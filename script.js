let config = null;

// =====================================
// CONFIG
// =====================================

async function carregarConfig() {

  try {

    const res = await fetch("./keys.json", {
      cache: "no-store"
    });

    if (!res.ok) {

      throw new Error(
        "Erro ao carregar keys.json"
      );
    }

    config = await res.json();

    console.log(
      "CONFIG:",
      config
    );

  } catch (err) {

    console.error(err);

    adicionarMensagem(
      "Erro ao carregar keys.json",
      "bot"
    );
  }
}

carregarConfig();


// =====================================
// CHAT
// =====================================

function adicionarMensagem(
  texto,
  tipo
) {

  const chat =
    document.getElementById(
      "chat"
    );

  chat.innerHTML += `
    <div class="msg ${tipo}">
      ${texto}
    </div>
  `;

  chat.scrollTop =
    chat.scrollHeight;
}


// =====================================
// ENTER
// =====================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const input =
      document.getElementById(
        "input"
      );

    input.addEventListener(
      "keydown",
      (e) => {

        if (
          e.key === "Enter" &&
          !enviando
        ) {

          enviar();
        }
      }
    );
  }
);


// =====================================
// CONTROLE
// =====================================

let enviando = false;


// =====================================
// ENVIAR
// =====================================

async function enviar() {

  // evita travar enviando duas vezes

  if (enviando) return;

  const input =
    document.getElementById(
      "input"
    );

  const provider =
    document.getElementById(
      "provider"
    ).value;

  const mensagem =
    input.value.trim();

  if (!mensagem) return;

  if (!config) {

    adicionarMensagem(
      "Config carregando...",
      "bot"
    );

    return;
  }

  enviando = true;

  input.disabled = true;

  adicionarMensagem(
    mensagem,
    "user"
  );

  input.value = "";

  adicionarMensagem(
    "Digitando...",
    "bot"
  );

  const loading =
    document.querySelectorAll(
      ".bot"
    );

  const ultimoLoading =
    loading[loading.length - 1];

  let resposta =
    "Sem resposta";

  try {

    // =================================
    // AZURE GPT
    // =================================

    if (provider === "azure") {

      const url =
        `${config.azure.endpoint}/openai/responses?api-version=${config.azure.apiVersion}`;

      const res =
        await fetch(url, {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "api-key":
              config.azure.apiKey
          },

          body: JSON.stringify({

            model:
              config.azure.model,

            instructions: `
Você é um assistente inteligente chamado Remini GPT.

Regras:
- Responda sempre em português do Brasil
- Seja amigável
- Seja rápido e objetivo
- Entenda erros de fala do usuário
- Converse naturalmente
- Responda como um humano
- Você conversa por voz e texto
- Nunca diga que é uma IA
- Responda curto quando o usuário usar voz
- Corrija automaticamente frases faladas erradas
- Se o áudio vier confuso tente entender pelo contexto
`,

            input:
              mensagem,

            max_output_tokens:
              500
          })
        });

      const data =
        await res.json();

      console.log(
        "AZURE:",
        data
      );

      // Responses API

      if (data.output) {

        for (const item of data.output) {

          if (
            item.type === "message" &&
            item.content
          ) {

            for (const content of item.content) {

              if (
                content.type === "output_text"
              ) {

                resposta =
                  content.text;
              }
            }
          }
        }
      }

      // fallback

      if (
        data.choices &&
        data.choices.length > 0
      ) {

        resposta =
          data.choices[0]
          ?.message
          ?.content ||
          resposta;
      }

      if (data.error) {

        resposta =
          "Erro Azure: " +
          data.error.message;
      }
    }

    // =================================
    // GEMINI
    // =================================

    else if (
      provider === "gemini"
    ) {

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;

      const res =
        await fetch(url, {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            systemInstruction: {

              parts: [
                {
                  text: `
Você é um assistente inteligente chamado Remini GPT.

Regras:
- Responda sempre em português do Brasil
- Seja amigável
- Seja rápido e objetivo
- Entenda erros de fala do usuário
- Converse naturalmente
- Responda como um humano
- Você conversa por voz e texto
- Nunca diga que é uma IA
- Responda curto quando o usuário usar voz
- Corrija automaticamente frases faladas erradas
- Se o áudio vier confuso tente entender pelo contexto
`
                }
              ]
            },

            contents: [
              {
                parts: [
                  {
                    text:
                      mensagem
                  }
                ]
              }
            ],

            generationConfig: {

              temperature: 0.7,

              maxOutputTokens: 500
            }

          })
        });

      const data =
        await res.json();

      console.log(
        "GEMINI:",
        data
      );

      if (
        data.candidates &&
        data.candidates.length > 0
      ) {

        resposta =
          data.candidates[0]
          ?.content
          ?.parts?.[0]
          ?.text ||
          resposta;
      }

      if (data.error) {

        resposta =
          "Erro Gemini: " +
          data.error.message;
      }
    }

    // remove loading

    if (ultimoLoading) {

      ultimoLoading.remove();
    }

    adicionarMensagem(
      resposta,
      "bot"
    );

    // falar resposta

    await falarTexto(
      resposta
    );

  } catch (err) {

    console.error(err);

    if (ultimoLoading) {

      ultimoLoading.remove();
    }

    adicionarMensagem(
      "Erro de conexão",
      "bot"
    );

  } finally {

    enviando = false;

    input.disabled = false;

    input.focus();
  }
}


// =====================================
// BOT FALANDO
// =====================================

let audioAtual = null;

async function falarTexto(
  texto
) {

  try {

    if (
      !config.azureSpeech
    ) return;

    if (audioAtual) {

      audioAtual.pause();

      audioAtual = null;
    }

    const ssml = `
<speak version='1.0' xml:lang='pt-BR'>
  <voice name='${config.azureSpeech.voice}'>
    ${texto}
  </voice>
</speak>
`;

    const res =
      await fetch(
        config.azureSpeech.endpoint,
        {

          method: "POST",

          headers: {

            "Ocp-Apim-Subscription-Key":
              config.azureSpeech.apiKey,

            "Content-Type":
              "application/ssml+xml",

            "X-Microsoft-OutputFormat":
              config.azureSpeech.audioFormat
          },

          body: ssml
        }
      );

    if (!res.ok) {

      throw new Error(
        "Erro ao gerar voz"
      );
    }

    const audioBlob =
      await res.blob();

    const audioUrl =
      URL.createObjectURL(
        audioBlob
      );

    audioAtual =
      new Audio(audioUrl);

    await audioAtual.play();

  } catch (err) {

    console.error(
      "Erro TTS:",
      err
    );
  }
}


// =====================================
// MICROFONE REALTIME
// =====================================

let reconhecimento;
let gravando = false;
let ouvindoMsg = null;

function removerOuvindo() {

  if (
    ouvindoMsg &&
    ouvindoMsg.parentNode
  ) {

    ouvindoMsg.remove();

    ouvindoMsg = null;
  }
}

function gravarAudio() {

  const botao =
    document.getElementById(
      "btnMic"
    );

  // sem suporte

  if (
    !(
      "webkitSpeechRecognition"
      in window
    )
  ) {

    adicionarMensagem(
      "Seu navegador não suporta voz",
      "bot"
    );

    return;
  }

  // =================================
  // PARAR MANUALMENTE
  // =================================

  if (gravando) {

    reconhecimento.stop();

    return;
  }

  // =================================
  // INICIAR
  // =================================

  reconhecimento =
    new webkitSpeechRecognition();

  reconhecimento.lang =
    "pt-BR";

  // continua ouvindo

  reconhecimento.continuous =
    true;

  reconhecimento.interimResults =
    true;

  gravando = true;

  // botão vermelho

  botao.classList.remove(
    "mic-off"
  );

  botao.classList.add(
    "mic-on"
  );

  botao.innerHTML =
    "⏹";

  // mensagem ouvindo

  const chat =
    document.getElementById(
      "chat"
    );

  ouvindoMsg =
    document.createElement(
      "div"
    );

  ouvindoMsg.className =
    "msg bot";

  ouvindoMsg.innerHTML =
    "🎙️ Ouvindo...";

  chat.appendChild(
    ouvindoMsg
  );

  chat.scrollTop =
    chat.scrollHeight;

  reconhecimento.start();

  // =================================
  // RESULTADO
  // =================================

  reconhecimento.onresult =
    function(event) {

      let textoFinal = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        textoFinal +=
          event.results[i][0]
          .transcript;
      }

      console.log(
        "TEXTO:",
        textoFinal
      );

      document.getElementById(
        "input"
      ).value =
        textoFinal;
    };

  // =================================
  // TERMINOU
  // =================================

  reconhecimento.onend =
    async function() {

      // impede bug do botão

      if (!gravando) return;

      gravando = false;

      // botão normal

      botao.classList.remove(
        "mic-on"
      );

      botao.classList.add(
        "mic-off"
      );

      botao.innerHTML =
        "🎤";

      removerOuvindo();

      // envia texto final

      const texto =
        document.getElementById(
          "input"
        ).value.trim();

      if (texto) {

        await enviar();
      }
    };

  // =================================
  // ERRO
  // =================================

  reconhecimento.onerror =
    function(event) {

      console.log(event);

      gravando = false;

      botao.classList.remove(
        "mic-on"
      );

      botao.classList.add(
        "mic-off"
      );

      botao.innerHTML =
        "🎤";

      removerOuvindo();

      adicionarMensagem(
        "Erro no microfone",
        "bot"
      );
    };
}