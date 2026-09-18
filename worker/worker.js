export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      return Response.json({
        success: true,
        name: "TonnerreIA",
        cloudflare: true,
        openai: false,
        workersAI: !!env.AI,
        version: "project-generator-1"
      });
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      try {
        const body = await request.json();

        if (!body.prompt || !body.prompt.trim()) {
          return Response.json(
            { error: "Prompt manquant" },
            { status: 400 }
          );
        }

        if (!env.AI) {
          return Response.json(
            { error: "Workers AI n'est pas connecté." },
            { status: 500 }
          );
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [
              {
                role: "system",
                content: `Tu es TonnerreIA, une IA spécialisée dans la création de sites web, applications et scripts.

Tu dois répondre en français.

IMPORTANT :
Quand l'utilisateur demande de créer un projet, réponds avec un projet COMPLET.

Pour un site web, utilise cette structure :
PROJECT_NAME
FILE: index.html
[code complet]
END_FILE

FILE: style.css
[code complet]
END_FILE

FILE: script.js
[code complet]
END_FILE

Ne donne jamais seulement un extrait.
Chaque fichier doit être complet et directement utilisable.

Pour un projet nécessitant plusieurs fichiers, crée tous les fichiers nécessaires.

Tu peux créer :
- sites HTML/CSS/JavaScript
- dashboards
- applications web
- scripts JavaScript
- bots Discord
- interfaces
- petits jeux web

Si l'utilisateur demande simplement une question ou une explication, réponds normalement.`
              },
              {
                role: "user",
                content: body.prompt
              }
            ]
          }
        );

        const response =
          result?.response ||
          result?.result?.response ||
          result?.choices?.[0]?.message?.content ||
          "Aucune réponse.";

        return Response.json({
          success: true,
          response
        });

      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error?.message || "Erreur Workers AI"
          },
          { status: 500 }
        );
      }
    }

    return new Response("TonnerreIA - Page introuvable", {
      status: 404
    });
  }
};

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>TonnerreIA - Créateur de projets</title>

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
  border-bottom: 1px solid #202633;
  background: #0b0f18;
}

.logo {
  font-size: 25px;
  font-weight: bold;
}

.logo span {
  margin-left: 5px;
}

.container {
  max-width: 1200px;
  margin: auto;
  padding: 35px 20px;
}

.hero {
  text-align: center;
  margin-bottom: 35px;
}

.hero h1 {
  font-size: 42px;
  margin: 10px 0;
}

.hero p {
  color: #9fa9bb;
  font-size: 17px;
}

.examples {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 20px;
}

.example {
  background: #111722;
  border: 1px solid #293244;
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
}

.example:hover {
  border-color: white;
}

textarea {
  width: 100%;
  min-height: 150px;
  padding: 18px;
  background: #111722;
  border: 1px solid #30394c;
  border-radius: 14px;
  color: white;
  font-size: 16px;
  resize: vertical;
  outline: none;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 13px 20px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}

.generate {
  background: white;
  color: #080b12;
}

.clear {
  background: #202735;
  color: white;
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.workspace {
  display: none;
  margin-top: 30px;
  border: 1px solid #293244;
  border-radius: 14px;
  overflow: hidden;
  background: #0d121c;
}

.workspace.active {
  display: block;
}

.tabs {
  display: flex;
  overflow-x: auto;
  background: #111722;
  border-bottom: 1px solid #293244;
}

.tab {
  padding: 13px 18px;
  cursor: pointer;
  white-space: nowrap;
  border-right: 1px solid #293244;
}

.tab.active {
  background: #202735;
}

.file-content {
  display: none;
  padding: 20px;
}

.file-content.active {
  display: block;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
  line-height: 1.5;
  color: #dce3ee;
}

.file-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.preview {
  display: none;
  margin-top: 20px;
}

.preview.active {
  display: block;
}

.preview iframe {
  width: 100%;
  height: 600px;
  border: 1px solid #293244;
  border-radius: 12px;
  background: white;
}

.status {
  margin-top: 15px;
  color: #9fa9bb;
  white-space: pre-wrap;
}

</style>
</head>

<body>

<header>
  <div class="logo">⚡ TonnerreIA</div>
</header>

<div class="container">

  <div class="hero">

    <h1>Crée ton projet avec l'IA</h1>

    <p>
      Décris ce que tu veux et TonnerreIA génère directement tes fichiers.
    </p>

    <div class="examples">

      <div class="example"
        onclick="setPrompt('Crée un site de restaurant moderne avec menu, réservation et contact')">
        🍔 Restaurant
      </div>

      <div class="example"
        onclick="setPrompt('Crée un site portfolio moderne pour un développeur')">
        💻 Portfolio
      </div>

      <div class="example"
        onclick="setPrompt('Crée un petit jeu web en HTML CSS JavaScript')">
        🎮 Jeu
      </div>

      <div class="example"
        onclick="setPrompt('Crée un dashboard administrateur moderne')">
        📊 Dashboard
      </div>

    </div>

  </div>

  <textarea
    id="prompt"
    placeholder="Exemple : crée-moi un site de restaurant moderne avec menu, réservation, animations et formulaire de contact..."
  ></textarea>

  <div class="actions">

    <button
      class="generate"
      id="generate"
      onclick="generateProject()">
      🚀 Créer le projet
    </button>

    <button
      class="clear"
      onclick="clearAll()">
      Effacer
    </button>

  </div>

  <div id="status" class="status">
    TonnerreIA est prête.
  </div>

  <div id="workspace" class="workspace">

    <div id="tabs" class="tabs"></div>

    <div id="files"></div>

    <div class="file-actions">

      <button onclick="copyCurrent()">
        📋 Copier
      </button>

      <button onclick="downloadCurrent()">
        ⬇️ Télécharger
      </button>

      <button onclick="showPreview()">
        👁️ Aperçu
      </button>

    </div>

  </div>

  <div id="preview" class="preview">

    <h2>👁️ Aperçu</h2>

    <iframe id="iframe"></iframe>

  </div>

</div>

<script>

let projectFiles = {};
let currentFile = "";

function setPrompt(text) {
  document.getElementById("prompt").value = text;
}

function clearAll() {
  document.getElementById("prompt").value = "";
  document.getElementById("status").textContent =
    "TonnerreIA est prête.";

  document.getElementById("workspace")
    .classList.remove("active");

  document.getElementById("preview")
    .classList.remove("active");

  projectFiles = {};
  currentFile = "";
}

async function generateProject() {

  const prompt =
    document.getElementById("prompt").value.trim();

  const button =
    document.getElementById("generate");

  const status =
    document.getElementById("status");

  if (!prompt) {
    status.textContent =
      "❌ Décris ce que tu veux créer.";
    return;
  }

  button.disabled = true;

  status.textContent =
    "⚡ TonnerreIA crée ton projet...";

  document.getElementById("workspace")
    .classList.remove("active");

  try {

    const response = await fetch("/api/chat", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        prompt
      })

    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Erreur du serveur"
      );
    }

    parseProject(data.response);

    status.textContent =
      "✅ Projet généré avec succès.";

  } catch (error) {

    status.textContent =
      "❌ Erreur : " + error.message;

  }

  button.disabled = false;
}

function parseProject(text) {

  projectFiles = {};

  const regex =
    /FILE:\\s*([^\\n]+)\\n([\\s\\S]*?)END_FILE/g;

  let match;

  while ((match = regex.exec(text)) !== null) {

    const filename =
      match[1].trim();

    const content =
      match[2].trim();

    projectFiles[filename] = content;
  }

  if (Object.keys(projectFiles).length === 0) {

    projectFiles["response.txt"] = text;
  }

  renderFiles();
}

function renderFiles() {

  const tabs =
    document.getElementById("tabs");

  const files =
    document.getElementById("files");

  tabs.innerHTML = "";
  files.innerHTML = "";

  const names =
    Object.keys(projectFiles);

  currentFile = names[0];

  names.forEach((name, index) => {

    const tab =
      document.createElement("div");

    tab.className =
      "tab" + (index === 0 ? " active" : "");

    tab.textContent = "📄 " + name;

    tab.onclick =
      () => selectFile(name);

    tabs.appendChild(tab);

    const content =
      document.createElement("div");

    content.className =
      "file-content" +
      (index === 0 ? " active" : "");

    content.id =
      "file-" + encodeURIComponent(name);

    const pre =
      document.createElement("pre");

    pre.textContent =
      projectFiles[name];

    content.appendChild(pre);

    files.appendChild(content);

  });

  document.getElementById("workspace")
    .classList.add("active");
}

function selectFile(name) {

  currentFile = name;

  document.querySelectorAll(".tab")
    .forEach(tab => {

      tab.classList.toggle(
        "active",
        tab.textContent === "📄 " + name
      );

    });

  document.querySelectorAll(".file-content")
    .forEach(content => {

      content.classList.remove("active");

    });

  const selected =
    document.getElementById(
      "file-" + encodeURIComponent(name)
    );

  if (selected) {
    selected.classList.add("active");
  }
}

async function copyCurrent() {

  if (!currentFile) return;

  await navigator.clipboard.writeText(
    projectFiles[currentFile]
  );

  document.getElementById("status")
    .textContent =
    "✅ " + currentFile + " copié.";
}

function downloadCurrent() {

  if (!currentFile) return;

  const blob =
    new Blob(
      [projectFiles[currentFile]],
      { type: "text/plain" }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    currentFile.split("/").pop();

  a.click();

  URL.revokeObjectURL(url);
}

function showPreview() {

  if (!projectFiles["index.html"]) {

    alert(
      "Le projet ne contient pas de index.html."
    );

    return;
  }

  let html =
    projectFiles["index.html"];

  if (projectFiles["style.css"]) {

    const css =
      projectFiles["style.css"];

    html =
      html.replace(
        "</head>",
        "<style>" +
        css +
        "</style></head>"
      );
  }

  if (projectFiles["script.js"]) {

    const js =
      projectFiles["script.js"];

    html =
      html.replace(
        "</body>",
        "<script>" +
        js +
        "<\\/script></body>"
      );
  }

  const iframe =
    document.getElementById("iframe");

  iframe.srcdoc = html;

  document.getElementById("preview")
    .classList.add("active");
}

</script>

</body>
</html>`;
