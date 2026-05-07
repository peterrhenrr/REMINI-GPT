let config = null;

// carregar keys.json
async function carregarConfig() {

  try {

    const res = await fetch("./keys.json", {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("keys.json não encontrado");
    }

    config = await res.json();

    console.log("CONFIG OK:", config);

  } catch (err) {

    console.error("Erro ao carregar keys.json:", err);

    document.getElementById("chat").innerHTML += `
      <div class="msg bot">
        Erro ao carregar keys.json
      </div>
    `;
  }
}

// inicia config
carregarConfig();


// função enviar
async function enviar() {

  const input = document.getElementById("input");
  const chat = document.getElementById("chat");

  const mensagem = input.value.trim();

  if (!mensagem) return;

  // verifica config
  if (!config) {

    chat.innerHTML += `
      <div class="msg bot">
        Config ainda carregando...
      </div>
    `;

    return;
  }

  // adiciona mensagem do usuário
  chat.innerHTML += `
    <div class="msg user">
      Você: ${mensagem}
    </div>
  `;

  // limpa input
  input.value = "";

  // scroll automático
  chat.scrollTop = chat.scrollHeight;

  // URL Azure
  const url =
    `${config.endpoint}/openai/responses?api-version=${config.apiVersion}`;

  try {

    const res = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey
      },

      body: JSON.stringify({
        model: config.model,
        input: mensagem,
        max_output_tokens: 500
      })
    });

    const data = await res.json();

    // debug
    console.log("AZURE RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    let resposta = "Sem resposta";

    // NOVA RESPONSES API
    if (data.output && data.output.length > 0) {

      for (const item of data.output) {

        // procura mensagem do assistant
        if (
          item.type === "message" &&
          item.content &&
          item.content.length > 0
        ) {

          for (const content of item.content) {

            // texto encontrado
            if (
              content.type === "output_text" &&
              content.text
            ) {

              resposta = content.text;
              break;
            }
          }
        }
      }
    }

    // fallback antigo
    else if (
      data.choices &&
      data.choices.length > 0
    ) {

      resposta =
        data.choices[0]?.message?.content ||
        "Sem resposta";
    }

    // resposta do bot
    chat.innerHTML += `
      <div class="msg bot">
        Bot: ${resposta}
      </div>
    `;

    // scroll automático
    chat.scrollTop = chat.scrollHeight;

  } catch (err) {

    console.error("ERRO:", err);

    chat.innerHTML += `
      <div class="msg bot">
        Erro de conexão com Azure
      </div>
    `;
  }
}