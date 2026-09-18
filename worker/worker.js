import JSZip from "jszip";

const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const SYSTEM_PROMPT = `
Tu es TonnerreIA Design Director, une IA spécialisée dans la conception de sites web premium.

TON OBJECTIF:
Créer des sites qui semblent avoir été conçus par une véritable agence web haut de gamme.
Chaque projet doit avoir sa propre identité visuelle.

REGLE ABSOLUE:
NE JAMAIS reproduire un template générique.
NE JAMAIS utiliser systématiquement le même hero.
NE JAMAIS utiliser systématiquement les mêmes cartes.
NE JAMAIS utiliser systématiquement les mêmes couleurs.
NE JAMAIS utiliser systématiquement la même structure.
NE JAMAIS faire deux projets différents qui semblent être le même site recoloré.

==================================================
PHASE 1 — DESIGN DIRECTOR
==================================================

Avant de générer le code, analyse mentalement la demande.

Détermine:

- type de projet
- secteur
- public cible
- objectif du site
- personnalité de la marque
- niveau de gamme
- ambiance
- direction artistique
- palette
- typographies
- système de grille
- type de navigation
- type de hero
- ordre des sections
- style des boutons
- style des cartes
- traitement des images
- animations
- expérience mobile

Choisis librement la direction artistique.

Tu peux utiliser notamment:
- luxury
- editorial
- cinematic
- minimalist
- brutalist
- futuristic
- premium
- fashion
- corporate
- playful
- immersive
- architectural
- automotive
- glass
- dark premium
- light editorial

Mais ne choisis jamais un style uniquement parce qu'il est facile à coder.

==================================================
PHASE 2 — VARIATION
==================================================

Pour chaque nouvelle demande, demande-toi:

"Est-ce que ce site ressemble à un site que j'aurais déjà généré?"

Si oui:
- change la composition
- change le hero
- change la hiérarchie
- change la grille
- change les composants
- change la palette
- change le rythme vertical
- change les traitements d'image

Deux sites de secteurs différents doivent avoir des personnalités différentes.

==================================================
DIRECTION PAR SECTEUR
==================================================

RESTAURANT:
Mettre en avant l'expérience, la nourriture, les photographies, l'ambiance et la réservation.
Le design peut être gastronomique, éditorial, chaleureux, contemporain ou luxueux.

AUTOMOBILE:
Mettre en avant les véhicules, les images, la performance, la marque et l'expérience.
Utiliser des compositions fortes et des visuels importants.

MODE:
Utiliser une direction éditoriale, des images fortes, une typographie expressive et beaucoup d'espace.

PORTFOLIO:
Mettre les réalisations au centre.
La mise en page doit être personnalisée et visuelle.

AGENCE:
Mettre en avant la proposition de valeur, les services, les réalisations, les chiffres et les témoignages.

E-COMMERCE:
Mettre en avant les produits, les catégories, les visuels, les informations et les appels à l'action.

GAMING:
Créer une expérience immersive, dynamique et visuelle.

IMMOBILIER:
Mettre en avant les biens, les photographies, les informations essentielles et les demandes de contact.

ENTREPRISE:
Créer une identité crédible, claire et professionnelle.

Si le secteur n'est pas évident:
invente une direction artistique cohérente.

==================================================
DESIGN
==================================================

Utilise:
- une hiérarchie visuelle forte
- de vrais contrastes
- des espacements cohérents
- une grille professionnelle
- des compositions variées
- des tailles de titres adaptées
- des boutons travaillés
- des interactions utiles
- des transitions fluides
- des animations légères
- des détails visuels

Les éléments doivent sembler intentionnels.

Ne remplis jamais l'écran inutilement.

Les cartes ne sont pas obligatoires.
Une section peut utiliser:
- une grande image
- une grille asymétrique
- du texte
- une timeline
- une liste
- une composition éditoriale
- un split layout
- une galerie
- un tableau visuel
- une section pleine largeur

==================================================
HERO
==================================================

Le hero doit être spécifique au projet.

Il peut être:
- plein écran
- éditorial
- asymétrique
- centré
- image + texte
- texte dominant
- produit dominant
- galerie
- composition immersive
- minimaliste

Ne fais pas systématiquement:
titre + sous-titre + bouton + image.

==================================================
COULEURS
==================================================

Choisis la palette selon le projet.

Ne choisis pas systématiquement:
- bleu/violet
- noir/violet
- dégradé violet

Une palette peut être:
- monochrome
- chaude
- froide
- naturelle
- luxueuse
- colorée
- sombre
- claire
- expérimentale

==================================================
TYPOGRAPHIE
==================================================

Choisis une combinaison de typographies cohérente.

La typographie doit participer à l'identité du site.

Les titres doivent avoir une vraie présence.
Le texte courant doit rester lisible.

==================================================
IMAGES UTILISATEUR
==================================================

Des images peuvent être fournies par l'utilisateur.

Elles sont représentées par:

TONNERRE_IMAGE_1
TONNERRE_IMAGE_2
TONNERRE_IMAGE_3
TONNERRE_IMAGE_4
TONNERRE_IMAGE_5
TONNERRE_IMAGE_6
TONNERRE_IMAGE_7
TONNERRE_IMAGE_8

IMPORTANT:
Conserve exactement ces placeholders.

Ne les renomme jamais.

Utilise les photos dans les endroits où elles ont le plus de valeur.

La première photo peut être utilisée comme visuel principal si elle correspond au projet.

==================================================
IMAGES EXTERNES
==================================================

Des images distantes publiques peuvent être utilisées lorsque cela améliore le rendu.

Mais le site ne doit pas dépendre entièrement d'images externes.

==================================================
RESPONSIVE
==================================================

Le site doit fonctionner parfaitement sur:
- téléphone
- tablette
- ordinateur

Aucun débordement horizontal.

Les images doivent être adaptées.

Les textes doivent être lisibles.

La navigation mobile doit fonctionner.

==================================================
JAVASCRIPT
==================================================

Utilise JavaScript uniquement lorsqu'il apporte une vraie fonctionnalité.

Exemples:
- menu mobile
- galerie
- filtres
- FAQ
- modal
- formulaire
- navigation
- animations
- compteurs
- onglets
- slider

==================================================
MULTI-PAGES
==================================================

Utilise plusieurs pages lorsque cela améliore réellement le projet.

index.html est obligatoire.

Pages possibles:
- index.html
- about.html
- services.html
- products.html
- projects.html
- gallery.html
- booking.html
- faq.html
- contact.html

Toutes les pages doivent utiliser:
style.css
script.js

Les liens entre les pages doivent fonctionner.

==================================================
QUALITE
==================================================

Le HTML doit être propre.

Le CSS doit être organisé.

Le JavaScript doit être fonctionnel.

Les noms de classes doivent être cohérents.

Pas de code inutile.

Pas de lorem ipsum.

Pas de texte incohérent.

Pas de sections répétitives.

==================================================
AUTO-CONTROLE
==================================================

Avant de retourner le résultat:

1. Vérifie visuellement la hiérarchie.
2. Vérifie la cohérence des couleurs.
3. Vérifie la lisibilité.
4. Vérifie les images.
5. Vérifie les liens.
6. Vérifie le responsive.
7. Vérifie le JavaScript.
8. Vérifie que le design ne ressemble pas à un template générique.

==================================================
FORMAT
==================================================

Retourne uniquement les fichiers.

Utilise exactement:

PROJECT_NAME: Nom du projet

FILE: index.html
contenu complet
END_FILE

FILE: style.css
contenu complet
END_FILE

FILE: script.js
contenu complet
END_FILE

Pour chaque page supplémentaire:

FILE: about.html
contenu complet
END_FILE

Aucun markdown.
Aucun bloc \`\`\`.
Aucune explication.
`;

const EDIT_SYSTEM_PROMPT = `
Tu es TonnerreIA, une IA experte en redesign et modification de sites web.

Ta mission:
modifier le projet existant selon la demande de l'utilisateur tout en conservant ses fonctionnalités.

REGLES:
- conserve les pages existantes
- conserve les fonctionnalités existantes
- conserve les images utilisateur
- conserve les placeholders TONNERRE_IMAGE_X
- garde un design professionnel
- améliore le design lorsque la demande concerne le design
- garde le responsive
- ne supprime pas une fonctionnalité sans raison
- ne casse pas la navigation
- ne transforme pas le site en template générique

Si l'utilisateur demande un changement de design:
- analyse la direction artistique actuelle
- améliore réellement la composition
- évite les changements superficiels de couleurs uniquement
- travaille la typographie
- travaille les espacements
- travaille la hiérarchie
- travaille les sections
- travaille les images
- travaille les interactions

FORMAT OBLIGATOIRE:

PROJECT_NAME: Nom du projet

FILE: index.html
contenu complet
END_FILE

FILE: style.css
contenu complet
END_FILE

FILE: script.js
contenu complet
END_FILE

Pour chaque page supplémentaire:
FILE: nom.html
contenu complet
END_FILE

Aucun markdown.
Aucun bloc de code.
Retourne uniquement les fichiers.
`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "Content-Type"
    }
  });
}

function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function cleanAIResponse(text) {
  if (!text) return "";

  return String(text)
    .replace(/```html/gi, "")
    .replace(/```css/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseProject(text) {
  const clean = cleanAIResponse(text);

  const files = {};

  const regex =
    /FILE:\s*([a-zA-Z0-9_.-]+\.html|style\.css|script\.js)\s*\n([\s\S]*?)\s*END_FILE/gi;

  let match;

  while ((match = regex.exec(clean)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();

    if (content) {
      files[filename] = content;
    }
  }

  return files;
}

function extractProjectName(text) {
  const match = String(text || "").match(
    /PROJECT_NAME:\s*(.+)/i
  );

  return match
    ? match[1].trim()
    : "TonnerreIA Site";
}

function injectImages(files, images) {
  if (!Array.isArray(images) || images.length === 0) {
    return files;
  }

  const result = { ...files };

  for (const filename of Object.keys(result)) {
    let content = result[filename];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      if (
        typeof image !== "string" ||
        !image.startsWith("data:image/")
      ) {
        continue;
      }

      const placeholder =
        "TONNERRE_IMAGE_" + (i + 1);

      content = content.split(placeholder).join(image);
    }

    result[filename] = content;
  }

  return result;
}

function getIndexFile(files) {
  if (files["index.html"]) {
    return files["index.html"];
  }

  const htmlFile = Object.keys(files).find(
    file => file.endsWith(".html")
  );

  return htmlFile ? files[htmlFile] : "";
}

function makePreview(files) {
  let index = getIndexFile(files);

  if (!index) {
    return "";
  }

  let css = files["style.css"] || "";
  let js = files["script.js"] || "";

  const cssTag = `<style>${css}</style>`;

  const jsTag = `<script>
${js}
<\/script>`;

  if (/<\/head>/i.test(index)) {
    index = index.replace(
      /<\/head>/i,
      `${cssTag}</head>`
    );
  } else {
    index = `${cssTag}${index}`;
  }

  if (/<\/body>/i.test(index)) {
    index = index.replace(
      /<\/body>/i,
      `${jsTag}</body>`
    );
  } else {
    index += jsTag;
  }

  return index;
}

async function callAI(env, messages, options = {}) {
  if (!env.AI) {
    throw new Error(
      "Le binding Workers AI 'AI' est absent."
    );
  }

  const result = await env.AI.run(
    AI_MODEL,
    {
      messages,
      max_tokens:
        options.max_tokens || 12000,
      temperature:
        options.temperature ?? 0.9
    }
  );

  let output = "";

  if (typeof result === "string") {
    output = result;
  } else if (result?.response) {
    output = result.response;
  } else if (result?.text) {
    output = result.text;
  } else if (result?.choices?.[0]?.message?.content) {
    output =
      result.choices[0].message.content;
  }

  if (!output) {
    throw new Error(
      "Workers AI n'a retourné aucun contenu."
    );
  }

  return output;
}

async function createDesignDirection(env, prompt) {
  const designPrompt = `
Analyse cette demande de création de site:

${prompt}

Crée une direction artistique unique.

Réponds avec:

TYPE:
PUBLIC:
OBJECTIF:
PERSONNALITÉ:
DIRECTION_ARTISTIQUE:
AMBIANCE:
PALETTE:
TYPOGRAPHIES:
NAVIGATION:
HERO:
STRUCTURE:
IMAGES:
ANIMATIONS:
MOBILE:

Ne génère aucun code.
`;

  return await callAI(
    env,
    [
      {
        role: "system",
        content: `
Tu es le directeur artistique de TonnerreIA.
Tu dois créer des directions artistiques originales.
Ne choisis pas automatiquement un design déjà utilisé.
`
      },
      {
        role: "user",
        content: designPrompt
      }
    ],
    {
      max_tokens: 2500,
      temperature: 1
    }
  );
}

async function generateSite(
  env,
  prompt,
  images = []
) {
  const designDirection =
    await createDesignDirection(
      env,
      prompt
    );

  const imageInfo = images.length
    ? `
IMAGES UTILISATEUR DISPONIBLES:
${images
  .map(
    (_, i) =>
      `TONNERRE_IMAGE_${i + 1}`
  )
  .join("\n")}

Utilise ces placeholders dans le HTML.
`
    : `
Aucune image utilisateur n'est fournie.
`;

  const finalPrompt = `
DEMANDE UTILISATEUR:

${prompt}

==================================================
DIRECTION ARTISTIQUE
==================================================

${designDirection}

==================================================
IMAGES
==================================================

${imageInfo}

==================================================
INSTRUCTION
==================================================

Construis maintenant le site complet à partir de cette direction.

IMPORTANT:
La direction artistique doit être réellement visible dans le résultat.

Ne reviens pas à un template générique.

Le hero, les sections, les cartes, les espacements,
les couleurs et les compositions doivent suivre la direction artistique.

${SYSTEM_PROMPT}
`;

  const response = await callAI(
    env,
    [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: finalPrompt
      }
    ],
    {
      max_tokens: 14000,
      temperature: 0.9
    }
  );

  let files = parseProject(response);

  files = injectImages(
    files,
    images
  );

  return {
    projectName:
      extractProjectName(response),
    designDirection,
    files,
    preview: makePreview(files)
  };
}

async function editSite(
  env,
  project,
  change,
  images = []
) {
  const files =
    project?.files || {};

  const projectText = Object.entries(files)
    .map(
      ([filename, content]) =>
        `FILE: ${filename}\n${content}\nEND_FILE`
    )
    .join("\n\n");

  const imageInfo = images.length
    ? `
Images disponibles:
${images
  .map(
    (_, i) =>
      `TONNERRE_IMAGE_${i + 1}`
  )
  .join(", ")}
`
    : "";

  const prompt = `
PROJET EXISTANT:

${projectText}

==================================================

MODIFICATION DEMANDÉE:

${change}

${imageInfo}

==================================================

Retourne le projet COMPLET après modification.

Ne retourne pas seulement les fichiers modifiés.
Retourne tous les fichiers nécessaires.
`;

  const response = await callAI(
    env,
    [
      {
        role: "system",
        content: EDIT_SYSTEM_PROMPT
      },
      {
        role: "user",
        content: prompt
      }
    ],
    {
      max_tokens: 14000,
      temperature: 0.8
    }
  );

  let newFiles =
    parseProject(response);

  if (
    Object.keys(newFiles).length === 0
  ) {
    throw new Error(
      "L'IA n'a pas retourné de fichiers valides."
    );
  }

  newFiles = injectImages(
    newFiles,
    images
  );

  return {
    projectName:
      project.projectName ||
      extractProjectName(response),
    files: newFiles,
    preview: makePreview(newFiles)
  };
}

async function downloadProject(project) {
  if (!project || !project.files) {
    throw new Error("Projet absent ou invalide.");
  }

  const zip = new JSZip();

  const files = project.files;

  for (const [filename, content] of Object.entries(files)) {
    if (!filename || typeof content !== "string") {
      continue;
    }

    zip.file(filename, content);
  }

  const projectName =
    String(project.projectName || "tonnerreia-project")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

  const blob = await zip.generateAsync({
    type: "blob"
  });

  return new Response(blob, {
    status: 200,
    headers: {
      "content-type": "application/zip",
      "content-disposition":
        `attachment; filename="${projectName}.zip"`
    }
  });
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

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: #07080c;
  color: #f5f5f7;
}

body {
  min-height: 100vh;
}

button,
textarea,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #1b1d25;
  background: rgba(7, 8, 12, .88);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  letter-spacing: -.03em;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #ffffff, #777b87);
  color: #08090d;
  font-weight: 950;
}

.status {
  color: #8f95a3;
  font-size: 13px;
}

.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: 390px minmax(0, 1fr);
  min-height: calc(100vh - 68px);
}

.sidebar {
  border-right: 1px solid #1b1d25;
  padding: 24px;
  overflow-y: auto;
}

.heading {
  font-size: 28px;
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -.055em;
  margin-bottom: 9px;
}

.subheading {
  color: #8f95a3;
  line-height: 1.55;
  font-size: 14px;
  margin-bottom: 22px;
}

.label {
  display: block;
  color: #b7bbc5;
  font-size: 12px;
  font-weight: 750;
  margin-bottom: 8px;
}

.prompt {
  width: 100%;
  min-height: 180px;
  resize: vertical;
  border: 1px solid #282b35;
  border-radius: 16px;
  outline: none;
  padding: 16px;
  color: #fff;
  background: #101219;
  transition: .2s;
}

.prompt:focus {
  border-color: #626875;
  box-shadow: 0 0 0 3px rgba(255,255,255,.05);
}

.actions {
  display: flex;
  gap: 9px;
  margin-top: 12px;
}

.primary {
  flex: 1;
  border: 0;
  border-radius: 13px;
  padding: 13px 16px;
  background: #fff;
  color: #08090d;
  font-weight: 850;
}

.secondary {
  border: 1px solid #2a2d37;
  border-radius: 13px;
  padding: 13px 15px;
  background: #11131a;
  color: #fff;
}

.primary:hover {
  transform: translateY(-1px);
}

.secondary:hover {
  background: #181b23;
}

.photos {
  margin-top: 18px;
  padding: 15px;
  border: 1px solid #242731;
  border-radius: 16px;
  background: #0d0f15;
}

.photoInput {
  width: 100%;
  color: #9da3b1;
  font-size: 12px;
}

.photoGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
  margin-top: 10px;
}

.photo {
  aspect-ratio: 1;
  border-radius: 9px;
  overflow: hidden;
  background: #07080c;
  border: 1px solid #292c35;
}

.photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit {
  margin-top: 22px;
}

.editInput {
  width: 100%;
  min-height: 85px;
  resize: vertical;
  padding: 12px;
  border-radius: 13px;
  border: 1px solid #282b35;
  background: #101219;
  color: #fff;
  outline: none;
}

.previewArea {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #0b0c10;
}

.previewTop {
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #1b1d25;
}

.devices {
  display: flex;
  gap: 7px;
}

.device {
  border: 1px solid #292c35;
  background: #101219;
  color: #aeb3bf;
  border-radius: 9px;
  padding: 8px 12px;
  font-size: 12px;
}

.device.active {
  color: #fff;
  background: #1b1e27;
}

.preview {
  flex: 1;
  min-height: 600px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  overflow: auto;
}

.frame {
  width: 100%;
  height: calc(100vh - 150px);
  min-height: 620px;
  border: 1px solid #282b35;
  border-radius: 16px;
  background: white;
  overflow: hidden;
  transition: width .3s ease;
}

.frame.phone {
  width: 390px;
}

.frame iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: white;
}

.empty {
  width: min(650px, 100%);
  margin: auto;
  text-align: center;
  color: #737987;
}

.emptyIcon {
  font-size: 48px;
  margin-bottom: 14px;
}

.emptyTitle {
  color: #e8e9ed;
  font-weight: 800;
  font-size: 20px;
  margin-bottom: 8px;
}

.files {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px 16px;
  border-top: 1px solid #1b1d25;
}

.file {
  border: 1px solid #292c35;
  border-radius: 8px;
  padding: 5px 8px;
  color: #8f95a3;
  font-size: 11px;
}

.loading {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: none;
  place-items: center;
  background: rgba(5,6,9,.76);
  backdrop-filter: blur(12px);
}

.loading.show {
  display: grid;
}

.loadingBox {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: auto auto 14px;
  border: 3px solid #2a2d35;
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: 0;
    border-bottom: 1px solid #1b1d25;
  }

  .previewArea {
    min-height: 700px;
  }
}
</style>
</head>

<body>

<div class="app">

<header class="topbar">
  <div class="brand">
    <div class="logo">T</div>
    <div>TonnerreIA</div>
  </div>

  <div class="status" id="status">
    Design Director
  </div>
</header>

<main class="workspace">

<aside class="sidebar">

  <div class="heading">
    Crée ton site.
  </div>

  <div class="subheading">
    Décris simplement ce que tu veux.
    TonnerreIA imagine la direction artistique
    et construit le site.
  </div>

  <label class="label">
    Ta demande
  </label>

  <textarea
    id="prompt"
    class="prompt"
    placeholder="Exemple : crée-moi un site premium pour une concession automobile..."
  ></textarea>

  <div class="actions">
    <button
      id="generate"
      class="primary"
    >
      ✨ Générer
    </button>

    <button
      id="download"
      class="secondary"
      disabled
    >
      ZIP
    </button>
  </div>

  <div class="photos">

    <label class="label">
      🖼️ Tes photos
    </label>

    <input
      id="photoInput"
      class="photoInput"
      type="file"
      accept="image/*"
      multiple
    >

    <div
      id="photoGrid"
      class="photoGrid"
    ></div>

  </div>

  <div class="edit">

    <label class="label">
      Modifier le site
    </label>

    <textarea
      id="editInput"
      class="editInput"
      placeholder="Exemple : rends le design plus luxueux..."
    ></textarea>

    <button
      id="edit"
      class="secondary"
      style="width:100%;margin-top:9px"
      disabled
    >
      ✏️ Modifier avec l'IA
    </button>

  </div>

</aside>

<section class="previewArea">

  <div class="previewTop">

    <div id="projectName">
      Aucun projet
    </div>

    <div class="devices">

      <button
        class="device active"
        id="pc"
      >
        🖥️ PC
      </button>

      <button
        class="device"
        id="phone"
      >
        📱 Téléphone
      </button>

    </div>

  </div>

  <div class="preview">

    <div
      class="frame"
      id="frame"
    >

      <div
        class="empty"
        id="empty"
      >

        <div class="emptyIcon">
          ✦
        </div>

        <div class="emptyTitle">
          Ton prochain site
        </div>

        <div>
          Décris ton idée à gauche et
          TonnerreIA s'occupe du design.
        </div>

      </div>

      <iframe
        id="iframe"
        style="display:none"
      ></iframe>

    </div>

  </div>

  <div
    class="files"
    id="files"
  ></div>

</section>

</main>

</div>

<div
  class="loading"
  id="loading"
>
  <div class="loadingBox">
    <div class="spinner"></div>
    <strong id="loadingText">
      TonnerreIA crée ton design...
    </strong>
  </div>
</div>

<script>
let currentProject = null;
let uploadedImages = [];

const promptInput =
  document.getElementById("prompt");

const photoInput =
  document.getElementById("photoInput");

const photoGrid =
  document.getElementById("photoGrid");

const generateButton =
  document.getElementById("generate");

const editButton =
  document.getElementById("edit");

const editInput =
  document.getElementById("editInput");

const downloadButton =
  document.getElementById("download");

const iframe =
  document.getElementById("iframe");

const empty =
  document.getElementById("empty");

const frame =
  document.getElementById("frame");

const filesElement =
  document.getElementById("files");

const projectName =
  document.getElementById("projectName");

const loading =
  document.getElementById("loading");

const loadingText =
  document.getElementById("loadingText");

function setLoading(value, text) {
  loading.classList.toggle(
    "show",
    value
  );

  if (text) {
    loadingText.textContent = text;
  }
}

function resizeImage(file, maxSize = 1600) {
  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () => {

        const image =
          new Image();

        image.onload = () => {

          let width =
            image.width;

          let height =
            image.height;

          if (
            width > maxSize ||
            height > maxSize
          ) {

            const ratio =
              Math.min(
                maxSize / width,
                maxSize / height
              );

            width =
              Math.round(
                width * ratio
              );

            height =
              Math.round(
                height * ratio
              );
          }

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            width;

          canvas.height =
            height;

          const context =
            canvas.getContext(
              "2d"
            );

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          resolve(
            canvas.toDataURL(
              "image/jpeg",
              .82
            )
          );
        };

        image.onerror =
          reject;

        image.src =
          reader.result;
      };

      reader.onerror =
        reject;

      reader.readAsDataURL(
        file
      );
    }
  );
}

photoInput.addEventListener(
  "change",
  async () => {

    uploadedImages = [];
    photoGrid.innerHTML = "";

    const files =
      Array.from(
        photoInput.files || []
      ).slice(0, 8);

    for (
      let i = 0;
      i < files.length;
      i++
    ) {

      try {

        const image =
          await resizeImage(
            files[i]
          );

        uploadedImages.push(
          image
        );

        const item =
          document.createElement(
            "div"
          );

        item.className =
          "photo";

        const img =
          document.createElement(
            "img"
          );

        img.src =
          image;

        item.appendChild(
          img
        );

        photoGrid.appendChild(
          item
        );

      } catch (error) {

        console.error(
          error
        );

      }
    }
  }
);

function showProject(project) {

  currentProject =
    project;

  projectName.textContent =
    project.projectName ||
    "Projet TonnerreIA";

  iframe.srcdoc =
    project.preview ||
    "";

  iframe.style.display =
    "block";

  empty.style.display =
    "none";

  editButton.disabled =
    false;

  downloadButton.disabled =
    false;

  filesElement.innerHTML =
    "";

  Object.keys(
    project.files || {}
  ).forEach(
    filename => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "file";

      element.textContent =
        filename;

      filesElement.appendChild(
        element
      );
    }
  );
}

generateButton.addEventListener(
  "click",
  async () => {

    const prompt =
      promptInput.value.trim();

    if (!prompt) {

      alert(
        "Décris d'abord le site que tu veux créer."
      );

      return;
    }

    setLoading(
      true,
      "TonnerreIA imagine la direction artistique..."
    );

    try {

      const response =
        await fetch(
          "/api/generate",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                prompt,
                images:
                  uploadedImages
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Erreur de génération."
        );
      }

      showProject(
        data
      );

    } catch (error) {

      alert(
        error.message
      );

    } finally {

      setLoading(
        false
      );
    }
  }
);

editButton.addEventListener(
  "click",
  async () => {

    const change =
      editInput.value.trim();

    if (!change) {

      alert(
        "Décris la modification à faire."
      );

      return;
    }

    if (!currentProject) {
      return;
    }

    setLoading(
      true,
      "TonnerreIA redesign ton site..."
    );

    try {

      const response =
        await fetch(
          "/api/edit",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                change,
                project:
                  currentProject,
                images:
                  uploadedImages
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Erreur de modification."
        );
      }

      showProject(
        data
      );

      editInput.value =
        "";

    } catch (error) {

      alert(
        error.message
      );

    } finally {

      setLoading(
        false
      );
    }
  }
);

downloadButton.addEventListener(
  "click",
  async () => {

    if (!currentProject) {
      return;
    }

    setLoading(
      true,
      "Préparation du ZIP..."
    );

    try {

      const response =
        await fetch(
          "/api/download",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                project:
                  currentProject
              })
          }
        );

      if (!response.ok) {

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        throw new Error(
          data.error ||
          "Impossible de créer le ZIP."
        );
      }

      const blob =
        await response.blob();

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        (
          currentProject.projectName ||
          "tonnerreia-project"
        )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .toLowerCase() +
        ".zip";

      link.click();

      URL.revokeObjectURL(
        url
      );

    } catch (error) {

      alert(
        error.message
      );

    } finally {

      setLoading(
        false
      );
    }
  }
);

document
  .getElementById("pc")
  .addEventListener(
    "click",
    () => {

      frame.classList.remove(
        "phone"
      );

      document
        .getElementById("pc")
        .classList.add(
          "active"
        );

      document
        .getElementById("phone")
        .classList.remove(
          "active"
        );
    }
  );

document
  .getElementById("phone")
  .addEventListener(
    "click",
    () => {

      frame.classList.add(
        "phone"
      );

      document
        .getElementById("phone")
        .classList.add(
          "active"
        );

      document
        .getElementById("pc")
        .classList.remove(
          "active"
        );
    }
  );

promptInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      (event.ctrlKey ||
       event.metaKey)
    ) {

      generateButton.click();
    }
  }
);
</script>

</body>
</html>`;

export default {
  async fetch(request, env) {

    if (
      request.method === "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods":
              "GET,POST,OPTIONS",
            "access-control-allow-headers":
              "Content-Type"
          }
        }
      );
    }

    const url =
      new URL(request.url);

    try {

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
          cloudflare: true,
          workersAI:
            Boolean(env.AI),
          model: AI_MODEL,
          version: "V6"
        });
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/generate"
      ) {

        const body =
          await request.json();

        const prompt =
          String(
            body.prompt || ""
          ).trim();

        const images =
          Array.isArray(
            body.images
          )
            ? body.images
            : [];

        if (!prompt) {
          return json(
            {
              ok: false,
              error:
                "Prompt vide."
            },
            400
          );
        }

        const project =
          await generateSite(
            env,
            prompt,
            images
          );

        return json({
          ok: true,
          ...project
        });
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/edit"
      ) {

        const body =
          await request.json();

        const change =
          String(
            body.change || ""
          ).trim();

        const project =
          body.project;

        const images =
          Array.isArray(
            body.images
          )
            ? body.images
            : [];

        if (!change) {
          return json(
            {
              ok: false,
              error:
                "Modification vide."
            },
            400
          );
        }

        if (
          !project ||
          !project.files
        ) {
          return json(
            {
              ok: false,
              error:
                "Projet absent."
            },
            400
          );
        }

        const result =
          await editSite(
            env,
            project,
            change,
            images
          );

        return json({
          ok: true,
          ...result
        });
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/download"
      ) {

        const body =
          await request.json();

        if (
          !body.project ||
          !body.project.files
        ) {
          return json(
            {
              ok: false,
              error:
                "Projet absent."
            },
            400
          );
        }

        return await downloadProject(
          body.project
        );
      }

      return json(
        {
          ok: false,
          error:
            "Route introuvable."
        },
        404
      );

    } catch (error) {

      console.error(
        error
      );

      return json(
        {
          ok: false,
          error:
            error?.message ||
            "Erreur serveur."
        },
        500
      );
    }
  }
};
