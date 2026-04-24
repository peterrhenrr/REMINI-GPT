const perguntas = [
    "Qual é o seu nome?",
    "Como você pode me ajudar?",
    "Que horas são agora?",
    "Qual é a data de hoje?",
    "O que você sabe fazer?",
    "Me conte uma curiosidade",
    "Olá, tudo bem?",
    "Como funciona a inteligência artificial?"
];

const container = document.getElementById("suggestions-container");
perguntas.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("suggestion-card");
    card.textContent = p;
    container.appendChild(card);
});

const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("night");
    document.body.classList.toggle("day");
    themeToggle.textContent = document.body.classList.contains("night") ? "Modo Dia" : "Modo Noite";
});