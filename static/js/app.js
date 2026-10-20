
"use strict";

// ============================================================
// NutriAI 2.0 — Frontend Application
// ============================================================

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const themeToggle = document.getElementById("themeToggle");
const navButtons = document.querySelectorAll(".nav-btn");

const STORAGE_KEYS = {
    profile: "nutriAIProfile",
    theme: "nutriAITheme",
    chat: "nutriAIChat"
};

const MAX_STORED_MESSAGES = 50;
const MAX_CONTEXT_MESSAGES = 8;

let chatHistory = [];
let isSending = false;

const sections = {
    chat: document.getElementById("chatSection"),
    planner: document.getElementById("plannerSection"),
    calculator: document.getElementById("calculatorSection"),
    profile: document.getElementById("profileSection"),
    about: document.getElementById("aboutSection")
};


// ============================================================
// STORAGE HELPERS
// ============================================================

function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        console.warn("Local storage is unavailable.");
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn("Could not save local data.");
        return false;
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn("Could not remove local data.");
    }
}

function getSavedProfile() {
    try {
        const raw = readStorage(STORAGE_KEYS.profile, "{}");
        const profile = JSON.parse(raw);

        return profile && typeof profile === "object" &&
            !Array.isArray(profile) ? profile : {};
    } catch {
        return {};
    }
}

function saveChatHistory() {
    const saved = chatHistory.slice(-MAX_STORED_MESSAGES);

    if (!writeStorage(STORAGE_KEYS.chat, JSON.stringify(saved))) {
        console.warn("Chat history could not be saved on this device.");
    }
}

function loadChatHistory() {
    try {
        const raw = readStorage(STORAGE_KEYS.chat, "[]");
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            chatHistory = [];
            return;
        }

        chatHistory = parsed
            .filter(item =>
                item &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
            )
            .slice(-MAX_STORED_MESSAGES)
            .map(item => ({
                role: item.role,
                content: item.content.slice(0, 4000)
            }));

    } catch {
        chatHistory = [];
    }
}


// ============================================================
// NAVIGATION
// ============================================================

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        showSection(button.dataset.section);
    });
});

function showSection(sectionName) {
    if (!sections[sectionName]) return;

    navButtons.forEach(button => {
        const isActive = button.dataset.section === sectionName;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-current", isActive ? "page" : "false");
    });

    Object.entries(sections).forEach(([name, section]) => {
        if (section) {
            section.classList.toggle("active", name === sectionName);
        }
    });

    window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth"
    });
}


// ============================================================
// SAFE MESSAGE RENDERING
// ============================================================

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatMessage(message) {
    // Escape user/model text before adding a small set of safe
    // formatting tags. Do not render arbitrary HTML from the model.
    let safe = escapeHtml(message);

    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/^### (.*)$/gm, "<strong>$1</strong>");
    safe = safe.replace(/^## (.*)$/gm, "<strong>$1</strong>");
    safe = safe.replace(/^# (.*)$/gm, "<strong>$1</strong>");

    return safe.replace(/\n/g, "<br>");
}

function addMessage(message, type = "bot", options = {}) {
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;

    if (type === "bot") {
        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = "🥗";
        avatar.setAttribute("aria-hidden", "true");

        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const name = document.createElement("strong");
        name.textContent = "NutriAI";

        const content = document.createElement("p");
        content.innerHTML = formatMessage(message);

        bubble.append(name, content);
        messageDiv.append(avatar, bubble);
    } else {
        const bubble = document.createElement("div");
        bubble.className = "bubble";

        const content = document.createElement("p");
        content.textContent = message;

        bubble.appendChild(content);
        messageDiv.appendChild(bubble);
    }

    if (options.temporary) {
        messageDiv.dataset.temporary = "true";
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function renderConversation() {
    if (!chatBox) return;

    chatBox.replaceChildren();

    if (chatHistory.length === 0) {
        addMessage(
            "Hello! I'm NutriAI, your personal nutrition assistant.\n\nTell me your goal or ask a nutrition question to get started.",
            "bot"
        );
        return;
    }

    chatHistory.forEach(item => {
        addMessage(
            item.content,
            item.role === "user" ? "user" : "bot"
        );
    });
}


// ============================================================
// TYPING INDICATOR
// ============================================================

function showTyping() {
    removeTyping();

    if (!chatBox) return;

    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot";
    typingDiv.id = "typingIndicator";
    typingDiv.setAttribute("role", "status");
    typingDiv.setAttribute("aria-live", "polite");

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🥗";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const name = document.createElement("strong");
    name.textContent = "NutriAI";

    const text = document.createElement("p");
    text.textContent = "Preparing your response…";

    bubble.append(name, text);
    typingDiv.append(avatar, bubble);
    chatBox.appendChild(typingDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    document.getElementById("typingIndicator")?.remove();
}


// ============================================================
// PROFILE
// ============================================================

function saveProfile() {
    const getValue = id =>
        document.getElementById(id)?.value.trim() || "";

    const profile = {
        age: getValue("profileAge"),
        weight: getValue("profileWeight"),
        height: getValue("profileHeight"),
        goal: getValue("goal"),
        diet: getValue("diet"),
        activity: getValue("activity"),
        allergies: getValue("profileAllergies"),
        dislikes: getValue("profileDislikes")
    };

    const age = Number(profile.age);
    const weight = Number(profile.weight);
    const height = Number(profile.height);

    if (profile.age && (!Number.isFinite(age) || age < 1 || age > 120)) {
        setProfileStatus("Please enter a valid age.", true);
        return;
    }

    if (profile.weight &&
        (!Number.isFinite(weight) || weight <= 0 || weight > 500)) {
        setProfileStatus("Please enter a valid weight in kg.", true);
        return;
    }

    if (profile.height &&
        (!Number.isFinite(height) || height <= 0 || height > 300)) {
        setProfileStatus("Please enter a valid height in cm.", true);
        return;
    }

    const saved = writeStorage(
        STORAGE_KEYS.profile,
        JSON.stringify(profile)
    );

    setProfileStatus(
        saved
            ? "Profile saved on this device."
            : "Could not save the profile. Check your browser storage settings.",
        !saved
    );
}

function setProfileStatus(message, isError = false) {
    const status = document.getElementById("profileStatus");
    if (!status) return;

    status.textContent = message;
    status.style.color = isError ? "#c0392b" : "";
}

function loadProfile() {
    const profile = getSavedProfile();

    const fields = {
        profileAge: "age",
        profileWeight: "weight",
        profileHeight: "height",
        goal: "goal",
        diet: "diet",
        activity: "activity",
        profileAllergies: "allergies",
        profileDislikes: "dislikes"
    };

    Object.entries(fields).forEach(([elementId, key]) => {
        const element = document.getElementById(elementId);

        if (element) {
            element.value = profile[key] || "";
        }
    });
}


// ============================================================
// CHAT REQUEST
// ============================================================

async function sendMessage() {
    if (isSending || !messageInput || !sendButton) return;

    const message = messageInput.value.trim();

    if (!message) {
        messageInput.focus();
        return;
    }

    if (message.length > 4000) {
        addMessage(
            "Please keep your message under 4,000 characters.",
            "bot"
        );
        return;
    }

    // Send prior messages as context, without duplicating the
    // current message in the history supplied to the backend.
    const historyForRequest = chatHistory
        .slice(-MAX_CONTEXT_MESSAGES)
        .map(item => ({ ...item }));

    chatHistory.push({
        role: "user",
        content: message
    });

    chatHistory = chatHistory.slice(-MAX_STORED_MESSAGES);
    addMessage(message, "user");
    saveChatHistory();

    messageInput.value = "";
    isSending = true;
    sendButton.disabled = true;
    sendButton.textContent = "Thinking…";
    messageInput.disabled = true;

    showTyping();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                profile: getSavedProfile(),
                history: historyForRequest
            })
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok) {
            throw new Error(
                data.error || "NutriAI couldn't process the request."
            );
        }

        if (typeof data.response !== "string" || !data.response.trim()) {
            throw new Error("No answer was returned. Please try again.");
        }

        const answer = data.response.trim();

        chatHistory.push({
            role: "assistant",
            content: answer
        });

        chatHistory = chatHistory.slice(-MAX_STORED_MESSAGES);
        addMessage(answer, "bot");
        saveChatHistory();

    } catch (error) {
        console.error("NutriAI request failed:", error);

        const messageForUser =
            error instanceof TypeError
                ? "Unable to connect to NutriAI. Check your connection and try again."
                : error.message || "Something went wrong. Please try again.";

        // Do not save a temporary network/API error as an AI answer.
        addMessage(messageForUser, "bot");

    } finally {
        removeTyping();

        isSending = false;
        sendButton.disabled = false;
        sendButton.textContent = "Send ➤";
        messageInput.disabled = false;
        messageInput.focus();
    }
}


// ============================================================
// QUICK PROMPTS AND DIET PLANNER
// ============================================================

function sendQuickMessage(message) {
    showSection("chat");

    if (!messageInput) return;

    messageInput.value = message;
    sendMessage();
}

function usePlannerPrompt(prompt) {
    sendQuickMessage(prompt);
}


// ============================================================
// BMI CALCULATOR
// ============================================================

function calculateBMI() {
    const weight = Number(
        document.getElementById("bmiWeight")?.value
    );

    const height = Number(
        document.getElementById("bmiHeight")?.value
    );

    const result = document.getElementById("bmiResult");
    if (!result) return;

    if (
        !Number.isFinite(weight) ||
        !Number.isFinite(height) ||
        weight <= 0 ||
        weight > 500 ||
        height <= 0 ||
        height > 300
    ) {
        result.textContent = "Enter a valid weight and height.";
        return;
    }

    const heightMeters = height / 100;
    const bmi = weight / (heightMeters * heightMeters);

    let category;

    if (bmi < 18.5) {
        category = "Underweight range";
    } else if (bmi < 25) {
        category = "Normal range";
    } else if (bmi < 30) {
        category = "Overweight range";
    } else {
        category = "Obesity range";
    }

    result.replaceChildren();

    const summary = document.createElement("p");
    summary.textContent = `Your BMI is ${bmi.toFixed(1)} — ${category}.`;

    const note = document.createElement("small");
    note.textContent =
        "BMI is a general screening measure, not a diagnosis.";

    result.append(summary, note);
}


// ============================================================
// DAILY CALORIE ESTIMATE
// ============================================================

function calculateCalories() {
    const age = Number(
        document.getElementById("calorieAge")?.value
    );

    const weight = Number(
        document.getElementById("calorieWeight")?.value
    );

    const height = Number(
        document.getElementById("calorieHeight")?.value
    );

    const result = document.getElementById("calorieResult");
    if (!result) return;

    if (
        !Number.isFinite(age) ||
        !Number.isFinite(weight) ||
        !Number.isFinite(height) ||
        age < 18 ||
        age > 100 ||
        weight <= 0 ||
        weight > 500 ||
        height <= 0 ||
        height > 300
    ) {
        result.textContent =
            "For this estimate, enter an age from 18–100, a valid weight and a valid height.";
        return;
    }

    // This is a rough estimate using a simplified formula.
    // It is not an individualized clinical calorie prescription.
    const estimatedBMR =
        (10 * weight) + (6.25 * height) - (5 * age);

    const estimatedCalories = estimatedBMR * 1.45;

    result.replaceChildren();

    const summary = document.createElement("p");
    summary.textContent =
        `Approximate daily energy estimate: ${Math.round(estimatedCalories)} kcal/day.`;

    const note = document.createElement("small");
    note.textContent =
        "This simplified estimate does not account for all individual factors. It is not a medical recommendation.";

    result.append(summary, note);
}


// ============================================================
// DARK MODE
// ============================================================

function loadTheme() {
    const savedTheme = readStorage(STORAGE_KEYS.theme, "light");
    const isDark = savedTheme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    if (themeToggle) {
        themeToggle.textContent = isDark ? "☀️" : "🌙";
        themeToggle.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle("dark-mode");

    writeStorage(
        STORAGE_KEYS.theme,
        isDark ? "dark" : "light"
    );

    if (themeToggle) {
        themeToggle.textContent = isDark ? "☀️" : "🌙";
        themeToggle.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );
    }
}

themeToggle?.addEventListener("click", toggleTheme);


// ============================================================
// CLEAR CHAT
// ============================================================

function clearChat() {
    if (isSending) {
        addMessage(
            "Please wait for the current response before clearing the chat.",
            "bot"
        );
        return;
    }

    chatHistory = [];
    removeStorage(STORAGE_KEYS.chat);
    renderConversation();
}

window.clearChat = clearChat;


// ============================================================
// ENTER KEY
// ============================================================

messageInput?.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    loadTheme();
    loadChatHistory();
    renderConversation();
});


// Make functions available to the existing inline HTML handlers.
window.sendMessage = sendMessage;
window.sendQuickMessage = sendQuickMessage;
window.usePlannerPrompt = usePlannerPrompt;
window.saveProfile = saveProfile;
window.calculateBMI = calculateBMI;
window.calculateCalories = calculateCalories;
