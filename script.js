 let config = null;

// =====================================
// CONTROLE
// =====================================

let enviando = false;

let audioAtual = null;

let reconhecimento = null;

let gravando = false;

let ouvindoMsg = null;


// =====================================
// CONFIG
// =====================================

async function carregarConfig() {

  try {

    const res = await fetch(
      "./keys.json",
      {
        cache: "no-store"
      }
    );

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

    adicionarMensagem(
      "Remini GPT online 🚀",
      "bot"
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
// ENVIAR
// =====================================

async function enviar() {

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
    loading[
      loading.length - 1
    ];

  let resposta =
    "Sem resposta";

  try {

    // =================================
    // CHATGPT / AZURE
    // =================================

    if (
      provider === "azure"
    ) {

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
Você é Remini GPT.

Regras:
- Responda em português do Brasil
- Seja rápido
- Seja amigável
- Converse naturalmente
- Entenda erros de fala
- Nunca diga que é IA
- Responda curto quando for voz
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

      if (data.output) {

        for (const item of data.output) {

          if (
            item.type === "message"
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

      if (
        data.error
      ) {

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
Você é Remini GPT.

Regras:
- Responda em português do Brasil
- Seja rápido
- Seja amigável
- Converse naturalmente
- Entenda erros de fala
- Nunca diga que é IA
- Responda curto quando for voz
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

      if (
        data.error
      ) {

        resposta =
          "Erro Gemini: " +
          data.error.message;
      }
    }

    // REMOVE LOADING

    if (
      ultimoLoading
    ) {

      ultimoLoading.remove();
    }

    adicionarMensagem(
      resposta,
      "bot"
    );

    // FALAR

    await falarTexto(
      resposta
    );

  } catch (err) {

    console.error(err);

    if (
      ultimoLoading
    ) {

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
// VOZ
// =====================================

async function falarTexto(
  texto
) {

  try {

    const provider =
      document.getElementById(
        "provider"
      ).value;

    // =================================
    // GEMINI = VOZ NATIVA
    // =================================

    if (
      provider === "gemini"
    ) {

      window.speechSynthesis.cancel();

      const fala =
        new SpeechSynthesisUtterance(
          texto
        );

      fala.lang =
        "pt-BR";

      fala.rate =
        1;

      fala.pitch =
        1;

      const vozes =
        window.speechSynthesis.getVoices();

      let vozBR =
        vozes.find(
          v =>
            v.lang === "pt-BR"
        );

      if (!vozBR) {

        vozBR =
          vozes.find(
            v =>
              v.lang.includes(
                "pt"
              )
          );
      }

      if (vozBR) {

        fala.voice =
          vozBR;
      }

      window.speechSynthesis.speak(
        fala
      );

      return;
    }

    // =================================
    // AZURE VOICE
    // =================================

    if (
      provider === "azure"
    ) {

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
          "Erro voz Azure"
        );
      }

      const blob =
        await res.blob();

      const audioUrl =
        URL.createObjectURL(
          blob
        );

      audioAtual =
        new Audio(
          audioUrl
        );

      await audioAtual.play();
    }

  } catch (err) {

    console.error(
      "Erro voz:",
      err
    );
  }
}


// =====================================
// MICROFONE
// =====================================

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

  // =================================
  // SUPORTE
  // =================================

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    adicionarMensagem(
      "Seu navegador não suporta voz",
      "bot"
    );

    return;
  }

  // =================================
  // PARAR E ENVIAR
  // =================================

  if (gravando) {

    gravando = false;

    reconhecimento.stop();

    return;
  }

  // =================================
  // INICIAR
  // =================================

  reconhecimento =
    new SpeechRecognition();

  reconhecimento.lang =
    "pt-BR";

  reconhecimento.continuous =
    true;

  reconhecimento.interimResults =
    true;

  gravando = true;

  // BOTÃO

  botao.classList.remove(
    "mic-off"
  );

  botao.classList.add(
    "mic-on"
  );

  botao.innerHTML =
    "⏹";

  // MENSAGEM OUVINDO

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
    async function(event) {

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

      textoFinal =
        textoFinal.trim();

      document.getElementById(
        "input"
      ).value =
        textoFinal;

      // =================================
      // ATIVAÇÃO POR NOME
      // =================================

      const textoLower =
        textoFinal.toLowerCase();

      const ativadores = [

        "remini",
        "remini gpt",
        "oi remini",
        "olá remini",
        "hey remini"
      ];

      const chamou =
        ativadores.some(
          nome =>
            textoLower.includes(
              nome
            )
        );

      // RESPONDE AUTOMÁTICO

      if (
        chamou &&
        !enviando
      ) {

        gravando = false;

        reconhecimento.stop();

        removerOuvindo();

        botao.classList.remove(
          "mic-on"
        );

        botao.classList.add(
          "mic-off"
        );

        botao.innerHTML =
          "🎤";

        await enviar();
      }
    };

  // =================================
  // FINALIZOU
  // =================================

  reconhecimento.onend =
    async function() {

      if (
        gravando
      ) {

        gravando = false;

        removerOuvindo();

        botao.classList.remove(
          "mic-on"
        );

        botao.classList.add(
          "mic-off"
        );

        botao.innerHTML =
          "🎤";

        const texto =
          document.getElementById(
            "input"
          ).value.trim();

        if (texto) {

          await enviar();
        }
      }
    };

  // =================================
  // ERRO
  // =================================

  reconhecimento.onerror =
    function(event) {

      console.log(event);

      gravando = false;

      removerOuvindo();

      botao.classList.remove(
        "mic-on"
      );

      botao.classList.add(
        "mic-off"
      );

      botao.innerHTML =
        "🎤";

      adicionarMensagem(
        "Erro no microfone",
        "bot"
      );
    };
}