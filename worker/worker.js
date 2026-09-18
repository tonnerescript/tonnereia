const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const SYSTEM_PROMPT = [
  "Tu es TonnerreIA, une IA experte en création de sites web.",
  "",
  "MISSION :",
  "Crée automatiquement un vrai site web moderne, complet, intéressant et professionnel à partir de la demande.",
  "Analyse le projet avant de choisir sa structure.",
  "Tu décides toi-même si une ou plusieurs pages sont nécessaires.",
  "",
  "MODE CRÉATIF AUTOMATIQUE :",
  "- Analyse le type de projet.",
  "- Comprends son objectif.",
  "- Identifie le public.",
  "- Choisis une identité visuelle.",
  "- Choisis les sections utiles.",
  "- Choisis le nombre de pages adapté.",
  "- Ajoute des interactions utiles.",
  "- Crée une navigation cohérente.",
  "- Adapte le résultat au téléphone, à la tablette et au PC.",
  "",
  "PAGES :",
  "Si plusieurs pages sont utiles, crée-les.",
  "Utilise uniquement ces noms :",
  "index.html",
  "about.html",
  "services.html",
  "products.html",
  "projects.html",
  "contact.html",
  "gallery.html",
  "booking.html",
  "faq.html",
  "",
  "Tu peux utiliser d'autres noms simples en .html si le projet le nécessite.",
  "",
  "IMPORTANT :",
  "Toutes les pages doivent partager le même style.css et script.js.",
  "Les liens de navigation doivent fonctionner entre les pages.",
  "Chaque page doit être complète.",
  "",
  "DESIGN :",
  "- Design professionnel.",
  "- Belle hiérarchie visuelle.",
  "- Couleurs cohérentes.",
  "- Cartes modernes.",
  "- Boutons modernes.",
  "- Animations légères.",
  "- Effets hover.",
  "- Sections bien espacées.",
  "- Design responsive.",
  "",
  "INTERACTIONS :",
  "Utilise JavaScript lorsque cela apporte quelque chose.",
  "Exemples : menu mobile, FAQ, formulaire, filtres, galerie, modal, compteur, animations.",
  "",
  "IMAGES :",
  "Tu peux utiliser des images publiques distantes si elles améliorent réellement le site.",
  "",
  "FORMAT OBLIGATOIRE :",
  "PROJECT_NAME: Nom du site",
  "FILES_COUNT: nombre",
  "FILE: index.html",
  "CONTENU COMPLET",
  "END_FILE",
  "FILE: autre.html",
  "CONTENU COMPLET",
  "END_FILE",
  "FILE: style.css",
  "CSS COMPLET",
  "END_FILE",
  "FILE: script.js",
  "JAVASCRIPT COMPLET",
  "END_FILE",
  "",
  "Ne mets aucun markdown.",
  "Ne mets jamais de ```.",
  "Retourne uniquement les fichiers."
].join("\n");

const EDIT_SYSTEM_PROMPT = [
  "Tu es TonnerreIA.",
  "Tu modifies un site web existant de façon intelligente.",
  "",
  "OBJECTIF :",
  "Applique la demande de modification.",
  "Conserve les fonctionnalités existantes.",
  "Conserve les pages existantes sauf si la demande demande leur suppression.",
  "Si la modification nécessite une nouvelle page, crée-la.",
  "Si la modification concerne plusieurs pages, mets-les toutes à jour.",
  "Garde une identité visuelle cohérente.",
  "Le site doit rester responsive.",
  "",
  "FORMAT OBLIGATOIRE :",
  "PROJECT_NAME: Nom du site",
  "FILE: index.html",
  "CONTENU COMPLET",
  "END_FILE",
  "FILE: autres-pages.html",
  "CONTENU COMPLET",
  "END_FILE",
  "FILE: style.css",
  "CSS COMPLET",
  "END_FILE",
  "FILE: script.js",
  "JAVASCRIPT COMPLET",
  "END_FILE",
  "",
  "Retourne toutes les pages et les deux fichiers communs complets.",
  "Ne mets aucun markdown.",
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

function html(data, status = 200) {
  return new Response(data, {
    status,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function cleanAIResponse(text) {
  return String(text || "")
    .replace(/```html/gi, "")
    .replace(/```css/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseProject(text) {
  const source = cleanAIResponse(text);

  const nameMatch = source.match(
    /PROJECT_NAME:\s*(.+)/i
  );

  const projectName = nameMatch
    ? nameMatch[1].trim()
    : "Site généré par TonnerreIA";

  const files = {};

  const regex =
    /FILE:\s*([a-zA-Z0-9_-]+\.html|style\.css|script\.js)\s*\n([\s\S]*?)\s*END_FILE/gi;

  let match;

  while ((match = regex.exec(source)) !== null) {
    const filename = match[1].toLowerCase();

    files[filename] = match[2].trim();
  }

  if (!files["index.html"]) {
    const htmlMatch = source.match(
      /<!DOCTYPE html[\s\S]*<\/html>/i
    );

    if (htmlMatch) {
      files["index.html"] =
        htmlMatch[0].trim();
    }
  }

  return {
    projectName,
    files
  };
}

function injectAssets(page, css, js) {
  let result = page;

  if (css) {
    if (/<\/head>/i.test(result)) {
      result = result.replace(
        /<\/head>/i,
        "<style>" +
          css +
          "</style></head>"
      );
    } else {
      result =
        "<style>" +
        css +
        "</style>" +
        result;
    }
  }

  if (js) {
    if (/<\/body>/i.test(result)) {
      result = result.replace(
        /<\/body>/i,
        "<script>" +
          js +
          "<\/script></body>"
      );
    } else {
      result +=
        "<script>" +
        js +
        "<\/script>";
    }
  }

  return result;
}

function makePreview(project) {
  const files = project.files || {};

  const css =
    files["style.css"] || "";

  const js =
    files["script.js"] || "";

  const pages = {};

  for (const filename of Object.keys(files)) {
    if (
      filename.endsWith(".html") &&
      files[filename]
    ) {
      pages[filename] =
        injectAssets(
          files[filename],
          css,
          js
        );
    }
  }

  if (!pages["index.html"]) {
    pages["index.html"] = [
      "<!DOCTYPE html>",
      '<html lang="fr">',
      "<head>",
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      "<style>",
      css,
      "</style>",
      "</head>",
      "<body>",
      "<h1>Site généré par TonnerreIA</h1>",
      "<script>",
      js,
      "<\/script>",
      "</body>",
      "</html>"
    ].join("\n");
  }

  return {
    main: pages["index.html"],
    pages
  };
}

async function callAI(
  env,
  systemPrompt,
  userPrompt
) {
  const result =
    await env.AI.run(
      AI_MODEL,
      {
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
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
    return json(
      {
        ok: false,
        error: "JSON invalide."
      },
      400
    );
  }

  const prompt =
    String(
      body.prompt || ""
    ).trim();

  if (!prompt) {
    return json(
      {
        ok: false,
        error: "Prompt vide."
      },
      400
    );
  }

  if (!env.AI) {
    return json(
      {
        ok: false,
        error:
          "Cloudflare Workers AI n'est pas configuré."
      },
      500
    );
  }

  const creativePrompt = [
    "Active le MODE CRÉATIF AUTOMATIQUE.",
    "",
    "DEMANDE :",
    prompt,
    "",
    "Décide automatiquement :",
    "- la structure",
    "- le nombre de pages",
    "- les sections",
    "- le design",
    "- les couleurs",
    "- les interactions",
    "- la navigation",
    "- le responsive",
    "",
    "Crée un résultat qui ressemble à un vrai site professionnel.",
    "Ne crée pas plusieurs pages simplement pour en créer.",
    "Utilise plusieurs pages lorsque cela améliore réellement le projet."
  ].join("\n");

  try {
    const responseText =
      await callAI(
        env,
        SYSTEM_PROMPT,
        creativePrompt
      );

    if (!responseText) {
      return json(
        {
          ok: false,
          error:
            "L'IA n'a renvoyé aucun résultat."
        },
        500
      );
    }

    const project =
      parseProject(
        responseText
      );

    if (
      !project.files["index.html"]
    ) {
      return json(
        {
          ok: false,
          error:
            "Le HTML n'a pas été généré correctement."
        },
        500
      );
    }

    const preview =
      makePreview(project);

    return json({
      ok: true,
      project,
      preview: preview.main,
      pages: preview.pages,
      pageNames:
        Object.keys(
          preview.pages
        )
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(
          error.message ||
          error
        )
      },
      500
    );
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
    return json(
      {
        ok: false,
        error: "JSON invalide."
      },
      400
    );
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
    return json(
      {
        ok: false,
        error:
          "Décris la modification."
      },
      400
    );
  }

  if (
    !currentFiles["index.html"]
  ) {
    return json(
      {
        ok: false,
        error:
          "Aucun site à modifier."
      },
      400
    );
  }

  if (!env.AI) {
    return json(
      {
        ok: false,
        error:
          "Cloudflare Workers AI n'est pas configuré."
      },
      500
    );
  }

  const siteParts = [];

  siteParts.push(
    "NOM DU PROJET :"
  );

  siteParts.push(
    String(
      current.projectName ||
      "Site généré"
    )
  );

  siteParts.push("");

  for (
    const filename of
    Object.keys(currentFiles)
  ) {
    siteParts.push(
      "===== " +
      filename +
      " ====="
    );

    siteParts.push(
      currentFiles[filename] || ""
    );

    siteParts.push("");
  }

  siteParts.push(
    "===== MODIFICATION DEMANDÉE ====="
  );

  siteParts.push(change);

  siteParts.push("");

  siteParts.push(
    "Retourne toutes les pages complètes."
  );

  try {
    const responseText =
      await callAI(
        env,
        EDIT_SYSTEM_PROMPT,
        siteParts.join("\n")
      );

    if (!responseText) {
      return json(
        {
          ok: false,
          error:
            "L'IA n'a renvoyé aucun résultat."
        },
        500
      );
    }

    const project =
      parseProject(
        responseText
      );

    if (
      !project.files["index.html"]
    ) {
      return json(
        {
          ok: false,
          error:
            "La modification n'a pas produit de HTML valide."
        },
        500
      );
    }

    const preview =
      makePreview(project);

    return json({
      ok: true,
      project,
      preview: preview.main,
      pages: preview.pages,
      pageNames:
        Object.keys(
          preview.pages
        )
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(
          error.message ||
          error
        )
      },
      500
    );
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

  "html{scroll-behavior:smooth}",

  "body{",
  "margin:0;",
  "min-height:100vh;",
  "font-family:Arial,Helvetica,sans-serif;",
  "background:#070811;",
  "color:#fff;",
  "}",

  ".header{",
  "height:72px;",
  "display:flex;",
  "align-items:center;",
  "justify-content:space-between;",
  "padding:0 28px;",
  "border-bottom:1px solid #25283d;",
  "background:rgba(10,12,25,.94);",
  "position:sticky;",
  "top:0;",
  "z-index:10;",
  "backdrop-filter:blur(14px);",
  "}",

  ".logo{",
  "font-size:22px;",
  "font-weight:800;",
  "}",

  ".logo span{",
  "color:#7867ff;",
  "}",

  ".online{",
  "font-size:13px;",
  "color:#70e5a0;",
  "}",

  ".container{",
  "width:min(1120px,calc(100% - 30px));",
  "margin:auto;",
  "padding:60px 0 100px;",
  "}",

  ".hero{text-align:center}",

  ".badge{",
  "display:inline-flex;",
  "padding:8px 14px;",
  "border:1px solid #332e62;",
  "border-radius:999px;",
  "background:#15122d;",
  "color:#afa7ff;",
  "font-size:13px;",
  "font-weight:600;",
  "}",

  "h1{",
  "font-size:clamp(42px,7vw,74px);",
  "line-height:.98;",
  "letter-spacing:-3px;",
  "margin:24px 0 18px;",
  "}",

  ".hero p{",
  "max-width:720px;",
  "margin:0 auto;",
  "color:#9ca4bc;",
  "font-size:17px;",
  "line-height:1.7;",
  "}",

  ".generator{",
  "margin-top:42px;",
  "}",

  "textarea{",
  "width:100%;",
  "min-height:150px;",
  "padding:20px;",
  "resize:vertical;",
  "border-radius:18px;",
  "border:1px solid #292d44;",
  "outline:none;",
  "background:#101221;",
  "color:#fff;",
  "font-size:16px;",
  "line-height:1.5;",
  "}",

  "textarea:focus{",
  "border-color:#7565ff;",
  "box-shadow:0 0 0 3px rgba(117,101,255,.12);",
  "}",

  ".generate,.editButton{",
  "width:100%;",
  "margin-top:12px;",
  "padding:17px 20px;",
  "border:0;",
  "border-radius:14px;",
  "background:linear-gradient(135deg,#705cff,#358cff);",
  "color:#fff;",
  "font-size:16px;",
  "font-weight:800;",
  "cursor:pointer;",
  "}",

  ".editButton{",
  "background:linear-gradient(135deg,#9a55ff,#e34cff);",
  "}",

  "button:disabled{",
  "opacity:.55;",
  "cursor:wait;",
  "}",

  "#message{",
  "display:none;",
  "margin-top:14px;",
  "padding:14px 16px;",
  "border-radius:13px;",
  "background:#101321;",
  "border:1px solid #292d44;",
  "color:#b6bdd0;",
  "}",

  "#editBox{",
  "display:none;",
  "margin-top:25px;",
  "}",

  ".editTitle{",
  "margin-bottom:8px;",
  "font-size:16px;",
  "font-weight:800;",
  "}",

  ".editHint{",
  "margin:0 0 10px;",
  "color:#7e869d;",
  "font-size:13px;",
  "}",

  "#previewBox{",
  "display:none;",
  "margin-top:38px;",
  "border:1px solid #292d44;",
  "border-radius:20px;",
  "overflow:hidden;",
  "background:#171923;",
  "}",

  ".previewHeader{",
  "min-height:64px;",
  "display:flex;",
  "align-items:center;",
  "justify-content:space-between;",
  "gap:12px;",
  "padding:11px 15px;",
  "background:#0f1120;",
  "}",

  "#previewTitle{",
  "font-weight:800;",
  "}",

  ".previewButtons{",
  "display:flex;",
  "gap:7px;",
  "}",

  ".deviceButton{",
  "width:auto;",
  "margin:0;",
  "padding:9px 13px;",
  "border:1px solid #34384f;",
  "border-radius:9px;",
  "background:#1a1d2d;",
  "color:#fff;",
  "font-size:13px;",
  "cursor:pointer;",
  "}",

  ".deviceButton.active{",
  "background:#6756ff;",
  "border-color:#6756ff;",
  "}",

  "#previewArea{",
  "width:100%;",
  "height:680px;",
  "display:flex;",
  "justify-content:center;",
  "align-items:stretch;",
  "overflow:auto;",
  "background:#181a23;",
  "}",

  "#preview{",
  "width:100%;",
  "height:100%;",
  "border:0;",
  "background:#fff;",
  "}",

  "#previewArea.phone{",
  "align-items:center;",
  "padding:30px;",
  "}",

  "#previewArea.phone #preview{",
  "width:390px;",
  "max-width:390px;",
  "height:620px;",
  "border-radius:24px;",
  "box-shadow:0 0 0 7px #05060a,0 20px 60px rgba(0,0,0,.5);",
  "}",

  "#pageSelector{",
  "display:none;",
  "padding:10px 15px;",
  "border-top:1px solid #292d44;",
  "background:#10121f;",
  "overflow-x:auto;",
  "gap:8px;",
  "}",

  ".pageButton{",
  "flex:0 0 auto;",
  "padding:9px 13px;",
  "border:1px solid #34384f;",
  "border-radius:9px;",
  "background:#1a1d2d;",
  "color:#fff;",
  "cursor:pointer;",
  "}",

  ".pageButton.active{",
  "background:#6756ff;",
  "border-color:#6756ff;",
  "}",

  ".files{",
  "display:none;",
  "grid-template-columns:repeat(3,1fr);",
  "gap:10px;",
  "margin-top:12px;",
  "}",

  ".file{",
  "padding:14px;",
  "border:1px solid #292d44;",
  "border-radius:11px;",
  "background:#10121f;",
  "color:#aeb5c8;",
  "font-size:14px;",
  "}",

  "@media(max-width:700px){",

  ".header{",
  "padding:0 17px;",
  "}",

  ".container{",
  "padding-top:40px;",
  "}",

  "h1{",
  "letter-spacing:-2px;",
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

  "#previewArea.phone{",
  "padding:18px;",
  "}",

  "#previewArea.phone #preview{",
  "width:360px;",
  "max-width:calc(100% - 10px);",
  "height:565px;",
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

  '<div class="badge">✦ Mode Créatif automatique</div>',

  "<h1>Crée ton site avec TonnerreIA</h1>",

  "<p>",
  "Décris ton idée. TonnerreIA choisit automatiquement la structure, le design, les fonctionnalités et le nombre de pages adaptés à ton projet.",
  "</p>",

  "</section>",

  '<section class="generator">',

  '<textarea id="prompt" placeholder="Exemple : crée-moi un site professionnel pour une agence immobilière avec accueil, biens, agence, avis et contact..."></textarea>',

  '<button class="generate" id="generate">',
  "⚡ Générer mon site",
  "</button>",

  '<div id="message"></div>',

  '<div id="editBox">',

  '<div class="editTitle">✏️ Modifier ton site avec l’IA</div>',

  '<p class="editHint">',
  "Demande une modification et TonnerreIA mettra à jour les pages concernées.",
  "</p>",

  '<textarea id="change" placeholder="Exemple : ajoute une page tarifs, rends le design plus premium et ajoute des animations..."></textarea>',

  '<button class="editButton" id="edit">',
  "✏️ Modifier avec l’IA",
  "</button>",

  "</div>",

  '<div id="previewBox">',

  '<div class="previewHeader">',

  '<div id="previewTitle">⚡ Site généré</div>',

  '<div class="previewButtons">',

  '<button class="deviceButton active" id="pcButton">🖥️ PC</button>',

  '<button class="deviceButton" id="phoneButton">📱 Téléphone</button>',

  "</div>",

  "</div>",

  '<div id="pageSelector"></div>',

  '<div id="previewArea">',

  '<iframe id="preview" title="Aperçu du site généré" sandbox="allow-scripts allow-forms"></iframe>',

  "</div>",

  "</div>",

  '<div class="files" id="files"></div>',

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
  'const pageSelector=document.getElementById("pageSelector");',
  'const pcButton=document.getElementById("pcButton");',
  'const phoneButton=document.getElementById("phoneButton");',

  "let currentProject=null;",
  "let currentPages={};",

  "function showMessage(text){",
  'message.style.display="block";',
  "message.textContent=text;",
  "}",

  "function escapeHtml(text){",
  "return String(text)",
  ".replace(/&/g,'&amp;')",
  ".replace(/</g,'&lt;')",
  ".replace(/>/g,'&gt;')",
  ".replace(/\"/g,'&quot;')",
  ".replace(/'/g,'&#039;');",
  "}",

  "function renderPageButtons(pageNames){",

  "pageSelector.innerHTML='';",

  "if(!pageNames||pageNames.length<=1){",
  'pageSelector.style.display="none";',
  "return;",
  "}",

  'pageSelector.style.display="flex";',

  "pageNames.forEach(function(name,index){",

  "const button=document.createElement('button');",

  'button.className="pageButton";',
  "button.textContent=name;",
  "button.addEventListener('click',function(){",

  "document.querySelectorAll('.pageButton').forEach(function(item){",
  "item.classList.remove('active');",
  "});",

  "button.classList.add('active');",

  "if(currentPages[name]){",
  "preview.srcdoc=currentPages[name];",
  "}",

  "});",

  "if(index===0){",
  "button.classList.add('active');",
  "}",

  "pageSelector.appendChild(button);",

  "});",

  "}",

  "function renderFiles(project){",

  "files.innerHTML='';",

  "Object.keys(project.files||{}).forEach(function(name){",

  "const div=document.createElement('div');",

  'div.className="file";',
  "div.textContent=",
  "(name.endsWith('.html')?'📄 ':name==='style.css'?'🎨 ':'⚙️ ')+name;",

  "files.appendChild(div);",

  "});",

  "}",

  "function showProject(data){",

  "currentProject=data.project;",

  "currentPages=data.pages||{};",

  "previewTitle.textContent='⚡ '+(",
  "data.project.projectName||'Site généré'",
  ");",

  "preview.srcdoc=data.preview;",

  'previewBox.style.display="block";',
  'editBox.style.display="block";',
  'files.style.display="grid";',

  "renderPageButtons(Object.keys(currentPages));",
  "renderFiles(data.project);",

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
  'generateButton.textContent="🧠 Création intelligente...";',

  'showMessage("🧠 TonnerreIA analyse ton projet et construit sa structure...");',

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

  "const count=Object.keys(data.pages||{}).length;",

  'showMessage("✅ Site créé ! "+count+" page(s) générée(s) automatiquement.");',

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
  'showMessage("⚠️ Décris la modification.");',
  "return;",
  "}",

  "editButton.disabled=true;",
  'editButton.textContent="🧠 Modification en cours...";',

  'showMessage("🧠 TonnerreIA analyse toutes les pages et applique ta modification...");',

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

  'showMessage("✅ Modification appliquée à ton site !");',

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
        workersAI: !!env.AI,
        creativeMode: true,
        multiPage: true
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

    return json(
      {
        ok: false,
        error: "Route introuvable."
      },
      404
    );
  }
};
