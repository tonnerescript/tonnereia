const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const SYSTEM_PROMPT = [
  "Tu es TonnerreIA, une IA experte en création de sites web.",
  "",
  "MISSION :",
  "À partir de la demande de l'utilisateur, conçois automatiquement un site complet, moderne, intéressant et professionnel.",
  "Tu dois réfléchir à la meilleure structure pour le projet au lieu d'utiliser toujours le même modèle.",
  "",
  "MODE CRÉATIF AUTOMATIQUE :",
  "1. Analyse le type de projet.",
  "2. Identifie le public et l'objectif du site.",
  "3. Choisis une direction artistique cohérente.",
  "4. Choisis automatiquement les sections utiles.",
  "5. Organise les informations de façon claire.",
  "6. Ajoute des interactions JavaScript utiles.",
  "7. Adapte le design au téléphone et à l'ordinateur.",
  "8. Évite les sections inutiles.",
  "9. Donne au site une vraie identité visuelle.",
  "10. Fais fonctionner les boutons et interactions lorsque cela est possible.",
  "",
  "DESIGN :",
  "- Utilise une palette de couleurs cohérente.",
  "- Utilise de belles typographies système ou Google Fonts si pertinent.",
  "- Utilise des cartes, boutons, badges et sections modernes.",
  "- Utilise des animations légères et professionnelles.",
  "- Crée une hiérarchie visuelle claire.",
  "- Évite un résultat vide ou trop basique.",
  "- Le résultat doit ressembler à un vrai site professionnel.",
  "",
  "STRUCTURE :",
  "La structure doit être décidée automatiquement selon le projet.",
  "Par exemple, un restaurant peut avoir hero, menu, spécialités, galerie, avis, réservation et contact.",
  "Un portfolio peut avoir hero, projets, compétences, expérience, à propos et contact.",
  "Une boutique peut avoir hero, produits, catégories, promotions, avis et contact.",
  "Ne force jamais toutes ces sections si elles ne sont pas adaptées.",
  "",
  "RESPONSIVE :",
  "Le site doit fonctionner correctement sur ordinateur, tablette et téléphone.",
  "",
  "IMAGES :",
  "Tu peux utiliser des images distantes avec des URLs publiques lorsqu'elles améliorent réellement le design.",
  "Privilégie des images cohérentes avec le thème.",
  "",
  "CODE :",
  "Le HTML doit être complet.",
  "Le CSS doit être complet.",
  "Le JavaScript doit être complet.",
  "Évite les dépendances inutiles.",
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
  "IMPORTANT :",
  "Ne mets aucun markdown.",
  "Ne mets jamais de ```.",
  "Retourne uniquement le format demandé."
].join("\n");

const EDIT_SYSTEM_PROMPT = [
  "Tu es TonnerreIA, une IA experte en modification de sites web.",
  "",
  "Tu reçois un site existant et une demande de modification.",
  "",
  "OBJECTIF :",
  "Applique la modification demandée intelligemment.",
  "Conserve les fonctionnalités existantes qui ne sont pas concernées.",
  "Améliore la cohérence visuelle si nécessaire.",
  "Ne supprime pas des éléments importants sans raison.",
  "Le résultat doit rester professionnel et responsive.",
  "",
  "MODE CRÉATIF :",
  "Si la demande est vague, prends des décisions de design cohérentes.",
  "Si l'utilisateur demande d'améliorer le site, améliore réellement sa structure, son design et ses interactions.",
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
  "Ne mets aucun markdown.",
  "Ne mets jamais de ```.",
  "Retourne les trois fichiers COMPLETS."
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

  const files = {
    "index.html": "",
    "style.css": "",
    "script.js": ""
  };

  const regex =
    /FILE:\s*(index\.html|style\.css|script\.js)\s*\n([\s\S]*?)\s*END_FILE/gi;

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
      files["index.html"] = htmlMatch[0].trim();
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

async function callAI(env, systemPrompt, userPrompt) {
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

  return result && result.response
    ? result.response
    : "";
}

async function generateSite(request, env) {
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

  const prompt = String(
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
    "Crée ce projet avec le MODE CRÉATIF AUTOMATIQUE.",
    "",
    "DEMANDE DE L'UTILISATEUR :",
    prompt,
    "",
    "Analyse la demande et décide toi-même :",
    "- la structure du site",
    "- les sections",
    "- la direction artistique",
    "- les couleurs",
    "- les composants",
    "- les animations",
    "- les interactions",
    "- la mise en page responsive",
    "",
    "Le site doit être complet et immédiatement présentable.",
  ].join("\n");

  try {
    const responseText = await callAI(
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

    return json({
      ok: true,
      project,
      preview: makePreview(project)
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

async function editSite(request, env) {
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

  const change = String(
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
          "Cloudflare Workers AI n'est pas configuré."
      },
      500
    );
  }

  const editPrompt = [
    "Voici le site actuel.",
    "",
    "NOM DU PROJET :",
    String(
      current.projectName ||
        "Site généré"
    ),
    "",
    "===== INDEX.HTML =====",
    currentFiles["index.html"],
    "",
    "===== STYLE.CSS =====",
    currentFiles["style.css"] || "",
    "",
    "===== SCRIPT.JS =====",
    currentFiles["script.js"] || "",
    "",
    "===== DEMANDE DE MODIFICATION =====",
    change,
    "",
    "Applique maintenant la modification.",
    "Retourne les trois fichiers complets."
  ].join("\n");

  try {
    const responseText = await callAI(
      env,
      EDIT_SYSTEM_PROMPT,
      editPrompt
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
            "La modification n'a pas produit de HTML valide."
        },
        500
      );
    }

    return json({
      ok: true,
      project,
      preview: makePreview(project)
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
  "letter-spacing:-.5px;",
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
  "align-items:center;",
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
  "max-width:700px;",
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

  "textarea::placeholder{",
  "color:#666d84;",
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
  "transition:.2s;",
  "}",

  ".editButton{",
  "background:linear-gradient(135deg,#9a55ff,#e34cff);",
  "}",

  ".generate:hover,.editButton:hover{",
  "transform:translateY(-1px);",
  "filter:brightness(1.08);",
  "}",

  "button:disabled{",
  "opacity:.55;",
  "cursor:wait;",
  "transform:none!important;",
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
  "margin-bottom:10px;",
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
  "box-shadow:0 20px 80px rgba(0,0,0,.3);",
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
  "padding:0;",
  "}",

  "#preview{",
  "width:100%;",
  "height:100%;",
  "border:0;",
  "background:#fff;",
  "transition:width .25s,height .25s;",
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
  "Décris simplement ton idée. TonnerreIA analyse ton projet et construit automatiquement la structure, le design et les fonctionnalités adaptées.",
  "</p>",

  "</section>",

  '<section class="generator">',

  '<textarea id="prompt" placeholder="Exemple : crée-moi un site moderne pour un restaurant italien avec réservation, menu, galerie et avis clients..."></textarea>',

  '<button class="generate" id="generate">',
  "⚡ Générer mon site",
  "</button>",

  '<div id="message"></div>',

  '<div id="editBox">',

  '<div class="editTitle">✏️ Modifier ton site avec l'IA</div>',

  '<p class="editHint">',
  "Décris ce que tu veux changer. TonnerreIA conservera le reste du site.",
  "</p>",

  '<textarea id="change" placeholder="Exemple : rends le site plus premium, ajoute une section tarifs et transforme les couleurs en noir et or..."></textarea>',

  '<button class="editButton" id="edit">',
  "✏️ Modifier avec l'IA",
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

  "function showProject(data){",

  "currentProject=data.project;",

  "previewTitle.textContent='⚡ '+(",
  "data.project.projectName||'Site généré'",
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
  'generateButton.textContent="⚡ Création intelligente...";',

  'showMessage("🧠 TonnerreIA analyse ton idée et construit le site...");',

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

  'showMessage("✅ Site créé avec le Mode Créatif automatique ! Tu peux maintenant le modifier.");',

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

  'showMessage("🧠 TonnerreIA modifie le site...");',

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

  'showMessage("✅ Modification appliquée avec succès !");',

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
        creativeMode: true
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
