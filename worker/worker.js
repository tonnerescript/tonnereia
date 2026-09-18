const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const SYSTEM_PROMPT = [
  "Tu es TonnerreIA, un générateur professionnel de sites web.",
  "Transforme la demande de l'utilisateur en site complet.",
  "",
  "Réponds UNIQUEMENT avec ce format :",
  "",
  "PROJECT_NAME: nom-du-site",
  "",
  "FILE: index.html",
  "CODE HTML COMPLET",
  "END_FILE",
  "",
  "FILE: style.css",
  "CODE CSS COMPLET",
  "END_FILE",
  "",
  "FILE: script.js",
  "CODE JAVASCRIPT COMPLET",
  "END_FILE",
  "",
  "REGLES IMPORTANTES :",
  "Aucun Markdown.",
  "Aucun bloc ```.",
  "Le HTML doit être complet et utilisable.",
  "Le CSS doit être complet.",
  "Le JavaScript doit être complet.",
  "Le site doit être moderne et professionnel.",
  "Le site doit être responsive téléphone et ordinateur.",
  "Utilise des animations légères et une belle hiérarchie visuelle.",
  "Crée réellement toutes les sections demandées.",
  "Ne réponds pas avec une explication : génère directement les fichiers.",
  "",
  "Restaurant : accueil, menu, présentation, horaires, réservation, contact, footer.",
  "Portfolio : accueil, présentation, compétences, projets, contact, footer.",
  "Boutique : accueil, produits, panier, contact, footer."
].join("\n");

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function html(body, status) {
  return new Response(body, {
    status: status || 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function cleanSlug(value) {
  return String(value || "site")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "site";
}

function cleanPath(value) {
  return String(value || "")
    .replace(/^\/+/, "")
    .trim();
}

function parseProject(text) {
  const source = String(text || "")
    .replace(/```html/gi, "")
    .replace(/```css/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();

  const projectMatch = source.match(/PROJECT_NAME:\s*(.+)/i);

  const projectName = projectMatch
    ? projectMatch[1].trim()
    : "TonnerreIA Site";

  const files = {};
  const regex = /FILE:\s*([^\n]+)\n([\s\S]*?)\nEND_FILE/gi;

  let match;

  while ((match = regex.exec(source)) !== null) {
    const fileName = cleanPath(match[1]);
    const content = match[2].trim();

    if (
      fileName === "index.html" ||
      fileName === "style.css" ||
      fileName === "script.js"
    ) {
      files[fileName] = content;
    }
  }

  if (!files["index.html"]) {
    const htmlMatch = source.match(/<!DOCTYPE html[\s\S]*<\/html>/i);

    if (htmlMatch) {
      files["index.html"] = htmlMatch[0];
    }
  }

  if (!files["style.css"]) {
    files["style.css"] = "";
  }

  if (!files["script.js"]) {
    files["script.js"] = "";
  }

  return {
    projectName,
    files
  };
}

function buildHTML(files) {
  let index = files["index.html"] || "";
  const css = files["style.css"] || "";
  const js = files["script.js"] || "";

  if (!index) {
    index = "<!DOCTYPE html><html><head></head><body></body></html>";
  }

  if (css) {
    if (/<\/head>/i.test(index)) {
      index = index.replace(
        /<\/head>/i,
        "<style>\n" + css + "\n</style>\n</head>"
      );
    } else {
      index = "<style>\n" + css + "\n</style>\n" + index;
    }
  }

  if (js) {
    if (/<\/body>/i.test(index)) {
      index = index.replace(
        /<\/body>/i,
        "<script>\n" + js + "\n</script>\n</body>"
      );
    } else {
      index += "<script>\n" + js + "\n</script>";
    }
  }

  return index;
}

const APP = String.raw`<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TonnerreIA — Générateur de sites IA</title>
<meta name="description" content="Crée des sites web avec TonnerreIA.">
<style>
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 15% 10%, rgba(90, 70, 255, .20), transparent 30%),
    radial-gradient(circle at 85% 20%, rgba(0, 200, 255, .12), transparent 28%),
    #070812;
  color: #f5f7ff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
textarea,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.topbar {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: rgba(7,8,18,.72);
  backdrop-filter: blur(18px);
  position: sticky;
  top: 0;
  z-index: 50;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 800;
  letter-spacing: -.5px;
}

.logo-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #7657ff, #21c8ff);
  box-shadow: 0 0 35px rgba(93, 105, 255, .35);
}

.logo-name {
  font-size: 18px;
}

.logo-name span {
  color: #8f86ff;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #aeb5c9;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #45e58c;
  box-shadow: 0 0 12px rgba(69,229,140,.8);
}

.hero {
  max-width: 1120px;
  margin: 0 auto;
  padding: 76px 24px 42px;
  text-align: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 13px;
  border: 1px solid rgba(143,134,255,.25);
  background: rgba(111,94,255,.08);
  border-radius: 999px;
  color: #c9c4ff;
  font-size: 13px;
  margin-bottom: 20px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(42px, 7vw, 76px);
  line-height: .98;
  letter-spacing: -4px;
  background: linear-gradient(100deg, #fff, #aaa3ff 48%, #5edaff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero p {
  max-width: 680px;
  margin: 22px auto 0;
  color: #a8aec2;
  line-height: 1.7;
  font-size: 17px;
}

.workspace {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 60px;
}

.generator {
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(17,19,34,.76);
  border-radius: 24px;
  padding: 18px;
  box-shadow: 0 30px 100px rgba(0,0,0,.28);
}

.prompt-wrap {
  position: relative;
}

textarea {
  width: 100%;
  min-height: 150px;
  resize: vertical;
  border: 1px solid rgba(255,255,255,.09);
  outline: none;
  border-radius: 17px;
  background: #0c0e1a;
  color: #f4f6ff;
  padding: 20px 20px 65px;
  line-height: 1.6;
  font-size: 16px;
  transition: .2s;
}

textarea:focus {
  border-color: rgba(126,113,255,.65);
  box-shadow: 0 0 0 4px rgba(126,113,255,.08);
}

.prompt-footer {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hint {
  color: #70778d;
  font-size: 12px;
}

.primary {
  border: 0;
  color: white;
  font-weight: 750;
  padding: 12px 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, #725cff, #347fff);
  box-shadow: 0 10px 30px rgba(75,91,255,.25);
  transition: transform .18s, filter .18s;
}

.primary:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.primary:disabled {
  opacity: .55;
  cursor: wait;
}

.examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 13px;
}

.example {
  border: 1px solid rgba(255,255,255,.08);
  color: #aeb5c8;
  background: #0d0f1c;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
}

.example:hover {
  border-color: rgba(126,113,255,.45);
  color: #ddd9ff;
}

.loading {
  display: none;
  margin-top: 18px;
  border-radius: 16px;
  padding: 16px;
  background: rgba(110,92,255,.07);
  border: 1px solid rgba(110,92,255,.16);
}

.loading.show {
  display: block;
}

.loading-line {
  height: 5px;
  border-radius: 999px;
  overflow: hidden;
  background: #1a1c2b;
}

.loading-line div {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, transparent, #8a7dff, #55dfff, transparent);
  animation: loading 1.1s infinite;
}

@keyframes loading {
  from { transform: translateX(-120%); }
  to { transform: translateX(300%); }
}

.loading-text {
  color: #b8bed1;
  font-size: 13px;
  margin-top: 10px;
}

.result {
  display: none;
  margin-top: 22px;
  grid-template-columns: 190px 1fr;
  gap: 16px;
}

.result.show {
  display: grid;
}

.files {
  background: #0c0e19;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  padding: 10px;
}

.files-title {
  color: #7e859b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 9px;
}

.file {
  width: 100%;
  border: 0;
  text-align: left;
  background: transparent;
  color: #9ea6ba;
  padding: 11px;
  border-radius: 10px;
  margin-bottom: 3px;
}

.file:hover,
.file.active {
  background: rgba(115,96,255,.12);
  color: white;
}

.editor {
  min-width: 0;
  background: #0c0e19;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  overflow: hidden;
}

.editor-head {
  min-height: 54px;
  padding: 9px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,.07);
}

.filename {
  color: #dfe3f0;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.small-btn {
  border: 1px solid rgba(255,255,255,.08);
  background: #131625;
  color: #bfc5d7;
  border-radius: 9px;
  padding: 8px 10px;
  font-size: 12px;
}

.small-btn:hover {
  color: white;
  border-color: rgba(255,255,255,.17);
}

.code {
  margin: 0;
  min-height: 360px;
  max-height: 520px;
  overflow: auto;
  padding: 18px;
  color: #cbd1df;
  white-space: pre-wrap;
  word-break: break-word;
  font: 12px/1.65 "SFMono-Regular", Consolas, monospace;
}

.preview {
  display: none;
  margin-top: 18px;
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  overflow: hidden;
  background: white;
}

.preview.show {
  display: block;
}

.preview-head {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 13px;
  background: #111322;
  color: #c3c9da;
  font-size: 12px;
}

iframe {
  width: 100%;
  height: 620px;
  border: 0;
  display: block;
  background: white;
}

.publish {
  display: none;
  margin-top: 18px;
  border: 1px solid rgba(69,229,140,.16);
  background: rgba(69,229,140,.05);
  border-radius: 17px;
  padding: 16px;
}

.publish.show {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.publish h3 {
  margin: 0 0 4px;
  font-size: 14px;
}

.publish p {
  margin: 0;
  color: #8f97aa;
  font-size: 12px;
}

.public-url {
  display: none;
  margin-top: 10px;
  padding: 10px;
  border-radius: 9px;
  background: #090b14;
  color: #6ee7a3;
  word-break: break-all;
  font-size: 12px;
}

.features {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto 80px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.card {
  padding: 23px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,.07);
  background: rgba(13,15,27,.65);
}

.card-icon {
  font-size: 25px;
  margin-bottom: 14px;
}

.card h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.card p {
  margin: 0;
  color: #858ca0;
  font-size: 13px;
  line-height: 1.6;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translate(-50%, 20px);
  opacity: 0;
  pointer-events: none;
  padding: 11px 15px;
  border-radius: 12px;
  background: #171a29;
  border: 1px solid rgba(255,255,255,.1);
  color: white;
  font-size: 13px;
  transition: .25s;
  z-index: 100;
}

.toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

.error {
  display: none;
  margin-top: 15px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,75,100,.08);
  border: 1px solid rgba(255,75,100,.18);
  color: #ff9daa;
  font-size: 13px;
}

.error.show {
  display: block;
}

footer {
  text-align: center;
  padding: 25px;
  border-top: 1px solid rgba(255,255,255,.06);
  color: #62697c;
  font-size: 12px;
}

@media (max-width: 760px) {
  .topbar {
    padding: 0 15px;
  }

  .status {
    display: none;
  }

  .hero {
    padding: 55px 18px 30px;
  }

  .hero h1 {
    letter-spacing: -2px;
    font-size: 48px;
  }

  .hero p {
    font-size: 15px;
  }

  .workspace {
    width: calc(100% - 20px);
  }

  .generator {
    padding: 11px;
    border-radius: 18px;
  }

  .result {
    grid-template-columns: 1fr;
  }

  .files {
    display: flex;
    gap: 5px;
    overflow-x: auto;
  }

  .files-title {
    display: none;
  }

  .file {
    white-space: nowrap;
    width: auto;
    margin: 0;
  }

  .editor-head {
    align-items: flex-start;
    gap: 10px;
    flex-direction: column;
  }

  .actions {
    width: 100%;
  }

  .small-btn {
    flex: 1;
  }

  .publish.show {
    flex-direction: column;
    align-items: stretch;
  }

  .publish .primary {
    width: 100%;
  }

  iframe {
    height: 500px;
  }

  .features {
    grid-template-columns: 1fr;
    width: calc(100% - 20px);
  }
}
</style>
</head>
<body>

<header class="topbar">
  <div class="logo">
    <div class="logo-icon">⚡</div>
    <div class="logo-name">Tonnerre<span>IA</span></div>
  </div>

  <div class="status">
    <span class="status-dot"></span>
    IA opérationnelle
  </div>
</header>

<section class="hero">
  <div class="badge">✦ Générateur de sites propulsé par IA</div>
  <h1>Ton idée.<br>Ton site.</h1>
  <p>
    Décris simplement le site que tu veux.
    TonnerreIA génère le HTML, le CSS et le JavaScript,
    puis te permet de le prévisualiser et de le publier.
  </p>
</section>

<main class="workspace">

  <section class="generator">

    <div class="prompt-wrap">
      <textarea id="prompt" placeholder="Exemple : Crée-moi un site moderne pour un restaurant italien avec un menu, les horaires, une réservation, une présentation du restaurant et une page contact..."></textarea>

      <div class="prompt-footer">
        <span class="hint">Décris ton projet avec tes propres mots.</span>
        <button class="primary" id="generateBtn">⚡ Générer</button>
      </div>
    </div>

    <div class="examples">
      <button class="example" data-prompt="Crée un site moderne pour un restaurant italien avec accueil, menu, réservation, horaires et contact.">🍝 Restaurant</button>
      <button class="example" data-prompt="Crée un portfolio professionnel pour un développeur avec présentation, compétences, projets et contact.">💻 Portfolio</button>
      <button class="example" data-prompt="Crée une boutique moderne de vêtements avec produits, prix, panier et contact.">🛍️ Boutique</button>
      <button class="example" data-prompt="Crée une landing page futuriste pour une application mobile avec présentation, fonctionnalités, tarifs et bouton télécharger.">🚀 Application</button>
    </div>

    <div class="loading" id="loading">
      <div class="loading-line"><div></div></div>
      <div class="loading-text" id="loadingText">TonnerreIA prépare ton site...</div>
    </div>

    <div class="error" id="error"></div>

    <section class="result" id="result">

      <aside class="files">
        <div class="files-title">Fichiers</div>
        <button class="file active" data-file="index.html">🌐 index.html</button>
        <button class="file" data-file="style.css">🎨 style.css</button>
        <button class="file" data-file="script.js">⚙️ script.js</button>
      </aside>

      <div class="editor">
        <div class="editor-head">
          <span class="filename" id="filename">index.html</span>

          <div class="actions">
            <button class="small-btn" id="copyBtn">📋 Copier</button>
            <button class="small-btn" id="previewBtn">👁️ Aperçu</button>
            <button class="small-btn" id="downloadBtn">⬇️ Télécharger</button>
          </div>
        </div>

        <pre class="code" id="code"></pre>
      </div>

    </section>

    <section class="preview" id="preview">
      <div class="preview-head">
        <span>👁️ Aperçu en direct</span>
        <button class="small-btn" id="closePreview">Fermer</button>
      </div>
      <iframe id="previewFrame" sandbox="allow-scripts"></iframe>
    </section>

    <section class="publish" id="publish">
      <div>
        <h3>🌐 Ton site est prêt à être publié</h3>
        <p>Envoie ton projet vers TonnerreIA et obtiens une URL publique.</p>
        <div class="public-url" id="publicUrl"></div>
      </div>

      <button class="primary" id="publishBtn">🚀 Publier</button>
    </section>

  </section>

</main>

<section class="features">
  <div class="card">
    <div class="card-icon">🤖</div>
    <h3>Création par IA</h3>
    <p>Décris ton idée normalement et TonnerreIA transforme ta demande en fichiers web utilisables.</p>
  </div>

  <div class="card">
    <div class="card-icon">⚡</div>
    <h3>Rapide</h3>
    <p>Génère une première version de ton projet sans devoir écrire chaque ligne de code toi-même.</p>
  </div>

  <div class="card">
    <div class="card-icon">🌐</div>
    <h3>Publication</h3>
    <p>Prévisualise ton résultat puis publie ton projet lorsqu'il est prêt.</p>
  </div>
</section>

<footer>
  TonnerreIA · Création web avec intelligence artificielle
</footer>

<div class="toast" id="toast"></div>

<script>
let project = {
  projectName: "",
  files: {
    "index.html": "",
    "style.css": "",
    "script.js": ""
  }
};

let currentFile = "index.html";

const promptInput = document.getElementById("prompt");
const generateBtn = document.getElementById("generateBtn");
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");
const result = document.getElementById("result");
const code = document.getElementById("code");
const filename = document.getElementById("filename");
const errorBox = document.getElementById("error");
const preview = document.getElementById("preview");
const previewFrame = document.getElementById("previewFrame");
const publish = document.getElementById("publish");
const publicUrl = document.getElementById("publicUrl");
const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(function() {
    toast.classList.remove("show");
  }, 2200);
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add("show");
}

function hideError() {
  errorBox.classList.remove("show");
}

function renderFile() {
  filename.textContent = currentFile;
  code.textContent = project.files[currentFile] || "";

  document.querySelectorAll(".file").forEach(function(button) {
    button.classList.toggle(
      "active",
      button.dataset.file === currentFile
    );
  });
}

function createPreview() {
  const source = project.files["index.html"] || "";
  const css = project.files["style.css"] || "";
  const js = project.files["script.js"] || "";

  let page = source;

  if (css) {
    if (page.toLowerCase().includes("</head>")) {
      page = page.replace(
        /<\\/head>/i,
        "<style>" + css + "</style></head>"
      );
    } else {
      page = "<style>" + css + "</style>" + page;
    }
  }

  if (js) {
    if (page.toLowerCase().includes("</body>")) {
      page = page.replace(
        /<\\/body>/i,
        "<script>" + js + "<\\/script></body>"
      );
    } else {
      page += "<script>" + js + "<\\/script>";
    }
  }

  previewFrame.srcdoc = page;
  preview.classList.add("show");

  setTimeout(function() {
    preview.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 50);
}

async function generate() {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    showError("Décris d'abord le site que tu veux créer.");
    promptInput.focus();
    return;
  }

  hideError();

  generateBtn.disabled = true;
  loading.classList.add("show");
  result.classList.remove("show");
  preview.classList.remove("show");
  publish.classList.remove("show");

  loadingText.textContent = "TonnerreIA analyse ton idée...";

  try {
    await new Promise(function(resolve) {
      setTimeout(resolve, 500);
    });

    loadingText.textContent = "Création du HTML, CSS et JavaScript...";

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "La génération a échoué.");
    }

    project = data.project || data;

    project.files = project.files || {};

    project.files["index.html"] =
      project.files["index.html"] || "";

    project.files["style.css"] =
      project.files["style.css"] || "";

    project.files["script.js"] =
      project.files["script.js"] || "";

    currentFile = "index.html";

    renderFile();

    result.classList.add("show");
    publish.classList.add("show");

    loadingText.textContent = "Site généré avec succès.";

    showToast("⚡ Site généré !");

    setTimeout(function() {
      result.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);

  } catch (error) {
    showError(error.message || "Une erreur est survenue.");
  } finally {
    generateBtn.disabled = false;

    setTimeout(function() {
      loading.classList.remove("show");
    }, 300);
  }
}

document.querySelectorAll(".file").forEach(function(button) {
  button.addEventListener("click", function() {
    currentFile = button.dataset.file;
    renderFile();
  });
});

document.querySelectorAll(".example").forEach(function(button) {
  button.addEventListener("click", function() {
    promptInput.value = button.dataset.prompt;
    promptInput.focus();
  });
});

generateBtn.addEventListener("click", generate);

promptInput.addEventListener("keydown", function(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    generate();
  }
});

document.getElementById("copyBtn").addEventListener("click", async function() {
  const text = project.files[currentFile] || "";

  if (!text) {
    showError("Ce fichier est vide.");
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast("📋 Code copié !");
  } catch (error) {
    showError("Impossible de copier automatiquement.");
  }
});

document.getElementById("previewBtn").addEventListener("click", function() {
  createPreview();
});

document.getElementById("closePreview").addEventListener("click", function() {
  preview.classList.remove("show");
});

document.getElementById("downloadBtn").addEventListener("click", function() {
  const content = project.files[currentFile] || "";

  const blob = new Blob(
    [content],
    { type: "text/plain;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = currentFile;
  link.click();

  URL.revokeObjectURL(url);

  showToast("⬇️ Fichier téléchargé !");
});

document.getElementById("publishBtn").addEventListener("click", async function() {
  const button = document.getElementById("publishBtn");

  if (!project.files["index.html"]) {
    showError("Génère d'abord un site.");
    return;
  }

  button.disabled = true;
  button.textContent = "Publication...";

  try {
    const response = await fetch("/api/publish", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        project: project
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.error || "Publication impossible.");
    }

    publicUrl.style.display = "block";
    publicUrl.textContent = data.url || "URL non disponible";

    showToast("🌐 Site publié !");

  } catch (error) {
    showError(error.message || "La publication a échoué.");
  } finally {
    button.disabled = false;
    button.textContent = "🚀 Publier";
  }
});

async function checkStatus() {
  try {
    const response = await fetch("/api/status");
    const data = await response.json();

    if (data.ok) {
      document.querySelector(".status").innerHTML =
        '<span class="status-dot"></span> IA opérationnelle';
    }
  } catch (error) {
    document.querySelector(".status").innerHTML =
      '<span class="status-dot" style="background:#ff6578"></span> Vérification...';
  }
}

renderFile();
checkStatus();
</script>
</body>
</html>`;

async function handleGenerate(request, env) {
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
      error: "Le prompt est vide."
    }, 400);
  }

  if (prompt.length > 10000) {
    return json({
      ok: false,
      error: "Le prompt est trop long."
    }, 400);
  }

  if (!env.AI) {
    return json({
      ok: false,
      error: "Le service Cloudflare AI n'est pas configuré."
    }, 500);
  }

  try {
    const result = await env.AI.run(AI_MODEL, {
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
    });

    const output =
      result &&
      typeof result.response === "string"
        ? result.response
        : "";

    if (!output) {
      return json({
        ok: false,
        error: "L'IA n'a renvoyé aucun résultat."
      }, 500);
    }

    const project = parseProject(output);

    if (!project.files["index.html"]) {
      return json({
        ok: false,
        error: "L'IA n'a pas généré index.html correctement."
      }, 500);
    }

    return json({
      ok: true,
      project: project
    });

  } catch (error) {
    return json({
      ok: false,
      error: "Erreur Cloudflare AI : " + String(error.message || error)
    }, 500);
  }
}

async function handlePublish(request, env) {
  if (!env.SITES) {
    return json({
      ok: false,
      error: "Le stockage KV SITES n'est pas encore configuré dans Cloudflare."
    }, 503);
  }

  let body;

  try {
    body = await request.json();
  } catch (error) {
    return json({
      ok: false,
      error: "JSON invalide."
    }, 400);
  }

  const project = body.project;

  if (
    !project ||
    !project.files ||
    !project.files["index.html"]
  ) {
    return json({
      ok: false,
      error: "Projet invalide."
    }, 400);
  }

  const baseName =
    project.projectName ||
    "site";

  const slug =
    cleanSlug(baseName) +
    "-" +
    Math.random().toString(36).slice(2, 8);

  const stored = {
    projectName: String(project.projectName || "Site"),
    files: {
      "index.html": String(project.files["index.html"] || ""),
      "style.css": String(project.files["style.css"] || ""),
      "script.js": String(project.files["script.js"] || "")
    },
    createdAt: new Date().toISOString()
  };

  try {
    await env.SITES.put(
      "site:" + slug,
      JSON.stringify(stored)
    );

    const origin = new URL(request.url).origin;

    return json({
      ok: true,
      slug: slug,
      url: origin + "/site/" + slug
    });

  } catch (error) {
    return json({
      ok: false,
      error: "Erreur lors de la publication : " +
        String(error.message || error)
    }, 500);
  }
}

async function handleSite(request, env, slug) {
  if (!env.SITES) {
    return html(
      "<h1>Stockage non configuré</h1><p>KV SITES doit être configuré.</p>",
      503
    );
  }

  const key = "site:" + cleanSlug(slug);

  try {
    const stored = await env.SITES.get(key, "json");

    if (!stored) {
      return html(
        "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Site introuvable</title></head><body><h1>404</h1><p>Ce site n'existe pas.</p></body></html>",
        404
      );
    }

    const finalHTML = buildHTML(stored.files || {});

    return new Response(finalHTML, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=UTF-8",
        "cache-control": "public, max-age=60"
      }
    });

  } catch (error) {
    return html(
      "<h1>Erreur</h1><p>Impossible de charger ce site.</p>",
      500
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type"
        }
      });
    }

    if (request.method === "GET" && pathname === "/") {
      return html(APP);
    }

    if (request.method === "GET" && pathname === "/api/status") {
      return json({
        ok: true,
        service: "TonnerreIA",
        cloudflare: true,
        workersAI: !!env.AI,
        storage: !!env.SITES
      });
    }

    if (request.method === "POST" && pathname === "/api/generate") {
      return handleGenerate(request, env);
    }

    if (request.method === "POST" && pathname === "/api/publish") {
      return handlePublish(request, env);
    }

    if (
      request.method === "GET" &&
      pathname.startsWith("/site/")
    ) {
      const slug = pathname.slice("/site/".length);

      if (!slug) {
        return html("<h1>Site introuvable</h1>", 404);
      }

      return handleSite(request, env, slug);
    }

    return json({
      ok: false,
      error: "Route introuvable."
    }, 404);
  }
};
