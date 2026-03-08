// ===== QUIZ DATA =====
const questions = [
    { q: "Você lembra do nosso início em 14/02/2022?", icon: "📅" },
    { q: "Lembra do nosso último dia no SESI?", icon: "🏫" },
    { q: "E da primeira vez que fui na sua casa, depois de jurarmos que íamos terminar?", icon: "🥺" },
    { q: "Como foi incrível a nossa luta contra todo mundo, não é?", icon: "⚔️" },
    { q: "E quando fomos à praia... inesquecível.", icon: "🌊", image: "assets/Praia.jpg" },
    { q: "Sabia que eu amo quando te chamo de Dóca?", icon: "🥰" },
    { q: "Você tem noção do orgulho que sinto de você?", icon: "📚" },
    { q: "Você é a mulher mais batalhadora e forte que conheço.", icon: "💎" },
    { q: "Cada dia tenho mais certeza de nós.", icon: "🤞" },
    { q: "Preparada pra pergunta final?", icon: "🚨" },
    { q: "Lara, aceita continuar sendo a dona do meu coração?", icon: "❤️" }
];

// ===== DOM ELEMENTS =====
const textEl = document.getElementById("question-text");
const iconEl = document.getElementById("icon");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.getElementById("progress-container");
const btnSim = document.getElementById("btn-sim");
const btnNao = document.getElementById("btn-nao");
const quizSection = document.getElementById("quiz-section");
const finalSection = document.getElementById("final-section");
const memoryImage = document.getElementById("memory-image");
const bgMusic = document.getElementById("bg-music");

// ===== STATE =====
let currentIndex = -1;
let rafPending = false;
let hasFled = false;

// Optimization Constants
const FLEE_MARGIN = 24;
const HEART_EMOJIS = ["❤️", "💖", "🌸", "✨", "💕"];
const MAX_POOL_SIZE = 20;

// ===== HEART MEMORY POOL (Performance) =====
// Rather than creating/destroying DOM elements endlessly, we reuse them.
const heartPool = [];
function initHeartPool() {
    for (let i = 0; i < MAX_POOL_SIZE; i++) {
        const heart = document.createElement("div");
        heart.className = "heart";
        document.body.appendChild(heart);
        heartPool.push(heart);
    }
}

function spawnHeart() {
    const inactiveHeart = heartPool.find(h => !h.classList.contains('active'));
    if (!inactiveHeart) return; // Pool empty right now

    // Randomize appearance
    inactiveHeart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];
    inactiveHeart.style.left = Math.random() * 95 + "vw";
    inactiveHeart.style.fontSize = (16 + Math.random() * 20) + "px";
    
    // Trigger animation
    inactiveHeart.classList.add("active");
    
    // Free it up matching the CSS duration (4.5s)
    setTimeout(() => {
        inactiveHeart.classList.remove("active");
    }, 4500);
}

// ===== CONFETTI BURST (Micro-interaction) =====
function fireConfetti(x, y) {
    const colors = ['#DB2777', '#F472B6', '#CA8A04', '#EAB308'];
    const amount = 8;
    
    for (let i = 0; i < amount; i++) {
        const conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = x + 'px';
        conf.style.top = y + 'px';
        conf.style.background = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(conf);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 30 + Math.random() * 50;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity - 20; // Gravity arc bias

        conf.animate([
            { transform: `translate(0, 0) scale(1)`, opacity: 1 },
            { transform: `translate(${dx}px, ${dy}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600 + Math.random() * 200,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
        }).onfinish = () => conf.remove();
    }
}

// ===== QUIZ LOGIC =====
function nextQuestion(event) {
    // Reward interaction
    if (event) {
        const rect = btnSim.getBoundingClientRect();
        fireConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    if (currentIndex === -1) {
        // Tenta tocar a música assim que o primeiro Sim é clicado
        if(bgMusic) {
            bgMusic.volume = 0.5;
            bgMusic.play().catch(e => console.log("Áudio bloqueado pelo navegador:", e));
        }
    }

    currentIndex++;

    if (currentIndex >= questions.length) {
        showFinalScreen();
        return;
    }

    const question = questions[currentIndex];

    // Remove entrance classes to reset sequence
    iconEl.className = "icon-box";
    textEl.className = "question-text";
    
    // Brief tiny gap before inserting new content
    setTimeout(() => {
        textEl.textContent = question.q;
        iconEl.textContent = question.icon;

        if (question.image) {
            memoryImage.src = question.image;
            memoryImage.classList.remove("hidden");
            // Force reflow
            void memoryImage.offsetWidth;
            memoryImage.classList.add("sequence-image");
        } else {
            memoryImage.classList.add("hidden");
            memoryImage.classList.remove("sequence-image");
        }

        // Apply sequenced Staggered Entrance
        void iconEl.offsetWidth; // Force Reflow
        iconEl.classList.add("sequence-icon");
        textEl.classList.add("sequence-text");
    }, 50);

    // Update progress semantic + visual
    const progress = ((currentIndex + 1) / questions.length) * 100;
    progressBar.style.width = progress + "%";
    progressContainer.setAttribute('aria-valuenow', progress);
}

btnSim.addEventListener("click", nextQuestion);

// =================================================================
// ELEGANT FLEE MECHANIC (Physical Springs)
// =================================================================

function initiateFleeMode() {
    if (hasFled) return;
    hasFled = true;

    const rect = btnNao.getBoundingClientRect();
    document.body.appendChild(btnNao);
    
    btnNao.style.left = rect.left + "px";
    btnNao.style.top = rect.top + "px";
    btnNao.classList.add("fleeing");
}

function fleeFromCursor(cursorX, cursorY) {
    initiateFleeMode();

    const rect = btnNao.getBoundingClientRect();
    const btnW = rect.width;
    const btnH = rect.height;
    
    // Available safe bounds
    const maxW = window.innerWidth - btnW - FLEE_MARGIN;
    const maxH = window.innerHeight - btnH - FLEE_MARGIN;

    // Organic Physics: Jump across axes avoiding the cursor's quadrant
    let newX, newY;
    if (cursorX < window.innerWidth / 2) {
        newX = (window.innerWidth / 2) + Math.random() * (maxW - (window.innerWidth / 2));
    } else {
        newX = FLEE_MARGIN + Math.random() * ((window.innerWidth / 2) - btnW - FLEE_MARGIN);
    }

    if (cursorY < window.innerHeight / 2) {
        newY = (window.innerHeight / 2) + Math.random() * (maxH - (window.innerHeight / 2));
    } else {
        newY = FLEE_MARGIN + Math.random() * ((window.innerHeight / 2) - btnH - FLEE_MARGIN);
    }

    // STRICT CLAMP to prevent overflow
    newX = Math.max(FLEE_MARGIN, Math.min(newX, maxW));
    newY = Math.max(FLEE_MARGIN, Math.min(newY, maxH));

    // Organic Rotation (tilt slightly while fleeing)
    const randomTilt = (Math.random() - 0.5) * 30; // -15deg to 15deg

    btnNao.style.left = newX + "px";
    btnNao.style.top = newY + "px";
    btnNao.style.transform = `rotate(${randomTilt}deg)`;
}

// Detect proximity via circle intersection
function isNearButton(clientX, clientY, threshold) {
    const rect = btnNao.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Circular detection is smoother than box math
    const dist = Math.hypot(clientX - centerX, clientY - centerY);
    return dist < threshold;
}

// High performance event listener
document.addEventListener("mousemove", function (e) {
    if (btnNao.classList.contains("hidden")) return;
    if (rafPending) return;

    rafPending = true;
    requestAnimationFrame(() => {
        rafPending = false;
        // 130px radius shield
        if (isNearButton(e.clientX, e.clientY, 130)) {
            fleeFromCursor(e.clientX, e.clientY);
        }
    });
}, { passive: true });

document.addEventListener("touchmove", function (e) {
    if (btnNao.classList.contains("hidden")) return;
    const touch = e.touches[0];
    if (!touch) return;

    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
        rafPending = false;
        if (isNearButton(touch.clientX, touch.clientY, 110)) {
            fleeFromCursor(touch.clientX, touch.clientY);
        }
    });
}, { passive: true });

window.addEventListener("resize", function () {
    if (btnNao.classList.contains("hidden") || !hasFled) return;

    const rect = btnNao.getBoundingClientRect();
    const maxW = window.innerWidth - rect.width - FLEE_MARGIN;
    const maxH = window.innerHeight - rect.height - FLEE_MARGIN;

    btnNao.style.left = Math.max(FLEE_MARGIN, Math.min(rect.left, maxW)) + "px";
    btnNao.style.top = Math.max(FLEE_MARGIN, Math.min(rect.top, maxH)) + "px";
});

// ===== FINAL SCREEN =====
function showFinalScreen() {
    quizSection.style.display = "none";
    quizSection.setAttribute('aria-hidden', 'true');
    btnNao.classList.add("hidden");
    
    finalSection.classList.add("visible");
    finalSection.removeAttribute('aria-hidden');

    // Confetti explosion on success
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    for(let i=0; i<5; i++) {
        setTimeout(() => fireConfetti(centerX + (Math.random()-0.5)*100, centerY), i * 150);
    }

    // Start memory-safe heart pool
    initHeartPool();
    setInterval(() => spawnHeart(), 600);
}

// INIT
window.addEventListener('DOMContentLoaded', () => {
    // Start by applying initial entrance
    iconEl.classList.add("sequence-icon");
    textEl.classList.add("sequence-text");
    document.querySelector('.btn-group').classList.add("sequence-btns");
});
