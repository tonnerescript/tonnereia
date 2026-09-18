export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ================================
    // ACCUEIL
    // ================================
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    // ================================
    // STATUS
    // ================================
    if (
      request.method === "GET" &&
      url.pathname === "/api/status"
    ) {
      return Response.json({
        success: true,
        name: "TonnerreIA",
        cloudflare: true,
        workersAI: !!env.AI,
        storage: !!env.SITES,
        version: "site-builder-2"
      });
    }

    // ================================
    // GENERER UN SITE
    // ================================
    if (
      request.method === "POST" &&
      url.pathname === "/api/generate"
    ) {
      try {
        const body = await request.json();
        const prompt = String(body.prompt || "").trim();

        if (!prompt) {
          return Response.json(
            {
              success: false,
              error: "Décris le site que tu veux créer."
            },
            { status: 400 }
          );
        }

        if (!env.AI) {
          return Response.json(
            {
              success: false,
              error: "Workers AI n'est pas connecté."
            },
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
Tu es TonnerreIA.

Tu es une IA qui crée directement des sites internet complets.

L'utilisateur décrit le site qu'il veut.

Tu dois créer un projet complet.

Réponds UNIQUEMENT avec un JSON valide.

Format obligatoire :

{
  "name": "nom-du-site",
  "title": "Titre du site",
  "description": "Description du site",
  "files": [
    {
      "path": "index.html",
      "content": "CODE COMPLET"
    },
    {
      "path": "style.css",
      "content": "CODE COMPLET"
    },
    {
      "path": "script.js",
      "content": "CODE COMPLET"
    }
  ]
}

RÈGLES :

- Pas de Markdown.
- Pas de ``` .
- Pas de texte avant le JSON.
- Pas de texte après le JSON.
- index.html doit être complet.
- style.css doit être complet.
- script.js doit être complet lorsque nécessaire.
- Le site doit être moderne.
- Le site doit être responsive.
- Le site doit fonctionner sur téléphone et ordinateur.
- Utilise du HTML, CSS et JavaScript classiques.
- Les images peuvent utiliser des URLs publiques.
- Crée toutes les sections demandées.
- Le résultat doit être directement utilisable comme un vrai site.

Exemple pour un restaurant :
accueil, menu, présentation, horaires, réservation, contact, footer.

Exemple pour un portfolio :
accueil, présentation, compétences, projets, contact.

Exemple pour une boutique :
accueil, produits, panier, contact.

Si plusieurs fichiers sont nécessaires, crée-les.
`
              },
              {
                role: "user",
                content: prompt
              }
            ]
          }
        );

        let text =
          result?.response ||
          result?.result?.response ||
          result?.choices?.[0]?.message?.content ||
          "";

        text = String(text).trim();

        // Retirer les éventuels backticks
        if (text.startsWith("```json")) {
          text = text.substring(7);
        }

        if (text.startsWith("```")) {
          text = text.substring(3);
        }

        if (text.endsWith("```")) {
          text = text.substring(
            0,
            text.length - 3
          );
        }

        text = text.trim();

        let project;

        try {
          project = JSON.parse(text);
        } catch {
          const first = text.indexOf("{");
          const last = text.lastIndexOf("}");

          if (first === -1 || last === -1) {
            throw new Error(
              "L'IA n'a pas retourné un projet valide."
            );
          }

          project = JSON.parse(
            text.substring(first, last + 1)
          );
        }

        if (
          !project ||
          !Array.isArray(project.files)
        ) {
          throw new Error(
            "Aucun fichier n'a été généré."
          );
        }

        project.files = project.files
          .filter(file => {
            return (
              file &&
              typeof file.path === "string" &&
              typeof file.content === "string"
            );
          })
          .map(file => {
            return {
              path: cleanPath(file.path),
              content: file.content
            };
          });

        if (
          !project.files.some(
            file => file.path === "index.html"
          )
        ) {
          throw new Error(
            "Le fichier index.html est manquant."
          );
        }

        project.name = cleanSlug(
          project.name ||
          project.title ||
          "mon-site"
        );

        project.title =
          project.title ||
          project.name;

        project.description =
          project.description || "";

        return Response.json({
          success: true,
          project
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error:
              error?.message ||
              "Erreur pendant la création du site."
          },
          { status: 500 }
        );
      }
    }

    // ================================
    // PUBLIER UN SITE
    // ================================
    if (
      request.method === "POST" &&
      url.pathname === "/api/publish"
    ) {
      try {
        if (!env.SITES) {
          return Response.json(
            {
              success: false,
              error:
                "Le stockage SITES n'est pas configuré."
            },
            { status: 500 }
          );
        }

        const body = await request.json();
        const project = body.project;

        if (
          !project ||
          !Array.isArray(project.files)
        ) {
          return Response.json(
            {
              success: false,
              error: "Projet invalide."
            },
            { status: 400 }
          );
        }

        const slug = createSlug(
          project.name ||
          project.title ||
          "site"
        );

        const site = {
          name:
            project.name ||
            slug,

          title:
            project.title ||
            project.name ||
            slug,

          description:
            project.description ||
            "",

          files:
            project.files,

          createdAt:
            new Date().toISOString()
        };

        await env.SITES.put(
          "site:" + slug,
          JSON.stringify(site)
        );

        const publicUrl =
          url.origin +
          "/site/" +
          encodeURIComponent(slug);

        return Response.json({
          success: true,
          slug,
          url: publicUrl
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error:
              error?.message ||
              "Impossible de publier le site."
          },
          { status: 500 }
        );
      }
    }

    // ================================
    // AFFICHER UN SITE PUBLIÉ
    // ================================
    if (
      request.method === "GET" &&
      url.pathname.startsWith("/site/")
    ) {
      try {
        if (!env.SITES) {
          return new Response(
            "Stockage des sites non configuré.",
            { status: 500 }
          );
        }

        const slug = decodeURIComponent(
          url.pathname.substring(6)
        );

        if (!slug) {
          return new Response(
            "Site introuvable.",
            { status: 404 }
          );
        }

        const data = await env.SITES.get(
          "site:" + slug
        );

        if (!data) {
          return new Response(
            `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Site introuvable</title>
<style>
body{
  margin:0;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#080b12;
  color:white;
  font-family:Arial,sans-serif;
  text-align:center;
}
h1{font-size:60px;margin:0}
</style>
</head>
<body>
<div>
<h1>404</h1>
<p>Ce site n'existe pas.</p>
</div>
</body>
</html>
`,
            {
              status: 404,
              headers: {
                "Content-Type":
                  "text/html; charset=UTF-8"
              }
            }
          );
        }

        const site = JSON.parse(data);

        const html = buildSiteHTML(
          site.files
        );

        return new Response(html, {
          headers: {
            "Content-Type":
              "text/html; charset=UTF-8",
            "Cache-Control":
              "public, max-age=60"
          }
        });

      } catch (error) {
        return new Response(
          "Erreur : " +
            (error?.message || "Erreur inconnue"),
          { status: 500 }
        );
      }
    }

    // ================================
    // 404
    // ================================
    return new Response(
      "TonnerreIA - Page introuvable",
      { status: 404 }
    );
  }
};


// ========================================
// NETTOYAGE DES CHEMINS
// ========================================

function cleanPath(path) {
  return String(path)
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .trim();
}


// ========================================
// SLUG
// ========================================

function cleanSlug(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50) ||
    "mon-site";
}


function createSlug(value) {
  return (
    cleanSlug(value) +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 7)
  );
}


// ========================================
// CONSTRUIRE LE SITE PUBLIC
// ========================================

function buildSiteHTML(files) {
  const findFile = name => {
    return files.find(
      file => file.path === name
    );
  };

  const indexFile =
    findFile("index.html");

  if (!indexFile) {
    return "<h1>index.html manquant</h1>";
  }

  let html = indexFile.content;

  const cssFile =
    findFile("style.css");

  const jsFile =
    findFile("script.js");

  // Supprimer la référence CSS externe
  html = html.replace(
    /<link[^>]*href=["']style\\.css["'][^>]*>/gi,
    ""
  );

  // Supprimer la référence JS externe
  html = html.replace(
    /<script[^>]*src=["']script\\.js["'][^>]*><\\/script>/gi,
    ""
  );

  // Ajouter le CSS
  if (cssFile) {
    const cssBlock =
      "<style>\n" +
      cssFile.content +
      "\n</style>";

    if (html.includes("</head>")) {
      html = html.replace(
        "</head>",
        cssBlock +
        "\n</head>"
      );
    } else {
      html =
        cssBlock +
        "\n" +
        html;
    }
  }

  // Ajouter le JavaScript
  if (jsFile) {
    const jsBlock =
      "<script>\n" +
      jsFile.content +
      "\n</script>";

    if (html.includes("</body>")) {
      html = html.replace(
        "</body>",
        jsBlock +
        "\n</body>"
      );
    } else {
      html += jsBlock;
    }
  }

  return html;
}


// ========================================
// INTERFACE TONNERREIA
// ========================================

const HTML = `<!DOCTYPE html>
<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1.0"
>

<title>TonnerreIA</title>

<style>

*{
box-sizing:border-box;
}

body{
margin:0;
font-family:Arial,Helvetica,sans-serif;
background:#070a10;
color:white;
}

header{
height:70px;
display:flex;
align-items:center;
padding:0 25px;
border-bottom:1px solid #242b39;
background:#0b0f17;
}

.logo{
font-size:25px;
font-weight:bold;
}

.container{
max-width:1250px;
margin:auto;
padding:35px 20px;
}

.hero{
text-align:center;
margin-bottom:30px;
}

.hero h1{
font-size:42px;
margin:10px 0;
}

.hero p{
color:#9da7b8;
font-size:17px;
}

textarea{
width:100%;
min-height:150px;
padding:18px;
border-radius:14px;
border:1px solid #303949;
background:#101620;
color:white;
font-size:16px;
resize:vertical;
outline:none;
}

.actions{
display:flex;
gap:10px;
margin-top:15px;
flex-wrap:wrap;
}

button{
padding:13px 20px;
border:0;
border-radius:10px;
font-weight:bold;
cursor:pointer;
font-size:15px;
}

.generate{
background:white;
color:#080b12;
}

.publish{
background:#202a3a;
color:white;
}

button:disabled{
opacity:.5;
}

.status{
margin-top:15px;
color:#9da7b8;
}

.workspace{
display:none;
margin-top:30px;
border:1px solid #293244;
border-radius:14px;
overflow:hidden;
background:#0d121b;
}

.workspace.active{
display:block;
}

.toolbar{
display:flex;
gap:10px;
padding:15px;
border-bottom:1px solid #293244;
flex-wrap:wrap;
}

.tabs{
display:flex;
overflow-x:auto;
border-bottom:1px solid #293244;
}

.tab{
padding:13px 18px;
cursor:pointer;
white-space:nowrap;
border-right:1px solid #293244;
}

.tab.active{
background:#202735;
}

.file{
display:none;
padding:20px;
}

.file.active{
display:block;
}

pre{
margin:0;
white-space:pre-wrap;
word-break:break-word;
font-family:monospace;
line-height:1.5;
color:#dce3ee;
}

.preview{
display:none;
margin-top:30px;
}

.preview.active{
display:block;
}

.preview iframe{
width:100%;
height:650px;
border:1px solid #293244;
border-radius:14px;
background:white;
}

.urlbox{
display:none;
margin-top:20px;
padding:18px;
border:1px solid #293244;
border-radius:14px;
background:#101620;
}

.urlbox.active{
display:block;
}

.url{
word-break:break-all;
color:#9ed0ff;
margin:10px 0;
}

.examples{
display:flex;
justify-content:center;
gap:10px;
flex-wrap:wrap;
margin-top:20px;
}

.example{
padding:10px 14px;
border:1px solid #293244;
background:#111722;
border-radius:10px;
cursor:pointer;
}

</style>

</head>

<body>

<header>

<div class="logo">
⚡ TonnerreIA
</div>

</header>

<div class="container">

<div class="hero">

<h1>
Crée ton site avec l'IA
</h1>

<p>
Décris ton idée et TonnerreIA construit directement ton site.
</p>

<div class="examples">

<div
class="example"
onclick="setExample('Crée un site de restaurant moderne avec menu, réservation, horaires et contact')">
🍔 Restaurant
</div>

<div
class="example"
onclick="setExample('Crée un portfolio moderne pour un développeur')">
💻 Portfolio
</div>

<div
class="example"
onclick="setExample('Crée un site vitrine moderne pour une entreprise')">
🏢 Entreprise
</div>

<div
class="example"
onclick="setExample('Crée un petit jeu web en HTML CSS JavaScript')">
🎮 Jeu
</div>

</div>

</div>

<textarea
id="prompt"
placeholder="Exemple : crée-moi un site de restaurant moderne..."
></textarea>

<div class="actions">

<button
class="generate"
id="generate"
onclick="generateSite()">
🚀 Créer le site
</button>

<button
onclick="clearProject()">
Effacer
</button>

</div>

<div
id="status"
class="status">
TonnerreIA est prête.
</div>

<div
id="workspace"
class="workspace">

<div class="toolbar">

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

<div
id="tabs"
class="tabs">
</div>

<div
id="files">
</div>

</div>

<div
id="preview"
class="preview">

<h2>
👁️ Aperçu du site
</h2>

<iframe
id="previewFrame">
</iframe>

</div>

<div
id="urlbox"
class="urlbox">

<h2>
🌐 Site publié
</h2>

<p>
Ton site est maintenant accessible publiquement :
</p>

<div
id="publicUrl"
class="url">
</div>

<button onclick="copyUrl()">
📋 Copier le lien
</button>

</div>

</div>

<script>

let project = null;
let currentFile = null;


// ========================================
// EXEMPLE
// ========================================

function setExample(text){

document.getElementById("prompt").value = text;

}


// ========================================
// CREATION
// ========================================

async function generateSite(){

const prompt =
document.getElementById("prompt").value.trim();

const button =
document.getElementById("generate");

const status =
document.getElementById("status");

if(!prompt){

status.textContent =
"❌ Décris le site que tu veux créer.";

return;

}

button.disabled = true;

status.textContent =
"⚡ TonnerreIA construit ton site...";

document
.getElementById("workspace")
.classList.remove("active");

document
.getElementById("preview")
.classList.remove("active");

document
.getElementById("urlbox")
.classList.remove("active");

try{

const response =
await fetch("/api/generate",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
prompt:prompt
})

});

const data =
await response.json();

if(!response.ok || !data.success){

throw new Error(
data.error ||
"Erreur pendant la génération."
);

}

project =
data.project;

displayProject();

status.textContent =
"✅ Site créé avec succès.";

}catch(error){

status.textContent =
"❌ " + error.message;

}

button.disabled = false;

}


// ========================================
// AFFICHER LES FICHIERS
// ========================================

function displayProject(){

const tabs =
document.getElementById("tabs");

const files =
document.getElementById("files");

tabs.innerHTML = "";
files.innerHTML = "";

project.files.forEach(
(file,index)=>{

const tab =
document.createElement("div");

tab.className =
"tab" +
(index === 0 ? " active" : "");

tab.textContent =
"📄 " + file.path;

tab.onclick =
()=>selectFile(file.path);

tabs.appendChild(tab);

const content =
document.createElement("div");

content.className =
"file" +
(index === 0 ? " active" : "");

content.id =
"file-" +
encodeURIComponent(file.path);

const pre =
document.createElement("pre");

pre.textContent =
file.content;

content.appendChild(pre);

files.appendChild(content);

}
);

currentFile =
project.files[0].path;

document
.getElementById("workspace")
.classList.add("active");

}


// ========================================
// SELECTION FICHIER
// ========================================

function selectFile(path){

currentFile = path;

document
.querySelectorAll(".tab")
.forEach(tab=>{

tab.classList.toggle(
"active",
tab.textContent === "📄 " + path
);

});

document
.querySelectorAll(".file")
.forEach(file=>{

file.classList.remove("active");

});

const selected =
document.getElementById(
"file-" +
encodeURIComponent(path)
);

if(selected){

selected.classList.add("active");

}

}


// ========================================
// COPIER
// ========================================

async function copyFile(){

if(!project || !currentFile){
return;
}

const file =
project.files.find(
item => item.path === currentFile
);

if(!file){
return;
}

await navigator.clipboard.writeText(
file.content
);

document
.getElementById("status")
.textContent =
"✅ " +
currentFile +
" copié.";

}


// ========================================
// TELECHARGER
// ========================================

function downloadFile(){

if(!project || !currentFile){
return;
}

const file =
project.files.find(
item => item.path === currentFile
);

if(!file){
return;
}

const blob =
new Blob(
[file.content],
{
type:"text/plain;charset=utf-8"
}
);

const url =
URL.createObjectURL(blob);

const link =
document.createElement("a");

link.href = url;

link.download =
file.path.split("/").pop();

document.body.appendChild(link);

link.click();

link.remove();

URL.revokeObjectURL(url);

}


// ========================================
// APERCU
// ========================================

function previewSite(){

if(!project){
return;
}

const index =
project.files.find(
file => file.path === "index.html"
);

if(!index){

alert(
"index.html est introuvable."
);

return;

}

let html =
index.content;

const css =
project.files.find(
file => file.path === "style.css"
);

const js =
project.files.find(
file => file.path === "script.js"
);

if(css){

html =
html.replace(
"</head>",
"<style>" +
css.content +
"</style></head>"
);

}

if(js){

html =
html.replace(
"</body>",
"<script>" +
js.content +
"<\\/script></body>"
);

}

html =
html.replace(
/<link[^>]*href=["']style\\.css["'][^>]*>/gi,
""
);

html =
html.replace(
/<script[^>]*src=["']script\\.js["'][^>]*><\\/script>/gi,
""
);

document
.getElementById("previewFrame")
.srcdoc = html;

document
.getElementById("preview")
.classList.add("active");

}


// ========================================
// PUBLIER
// ========================================

async function publishSite(){

if(!project){

alert(
"Crée d'abord un site."
);

return;

}

const status =
document.getElementById("status");

status.textContent =
"🌐 Publication du site...";

try{

const response =
await fetch("/api/publish",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
project:project
})

});

const data =
await response.json();

if(!response.ok || !data.success){

throw new Error(
data.error ||
"Impossible de publier le site."
);

}

document
.getElementById("publicUrl")
.textContent =
data.url;

document
.getElementById("urlbox")
.classList.add("active");

status.textContent =
"✅ Site publié !";

}catch(error){

status.textContent =
"❌ " + error.message;

}

}


// ========================================
// COPIER URL
// ========================================

async function copyUrl(){

const url =
document
.getElementById("publicUrl")
.textContent;

if(!url){
return;
}

await navigator.clipboard.writeText(url);

document
.getElementById("status")
.textContent =
"✅ Lien copié.";

}


// ========================================
// EFFACER
// ========================================

function clearProject(){

project = null;
currentFile = null;

document
.getElementById("prompt")
.value = "";

document
.getElementById("workspace")
.classList.remove("active");

document
.getElementById("preview")
.classList.remove("active");

document
.getElementById("urlbox")
.classList.remove("active");

document
.getElementById("status")
.textContent =
"TonnerreIA est prête.";

}

</script>

</body>
</html>`;
