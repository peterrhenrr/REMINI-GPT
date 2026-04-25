const AZURE_ENDPOINT = "https://georg-ml7854jc-swedencentral.cognitiveservices.azure.com";
const AZURE_API_KEY = "SUA_API_KEY";
const API_VERSION = "2025-04-01-preview";

async function enviar() {
  const input = document.getElementById("input");
  const chat = document.getElementById("chat");

  const mensagem = input.value.trim();
  if (!mensagem) return;

  chat.innerHTML += `<div>Você: ${mensagem}</div>`;
  input.value = "";

  const url = `${AZURE_ENDPOINT}/openai/responses?api-version=${API_VERSION}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_API_KEY
      },
      body: JSON.stringify({
        model: "gpt-5.2-chat",
        input: mensagem,
        max_output_tokens: 1000
      })
    });

    const data = await res.json();

    console.log("Azure response:", data);

    const resposta =
      data.output?.[0]?.content?.[0]?.text ||
      "Sem resposta";

    chat.innerHTML += `<div>Bot: ${resposta}</div>`;

  } catch (err) {
    console.error(err);
    chat.innerHTML += `<div>Erro de conexão com Azure</div>`;
  }
}