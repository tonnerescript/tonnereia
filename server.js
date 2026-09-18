require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const OpenAI = require("openai");

const app = express();

const PORT = Number(process.env.PORT || 3000);

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const GENERATED_DIR = path.join(__dirname, "generated");
const PUBLIC_DIR = path.join(__dirname, "public");

// =====================================================
// VERIFICATION ENV
// =====================================================

if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY manquante dans .env");
  process.exit(1);
}

if (!ACCOUNT_ID) {
  console.error("❌ CLOUDFLARE_ACCOUNT_ID manquante dans .env");
  process.exit(1);
}

if (!CF_API_TOKEN) {
  console.error("❌ CLOUDFLARE_API_TOKEN manquante dans .env");
  process.exit(1);
}

// =====================================================
// CLIENT OPENAI
// =====================================================

const client = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// =====================================================
// EXPRESS
// =====================================================

app.use(express.json({
  limit: "2mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "2mb"
}));

if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

fs.mkdirSync(GENERATED_DIR, {
  recursive: true
});

// =====================================================
// OUTILS
// =====================================================

function cleanFilePath(filePath) {
  if (typeof filePath !== "string") {
    throw new Error("Chemin de fichier invalide");
  }

  const cleaned = filePath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .trim();

  if (!cleaned) {
    throw new Error("Chemin de fichier vide");
  }

  if (
    cleaned.includes("..") ||
    cleaned.includes("\0") ||
    cleaned.startsWith(".git/")
  ) {
    throw new Error("Chemin de fichier interdit : " + cleaned);
  }

  return cleaned;
}

function safeProjectName(name) {
  let value = String(name || "tonnerreia")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  if (!value) {
    value = "tonnerreia";
  }

  return value.slice(0, 50);
}

function generateWorkerName(name) {
  const base = safeProjectName(name);
  const random = crypto.randomBytes(3).toString("hex");

  let workerName = `${base}-${random}`;

  workerName = workerName
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return workerName.slice(0, 63);
}

// =====================================================
// EXTRAIRE LE CODE JAVASCRIPT
// =====================================================

function extractJavascript(text) {
  if (!text) {
    throw new Error("OpenAI n'a retourné aucun code");
  }

  let code = String(text).trim();

  // Retire les éventuels blocs Markdown
  code = code.replace(/^```(?:javascript|js)?\s*/i, "");
  code = code.replace(/\s*```$/i, "");

  code = code.trim();

  if (!code.includes("export default")) {
    throw new Error(
      "Le code généré n'est pas un Worker Cloudflare valide."
    );
  }

  return code;
}

// =====================================================
// GENERATION OPENAI
// =====================================================

async function generateWorkerCode(prompt) {
  const systemPrompt = `
Tu es le moteur de génération de code de TonnerreIA.

Ta mission est de générer un Worker Cloudflare complet.

Le code doit être du JavaScript ES Module compatible Cloudflare Workers.

Le Worker DOIT contenir exactement une structure de ce type :

export default {
  async fetch(request, env, ctx) {
    ...
  }
};

Règles :
- Retourne UNIQUEMENT le code JavaScript.
- Aucun Markdown.
- Aucun commentaire avant le code.
- Aucun texte explicatif.
- N'utilise pas Node.js.
- N'utilise pas require().
- N'utilise pas fs.
- N'utilise pas child_process.
- Le code doit fonctionner directement sur Cloudflare Workers.
- Pour un site web, retourne du HTML avec Response.
- Le résultat doit être propre et fonctionnel.
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    instructions: systemPrompt,
    input: prompt
  });

  return extractJavascript(response.output_text);
}

// =====================================================
// CLOUDFLARE API
// =====================================================

async function deployToCloudflare(workerName, workerCode) {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/` +
    `${encodeURIComponent(ACCOUNT_ID)}/workers/scripts/` +
    `${encodeURIComponent(workerName)}`;

  const metadata = {
    main_module: "worker.js",
    compatibility_date: new Date().toISOString().slice(0, 10)
  };

  const form = new FormData();

  form.append(
    "metadata",
    new Blob(
      [JSON.stringify(metadata)],
      {
        type: "application/json"
      }
    )
  );

  form.append(
    "worker.js",
    new Blob(
      [workerCode],
      {
        type: "application/javascript+module"
      }),
    "worker.js"
  );

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`
    },
    body: form
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    console.error("Cloudflare :", JSON.stringify(data, null, 2));

    const message =
      data?.errors?.map(e => e.message).join(", ") ||
      `HTTP ${response.status}`;

    throw new Error(
      `Cloudflare deployment échoué : ${message}`
    );
  }

  return data;
}

// =====================================================
// ACTIVER workers.dev
// =====================================================

async function enableWorkersDev(workerName) {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/` +
    `${encodeURIComponent(ACCOUNT_ID)}/workers/scripts/` +
    `${encodeURIComponent(workerName)}/subdomain`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      enabled: true,
      previews_enabled: true
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    console.warn(
      "⚠️ Impossible d'activer automatiquement workers.dev :",
      JSON.stringify(data)
    );

    return false;
  }

  return true;
}

// =====================================================
// TEST CLOUDFLARE
// =====================================================

async function checkCloudflare() {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/` +
    `${encodeURIComponent(ACCOUNT_ID)}/workers/scripts`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`
    }
  });

  const data = await response.json();

  return {
    ok: response.ok && data.success === true,
    status: response.status,
    data
  };
}

// =====================================================
// ROUTE STATUS
// =====================================================

app.get("/api/status", async (req, res) => {
  try {
    const cloudflare = await checkCloudflare();

    res.json({
      ok: true,
      name: "TonnerreIA",
      openai: true,
      cloudflare: cloudflare.ok,
      port: PORT
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// =====================================================
// ROUTE TEST CLOUDFLARE
// =====================================================

app.get("/api/cloudflare", async (req, res) => {
  try {
    const result = await checkCloudflare();

    if (!result.ok) {
      return res.status(500).json({
        ok: false,
        message: "Cloudflare refuse la connexion",
        details: result.data
      });
    }

    res.json({
      ok: true,
      message: "TonnerreIA est bien connecté à Cloudflare"
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// =====================================================
// ROUTE CHAT
// =====================================================

app.post("/api/chat", async (req, res) => {
  try {
    const message = String(
      req.body?.message || ""
    ).trim();

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "Message vide"
      });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: message
    });

    res.json({
      ok: true,
      response: response.output_text || ""
    });

  } catch (error) {
    console.error("❌ Erreur OpenAI :", error);

    res.status(500).json({
      ok: false,
      error: error.message || "Erreur IA"
    });
  }
});

// =====================================================
// GENERER + DEPLOYER
// =====================================================

app.post("/api/generate", async (req, res) => {
  try {
    const prompt = String(
      req.body?.prompt || ""
    ).trim();

    const requestedName = String(
      req.body?.name || "tonnerreia-project"
    ).trim();

    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: "Décris le projet à créer."
      });
    }

    console.log("");
    console.log("========================================");
    console.log("🤖 Nouvelle génération");
    console.log("========================================");
    console.log("Prompt :", prompt);

    // -------------------------------------------------
    // 1. OPENAI
    // -------------------------------------------------

    console.log("🤖 Génération du code...");

    const workerCode = await generateWorkerCode(prompt);

    console.log("✅ Code généré");

    // -------------------------------------------------
    // 2. SAUVEGARDE LOCALE
    // -------------------------------------------------

    const workerName = generateWorkerName(requestedName);

    const projectDir = path.join(
      GENERATED_DIR,
      workerName
    );

    fs.mkdirSync(projectDir, {
      recursive: true
    });

    const workerFile = path.join(
      projectDir,
      "worker.js"
    );

    fs.writeFileSync(
      workerFile,
      workerCode,
      "utf8"
    );

    console.log(
      "💾 Fichier :",
      workerFile
    );

    // -------------------------------------------------
    // 3. CLOUDFLARE
    // -------------------------------------------------

    console.log(
      "☁️ Déploiement Cloudflare..."
    );

    await deployToCloudflare(
      workerName,
      workerCode
    );

    console.log(
      "✅ Worker déployé :",
      workerName
    );

    // -------------------------------------------------
    // 4. workers.dev
    // -------------------------------------------------

    await enableWorkersDev(workerName);

    const workerUrl =
      `https://${workerName}.workers.dev`;

    console.log(
      "🌍 URL :",
      workerUrl
    );

    console.log(
      "========================================"
    );

    res.json({
      ok: true,
      message: "Projet généré et déployé !",
      worker: workerName,
      url: workerUrl,
      localFile: workerFile
    });

  } catch (error) {
    console.error("");
    console.error("❌ ERREUR GENERATION / DEPLOIEMENT");
    console.error(error);
    console.error("");

    res.status(500).json({
      ok: false,
      error: error.message || "Erreur inconnue"
    });
  }
});

// =====================================================
// LISTE DES PROJETS GENERES
// =====================================================

app.get("/api/projects", (req, res) => {
  try {
    const projects = fs
      .readdirSync(GENERATED_DIR, {
        withFileTypes: true
      })
      .filter(item => item.isDirectory())
      .map(item => item.name);

    res.json({
      ok: true,
      projects
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

// =====================================================
// 404 API
// =====================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "Route API introuvable"
  });
});

// =====================================================
// ERREUR EXPRESS
// =====================================================

app.use((error, req, res, next) => {
  console.error("❌ Erreur Express :", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    ok: false,
    error: error.message || "Erreur serveur"
  });
});

// =====================================================
// DEMARRAGE
// =====================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("========================================");
  console.log("🚀 TONNERREIA EST DEMARRE");
  console.log("========================================");
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📁 ${PUBLIC_DIR}`);
  console.log("🤖 OpenAI : OK");
  console.log("☁️ Cloudflare : configuré");
  console.log("========================================");
  console.log("");
});
