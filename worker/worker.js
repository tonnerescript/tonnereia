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
           
