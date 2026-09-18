import JSZip from "jszip";

const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const SYSTEM_PROMPT = [
  "Tu es TonnerreIA, une IA experte en création de sites web.",
  "",
  "MISSION:",
  "Crée un vrai site web complet, moderne, professionnel et responsive.",
  "Analyse la demande avant de choisir la structure.",
  "Utilise le MODE CRÉATIF AUTOMATIQUE.",
  "",
  "MODE CRÉATIF:",
  "- Choisis automatiquement la structure.",
  "- Choisis les couleurs.",
  "- Choisis les polices.",
  "- Choisis les sections.",
  "- Choisis le nombre de pages.",
  "- Ajoute des animations légères.",
  "- Ajoute des interactions utiles.",
  "- Adapte le site au mobile et au PC.",
  "- Ne répète pas toujours le même design.",
  "",
  "MULTI-PAGES:",
  "Crée plusieurs pages lorsque le projet le nécessite.",
  "Toutes les pages doivent utiliser style.css et script.js.",
  "Les pages doivent avoir une navigation cohérente.",
  "index.html est obligatoire.",
  "",
  "PAGES POSSIBLES:",
  "index.html",
  "about.html",
  "services.html",
  "products.html",
  "projects.html",
  "gallery.html",
  "booking.html",
  "faq.html",
  "contact.html",
  "",
  "DESIGN:",
  "- Design professionnel.",
  "- Interface moderne.",
  "- Bonne hiérarchie visuelle.",
  "- Espacements propres.",
  "- Boutons modernes.",
  "- Cartes modernes.",
  "- Animations légères.",
  "- Responsive.",
  "",
  "JAVASCRIPT:",
  "Ajoute du JavaScript lorsque cela apporte une vraie fonctionnalité.",
  "Exemples: menu mobile, FAQ, filtres, galerie, formulaire, animations, compteur.",
  "",
  "IMAGES:",
  "Tu peux utiliser des images distantes publiques si elles améliorent le résultat.",
  "",
  "FORMAT OBLIGATOIRE:",
  "PROJECT_NAME: Nom du projet",
  "FILE: index.html",
  "contenu complet",
  "END_FILE",
  "FILE: autre.html",
  "contenu complet",
  "END_FILE",
  "FILE: style.css",
  "contenu complet",
  "END_FILE",
  "FILE: script.js",
  "contenu complet",
  "END_FILE",
  "",
  "Ne mets aucun markdown.",
  "Ne mets jamais de ```.",
  "Retourne uniquement les fichiers."
].join("\n");

const EDIT_SYSTEM_PROMPT = [
  "Tu es TonnerreIA, une IA experte en modification de sites web.",
  "",
  "MODIFICATION:",
  "Applique exactement la demande de l'utilisateur.",
  "Conserve les fonctionnalités existantes.",
  "Conserve les pages existantes.",
  "Ne supprime pas une page sauf si l'utilisateur le demande.",
  "Crée une nouvelle page si cela est nécessaire.",
  "Garde une identité visuelle cohérente.",
  "Garde le site responsive.",
  "",
  "FORMAT OBLIGATOIRE:",
  "PROJECT_NAME: Nom du projet",
  "FILE: index.html",
  "contenu complet",
  "END_FILE",
  "FILE: autres-pages.html",
  "contenu complet",
  "END_FILE",
  "FILE: style.css",
  "contenu complet",
  "END_FILE",
  "FILE: script.js",
  "contenu complet",
  "END_FILE",
  "",
  "Retourne tous les fichiers complets.",
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
    /FILE:\s*([a-zA-Z0-9_-]+\.(?:html|css|js))\s*\n([\s\S]*?)\s*END_FILE/gi;

  let match;

  while ((match = regex.exec(source)) !== null) {
    const filename = match[1].trim().toLowerCase();
    const content = match[2].trim();

    if (
      filename.endsWith(".html") ||
      filename === "style.css" ||
      filename === "script.js"
    ) {
      files[filename] = content;
    }
  }

  if (!files["index.html"]) {
    const fallback = source.match(
      /<!DOCTYPE html[\s\S]*?<\/html>/i
    );

    if (fallback) {
      files["index.html"] = fallback[0].trim();
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
    const styleBlock =
      "<style>\n" +
      css +
      "\n</style>";

    if (/<\/head>/i.test(result)) {
      result = result.replace(
        /<\/head>/i,
        styleBlock + "\n</head>"
      );
    } else {
      result =
        styleBlock +
        "\n" +
        result;
    }
  }

  if (js) {
    const safeJS = js.replace(
      /<\/script/gi,
      "<\\/script"
    );

    const scriptBlock =
      "<script>\n" +
      safeJS +
      "\n</script>";

    if (/<\/body>/i.test(result)) {
      result = result.replace(
        /<\/body>/i,
        scriptBlock + "\n</body>"
      );
    } else {
      result += "\n" + scriptBlock;
    }
  }

  return result;
}

function makePreview(project) {
  const files = project.files || {};

  const css = files["style.css"] || "";
  const js = files["script.js"] || "";

  const pages = {};

  for (const filename of Object.keys(files)) {
    if (
      filename.endsWith(".html") &&
      files[filename]
    ) {
      pages[filename] = injectAssets(
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
      js.replace(/<\/script/gi, "<\\/script"),
      "</script>",
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
  const result = await env.AI.run(
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
    body = await request.json();
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
    String(body.prompt || "").trim();

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
          "Workers AI n'est pas disponible."
      },
      500
    );
  }

  const userPrompt = [
    "Active le MODE CRÉATIF AUTOMATIQUE.",
    "",
    "DEMANDE DE L'UTILISATEUR:",
    prompt,
    "",
    "Analyse la demande.",
    "Choisis la meilleure structure.",
    "Choisis automatiquement le nombre de pages.",
    "Crée un vrai site professionnel.",
    "index.html est obligatoire.",
    "Utilise plusieurs pages uniquement si elles sont utiles."
  ].join("\n");

  try {
    const responseText = await callAI(
      env,
      SYSTEM_PROMPT,
      userPrompt
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
      parseProject(responseText);

    if (!project.files["index.html"]) {
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
        Object.keys(preview.pages)
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(
          error.message || error
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
    body = await request.json();
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
    String(body.change || "").trim();

  const project =
    body.project || {};

  const currentFiles =
    project.files || {};

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

  if (!currentFiles["index.html"]) {
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
          "Workers AI n'est pas disponible."
      },
      500
    );
  }

  const site = [];

  site.push(
    "PROJET:",
    project.projectName ||
      "Site TonnerreIA",
    ""
  );

  for (
    const filename of
    Object.keys(currentFiles)
  ) {
    site.push(
      "FILE EXISTANT: " + filename,
      currentFiles[filename],
      "END_FILE_EXISTANT",
      ""
    );
  }

  site.push(
    "MODIFICATION DEMANDÉE:",
    change,
    "",
    "Retourne tous les fichiers complets."
  );

  try {
    const responseText =
      await callAI(
        env,
        EDIT_SYSTEM_PROMPT,
        site.join("\n")
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

    const updated =
      parseProject(responseText);

    if (!updated.files["index.html"]) {
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
      makePreview(updated);

    return json({
      ok: true,
      project: updated,
      preview: preview.main,
      pages: preview.pages,
      pageNames:
        Object.keys(preview.pages)
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: String(
          error.message || error
        )
      },
      500
    );
  }
}

async function downloadProject(
  request
) {
  let body;

  try {
    body = await request.json();
  } catch (error) {
    return json(
      {
        ok: false,
        error: "JSON invalide."
      },
      400
    );
  }

  const project =
    body.project || {};

  const files =
    project.files || {};

  if (!files["index.html"]) {
    return json(
      {
        ok: false,
        error:
          "Aucun projet valide à télécharger."
      },
      400
    );
  }

  const zip = new JSZip();

  for (
    const filename of
    Object.keys(files)
  ) {
    if (!files[filename]) continue;

    zip.file(
      filename,
      files[filename]
    );
  }

  const content =
    await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE"
    });

  const safeName =
    String(
      project.projectName ||
        "tonnerreia-site"
    )
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) ||
    "tonnerreia-site";

  return new Response(
    content,
    {
      status: 200,
      headers: {
        "content-type":
          "application/zip",
        "content-disposition":
          'attachment; filename="' +
          safeName +
          '.zip"',
        "cache-control":
          "no-store"
      }
    }
  );
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
  "background:#070811;",
  "color:#fff;",
  "font-family:Arial,Helvetica,sans-serif;",
  "min-height:100vh;",
  "}",

  ".header{",
  "height:72px;",
  "display:flex;",
  "align-items:center;",
  "justify-content:space-between;",
  "padding:0 28px;",
  "border-bottom:1px solid #25283d;",
  "background:#0a0c19;",
  "position:sticky;",
  "top:0;",
  "z-index:20;",
  "}",

  ".logo{",
  "font-size:23px;",
  "font-weight:900;",
  "}",

  ".logo span{",
  "color:#7867ff;",
  "}",

  ".online{",
  "font-size:13px;",
  "color:#6de19a;",
  "}",

  ".container{",
  "width:min(1120px,calc(100% - 30px));",
  "margin:auto;",
  "padding:60px 0 100px;",
  "}",

  ".hero{text-align:center}",

  ".badge{",
  "display:inline-block;",
  "padding:8px 14px;",
  "border:1px solid #39346d;",
  "border-radius:999px;",
  "background:#15122d;",
  "color:#b4adff;",
  "font-size:13px;",
  "font-weight:700;",
  "}",

  "h1{",
  "font-size:clamp(42px,7vw,74px);",
  "line-height:1;",
  "letter-spacing:-3px;",
  "margin:25px 0 18px;",
  "}",

  ".hero p{",
  "max-width:730px;",
  "margin:auto;",
  "color:#9da5bc;",
  "font-size:17px;",
  "line-height:1.7;",
  "}",

  ".generator{",
  "margin-top:42px;",
  "}",

  "textarea{",
  "width:100%;",
  "min-height:145px;",
  "padding:20px;",
  "border:1px solid #292d44;",
  "border-radius:18px;",
  "background:#101221;",
  "color:#fff;",
  "font-size:16px;",
  "line-height:1.5;",
  "outline:none;",
  "resize:vertical;",
  "}",

  "textarea:focus{",
  "border-color:#7565ff;",
  "}",

  ".generate,.editButton{",
  "width:100%;",
  "margin-top:12px;",
  "padding:17px;",
  "border:0;",
  "border-radius:14px;",
  "background:linear-gradient(135deg,#705cff,#358cff);",
  "color:#fff;",
  "font-size:16px;",
  "font-weight:800;",
  "cursor:pointer;",
  "}",

  ".editButton{",
  "background:linear-gradient(135deg,#9b55ff,#e34cff);",
  "}",

  "button:disabled{",
  "opacity:.55;",
  "cursor:wait;",
  "}",

  "#message{",
  "display:none;",
  "margin-top:14px;",
  "padding:14px 16px;",
  "border:1px solid #292d44;",
  "border-radius:13px;",
  "background:#101321;",
  "color:#b9c0d2;",
  "}",

  "#editBox{",
  "display:none;",
  "margin-top:28px;",
  "}",

  ".editTitle{",
  "font-size:17px;",
  "font-weight:800;",
  "margin-bottom:7px;",
  "}",

  ".editHint{",
  "color:#7f879d;",
  "font-size:13px;",
  "}",

  "#previewBox{",
  "display:none;",
  "margin-top:38px;",
  "overflow:hidden;",
  "border:1px solid #292d44;",
  "border-radius:20px;",
  "background:#171923;",
  "}",

  ".previewHeader{",
  "min-height:65px;",
  "display:flex;",
  "align-items:center;",
  "justify-content:space-between;",
  "gap:12px;",
  "padding:12px 15px;",
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
  "padding:9px 13px;",
  "border:1px solid #34384f;",
  "border-radius:9px;",
  "background:#1a1d2d;",
  "color:#fff;",
  "cursor:pointer;",
  "}",

  ".deviceButton.active{",
  "background:#6756ff;",
  "border-color:#6756ff;",
  "}",

  "#pageSelector{",
  "display:none;",
  "gap:8px;",
  "padding:10px 15px;",
  "border-top:1px solid #292d44;",
  "border-bottom:1px solid #292d44;",
  "background:#10121f;",
  "overflow-x:auto;",
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

  "#previewArea{",
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
  "border-radius:25px;",
  "box-shadow:0 0 0 7px #05060a,0 20px 60px rgba(0,0,0,.5);",
  "}",

  ".download{",
  "width:100%;",
  "margin-top:12px;",
  "padding:16px;",
  "border:1px solid #34384f;",
  "border-radius:13px;",
  "background:#16192a;",
  "color:#fff;",
  "font-weight:800;",
  "cursor:pointer;",
  "}",

  ".download:hover{",
  "background:#20243a;",
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

  '<div class="badge">✦ Mode Créatif automatique + Multi-pages</div>',

  "<h1>Crée ton site avec TonnerreIA</h1>",

  "<p>",
  "Décris ton idée et TonnerreIA choisit automatiquement le design, la structure, les fonctionnalités et le nombre de pages.",
  "</p>",

  "</section>",

  '<section class="generator">',

  '<textarea id="prompt" placeholder="Exemple : crée-moi un site moderne pour une agence immobilière avec accueil, biens, agence, avis et contact..."></textarea>',

  '<button class="generate" id="generate">⚡ Générer mon site</button>',

  '<div id="message"></div>',

  '<div id="editBox">',

  '<div class="editTitle">✏️ Modifier ton site avec l’IA</div>',

  '<p class="editHint">',
  "Demande une modification et TonnerreIA mettra à jour le projet.",
  "</p>",

  '<textarea id="change" placeholder="Exemple : ajoute une page tarifs et rends le design plus premium..."></textarea>',

  '<button class="editButton" id="edit">✏️ Modifier avec l’IA</button>',

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

  '<iframe id="preview" title="Aperçu du site" sandbox="allow-scripts allow-forms"></iframe>',

  "</div>",

  '<button class="download" id="download">⬇️ Télécharger le projet ZIP</button>',

  "</div>",

  '<div class="files" id="files"></div>',

  "</section>",

  "</main>",

  "<script>",

  'const promptInput=document.getElementById("prompt");',
  'const changeInput=document.getElementById("change");',
  'const generateButton=document.getElementById("generate");',
  'const editButton=document.getElementById("edit");',
  'const downloadButton=document.getElementById("download");',
  'const message=document.getElementById("message");',
  'const editBox=document.getElementById("editBox");',
  'const previewBox=document.getElementById("previewBox");',
  'const preview=document.getElementById("preview");',
  'const previewTitle=document.getElementById("previewTitle");',
  'const previewArea=document.getElementById("previewArea");',
  'const pageSelector=document.getElementById("pageSelector");',
  'const filesBox=document.getElementById("files");',
  'const pcButton=document.getElementById("pcButton");',
  'const phoneButton=document.getElementById("phoneButton");',

  "let currentProject=null;",
  "let currentPages={};",

  "function showMessage(text){",
  'message.style.display="block";',
  "message.textContent=text;",
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
  'filesBox.style.display="grid";',

  "renderPages();",
  "renderFiles();",

  "previewBox.scrollIntoView({",
  "behavior:'smooth',",
  "block:'start'",
  "});",

  "}",

  "function renderPages(){",

  "pageSelector.innerHTML='';",

  "const names=Object.keys(currentPages);",

  "if(names.length<=1){",
  'pageSelector.style.display="none";',
  "return;",
  "}",

  'pageSelector.style.display="flex";',

  "names.forEach(function(name,index){",

  "const button=document.createElement('button');",

  'button.className="pageButton";',
  "button.textContent='📄 '+name;",

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

  "function renderFiles(){",

  "filesBox.innerHTML='';",

  "const names=Object.keys(currentProject.files||{});",

  "names.forEach(function(name){",

  "const div=document.createElement('div');",

  'div.className="file";',

  "let icon='⚙️ ';",

  "if(name.endsWith('.html')) icon='📄 ';",
  "if(name==='style.css') icon='🎨 ';",

  "div.textContent=icon+name;",

  "filesBox.appendChild(div);",

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
  'showMessage("⚠️ Écris ce que tu veux créer.");',
  "return;",
  "}",

  "generateButton.disabled=true;",
  'generateButton.textContent="🧠 Création en cours...";',

  'showMessage("🧠 TonnerreIA analyse ton idée et construit ton site...");',

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

  'showMessage("✅ Site créé avec "+count+" page(s).");',

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
  'editButton.textContent="🧠 Modification...";',

  'showMessage("🧠 TonnerreIA modifie ton site...");',

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

  'downloadButton.addEventListener("click",async function(){',

  "if(!currentProject){",
  'showMessage("⚠️ Génère d’abord un site.");',
  "return;",
  "}",

  "downloadButton.disabled=true;",
  'downloadButton.textContent="📦 Préparation du ZIP...";',

  "try{",

  "const response=await fetch('/api/download',{",
  "method:'POST',",
  "headers:{'Content-Type':'application/json'},",
  "body:JSON.stringify({project:currentProject})",
  "});",

  "if(!response.ok){",

  "let data={};",

  "try{",
  "data=await response.json();",
  "}catch(error){}",

  'throw new Error(data.error||"Impossible de créer le ZIP.");',

  "}",

  "const blob=await response.blob();",

  "const url=URL.createObjectURL(blob);",

  "const link=document.createElement('a');",

  "link.href=url;",

  "link.download='tonnerreia-site.zip';",

  "document.body.appendChild(link);",

  "link.click();",

  "link.remove();",

  "URL.revokeObjectURL(url);",

  'showMessage("✅ Projet ZIP téléchargé !");',

  "}catch(error){",

  'showMessage("❌ "+(error.message||"Erreur de téléchargement."));',

  "}finally{",

  "downloadButton.disabled=false;",
  'downloadButton.textContent="⬇️ Télécharger le projet ZIP";',

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
        multiPage: true,
        download: true
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

    if (
      request.method === "POST" &&
      url.pathname === "/api/download"
    ) {
      return downloadProject(
        request
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
