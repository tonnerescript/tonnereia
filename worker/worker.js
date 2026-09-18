export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // =========================
    // PAGE PRINCIPALE
    // =========================

    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML, {
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      });
    }

    // =========================
    // TEST
    // =========================

    if (request.method === "GET" && url.pathname === "/api/status") {

      return Response.json({
        success: true,
        name: "TonnerreIA",
        cloudflare: true,
        workersAI: !!env.AI
      });

    }

    // =========================
    // IA
    // =========================

    if (
      request.method === "POST" &&
      url.pathname === "/api/chat"
    ) {

      try {

        const body = await request.json();

        if (!body.prompt || !body.prompt.trim()) {

          return Response.json(
            {
              error: "Prompt manquant"
            },
            {
              status: 400
            }
          );

        }

        if (!env.AI) {

          return Response.json(
            {
              error: "Workers AI n'est pas configuré."
            },
            {
              status: 500
            }
          );

        }

        const messages = [

          {
            role: "system",
            content: `
Tu es TonnerreIA, une intelligence artificielle française spécialisée dans :

- développement web
- HTML
- CSS
- JavaScript
- Node.js
- Discord.js
- bots Discord
- applications
- scripts
- jeux vidéo
- Unity
- Godot
- programmation

Tu réponds toujours en français.

Quand l'utilisateur demande du code :
- donne du code complet
- donne du code propre
- explique où placer les fichiers
- évite les morceaux de code incomplets
- indique les commandes nécessaires
- vérifie mentalement la syntaxe avant de répondre

Quand l'utilisateur demande de créer un site ou une application, propose une structure claire et directement exploitable.

Tu es l'assistant officiel de TonnerreIA.
            `
          },

          {
            role: "user",
            content: body.prompt
          }

        ];

        const result = await env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            messages
          }
        );

        return Response.json({
          success: true,
          response:
            result?.response ||
            result?.result?.response ||
            "Aucune réponse reçue."
        });

      } catch (error) {

        console.error(error);

        return Response.json(
          {
            error:
              error?.message ||
              "Erreur Workers AI"
          },
          {
            status: 500
          }
        );

      }

    }

    // =========================
    // 404
    // =========================

    return new Response(
      "TonnerreIA - Page introuvable",
      {
        status: 404
      }
    );

  }
};


// ========================================
// INTERFACE TONNERREIA
// ========================================

const HTML = `<!DOCTYPE html>

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

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background:
    #080b12;

  color: white;

}

header {

  padding: 20px;

  border-bottom:
    1px solid #202633;

  text-align: center;

}

.logo {

  font-size: 28px;

  font-weight: bold;

}

.container {

  max-width: 900px;

  margin: auto;

  padding: 30px 20px;

}

h1 {

  font-size: 38px;

  margin-bottom: 10px;

}

p {

  color: #aeb6c5;

}

textarea {

  width: 100%;

  min-height: 180px;

  margin-top: 20px;

  padding: 18px;

  border-radius: 12px;

  border:
    1px solid #303848;

  background:
    #111621;

  color: white;

  font-size: 16px;

  resize: vertical;

  outline: none;

}

textarea:focus {

  border-color: #5865f2;

}

button {

  margin-top: 15px;

  padding: 14px 22px;

  border: 0;

  border-radius: 10px;

  background: white;

  color: #080b12;

  font-size: 16px;

  font-weight: bold;

  cursor: pointer;

}

button:hover {

  opacity: .9;

}

button:disabled {

  opacity: .5;

  cursor: wait;

}

#result {

  margin-top: 25px;

  padding: 20px;

  border-radius: 12px;

  background:
    #111621;

  border:
    1px solid #303848;

  white-space: pre-wrap;

  overflow-x: auto;

  line-height: 1.6;

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

  <h1>
    Crée avec TonnerreIA
  </h1>

  <p>
    Ton IA gratuite pour créer des sites,
    applications et scripts.
  </p>

  <textarea
    id="prompt"
    placeholder="Exemple : crée-moi un site de restaurant moderne..."
  ></textarea>

  <button
    id="button"
    onclick="askAI()"
  >
    Générer
  </button>

  <div id="result">
    TonnerreIA est prête.
  </div>

</div>

<script>

async function askAI() {

  const prompt =
    document.getElementById("prompt").value;

  const button =
    document.getElementById("button");

  const result =
    document.getElementById("result");

  if (!prompt.trim()) {

    result.textContent =
      "Écris une demande.";

    return;

  }

  button.disabled = true;

  result.textContent =
    "⚡ TonnerreIA réfléchit...";

  try {

    const response =
      await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            prompt
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Erreur du serveur"
      );

    }

    result.textContent =
      data.response ||
      "Aucune réponse.";

  } catch (error) {

    result.textContent =
      "❌ Erreur : " +
      error.message;

  }

  button.disabled = false;

}

</script>

</body>

</html>`;
