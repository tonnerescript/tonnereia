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
        version: "workers-ai-1"
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
            { error: "Workers AI n'est pas connecté au Worker." },
            { status: 500 }
          );
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            messages: [
              {
                role: "system",
                content:
                  "Tu es TonnerreIA, une IA française spécialisée dans la programmation, les sites web, les applications et les scripts. Réponds en français. Lorsque l'utilisateur demande du code, donne du code complet, propre et directement utilisable."
              },
              {
                role: "user",
                content: body.prompt
              }
            ]
          }
        );

        return Response.json({
          success: true,
          response:
            result?.response ||
            result?.result?.response ||
            result?.choices?.[0]?.message?.content ||
            "Aucune réponse."
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
<title>TonnerreIA</title>

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
  padding: 20px;
  border-bottom: 1px solid #202633;
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
  border: 1px solid #303848;
  background: #111621;
  color: white;
  font-size: 16px;
  resize: vertical;
  outline: none;
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

button:disabled {
  opacity: .5;
}

#result {
  margin-top: 25px;
  padding: 20px;
  border-radius: 12px;
  background: #111621;
  border: 1px solid #303848;
  white-space: pre-wrap;
  overflow-x: auto;
  line-height: 1.6;
}
</style>
</head>

<body>

<header>
  <div class="logo">⚡ TonnerreIA</div>
</header>

<div class="container">

  <h1>Crée avec TonnerreIA</h1>

  <p>
    Ton IA gratuite pour créer des sites,
    applications et scripts.
  </p>

  <textarea
    id="prompt"
    placeholder="Exemple : crée-moi un site de restaurant moderne..."
  ></textarea>

  <button id="button" onclick="askAI()">
    Générer
  </button>

  <div id="result">
    TonnerreIA est prête.
  </div>

</div>

<script>
async function askAI() {
  const prompt = document.getElementById("prompt").value;
  const button = document.getElementById("button");
  const result = document.getElementById("result");

  if (!prompt.trim()) {
    result.textContent = "Écris une demande.";
    return;
  }

  button.disabled = true;
  result.textContent = "⚡ TonnerreIA réfléchit...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur du serveur");
    }

    result.textContent = data.response || "Aucune réponse.";

  } catch (error) {
    result.textContent = "❌ Erreur : " + error.message;
  }

  button.disabled = false;
}
</script>

</body>
</html>`;
