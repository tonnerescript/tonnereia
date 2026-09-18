export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Interface
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(HTML, {
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      });
    }

    // Test
    if (url.pathname === "/api/status") {
      return Response.json({
        success: true,
        name: "TonnerreIA",
        cloudflare: true,
        openai: !!env.OPENAI_API_KEY
      });
    }

    // IA
    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();

        if (!body.prompt) {
          return Response.json(
            { error: "Prompt manquant" },
            { status: 400 }
          );
        }

        const response = await fetch(
          "https://api.openai.com/v1/responses",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-5-mini",
              input: [
                {
                  role: "system",
                  content:
                    "Tu es TonnerreIA, une IA spécialisée dans la création de sites, applications et scripts. Réponds en français et fournis du code propre et complet quand c'est demandé."
                },
                {
                  role: "user",
                  content: body.prompt
                }
              ]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          return Response.json(
            {
              error:
                data?.error?.message ||
                "Erreur OpenAI"
            },
            { status: response.status }
          );
        }

        return Response.json({
          success: true,
          response: data.output_text || ""
        });

      } catch (error) {
        return Response.json(
          {
            error: error.message
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
}

button {
  margin-top: 15px;
  padding: 14px 22px;
  border: 0;
  border-radius: 10px;
  background: #ffffff;
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
    Ton IA pour créer des sites, applications et scripts.
  </p>

  <textarea
    id="prompt"
    placeholder="Exemple : crée-moi un site de restaurant moderne avec un menu..."
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
      body: JSON.stringify({
        prompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erreur");
    }

    result.textContent = data.response;

  } catch (error) {
    result.textContent =
      "❌ Erreur : " + error.message;
  }

  button.disabled = false;
}
</script>

</body>
</html>`;
