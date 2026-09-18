export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // PAGE TONNERREIA
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    // STATUS
    if (request.method === "GET" && url.pathname === "/api/status") {
      return Response.json({
        success: true,
        name: "TonnerreIA",
        cloudflare: true,
        workersAI: !!env.AI,
        storage: !!env.SITES
      });
    }

    // GENERER LE SITE
    if (request.method === "POST" && url.pathname === "/api/generate") {
      try {
        const body = await request.json();
        const prompt = String(body.prompt || "").trim();

        if (!prompt) {
          return Response.json(
            { success: false, error: "Décris ton site." },
            { status: 400 }
          );
        }

        if (!env.AI) {
          return Response.json(
            { success: false, error: "Workers AI non connecté." },
            { status: 500 }
          );
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [
              {
                role: "system",
                content: `
Tu es TonnerreIA, une IA qui construit des sites internet.

L'utilisateur te donne une idée de site.
Tu dois créer directement un site complet.

Réponds uniquement avec ce format :

PROJECT_NAME: nom-du-site

FILE: index.html
CODE COMPLET DU HTML
END_FILE

FILE: style.css
CODE COMPLET DU CSS
END_FILE

FILE: script.js
CODE COMPLET DU JAVASCRIPT
END_FILE

Règles :
- Ne mets aucun Markdown.
- Ne mets pas de ``` .
- index.html doit être complet.
- style.css doit être complet.
- script.js doit être complet.
- Site moderne et professionnel.
- Site responsive téléphone et ordinateur.
- Crée toutes les sections demandées.
- Le résultat doit être directement utilisable.

Si l'utilisateur demande un restaurant, crée par exemple :
accueil, menu, présentation, horaires, réservation, contact et footer.

Si l'utilisateur demande un portfolio :
accueil, présentation, compétences, projets et contact.

Si l'utilisateur demande une boutique :
accueil, produits, panier et contact.
`
              },
              {
                role: "user",
                content: prompt
              }
            ]
          }
        );

        const response =
          result?.response ||
          result?.result?.response ||
          "";

        const project = parseProject(response);

        return Response.json({
          success: true,
          project
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error?.message || "Erreur génération."
          },
          { status: 500 }
        );
      }
    }

    // PUBLIER
    if (request.method === "POST" && url.pathname === "/api/publish") {
      try {
        if (!env.SITES) {
          return Response.json(
            {
              success: false,
              error: "Le stockage SITES n'est pas encore configuré."
            },
            { status: 500 }
          );
        }

        const body = await request.json();
        const project = body.project;

        if (!project || !project.files) {
          return Response.json(
            {
              success: false,
              error: "Projet invalide."
            },
            { status: 400 }
          );
        }

        const slug =
          cleanSlug(project.name || "site") +
          "-" +
          Math.random().toString(36).substring(2, 7);

        await env.SITES.put(
          "site:" + slug,
          JSON.stringify(project)
        );

        return Response.json({
          success: true,
          url: url.origin + "/site/" + slug
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error?.message || "Erreur publication."
          },
          { status: 500 }
        );
      }
    }

    // SITE PUBLIC
    if (request.method === "GET" && url.pathname.startsWith("/site/")) {
      try {
        if (!env.SITES) {
          return new Response(
            "Stockage SITES non configuré.",
            { status: 500 }
          );
        }

        const slug = decodeURIComponent(
          url.pathname.substring("/site/".length)
        );

        const data = await env.SITES.get("site:" + slug);

        if (!data) {
          return new Response(
            "<h1>Site introuvable</h1>",
            { status: 404 }
          );
        }

        const project = JSON.parse(data);

        const html = buildHTML(project.files);

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=UTF-8"
          }
        });

      } catch (error) {
        return new Response(
          "Erreur : " + error.message,
          { status: 500 }
        );
      }
    }

    return new Response("TonnerreIA - Page introuvable", {
      status: 404
    });
  }
};


// ================================
// PARSER LE PROJET
// ================================

function parseProject(text) {
  const files = [];

  const nameMatch = text.match(
    /PROJECT_NAME:\s*([^\n\r]+)/
  );

  const name = cleanSlug(
    nameMatch ? nameMatch[1].trim() : "mon-site"
  );

  const regex =
    /FILE:\s*([^\n\r]+)[\r\n]+([\s\S]*?)END_FILE/g;

  let match;

  while ((match = regex.exec(text)) !== null) {
    files.push({
      path: cleanPath(match[1]),
      content: match[2].trim()
    });
  }

  if (!files.some(file => file.path === "index.html")) {
    throw new Error(
      "L'IA n'a pas créé index.html."
    );
  }

  return {
    name,
    title: name,
    files
  };
}


// ================================
// NETTOYER CHEMIN
// ================================

function cleanPath(path) {
  return String(path)
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .trim();
}


// ================================
// SLUG
// ================================

function cleanSlug(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 40) || "mon-site";
}


// ================================
// CONSTRUIRE LE SITE
// ================================

function buildHTML(files) {
  const get = name => {
    const file = files.find(
      item => item.path === name
    );

    return file ? file.content : "";
  };

  let html = get("index.html");
  const css = get("style.css");
  const js = get("script.js");

  // Retirer les liens externes
  html = html.replace(
    /<link[^>]*href=["']style\.css["'][^>]*>/gi,
    ""
  );

  html = html.replace(
    /<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi,
    ""
  );

  // Ajouter CSS
  if (css) {
    const style =
      "<style>\n" +
      css +
      "\n</style>";

    if (html.includes("</head>")) {
      html = html.replace(
        "</head>",
        style + "\n</head>"
      );
    } else {
      html = style + html;
    }
  }

  // Ajouter JavaScript
  if (js) {
    const script =
      "<script>\n" +
      js +
      "\n</script>";

    if (html.includes("</body>")) {
      html = html.replace(
        "</body>",
        script + "\n</body>"
      );
    } else {
      html += script;
    }
  }

  return html;
}


// ================================
// INTERFACE
// ================================

const HTML = `<!DOCTYPE html>
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
  font-family: Arial, sans-serif;
  background: #080b12;
  color: white;
}

header {
  height: 70px;
  display: flex;
  align-items: center;
  padding: 0 25px;
  border-bottom: 1px solid #252c3a;
  background: #0d111a;
}

.logo {
  font-size: 25px;
  font-weight: bold;
}

.container {
  max-width: 1200px;
  margin: auto;
  padding: 35px 20px;
}

.hero {
  text-align: center;
  margin-bottom: 30px;
}

.hero h1 {
  font-size: 42px;
  margin: 10px 0;
}

.hero p {
  color: #9ba6b8;
}

textarea {
  width: 100%;
  min-height: 150px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #30394a;
  background: #111722;
  color: white;
  font-size: 16px;
  outline: none;
  resize: vertical;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

button {
  padding: 13px 20px;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
}

.generate {
  background: white;
  color: #080b12;
}

.publish {
  background: #243047;
  color: white;
}

.status {
  margin-top: 15px;
  color: #9ba6b8;
}

.workspace {
  display: none;
  margin-top: 30px;
  border: 1px solid #293244;
  border-radius: 14px;
  overflow: hidden;
}

.workspace.active {
  display: block;
}

.tabs {
  display: flex;
  overflow-x: auto;
  background: #111722;
}

.tab {
  padding: 14px 18px;
  cursor: pointer;
  border-right: 1px solid #293244;
  white-space: nowrap;
}

.tab.active {
  background: #252d3c;
}

.file {
  display: none;
  padding: 20px;
}

.file.active {
  display: block;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  font-family: monospace;
}

.preview {
  display: none;
  margin-top: 30px;
}

.preview.active {
  display: block;
}

.preview iframe {
  width: 100%;
  height: 650px;
  border: 1px solid #293244;
  border-radius: 14px;
  background: white;
}

.url {
  display: none;
  margin-top: 25px;
  padding: 20px;
  background: #111722;
  border: 1px solid #293244;
  border-radius: 14px;
}

.url.active {
  display: block;
}

.url a {
  color: #8fc7ff;
  word-break: break-all;
}
</style>
</head>

<body>

<header>
<div class="logo">⚡ TonnerreIA</div>
</header>

<div class="container">

<div class="hero">
<h1>Crée ton site avec l'IA</h1>
<p>Décris ton idée et TonnerreIA construit directement ton site.</p>
</div>

<textarea
id="prompt"
placeholder="Exemple : crée-moi un site de restaurant moderne avec menu, réservation et contact..."
></textarea>

<div class="buttons">

<button
class="generate"
id="generate"
onclick="generateSite()">
🚀 Créer le site
</button>

</div>

<div
class="status"
id="status">
TonnerreIA est prête.
</div>

<div
class="workspace"
id="workspace">

<div class="tabs" id="tabs"></div>

<div id="files"></div>

<div class="buttons">

<button onclick="copyFile()">
📋 Copier
</button>

<button onclick="downloadFile()">
⬇️ Télécharger
</button>

<button onclick="previewSite()">
👁️ Aperçu du site
</button>

<button
class="publish"
onclick="publishSite()">
🌐 Publier le site
</button>

</div>

</div>

<div
class="preview"
id="preview">

<h2>👁️ Aperçu du site</h2>

<iframe id="frame"></iframe>

</div>

<div
class="url"
id="url">

<h2>🌐 Site publié</h2>

<p>
Ton site est maintenant disponible ici :
</p>

<a
id="publicUrl"
target="_blank">
</a>

<br><br>

<button onclick="copyUrl()">
📋 Copier le lien
</button>

</div>

</div>

<script>

let project = null;
let currentFile = null;


// CREER

async function generateSite() {

const prompt =
document.getElementById("prompt").value.trim();

const button =
document.getElementById("generate");

const status =
document.getElementById("status");

if (!prompt) {

status.textContent =
"❌ Décris ton site.";

return;

}

button.disabled = true;

status.textContent =
"⚡ TonnerreIA construit ton site...";

try {

const response =
await fetch("/api/generate", {

method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify({
prompt: prompt
})

});

const data =
await response.json();

if (!response.ok || !data.success) {

throw new Error(
data.error || "Erreur."
);

}

project = data.project;

displayProject();

status.textContent =
"✅ Site créé !";

} catch (error) {

status.textContent =
"❌ " + error.message;

}

button.disabled = false;

}


// AFFICHER

function displayProject() {

const tabs =
document.getElementById("tabs");

const files =
document.getElementById("files");

tabs.innerHTML = "";
files.innerHTML = "";

project.files.forEach(
(file, index) => {

const tab =
document.createElement("div");

tab.className =
"tab" +
(index === 0 ? " active" : "");

tab.textContent =
"📄 " + file.path;

tab.onclick =
() => selectFile(file.path);

tabs.appendChild(tab);

const div =
document.createElement("div");

div.className =
"file" +
(index === 0 ? " active" : "");

div.id =
"file-" +
encodeURIComponent(file.path);

const pre =
document.createElement("pre");

pre.textContent =
file.content;

div.appendChild(pre);

files.appendChild(div);

}
);

currentFile =
project.files[0].path;

document
.getElementById("workspace")
.classList.add("active");

}


// SELECTION

function selectFile(path) {

currentFile = path;

document
.querySelectorAll(".tab")
.forEach(tab => {

tab.classList.toggle(
"active",
tab.textContent === "📄 " + path
);

});

document
.querySelectorAll(".file")
.forEach(file => {

file.classList.remove("active");

});

const file =
document.getElementById(
"file-" +
encodeURIComponent(path)
);

if (file) {
file.classList.add("active");
}

}


// COPIER

async function copyFile() {

if (!project || !currentFile) return;

const file =
project.files.find(
item => item.path === currentFile
);

if (!file) return;

await navigator.clipboard.writeText(
file.content
);

document
.getElementById("status")
.textContent =
"✅ Fichier copié.";

}


// TELECHARGER

function downloadFile() {

if (!project || !currentFile) return;

const file =
project.files.find(
item => item.path === currentFile
);

if (!file) return;

const blob =
new Blob(
[file.content],
{ type: "text/plain" }
);

const url =
URL.createObjectURL(blob);

const link =
document.createElement("a");

link.href = url;

link.download =
file.path.split("/").pop();

link.click();

URL.revokeObjectURL(url);

}


// APERCU

function previewSite() {

if (!project) return;

const index =
project.files.find(
file => file.path === "index.html"
);

const css =
project.files.find(
file => file.path === "style.css"
);

const js =
project.files.find(
file => file.path === "script.js"
);

if (!index) {

alert("index.html introuvable.");

return;

}

let html =
index.content;

html = html.replace(
/<link[^>]*href=["']style\\.css["'][^>]*>/gi,
""
);

html = html.replace(
/<script[^>]*src=["']script\\.js["'][^>]*><\\/script>/gi,
""
);

if (css) {

html = html.replace(
"</head>",
"<style>" +
css.content +
"</style></head>"
);

}

if (js) {

html = html.replace(
"</body>",
"<script>" +
js.content +
"<\\/script></body>"
);

}

document
.getElementById("frame")
.srcdoc = html;

document
.getElementById("preview")
.classList.add("active");

}


// PUBLIER

async function publishSite() {

if (!project) return;

const status =
document.getElementById("status");

status.textContent =
"🌐 Publication en cours...";

try {

const response =
await fetch("/api/publish", {

method: "POST",

headers: {
"Content-Type": "application/json"
},

body: JSON.stringify({
project: project
})

});

const data =
await response.json();

if (!response.ok || !data.success) {

throw new Error(
data.error || "Erreur publication."
);

}

const link =
document.getElementById("publicUrl");

link.href = data.url;
link.textContent = data.url;

document
.getElementById("url")
.classList.add("active");

status.textContent =
"✅ Site publié !";

} catch (error) {

status.textContent =
"❌ " + error.message;

}

}


// COPIER URL

async function copyUrl() {

const url =
document
.getElementById("publicUrl")
.textContent;

await navigator.clipboard.writeText(url);

document
.getElementById("status")
.textContent =
"✅ Lien copié.";

}

</script>

</body>
</html>`;
