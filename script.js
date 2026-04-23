// Lista de sugestões
const perguntas = [
    "Qual é o seu nome?",
    "Que horas são agora?",
    "O que você sabe fazer?",
    "Olá, tudo bem?",
    "Como funciona a inteligência artificial?"
];

// Adicionar cards na tela
const container = document.getElementById("suggestions-container");
perguntas.forEach(pergunta => {
    const card = document.createElement("div");
    card.classList.add("suggestion-card");
    card.textContent = pergunta;
    container.appendChild(card);
});

// Botão Dia/Noite
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("night");
    document.body.classList.toggle("day");
    themeToggle.textContent = document.body.classList.contains("night") ? "Modo Dia" : "Modo Noite";
});