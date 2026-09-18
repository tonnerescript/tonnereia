const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const SYSTEM_PROMPT = [
  "Tu es TonnerreIA.",
  "Tu crées des sites web complets.",
  "Réponds uniquement avec les fichiers demandés.",
  "Format obligatoire :",
  "PROJECT_NAME: nom",
  "FILE: index.html",
  "HTML",
  "END_FILE",
  "FILE: style.css",
  "CSS",
  "END_FILE",
  "FILE: script.js",
  "JAVASCRIPT",
  "END_FILE",
  "Ne mets jamais de Markdown.",
  "Ne mets jamais de ```."
].join("\n");

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function page(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=UTF-8"
    }
  });
}

function parseProject(text) {
  const source = String(text || "")
    .replace(/```html/gi, "")
    .replace(/```css/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();

  const nameMatch = source.match(/PROJECT_NAME:\s*(.+)/i);

  const projectName = nameMatch
    ? nameMatch[1].trim()
    : "Mon site";

  const files = {
    "index.html": "",
    "style.css": "",
    "script.js": ""
  };

  const regex = /FILE:\s*(index\.html|style\.css|script\.js)\s*\n([\s\S]*?)\s*END_FILE/gi;

  let match;

  while ((match = regex.exec(source)) !== null) {
    files[match[1].toLowerCase()] = match[2].trim();
  }

  if (!files["index.html"]) {
    const htmlMatch = source.match(/<!DOCTYPE html[\s\S]*<\/html>/i);

    if (htmlMatch) {
      files["index.html"] = htmlMatch[0];
    }
  }

  return {
    projectName,
    files
  };
}

const APP = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TonnerreIA</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Arial, sans-serif;
  color: white;
  background: #080914;
}

.header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  border-bottom: 1px solid #202337;
  background: #0c0e1c;
}

.logo {
  font-size: 21px;
  font-weight: bold;
}

.logo span {
  color: #7565ff;
}

.online {
  color: #65e59a;
  font-size: 13px;
}

.hero {
  max-width: 900px;
  margin: auto;
  padding: 80px 20px 40px;
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 30px;
  background: #17152e;
  color: #aaa1ff;
  font-size: 13px;
}

h1 {
  font-size: 60px;
  margin: 22px 0 15px;
  line-height: 1;
}

.hero p {
  color: #9da3b8;
  font-size: 17px;
  line-height: 1.6;
}

.box {
  max-width: 900px;
  margin: 20px auto 80px;
  padding: 15px;
}

textarea {
  width: 100%;
  height: 170px;
  resize: vertical;
  padding: 20px;
  border-radius: 15px;
  border: 1px solid #282c42;
  outline: none;
  background: #101221;
  color: white;
  font-size: 16px;
}

textarea:focus {
  border-color: #7165ff;
}

.generate {
  margin-top: 12px;
  width: 100%;
  padding: 16px;
  border: 0;
  border-radius: 13px;
  background: linear-gradient(135deg, #705cff, #358bff);
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.generate:disabled {
  opacity: .5;
}

.message {
  margin-top: 15px;
  padding: 13px;
  border-radius: 10px;
  background: #101321;
  color: #aeb5c9;
  display: none;
}

.result {
  display: none;
  margin-top: 20px;
  border: 1px solid #24283b;
  border-radius: 15px;
  overflow: hidden;
  background: #0d0f1b;
}

.result-head {
  padding: 15px;
  border-bottom: 1px solid #24283b;
  font-weight: bold;
}

pre {
  margin: 0;
  padding: 20px;
  min-height: 300px;
  max-height: 500px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #d7dbeb;
  font-family: monospace;
  font-size: 12px;
}

@media (max-width: 600px) {
  h1 {
    font-size: 43px;
  }

  .hero {
    padding-top: 55px;
  }

  .header {
    padding: 0 15px;
  }
}
</style>
</head>

<body>

<header class="header">
  <div class="logo">⚡ Tonnerre<span>IA</span></div>
  <div class="online">● IA en ligne</div>
</header>

<section class="hero">

  <div class="badge">
    ✦ Générateur de sites avec IA
  </div>

  <h1>
    Crée ton site<br>
    avec TonnerreIA
  </h1>

  <p>
    Décris ton idée et TonnerreIA génère automatiquement
    ton site web.
  </p>

</section>

<section class="box">

  <textarea
    id="prompt"
    placeholder="Exemple : crée-moi un site moderne pour un restaurant italien avec un menu, les horaires, une réservation et un formulaire de contact..."
  ></textarea>

  <button
    class="generate"
    id="generate"
  >
    ⚡ Générer mon site
  </button>

  <div
    class="message"
    id="message"
  ></div>

  <div
    class="result"
    id="result"
  >
    <div class="result-head" id="projectName">
      Site généré
    </div>

    <pre id="output"></pre>
  </div>

</section>

<script>
const promptInput = document.getElementById("prompt");
const generateButton = document.getElementById("generate");
const message = document.getElementById("message");
const result = document.getElementById("result");
const output = document.getElementById("output");
const projectName = document.getElementById("projectName");

function showMessage(text) {
  message.style.display = "block";
  message.textContent = text;
}

generateButton.addEventListener("click", async function() {

  const prompt = promptInput.value.trim();

  if (!prompt) {
    showMessage("Écris d'abord ce que tu veux créer.");
    return;
  }

  generateButton.disabled = true;
  generateButton.textContent = "⚡ Génération en cours...";
  result.style.display = "none";

  showMessage("TonnerreIA crée ton site...");

  try {

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(
        data.error || "Erreur pendant la génération."
      );
    }

    const project = data.project;

    projectName.textContent =
      "⚡ " +
      (project.projectName || "Site généré");

    output.textContent =
      project.files["index.html"] || "";

    result.style.display = "block";

    showMessage("✅ Ton site a été généré.");

    result.scrollIntoView({
      behavior: "smooth"
    });

  } catch (error) {

    showMessage(
      "❌ " +
      (error.message || "Une erreur est survenue.")
    );

  } finally {

    generateButton.disabled = false;
    generateButton.textContent = "⚡ Générer mon site";

  }

});
</script>

</body>
</html>`;

async function generate(request, env) {

  let body;

  try {
    body = await request.json();
  } catch (error) {
    return json({
      ok: false,
      error: "JSON invalide."
    }, 400);
  }

  const prompt = String(body.prompt || "").trim();

  if (!prompt) {
    return json({
      ok: false,
      error: "Prompt vide."
    }, 400);
  }

  if (!env.AI) {
    return json({
      ok: false,
      error: "Cloudflare AI n'est pas configuré."
    }, 500);
  }

  try {

    const result = await env.AI.run(
      AI_MODEL,
      {
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 7000
      }
    );

    const text = result && result.response
      ? result.response
      : "";

    if (!text) {
      return json({
        ok: false,
        error: "L'IA n'a renvoyé aucun résultat."
      }, 500);
    }

    const project = parseProject(text);

    if (!project.files["index.html"]) {
      return json({
        ok: false,
        error: "L'IA n'a pas correctement généré le HTML."
      }, 500);
    }

    return json({
      ok: true,
      project: project
    });

  } catch (error) {

    return json({
      ok: false,
      error: String(
        error.message || error
      )
    }, 500);

  }
}

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    if (
      request.method === "GET" &&
      url.pathname === "/"
    ) {
      return page(APP);
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/status"
    ) {
      return json({
        ok: true,
        service: "TonnerreIA",
        cloudflare: true,
        workersAI: !!env.AI
      });
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/generate"
    ) {
      return generate(request, env);
    }

    return json({
      ok: false,
      error: "Route introuvable."
    }, 404);
  }

};
