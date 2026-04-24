const input = document.getElementById("chat-input");
const sendBtn = document.querySelector(".send-btn");
const chatWindow = document.getElementById("chat-window");

// Função para gerar resposta da IA
function getBotResponse(userMsg) {
    userMsg = userMsg.toLowerCase();
    if(userMsg.includes("nome")) return "Eu sou o REMNI-GPT, seu assistente inteligente!";
    if(userMsg.includes("horas")) return `Agora são ${new Date().toLocaleTimeString()}`;
    if(userMsg.includes("data")) return `Hoje é ${new Date().toLocaleDateString()}`;
    if(userMsg.includes("oi") || userMsg.includes("olá")) return "Olá! Como posso te ajudar hoje?";
    return "Interessante! Me conte mais ou faça outra pergunta.";
}

// Função para adicionar mensagem ao chat
function addMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender === "user" ? "user-msg" : "bot-msg");
    msgDiv.textContent = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Evento de envio
sendBtn.addEventListener("click", () => {
    const msg = input.value.trim();
    if(msg === "") return;
    addMessage(msg, "user");
    input.value = "";
    setTimeout(() => {
        const botReply = getBotResponse(msg);
        addMessage(botReply, "bot");
    }, 500); // atraso para parecer mais natural
});

// Enviar com Enter
input.addEventListener("keypress", (e) => {
    if(e.key === "Enter") sendBtn.click();
});