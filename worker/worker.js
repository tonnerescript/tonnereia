export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /*
    ============================================================
    PAGE PRINCIPALE
    ============================================================
    */

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    /*
    ============================================================
    STATUT
    ============================================================
    */

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
        version: "site-builder-1"
      });
    }

    /*
    ============================================================
    CRÉATION D'UN SITE
    ============================================================
    */

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
              error:
                "Workers AI n'est pas connecté au Worker."
            },
            { status: 500 }
          );
        }

        const systemPrompt = `
Tu es TonnerreIA, un générateur professionnel de sites web.

L'utilisateur va te demander de créer un site.

Tu dois créer un VRAI site complet.

Tu dois retourner UNIQUEMENT un objet JSON valide.

Format obligatoire :

{
  "name": "nom-du-site",
  "title": "Titre du site",
  "description": "Description",
  "files": [
    {
      "path": "index.html",
      "content": "..."
    },
    {
      "path": "style.css",
      "content": "..."
    },
    {
      "path": "script.js",
      "content": "..."
    }
  ]
}

RÈGLES :

1. Le fichier index.html doit être complet.
2. Le fichier style.css doit être complet.
3. Le fichier script.js doit être complet si JavaScript est nécessaire.
4. Le site doit être responsive téléphone/tablette/ordinateur.
5. Le design doit être moderne et professionnel.
6. Ne mets PAS de Markdown.
7. Ne mets PAS de triple backticks.
8. Ne mets PAS de texte avant ou après le JSON.
9. Les chemins doivent être relatifs.
10. Le site doit fonctionner directement dans un navigateur.
11. Si des images sont nécessaires, utilise des URLs d'images publiques ou des gradients/placeholders.
12. Ne demande jamais à l'utilisateur d'installer quelque chose pour voir le site.
13. Pour un restaurant, ajoute par exemple menu, présentation, horaires, contact et réservation si demandé.
14. Pour un portfolio, ajoute les sections adaptées.
15. Pour une boutique, ajoute produits, panier simple et sections adaptées.
16. Pour un dashboard, crée une interface fonctionnelle côté navigateur.
17. Tu peux créer plusieurs fichiers si nécessaire.
18. Évite les fichiers inutilement énormes.

Le résultat doit être directement utilisable comme vrai site internet.
`;

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fast",
          {
            messages: [
              {
                role: "system",
                content: systemPrompt
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

        /*
        Nettoyage si le modèle ajoute quand même des ```json
        */

        text = text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        let project;

        try {
          project = JSON.parse(text);
        } catch (error) {
          /*
          Tentative de récupération du premier objet JSON
          */

          const first = text.indexOf("{");
          const last = text.lastIndexOf("}");

          if (first !== -1 && last !== -1) {
            const possibleJSON =
              text.slice(first, last + 1);

            project = JSON.parse(possibleJSON);
          } else {
            throw new Error(
              "L'IA n'a pas retourné un projet JSON valide."
            );
          }
        }

        if (
          !project ||
          !Array.isArray(project.files)
        ) {
          throw new Error(
            "Le projet généré ne contient pas de fichiers."
          );
        }

        /*
        Nettoyage des fichiers
        */

        project.files = project.files
          .filter(
            file =>
              file &&
              typeof file.path === "string" &&
              typeof file.content === "string"
          )
          .map(file => ({
            path: cleanPath(file.path),
            content: file.content
          }));

        /*
        Vérification index.html
        */

        if (
          !project.files.some(
            file => file.path === "index.html"
          )
        ) {
          throw new Error(
            "Le projet généré ne contient pas index.html."
          );
        }

        /*
        Nom du projet
        */

        project.name =
          cleanSlug(
            project.name ||
            project.title ||
            "mon-site"
          );

        project.title =
          project.title ||
          project.name;

        project.description =
          project.description ||
          "";

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

    /*
    ============================================================
    PUBLICATION D'UN SITE
    ============================================================
    */

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
                "Le stockage Cloudflare KV n'est pas encore connecté. Ajoute le binding SITES."
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
          name: project.name || slug,
          title: project.title || project.name || slug,
          description:
            project.description || "",
          files: project.files,
          createdAt: new Date().toISOString()
        };

        /*
        Stockage du site dans Cloudflare KV
        */

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

    /*
    ============================================================
    AFFICHAGE D'UN SITE PUBLIÉ
    ============================================================
    */

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

        const slug =
          decodeURIComponent(
            url.pathname.substring("/site/".length)
          );

        if (!slug) {
          return new Response(
            "Site introuvable.",
            { status: 404 }
          );
        }

        const data =
          await env.SITES.get(
            "site:" + slug
          );

        if (!data) {
          return new Response(
            `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <title>Site introuvable</title>
              <style>
                body {
                  margin:0;
                  min-height:100vh;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  background:#080b12;
                  color:white;
                  font-family:Arial;
                  text-align:center;
                }
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

        const site =
          JSON.parse(data);

        const html =
          buildPreviewHTML(site.files);

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

    /*
    ============================================================
    404
    ============================================================
    */

    return new Response(
      "TonnerreIA - Page introuvable",
      { status: 404 }
    );
  }
};


/*
================================================================
OUTILS
================================================================
*/

function cleanPath(path) {
  return String(path)
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .trim();
}


function cleanSlug(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "mon-site";
}


function createSlug(value) {
  const base = cleanSlug(value);

  return (
    base +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 7)
  );
}


/*
================================================================
CONSTRUCTION DU SITE PUBLIÉ
================================================================
*/

function buildPreviewHTML(files) {

  const getFile = name => {
    const file = files.find(
      item => item.path === name
    );

    return file
      ? file.content
      : "";
  };

  let html =
    getFile("index.html");

  const css =
    getFile("style.css");

  const js =
    getFile("script.js");

  /*
  Injection CSS
  */

  if (css) {
    if (html.includes("</head>")) {
      html = html.replace(
        "</head>",
        "<style>\n" +
        css +
        "\n</style>\n</head>"
      );
    } else {
      html =
        "<style>\n" +
        css +
        "\n</style>\n" +
        html;
    }
  }

  /*
  Injection JavaScript
  */

  if (js) {
    if (html.includes("</body>")) {
      html = html.replace(
        "</body>",
        "<script>\n" +
        js +
        "\n</script>\n</body>"
      );
    } else {
      html +=
        "<script>\n" +
        js +
        "\n</script>";
    }
  }

  /*
  Empêche les chemins CSS/JS externes
  d'être injectés deux fois.
  */

  html = html.replace(
    /<link[^>]+href=["']style
