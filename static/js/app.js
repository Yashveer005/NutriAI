
"use strict";

/* =========================================================
   NutriAI 2.0 — Frontend Application
   ========================================================= */

const STORAGE_KEYS = {
    profile: "nutriAIProfile",
    theme: "nutriAITheme",
    chat: "nutriAIChat"
};

const MAX_STORED_MESSAGES = 50;
const MAX_CONTEXT_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 4000;

let chatHistory = [];
let isSending = false;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const SECTION_IDS = [
    "chatSection",
    "plannerSection",
    "calculatorSection",
    "profileSection",
    "aboutSection"
];

const NAV_MAP = {
    "AI Chat": "chatSection",
    "Meal Planner": "plannerSection",
    "Calculators": "calculatorSection",
    "My Profile": "profileSection",
    "About": "aboutSection"
};

const chatBox = $("#chatBox");
const messageInput = $("#messageInput");
const sendButton = $("#sendButton");
const chatForm = $("#chatForm");
const profileForm = $("#profileForm");
const themeToggle = $("#themeToggle");

/* STORAGE */

function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch {
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        // Storage may be unavailable.
    }
}

function getSavedProfile() {
    try {
        const profile = JSON.parse(
            readStorage(STORAGE_KEYS.profile, "{}")
        );

        if (
            profile &&
            typeof profile === "object" &&
            !Array.isArray(profile)
        ) {
            return profile;
        }
    } catch {
        // Use empty profile when saved data is invalid.
    }

    return {};
}

/* NAVIGATION */

function showSection(sectionName) {
    const aliases = {
        chat: "chatSection",
        planner: "plannerSection",
        calculator: "calculatorSection",
        profile: "profileSection",
        about: "aboutSection"
    };

    const targetId = aliases[sectionName] || sectionName;
    const target = document.getElementById(targetId);

    if (!target || !target.classList.contains("content-section")) {
        console.warn("NutriAI: Section not found:", targetId);
        return;
    }

    $$(".content-section").forEach(section => {
        section.classList.toggle(
            "active-section",
            section.id === targetId
        );
    });

    $$(".nav-link").forEach(button => {
        const active =
            NAV_MAP[button.textContent.trim()] === targetId;

        button.classList.toggle("active", active);

        if (active) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    window.scrollTo({ top: 0, behavior: "auto" });
}

window.showSection = showSection;

function initializeNavigation() {
    $$(".nav-link").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = NAV_MAP[button.textContent.trim()];

            if (targetId) {
                showSection(targetId);
            }
        });
    });
}

/* MESSAGE RENDERING */

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
    let safe = escapeHtml(message);

    safe = safe.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    safe = safe.replace(
        /^#{1,3}\s+(.*)$/gm,
        "<strong>$1</strong>"
    );

    return safe.replace(/\n/g, "<br>");
}

function addMessage(message, type = "bot") {
    if (!chatBox) return;

    const isUser = type === "user";
    const wrapper = document.createElement("div");

    wrapper.className = isUser
        ? "message user-message"
        : "message bot-message";

    if (!isUser) {
        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = "N";
        avatar.setAttribute("aria-hidden", "true");
        wrapper.appendChild(avatar);
    }

    const content = document.createElement("div");
    content.className = "message-content";

    if (isUser) {
        const paragraph = document.createElement("p");
        paragraph.textContent = message;
        content.appendChild(paragraph);
    } else {
        content.innerHTML = formatMessage(message);
    }

    wrapper.appendChild(content);
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function renderConversation() {
    if (!chatBox) return;

    chatBox.replaceChildren();

    if (!chatHistory.length) {
        addMessage(
            "Hi! I'm NutriAI. 👋\n\nTell me about your nutrition goals or ask a food-related question. You can save your preferences in My Profile to personalize our conversation.",
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

/* CHAT HISTORY */

function loadChatHistory() {
    try {
        const parsed = JSON.parse(
            readStorage(STORAGE_KEYS.chat, "[]")
        );

        if (!Array.isArray(parsed)) {
            chatHistory = [];
            return;
        }

        chatHistory = parsed
            .filter(item =>
                item &&
                ["user", "assistant"].includes(item.role) &&
                typeof item.content === "string"
            )
            .slice(-MAX_STORED_MESSAGES)
            .map(item => ({
                role: item.role,
                content: item.content.slice(
                    0,
                    MAX_MESSAGE_LENGTH
                )
            }));
    } catch {
        chatHistory = [];
    }
}

function saveChatHistory() {
    chatHistory = chatHistory.slice(-MAX_STORED_MESSAGES);

    writeStorage(
        STORAGE_KEYS.chat,
        JSON.stringify(chatHistory)
    );
}

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

/* TYPING INDICATOR */

function showTyping() {
    removeTyping();

    if (!chatBox) return;

    const wrapper = document.createElement("div");
    wrapper.id = "typingIndicator";
    wrapper.className = "message bot-message";
    wrapper.setAttribute("role", "status");

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "N";

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = "NutriAI is preparing your response…";

    wrapper.append(avatar, content);
    chatBox.appendChild(wrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    $("#typingIndicator")?.remove();
}

/* PROFILE */

function setProfileStatus(message, isError = false) {
    const status = $("#profileStatus");

    if (!status) return;

    status.textContent = message;
    status.style.color = isError
        ? "var(--danger, #c0392b)"
        : "";
}

function saveProfile() {
    const value = id =>
        document.getElementById(id)?.value.trim() || "";

    const profile = {
        age: value("profileAge"),
        weight: value("profileWeight"),
        height: value("profileHeight"),
        activity: value("profileActivity"),
        goal: value("profileGoal"),
        diet: value("profileDiet"),
        allergies: value("profileAllergies"),
        dislikes: value("profileDislikes")
    };

    const checks = [
        ["age", 1, 120, "Enter a valid age."],
        ["weight", 0, 500, "Enter a valid weight in kilograms."],
        ["height", 0, 300, "Enter a valid height in centimetres."]
    ];

    for (const [key, min, max, errorMessage] of checks) {
        if (!profile[key]) continue;

        const number = Number(profile[key]);

        if (
            !Number.isFinite(number) ||
            number < min ||
            number > max ||
            (
                (key === "weight" || key === "height") &&
                number <= 0
            )
        ) {
            setProfileStatus(errorMessage, true);
            return;
        }
    }

    const saved = writeStorage(
        STORAGE_KEYS.profile,
        JSON.stringify(profile)
    );

    setProfileStatus(
        saved
            ? "Preferences saved on this device."
            : "Could not save preferences. Check browser storage settings.",
        !saved
    );
}

function loadProfile() {
    const profile = getSavedProfile();

    const fields = {
        profileAge: "age",
        profileWeight: "weight",
        profileHeight: "height",
        profileActivity: "activity",
        profileGoal: "goal",
        profileDiet: "diet",
        profileAllergies: "allergies",
        profileDislikes: "dislikes"
    };

    Object.entries(fields).forEach(([id, key]) => {
        const field = document.getElementById(id);

        if (field) {
            field.value = profile[key] || "";
        }
    });
}

window.saveProfile = saveProfile;

/* AI CHAT */

async function sendMessage() {
    if (isSending || !messageInput || !sendButton) return;

    const message = messageInput.value.trim();

    if (!message) {
        messageInput.focus();
        return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        addMessage(
            "Please keep your message under 4,000 characters.",
            "bot"
        );
        return;
    }

    const previousHistory = [...chatHistory];

    const historyForRequest = chatHistory
        .slice(-MAX_CONTEXT_MESSAGES)
        .map(item => ({ ...item }));

    addMessage(message, "user");

    chatHistory.push({
        role: "user",
        content: message
    });

    saveChatHistory();

    messageInput.value = "";
    isSending = true;
    sendButton.disabled = true;
    messageInput.disabled = true;
    sendButton.textContent = "…";

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
            throw new Error(
                "The server returned an invalid response. Please try again."
            );
        }

        if (!response.ok) {
            throw new Error(
                data?.error ||
                "NutriAI could not process your request."
            );
        }

        if (
            typeof data.response !== "string" ||
            !data.response.trim()
        ) {
            throw new Error(
                "No answer was returned. Please try again."
            );
        }

        const answer = data.response.trim();

        chatHistory.push({
            role: "assistant",
            content: answer
        });

        saveChatHistory();
        addMessage(answer, "bot");

    } catch (error) {
        console.error("NutriAI request failed:", error);

        chatHistory = previousHistory;
        saveChatHistory();

        const messageText = error instanceof TypeError
            ? "Unable to connect to NutriAI. Check your internet connection and try again."
            : error.message ||
              "Something went wrong. Please try again.";

        addMessage(messageText, "bot");

    } finally {
        removeTyping();

        isSending = false;
        sendButton.disabled = false;
        messageInput.disabled = false;
        sendButton.innerHTML =
            '<span aria-hidden="true">↑</span>';

        messageInput.focus();
    }
}

window.sendMessage = sendMessage;

/* QUICK PROMPTS */

function sendQuickMessage(message) {
    if (isSending || !messageInput) return;

    showSection("chatSection");
    messageInput.value = message;
    sendMessage();
}

function usePlannerPrompt(prompt) {
    sendQuickMessage(prompt);
}

window.sendQuickMessage = sendQuickMessage;
window.usePlannerPrompt = usePlannerPrompt;

/* BMI CALCULATOR */

function calculateBMI() {
    const weightField = $("#bmiWeight");
    const heightField = $("#bmiHeight");
    const result = $("#bmiResult");

    if (!result) return;

    const weight = Number(weightField?.value);
    const height = Number(heightField?.value);

    if (
        !weightField?.value ||
        !heightField?.value ||
        !Number.isFinite(weight) ||
        !Number.isFinite(height) ||
        weight <= 0 ||
        weight > 500 ||
        height <= 0 ||
        height > 300
    ) {
        result.textContent =
            "Enter a valid weight in kg and height in cm.";
        return;
    }

    const bmi = weight / ((height / 100) ** 2);

    let category;

    if (bmi < 18.5) category = "Underweight range";
    else if (bmi < 25) category = "Normal range";
    else if (bmi < 30) category = "Overweight range";
    else category = "Obesity range";

    result.textContent =
        `Your BMI is ${bmi.toFixed(1)} — ${category}. Remember, BMI is a screening measure, not a diagnosis.`;
}

window.calculateBMI = calculateBMI;

/* DAILY CALORIE ESTIMATE */

function calculateCalories() {
    const ageField = $("#calorieAge");
    const weightField = $("#calorieWeight");
    const heightField = $("#calorieHeight");
    const result = $("#calorieResult");

    if (!result) return;

    const age = Number(ageField?.value);
    const weight = Number(weightField?.value);
    const height = Number(heightField?.value);

    if (
        !ageField?.value ||
        !weightField?.value ||
        !heightField?.value ||
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
            "Enter an age from 18–100, a valid weight and a valid height.";
        return;
    }

    // Simplified estimate for general awareness only.
    const estimatedBMR =
        (10 * weight) + (6.25 * height) - (5 * age) - 161;

    const estimatedCalories = Math.round(
        estimatedBMR * 1.45
    );

    result.textContent =
        `Approximate estimate: ${estimatedCalories.toLocaleString()} kcal/day. This simplified estimate is not medical advice.`;
}

window.calculateCalories = calculateCalories;

/* THEME
   CSS must use body.dark-mode for the dark theme variables.
*/

function applyTheme(theme) {
    const normalizedTheme =
        theme === "dark" ? "dark" : "light";

    const isDark = normalizedTheme === "dark";

    document.body.classList.toggle("dark-mode", isDark);
    document.documentElement.style.colorScheme =
        normalizedTheme;

    if (themeToggle) {
        themeToggle.textContent = isDark ? "☀️" : "🌙";

        themeToggle.setAttribute(
            "aria-label",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );

        themeToggle.title = isDark
            ? "Switch to light mode"
            : "Switch to dark mode";
    }
}

function loadTheme() {
    const savedTheme = readStorage(
        STORAGE_KEYS.theme,
        "light"
    );

    applyTheme(savedTheme);
}

function toggleTheme() {
    const isDark =
        document.body.classList.contains("dark-mode");

    const nextTheme = isDark ? "light" : "dark";

    applyTheme(nextTheme);
    writeStorage(STORAGE_KEYS.theme, nextTheme);
}

window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;

themeToggle?.addEventListener("click", event => {
    event.preventDefault();
    toggleTheme();
});

/* EVENT HANDLERS */

chatForm?.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage();
});

messageInput?.addEventListener("keydown", event => {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();
        sendMessage();
    }
});

profileForm?.addEventListener("submit", event => {
    event.preventDefault();
    saveProfile();
});

/* INITIALIZATION */

function initializeNutriAI() {
    initializeNavigation();
    loadTheme();
    loadProfile();
    loadChatHistory();
    renderConversation();

    const firstAvailableSection = SECTION_IDS.find(
        id => document.getElementById(id)
    );

    if (firstAvailableSection) {
        showSection(
            document.getElementById("chatSection")
                ? "chatSection"
                : firstAvailableSection
        );
    }
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeNutriAI,
        { once: true }
    );
} else {
    initializeNutriAI();
}
