const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const SYSTEM_PROMPT = [
  "Tu es TonnerreIA.",
  "Tu es un générateur professionnel de sites web.",
  "Crée des sites modernes, complets et responsive.",
  "Utilise HTML, CSS et JavaScript.",
  "Les boutons et interactions doivent fonctionner.",
  "",
  "FORMAT OBLIGATOIRE :",
  "PROJECT_NAME: Nom du site",
  "FILE: index.html",
  "HTML COMPLET",
  "END_FILE",
  "FILE: style.css",
  "CSS COMPLET",
  "END_FILE",
  "FILE: script.js",
  "JAVASCRIPT COMPLET",
  "END_FILE",
  "",
  "Ne mets pas de markdown.",
  "Ne mets jamais ```."
].join("\n");

const EDIT_SYSTEM_PROMPT = [
  "Tu es TonnerreIA.",
  "Tu dois modifier un site web existant.",
  "Conserve toutes les fonctionnalités qui ne sont pas concernées.",
  "Applique exactement la demande de modification.",
  "Retourne toujours les trois fichiers COMPLETS.",
  "",
  "FORMAT OBLIGATOIRE :",
  "PROJECT_NAME: Nom du site",
  "FILE: index.html",
  "HTML COMPLET",
  "END_FILE",
  "FILE: style.css",
  "CSS COMPLET",
  "END_FILE",
  "FILE: script.js",
  "JAVASCRIPT COMPLET",
  "END_FILE",
  "",
  "Ne mets pas de markdown.",
  "Ne mets jamais ```."
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

function html(data, status = 200) {
  return new Response(data, {
    status,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store"
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

  const nameMatch =
    source.match(/PROJECT_NAME:\s*(.+)/i);

  const projectName =
    nameMatch
      ? nameMatch[1].trim()
      : "Site généré";

  const files = {
    "index.html": "",
    "style.css": "",
    "script.js": ""
  };

  const regex =
    /FILE:\s*(index\.html|style\.css|script\.js)\s*\n([\s\S]*?)\s*END_FILE/gi;

  let match;

  while ((match = regex.exec(source)) !== null) {
    files[match[1].toLowerCase()] =
      match[2].trim();
  }

  if (!files["index.html"]) {
    const htmlMatch =
      source.match(
        /<!DOCTYPE html[\s\S]*<\/html>/i
      );

    if (htmlMatch) {
      files["index.html"] =
        htmlMatch[0];
    }
  }

  return {
    projectName,
    files
  };
}

function makePreview(project) {
  const htmlCode =
    project.files["index.html"] || "";

  const cssCode =
    project.files["style.css"] || "";

  const jsCode =
    project.files["script.js"] || "";

  if (
    /<html[\s\S]*<\/html>/i.test(
      htmlCode
    )
  ) {
    let result = htmlCode;

    if (cssCode) {
      result = result.replace(
        /<\/head>/i,
        "<style>" +
        cssCode +
        "</style></head>"
      );
    }

    if (jsCode) {
      result = result.replace(
        /<\/body>/i,
        "<script>" +
        jsCode +
        "<\/script></body>"
      );
    }

    return result;
  }

  return [
    "<!DOCTYPE html>",
    '<html lang="fr">',
    "<head>",
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    "<style>",
    cssCode,
    "</style>",
    "</head>",
    "<body>",
    htmlCode,
    "<script>",
    jsCode,
    "<\/script>",
    "</body>",
    "</html>"
  ].join("\n");
}

async function callAI(env, system, user) {
  const result =
    await env.AI.run(
      AI_MODEL,
      {
        messages: [
          {
            role: "system",
            content: system
          },
          {
            role: "user",
            content: user
          }
        ],
        max_tokens: 7000
      }
    );

  return result &&
    result.response
      ? result.response
      : "";
}

async function generateSite(
  request,
  env
) {
  let body;

  try {
    body =
      await request.json();
  } catch (error) {
    return json({
      ok: false,
      error: "JSON invalide."
    }, 400);
  }

  const prompt =
    String(
      body.prompt || ""
    ).trim();

  if (!prompt) {
    return json({
      ok: false,
      error: "Prompt vide."
    }, 400);
  }

  if (!env.AI) {
    return json({
      ok: false,
      error:
        "Cloudflare Workers AI n'est pas configuré."
    }, 500);
  }

  try {
    const responseText =
      await callAI(
        env,
        SYSTEM_PROMPT,
        prompt
      );

    if (!responseText) {
      return json({
        ok: false,
        error:
          "L'IA n'a renvoyé aucun résultat."
      }, 500);
    }

    const project =
      parseProject(
        responseText
      );

    if (
      !project.files["index.html"]
    ) {
      return json({
        ok: false,
        error:
          "Le HTML n'a pas été généré correctement."
      }, 500);
    }

    return json({
      ok: true,
      project,
      preview:
        makePreview(project)
    });

  } catch (error) {
    return json({
      ok: false,
      error: String(
        error.message ||
        error
      )
    }, 500);
  }
}

async function editSite(
  request,
  env
) {
  let body;

  try {
    body =
      await request.json();
  } catch (error) {
    return json({
      ok: false,
      error: "JSON invalide."
    }, 400);
  }

  const change =
    String(
      body.change || ""
    ).trim();

  const current =
    body.project || {};

  const currentFiles =
    current.files || {};

  if (!change) {
    return json({
      ok: false,
      error:
        "Décris la modification."
    }, 400);
  }

  if (
    !currentFiles["index.html"]
  ) {
    return json({
      ok: false,
      error:
        "Aucun site à modifier."
    }, 400);
  }

  if (!env.AI) {
    return json({
      ok: false,
      error:
        "Cloudflare Workers AI n'est pas configuré."
    }, 500);
  }

  const prompt = [
    "Voici le site actuel.",
    "",
    "NOM :",
    String(
      current.projectName ||
      "Site généré"
    ),
    "",
    "INDEX.HTML :",
    currentFiles["index.html"],
    "",
    "STYLE.CSS :",
    currentFiles["style.css"] || "",
    "",
    "SCRIPT.JS :",
    currentFiles["script.js"] || "",
    "",
    "MODIFICATION DEMANDÉE :",
    change,
    "",
    "Retourne le site complet avec la modification."
  ].join("\n");

  try {
    const responseText =
      await callAI(
        env,
        EDIT_SYSTEM_PROMPT,
        prompt
      );

    if (!responseText) {
      return json({
        ok: false,
        error:
          "L'IA n'a renvoyé aucun résultat."
      }, 500);
    }

    const project =
      parseProject(
        responseText
      );

    if (
      !project.files["index.html"]
    ) {
      return json({
        ok: false,
        error:
          "La modification n'a pas produit de HTML valide."
      }, 500);
    }

    return json({
      ok: true,
      project,
      preview:
        makePreview(project)
    });

  } catch (error) {
    return json({
      ok: false,
      error: String(
        error.message ||
        error
      )
    }, 500);
  }
}

const APP = [
  "<!DOCTYPE html>",
  '<html lang="fr">',
  "<head>",
  '<meta charset="UTF-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  "<title>TonnerreIA</title>",

  "<style>",

  "*{box-sizing:border-box}",

  "body{",
  "margin:0;",
  "min-height:100vh;",
  "font-family:Arial,Helvetica,sans-serif;",
  "background:#080914;",
  "color:white;",
  "}",

  ".header{",
  "height:70px;",
  "display:flex;",
  "align-items:center;",
  "justify-content:space-between;",
  "padding:0 25px;",
  "border-bottom:1px solid #24263a;",
  "background:#0c0e1c;",
  "}",

  ".logo{",
  "font-size:21px;",
  "font-weight:bold;",
  "}",

  ".logo span{",
  "color:#7565ff;",
  "}",

  ".online{",
  "color:#65e59a;",
  "font-size:13px;",
  "}",

  ".container{",
  "width:min(1100px,calc(100% - 30px));",
  "margin:auto;",
  "padding:60px 0;",
  "}",

  ".hero{text-align:center}",

  ".badge{",
  "display:inline-block;",
  "padding:8px 14px;",
  "border-radius:30px;",
  "background:#17152e;",
  "color:#aaa1ff;",
  "font-size:13px;",
  "}",

  "h1{",
  "font-size:clamp(42px,7vw,72px);",
  "line-height:1;",
  "margin:25px 0 15px;",
  "}",

  ".hero p{",
  "color:#9da3b8;",
  "font-size:17px;",
  "line-height:1.6;",
  "}",

  ".generator{",
  "margin-top:40px;",
  "}",

  "textarea{",
  "width:100%;",
  "height:150px;",
  "padding:20px;",
  "resize:vertical;",
  "border-radius:16px;",
  "border:1px solid #282c42;",
  "outline:none;",
  "background:#101221;",
  "color:white;",
  "font-size:16px;",
  "}",

  "textarea:focus{",
  "border-color:#7165ff;",
  "}",

  ".generate,",
  ".editButton{",
  "width:100%;",
  "margin-top:12px;",
  "padding:17px;",
  "border:0;",
  "border-radius:13px;",
  "background:linear-gradient(135deg,#705cff,#358bff);",
  "color:white;",
  "font-size:16px;",
  "font-weight:bold;",
  "cursor:pointer;",
  "}",

  ".editButton{",
  "background:linear-gradient(135deg,#9b58ff,#e64dff);",
  "}",

  "button:disabled{",
  "opacity:.5;",
  "cursor:wait;",
  "}",

  "#message{",
  "display:none;",
  "margin-top:15px;",
  "padding:14px;",
  "border-radius:12px;",
  "background:#101321;",
  "border:1px solid #282c42;",
  "color:#aeb5c9;",
  "}",

  "#editBox{",
  "display:none;",
  "margin-top:25px;",
  "}",

  ".editTitle{",
  "margin-bottom:10px;",
  "font-size:16px;",
  "font-weight:bold;",
  "}",

  "#previewBox{",
  "display:none;",
  "margin-top:35px;",
  "border:1px solid #292c42;",
  "border-radius:18px;",
  "overflow:hidden;",
  "background:#171923;",
  "}",

  ".previewHeader{",
  "min-height:60px;",
  "display:flex;",
  "align-items:center;",
  "justify-content:space-between;",
  "gap:10px;",
  "padding:10px 15px;",
  "background:#10121f;",
  "color:white;",
  "}",

  "#previewTitle{",
  "font-weight:bold;",
  "}",

  ".previewButtons{",
  "display:flex;",
  "gap:7px;",
  "}",

  ".deviceButton{",
  "width:auto;",
  "margin:0;",
  "padding:8px 12px;",
  "border:1px solid #34384f;",
  "border-radius:9px;",
  "background:#1b1e30;",
  "color:white;",
  "font-size:13px;",
  "cursor:pointer;",
  "}",

  ".deviceButton.active{",
  "background:#6655ff;",
  "border-color:#6655ff;",
  "}",

  "#previewArea{",
  "width:100%;",
  "height:650px;",
  "display:flex;",
  "justify-content:center;",
  "align-items:stretch;",
  "overflow:auto;",
  "background:#171923;",
  "}",

  "#preview{",
  "width:100%;",
  "height:100%;",
  "border:0;",
  "background:white;",
  "transition:width .3s;",
  "}",

  "#previewArea.phone{",
  "align-items:center;",
  "}",

  "#previewArea.phone #preview{",
  "width:390px;",
  "max-width:390px;",
  "height:620px;",
  "border-radius:20px;",
  "box-shadow:0 0 0 6px #05060a;",
  "}",

  ".files{",
  "display:none;",
  "grid-template-columns:repeat(3,1fr);",
  "gap:10px;",
  "margin-top:12px;",
  "}",

  ".file{",
  "padding:14px;",
  "background:#10121f;",
  "border:1px solid #292c42;",
  "border-radius:10px;",
  "color:#b8bed0;",
  "}",

  "@media(max-width:700px){",

  ".container{",
  "padding-top:40px;",
  "}",

  ".previewHeader{",
  "align-items:flex-start;",
  "flex-direction:column;",
  "}",

  ".previewButtons{",
  "width:100%;",
  "}",

  ".deviceButton{",
  "flex:1;",
  "}",

  "#previewArea{",
  "height:600px;",
  "}",

  "#previewArea.phone #preview{",
  "width:360px;",
  "max-width:calc(100% - 30px);",
  "height:570px;",
  "}",

  ".files{",
  "grid-template-columns:1fr;",
  "}",

  "}",

  "</style>",
  "</head>",

  "<body>",

  '<header class="header">',
  '<div class="logo">⚡ Tonnerre<span>IA</span></div>',
  '<div class="online">● IA en ligne</div>',
  "</header>",

  '<main class="container">',

  '<section class="hero">',

  '<div class="badge">',
  "✦ Générateur de vrais sites web",
  "</div>",

  "<h1>Crée ton site avec TonnerreIA</h1>",

  "<p>",
  "Décris ton idée et TonnerreIA crée ton vrai site web.",
  "</p>",

  "</section>",

  '<section class="generator">',

  '<textarea id="prompt" placeholder="Exemple : crée-moi un site moderne pour un restaurant italien avec menu, galerie, réservation et contact..."></textarea>',

  '<button class="generate" id="generate">',
  "⚡ Générer mon site",
  "</button>",

  '<div id="message"></div>',

  '<div id="editBox">',

  '<div class="editTitle">',
  "✏️ Que veux-tu modifier ?",
  "</div>",

  '<textarea id="change" placeholder="Exemple : change les couleurs en noir et or, ajoute une section avis clients et modifie le bouton principal..."></textarea>',

  '<button class="editButton" id="edit">',
  "✏️ Modifier avec l'IA",
  "</button>",

  "</div>",

  '<div id="previewBox">',

  '<div class="previewHeader">',

  '<div id="previewTitle">',
  "⚡ Site généré",
  "</div>",

  '<div class="previewButtons">',

  '<button class="deviceButton active" id="pcButton">',
  "🖥️ PC",
  "</button>",

  '<button class="deviceButton" id="phoneButton">',
  "📱 Téléphone",
  "</button>",

  "</div>",

  "</div>",

  '<div id="previewArea">',

  '<iframe id="preview" title="Aperçu du site généré" sandbox="allow-scripts allow-forms"></iframe>',

  "</div>",

  "</div>",

  '<div class="files" id="files">',

  '<div class="file">📄 index.html</div>',
  '<div class="file">🎨 style.css</div>',
  '<div class="file">⚙️ script.js</div>',

  "</div>",

  "</section>",

  "</main>",

  "<script>",

  'const promptInput=document.getElementById("prompt");',
  'const changeInput=document.getElementById("change");',
  'const generateButton=document.getElementById("generate");',
  'const editButton=document.getElementById("edit");',
  'const message=document.getElementById("message");',
  'const editBox=document.getElementById("editBox");',
  'const previewBox=document.getElementById("previewBox");',
  'const preview=document.getElementById("preview");',
  'const previewTitle=document.getElementById("previewTitle");',
  'const files=document.getElementById("files");',
  'const previewArea=document.getElementById("previewArea");',
  'const pcButton=document.getElementById("pcButton");',
  'const phoneButton=document.getElementById("phoneButton");',

  "let currentProject=null;",

  "function showMessage(text){",
  'message.style.display="block";',
  "message.textContent=text;",
  "}",

  'function showProject(data){',

  "currentProject=data.project;",

  "previewTitle.textContent=",
  "'⚡ '+(",
  "data.project.projectName||",
  "'Site généré'",
  ");",

  "preview.srcdoc=data.preview;",

  'previewBox.style.display="block";',
  'editBox.style.display="block";',
  'files.style.display="grid";',

  "previewBox.scrollIntoView({",
  "behavior:'smooth',",
  "block:'start'",
  "});",

  "}",

  'pcButton.addEventListener("click",function(){',

  'previewArea.classList.remove("phone");',
  'pcButton.classList.add("active");',
  'phoneButton.classList.remove("active");',

  "});",

  'phoneButton.addEventListener("click",function(){',

  'previewArea.classList.add("phone");',
  'phoneButton.classList.add("active");',
  'pcButton.classList.remove("active");',

  "});",

  'generateButton.addEventListener("click",async function(){',

  "const prompt=promptInput.value.trim();",

  "if(!prompt){",
  'showMessage("⚠️ Écris d’abord ce que tu veux créer.");',
  "return;",
  "}",

  "generateButton.disabled=true;",
  'generateButton.textContent="⚡ Création du site...";',

  'showMessage("⏳ TonnerreIA génère ton site...");',

  "try{",

  "const response=await fetch('/api/generate',{",
  "method:'POST',",
  "headers:{'Content-Type':'application/json'},",
  "body:JSON.stringify({prompt:prompt})",
  "});",

  "const data=await response.json();",

  "if(!response.ok||!data.ok){",
  'throw new Error(data.error||"Erreur de génération.");',
  "}",

  "showProject(data);",

  'showMessage("✅ Site généré ! Tu peux maintenant le modifier avec l’IA.");',

  "}catch(error){",

  'showMessage("❌ "+(error.message||"Erreur inconnue."));',

  "}finally{",

  "generateButton.disabled=false;",
  'generateButton.textContent="⚡ Générer mon site";',

  "}",

  "});",

  'editButton.addEventListener("click",async function(){',

  "if(!currentProject){",
  'showMessage("⚠️ Génère d’abord un site.");',
  "return;",
  "}",

  "const change=changeInput.value.trim();",

  "if(!change){",
  'showMessage("⚠️ Décris la modification que tu veux.");',
  "return;",
  "}",

  "editButton.disabled=true;",
  'editButton.textContent="✏️ Modification en cours...";',

  'showMessage("⏳ TonnerreIA modifie ton site...");',

  "try{",

  "const response=await fetch('/api/edit',{",
  "method:'POST',",
  "headers:{'Content-Type':'application/json'},",
  "body:JSON.stringify({",
  "change:change,",
  "project:currentProject",
  "})",
  "});",

  "const data=await response.json();",

  "if(!response.ok||!data.ok){",
  'throw new Error(data.error||"Erreur de modification.");',
  "}",

  "showProject(data);",

  'changeInput.value="";',

  'showMessage("✅ Modification appliquée !");',

  "}catch(error){",

  'showMessage("❌ "+(error.message||"Erreur inconnue."));',

  "}finally{",

  "editButton.disabled=false;",
  'editButton.textContent="✏️ Modifier avec l’IA";',

  "}",

  "});",

  "</script>",
  "</body>",
  "</html>"
].join("\n");

export default {
  async fetch(request, env) {

    const url =
      new URL(request.url);

    if (
      request.method === "GET" &&
      url.pathname === "/"
    ) {
      return html(APP);
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
      return generateSite(
        request,
        env
      );
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/edit"
    ) {
      return editSite(
        request,
        env
      );
    }

    return json({
      ok: false,
      error: "Route introuvable."
    }, 404);
  }
};
