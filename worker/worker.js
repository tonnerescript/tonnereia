const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

const SYSTEM_PROMPT = [
  "Tu es TonnerreIA, un générateur professionnel de sites web.",
  "À partir de la demande de l'utilisateur, crée un vrai site web complet, moderne et responsive.",
  "",
  "Le site doit contenir du HTML, du CSS et du JavaScript fonctionnel.",
  "Les boutons, menus, formulaires, animations et interactions doivent fonctionner quand c'est possible.",
  "Le design doit être professionnel et adapté au téléphone et à l'ordinateur.",
  "",
  "FORMAT OBLIGATOIRE :",
  "PROJECT_NAME: nom du projet",
  "FILE: index.html",
  "CONTENU HTML COMPLET",
  "END_FILE",
  "FILE: style.css",
  "CONTENU CSS COMPLET",
  "END_FILE",
  "FILE: script.js",
  "CONTENU JAVASCRIPT COMPLET",
  "END_FILE",
  "",
  "IMPORTANT :",
  "Ne mets pas de Markdown.",
  "Ne mets pas de ```.",
  "Ne mets pas d'explication avant ou après les fichiers.",
  "Le fichier index.html doit être complet.",
  "Le CSS doit être complet.",
  "Le JavaScript doit être complet."
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
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function cleanSource(text) {
  return String(text || "")
    .replace(/```html/gi, "")
    .replace(/```css/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseProject(text) {
  const source = cleanSource(text);

  const nameMatch = source.match(
    /PROJECT_NAME:\s*(.+)/i
  );

  const projectName = nameMatch
    ? nameMatch[1].trim()
    : "Mon site";

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
      files["index.html"] = htmlMatch[0];
    }
  }

  return {
    projectName,
    files
  };
}

function buildPreview(project) {
  let html = project.files["index.html"] || "";
  const css = project.files["style.css"] || "";
  const js = project.files["script.js"] || "";

  /*
   * Si le HTML contient déjà une balise <html>,
   * on injecte le CSS et le JS directement dedans.
   */

  if (/<html[\s\S]*<\/html>/i.test(html)) {

    if (css) {
      if (/<\/head>/i.test(html)) {
        html = html.replace(
          /<\/head>/i,
          `<style>${css}</style></head>`
        );
      } else {
        html =
          `<style>${css}</style>\n` +
          html;
      }
    }

    if (js) {
      if (/<\/body>/i.test(html)) {
        html = html.replace(
          /<\/body>/i,
          `<script>${js}<\/script></body>`
        );
      } else {
        html += `<script>${js}<\/script>`;
      }
    }

    return html;
  }

  /*
   * Si l'IA renvoie seulement le contenu du body,
   * on crée automatiquement une vraie page HTML.
   */

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(project.projectName)}</title>
<style>
${css}
</style>
</head>
<body>

${html}

<script>
${js}
<\/script>

</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const APP = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>TonnerreIA</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
  color: white;
  background:
    radial-gradient(
      circle at top,
      #191634 0%,
      #080914 45%,
      #05060c 100%
    );
}

.header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  border-bottom: 1px solid #24263a;
  background: rgba(9, 10, 20, .9);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo {
  font-size: 21px;
  font-weight: 800;
}

.logo span {
  color: #7868ff;
}

.online {
  font-size: 13px;
  color: #6de39a;
}

.main {
  max-width: 1150px;
  margin: auto;
  padding: 65px 20px 80px;
}

.hero {
  text-align: center;
  max-width: 850px;
  margin: auto;
}

.badge {
  display: inline-block;
  padding: 8px 15px;
  border-radius: 999px;
  border: 1px solid #36315e;
  background: #15132a;
  color: #aaa0ff;
  font-size: 13px;
}

h1 {
  font-size: clamp(42px, 7vw, 72px);
  line-height: .98;
  letter-spacing: -3px;
  margin: 22px 0;
}

.gradient {
  background: linear-gradient(
    90deg,
    #8b78ff,
    #4e9bff
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero p {
  color: #a5a9bc;
  font-size: 17px;
  line-height: 1.6;
  max-width: 680px;
  margin: auto;
}

.generator {
  margin-top: 45px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.prompt-box {
  padding: 8px;
  border: 1px solid #292c42;
  border-radius: 18px;
  background: rgba(15, 17, 30, .9);
  box-shadow: 0 20px 80px rgba(0,0,0,.3);
}

textarea {
  width: 100%;
  min-height: 170px;
  resize: vertical;
  border: 0;
  outline: none;
  padding: 20px;
  border-radius: 13px;
  background: transparent;
  color: white;
  font-size: 16px;
  font-family: inherit;
}

textarea::placeholder {
  color: #666b80;
}

.generate {
  width: 100%;
  border: 0;
  border-radius: 13px;
  padding: 17px;
  cursor: pointer;
  color: white;
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(
    135deg,
    #735cff,
    #388dff
  );
  transition:
    transform .2s,
    opacity .2s;
}

.generate:hover {
  transform: translateY(-2px);
}

.generate:disabled {
  opacity: .5;
  cursor: wait;
  transform: none;
}

.message {
  display: none;
  margin-top: 15px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #292c42;
  background: #101221;
  color: #aeb4c9;
  text-align: left;
}

.preview {
  display: none;
  margin-top: 35px;
  border: 1px solid #292c42;
  border-radius: 18px;
  overflow: hidden;
  background: #080910;
  box-shadow: 0 30px 100px rgba(0,0,0,.4);
}

.preview-header {
  min-height: 58px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  border-bottom: 1px solid #292c42;
  background: #10121f;
}

.preview-title {
  font-weight: 800;
}

.preview-url {
  color: #777d94;
  font-size: 12px;
}

.preview-screen {
  background: white;
  height: 650px;
}

iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: white;
}

.files {
  display: none;
  margin-top: 15px;
  grid-template-columns:
    repeat(3, 1fr);
  gap: 10px;
}

.file {
  padding: 13px;
  border-radius: 10px;
  border: 1px solid #292c42;
  background: #10121f;
  color: #b5bbce;
  font-size: 13px;
}

@media (max-width: 700px) {

  .header {
    padding: 0 15px;
  }

  .main {
    padding-top: 45px;
  }

  h1 {
    letter-spacing: -2px;
  }

  .preview-screen {
    height: 600px;
  }

  .files {
    grid-template-columns: 1fr;
  }

  .preview-header {
    align-items: flex-start;
    flex-direction: column;
  }

}

</style>
</head>

<body>

<header class="header">

  <div class="logo">
    ⚡ Tonnerre<span>IA</span>
  </div>

  <div class="online">
    ● IA en ligne
  </div>

</header>

<main class="main">

<section class="hero">

  <div class="badge">
    ✦ Générateur de vrais sites web
  </div>

  <h1>
    Crée ton site avec
    <span class="gradient">
      TonnerreIA
    </span>
  </h1>

  <p>
    Décris simplement ton idée.
    TonnerreIA génère le HTML, le CSS et le
    JavaScript de ton site et l'affiche directement
    dans un aperçu interactif.
  </p>

</section>

<section class="generator">

  <div class="prompt-box">

    <textarea
      id="prompt"
      placeholder="Exemple : crée-moi un site moderne pour un restaurant italien avec un menu, les horaires, une réservation, une galerie et un formulaire de contact..."
    ></textarea>

    <button
      class="generate"
      id="generate"
    >
      ⚡ Générer mon site
    </button>

  </div>

  <div
    class="message"
    id="message"
  ></div>

</section>

<section
  class="preview"
  id="previewBox"
>

  <div class="preview-header">

    <div>
      <div
        class="preview-title"
        id="projectName"
      >
        ⚡ Site généré
      </div>

      <div class="preview-url">
        Aperçu interactif
      </div>
    </div>

    <div>
      ● LIVE PREVIEW
    </div>

  </div>

  <div class="preview-screen">

    <iframe
      id="preview"
      title="Aperçu du site généré"
      sandbox="allow-scripts allow-forms"
    ></iframe>

  </div>

</section>

<section
  class="files"
  id="files"
>

  <div class="file">
    📄 index.html
  </div>

  <div class="file">
    🎨 style.css
  </div>

  <div class="file">
    ⚙️ script.js
  </div>

</section>

</main>

<script>

const promptInput =
  document.getElementById("prompt");

const generateButton =
  document.getElementById("generate");

const message =
  document.getElementById("message");

const previewBox =
  document.getElementById("previewBox");

const preview =
  document.getElementById("preview");

const projectName =
  document.getElementById("projectName");

const files =
  document.getElementById("files");

function showMessage(text) {

  message.style.display = "block";
  message.textContent = text;

}

generateButton.addEventListener(
  "click",
  async function() {

    const prompt =
      promptInput.value.trim();

    if (!prompt) {

      showMessage(
        "⚠️ Décris d'abord le site que tu veux créer."
      );

      return;

    }

    generateButton.disabled = true;

    generateButton.textContent =
      "⚡ TonnerreIA construit le site...";

    previewBox.style.display = "none";
    files.style.display = "none";

    showMessage(
      "⏳ Génération du site en cours..."
    );

    try {

      const response =
        await fetch(
          "/api/generate",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              prompt: prompt
            })
          }
        );

      let data;

      try {
        data = await response.json();
      } catch (error) {

        throw new Error(
          "Le serveur a renvoyé une réponse invalide."
        );

      }

      if (
        !response.ok ||
        !data.ok
      ) {

        throw new Error(
          data.error ||
          "Erreur pendant la génération."
        );

      }

      const project =
        data.project;

      const html =
        project.files["index.html"] || "";

      const css =
        project.files["style.css"] || "";

      const js =
        project.files["script.js"] || "";

      projectName.textContent =
        "⚡ " +
        (
          project.projectName ||
          "Site généré"
        );

      /*
       * On récupère le HTML complet.
       */

      let fullPage = html;

      /*
       * Si l'IA a fourni uniquement
       * le contenu HTML sans document complet,
       * on crée le document complet ici.
       */

      if (
        !/<html[\\s\\S]*<\\/html>/i.test(
          fullPage
        )
      ) {

        fullPage = `
<!DOCTYPE html>
<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<style>
${css}
</style>

</head>

<body>

${html}

<script>
${js}
<\\/script>

</body>

</html>
`;

      } else {

        /*
         * Le HTML est déjà complet.
         * On injecte le CSS.
         */

        if (css) {

          if (
            /<\\/head>/i.test(fullPage)
          ) {

            fullPage =
              fullPage.replace(
                /<\\/head>/i,
                "<style>" +
                css +
                "</style></head>"
              );

          } else {

            fullPage =
              "<style>" +
              css +
              "</style>" +
              fullPage;

          }

        }

        /*
         * Puis le JavaScript.
         */

        if (js) {

          if (
            /<\\/body>/i.test(fullPage)
          ) {

            fullPage =
              fullPage.replace(
                /<\\/body>/i,
                "<script>" +
                js +
                "<\\/script></body>"
              );

          } else {

            fullPage +=
              "<script>" +
              js +
              "<\\/script>";

          }

        }

      }

      /*
       * Affichage du vrai site dans l'iframe.
       */

      preview.srcdoc = fullPage;

      previewBox.style.display =
        "block";

      files.style.display =
        "grid";

      showMessage(
        "✅ Site généré ! Tu peux maintenant l'utiliser dans l'aperçu ci-dessous."
      );

      previewBox.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (error) {

      console.error(error);

      showMessage(
        "❌ " +
        (
          error.message ||
          "Une erreur est survenue."
        )
      );

    } finally {

      generateButton.disabled =
        false;

      generateButton.textContent =
        "⚡ Générer mon site";

    }

  }
);

</script>

</body>
</html>`;

async function generate(request, env) {

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

  try {

    const result =
      await env.AI.run(
        AI_MODEL,
        {
          messages: [
            {
              role: "system",
              content:
                SYSTEM_PROMPT
            },
            {
              role: "user",
              content:
                prompt
            }
          ],

          max_tokens: 7000
        }
      );

    const text =
      result &&
      result.response
        ? result.response
        : "";

    if (!text) {

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
      parseProject(text);

    if (
      !project.files["index.html"]
    ) {

      return json(
        {
          ok: false,
          error:
            "L'IA n'a pas correctement généré le HTML."
        },
        500
      );

    }

    return json({
      ok: true,
      project: project
    });

  } catch (error) {

    return json(
      {
        ok: false,
        error:
          String(
            error.message ||
            error
          )
      },
      500
    );

  }

}

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);

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

      return generate(
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
