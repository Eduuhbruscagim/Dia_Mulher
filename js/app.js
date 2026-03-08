// ===== QUIZ DATA =====
const questions = [
    { q: "Você lembra do nosso início em 14/02/2022?", icon: "📅" },
    { q: "Sabia que eu amo quando te chamo de Dóca?", icon: "🥰" },
    { q: "Aceitaria dividir um Milk Milk comigo?", icon: "🍧" },
    { q: "Você tem noção do orgulho que sinto de você?", icon: "📚" },
    { q: "Sabia que eu já me vejo morando fora com você?", icon: "✈️" },
    { q: "Você é a mulher mais batalhadora que conheço?", icon: "💎" },
    { q: "Cada dia tenho mais certeza de nós.", icon: "🤞" },
    { q: "Preparada pra pergunta final?", icon: "🚨" },
    { q: "Lara, aceita continuar sendo dona do meu coração?", icon: "❤️" }
];

// ===== DOM ELEMENTS =====
const textEl = document.getElementById("question-text");
const iconEl = document.getElementById("icon");
const progressBar = document.getElementById("progress-bar");
const btnSim = document.getElementById("btn-sim");
const btnNao = document.getElementById("btn-nao");
const quizSection = document.getElementById("quiz-section");
const finalSection = document.getElementById("final-section");

// ===== STATE =====
let currentIndex = -1;
let heartInterval = null;
let hasFled = false;
let rafPending = false; // throttle flag for mousemove

const MAX_HEARTS = 15;
const HEART_EMOJIS = ["❤️", "💖", "🌸", "✨", "💕"];
const FLEE_MARGIN = 20;

// ===== QUIZ LOGIC =====
function nextQuestion() {
    currentIndex++;

    if (currentIndex >= questions.length) {
        showFinalScreen();
        return;
    }

    const question = questions[currentIndex];

    // Fade out, swap content, fade in
    textEl.classList.add("fade-out");

    setTimeout(() => {
        textEl.textContent = question.q;
        iconEl.textContent = question.icon;

        // Bounce the icon
        iconEl.classList.remove("bounce");
        void iconEl.offsetWidth;
        iconEl.classList.add("bounce");

        textEl.classList.remove("fade-out");
        textEl.classList.add("fade-in");

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                textEl.classList.remove("fade-in");
            });
        });
    }, 250);

    // Update progress
    const progress = ((currentIndex + 1) / questions.length) * 100;
    progressBar.style.width = progress + "%";

    spawnHearts(2);
}

btnSim.addEventListener("click", nextQuestion);

// =================================================================
// "NÃO" BUTTON FLEE MECHANIC
// Starts inline next to "Sim". On hover, switches to position:absolute
// on <body> and flees cursor — strictly clamped inside the viewport.
// =================================================================

function getViewportSize() {
    return {
        w: window.innerWidth,
        h: window.innerHeight
    };
}

function initiateFleeMode() {
    if (hasFled) return;
    hasFled = true;

    // Capture current screen position before switching to fixed
    const rect = btnNao.getBoundingClientRect();

    // Set initial position matching where it was on viewport
    btnNao.style.left = rect.left + "px";
    btnNao.style.top = rect.top + "px";
    btnNao.classList.add("fleeing");
}

function fleeFromCursor(cursorX, cursorY) {
    initiateFleeMode(); // Switches to fixed

    const rect = btnNao.getBoundingClientRect();
    const btnW = rect.width;
    const btnH = rect.height;
    const vp = getViewportSize();

    // Available area: full viewport minus margin and button size
    const maxX = vp.w - btnW - FLEE_MARGIN;
    const maxY = vp.h - btnH - FLEE_MARGIN;

    let newX, newY;

    // Se o cursor estiver na metade esquerda da tela, fuja aleatoriamente para a metade direita (e vice-versa)
    if (cursorX < vp.w / 2) {
        newX = (vp.w / 2) + Math.random() * (maxX - (vp.w / 2));
    } else {
        newX = FLEE_MARGIN + Math.random() * ((vp.w / 2) - btnW - FLEE_MARGIN);
    }

    // O mesmo para o eixo Y
    if (cursorY < vp.h / 2) {
        newY = (vp.h / 2) + Math.random() * (maxY - (vp.h / 2));
    } else {
        newY = FLEE_MARGIN + Math.random() * ((vp.h / 2) - btnH - FLEE_MARGIN);
    }

    // STRICT CLAMP — nunca saia do campo de visão (bordas)
    newX = Math.max(FLEE_MARGIN, Math.min(newX, maxX));
    newY = Math.max(FLEE_MARGIN, Math.min(newY, maxY));

    btnNao.style.left = newX + "px";
    btnNao.style.top = newY + "px";
}

function isNearButton(clientX, clientY, threshold) {
    const rect = btnNao.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = Math.abs(clientX - centerX);
    const dy = Math.abs(clientY - centerY);
    return dx < threshold && dy < threshold;
}

// Mouse — throttled with requestAnimationFrame
document.addEventListener("mousemove", function (e) {
    if (btnNao.classList.contains("hidden")) return;
    if (rafPending) return;

    rafPending = true;
    requestAnimationFrame(() => {
        rafPending = false;
        if (isNearButton(e.clientX, e.clientY, 120)) {
            fleeFromCursor(e.clientX, e.clientY);
        }
    });
});

// Touch — throttled
document.addEventListener("touchmove", function (e) {
    if (btnNao.classList.contains("hidden")) return;
    const touch = e.touches[0];
    if (!touch) return;

    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
        rafPending = false;
        if (isNearButton(touch.clientX, touch.clientY, 100)) {
            fleeFromCursor(touch.clientX, touch.clientY);
        }
    });
}, { passive: true });

// Also trigger on touchstart for first touch
document.addEventListener("touchstart", function (e) {
    if (btnNao.classList.contains("hidden")) return;
    const touch = e.touches[0];
    if (!touch) return;
    if (isNearButton(touch.clientX, touch.clientY, 100)) {
        fleeFromCursor(touch.clientX, touch.clientY);
    }
}, { passive: true });

// Re-clamp button on window resize
window.addEventListener("resize", function () {
    if (btnNao.classList.contains("hidden") || !hasFled) return;

    const rect = btnNao.getBoundingClientRect();
    const vp = getViewportSize();
    const maxX = vp.w - rect.width - FLEE_MARGIN;
    const maxY = vp.h - rect.height - FLEE_MARGIN;

    btnNao.style.left = Math.max(FLEE_MARGIN, Math.min(rect.left, maxX)) + "px";
    btnNao.style.top = Math.max(FLEE_MARGIN, Math.min(rect.top, maxY)) + "px";
});

// ===== FINAL SCREEN =====
function showFinalScreen() {
    quizSection.style.display = "none";
    btnNao.classList.add("hidden");
    finalSection.classList.add("visible");

    // Hearts at a slower interval to avoid lag
    heartInterval = setInterval(() => spawnHearts(1), 800);
}

// ===== HEARTS =====
function spawnHearts(count) {
    // Cap max hearts in DOM
    const existing = document.querySelectorAll(".heart");
    if (existing.length >= MAX_HEARTS) return;

    for (let i = 0; i < count; i++) {
        const heart = document.createElement("div");
        heart.className = "heart";
        heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];

        heart.style.left = Math.random() * 100 + "vw";
        heart.style.fontSize = (16 + Math.random() * 14) + "px";
        heart.style.animationDelay = (Math.random() * 0.4) + "s";

        document.body.appendChild(heart);

        // Remove after animation (4s duration + 0.4s max delay + buffer)
        setTimeout(() => {
            if (heart.parentNode) {
                heart.remove();
            }
        }, 4600);
    }
}
