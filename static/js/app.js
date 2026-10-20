
"use strict";

/* =========================================================
   NutriAI 2.0 — Complete Frontend Application
   Compatible with the current index.html and style.css
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

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const themeToggle = document.getElementById("themeToggle");
const chatForm = document.getElementById("chatForm");

const navButtons = document.querySelectorAll(".nav-link");

const sections = {
    chatSection: document.getElementById("chatSection"),
    plannerSection: document.getElementById("plannerSection"),
    calculatorSection: document.getElementById("calculatorSection"),
    profileSection: document.getElementById("profileSection"),
    aboutSection: document.getElementById("aboutSection")
};


/* =========================================================
   SAFE LOCAL STORAGE
   ========================================================= */

function readStorage(key, fallback = null) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        console.warn("NutriAI: Browser storage is unavailable.");
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.warn("NutriAI: Could not save browser data.");
        return false;
    }
}

function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn("NutriAI: Could not remove browser data.");
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
    } catch (error) {
        console.warn("NutriAI: Saved profile could not be read.");
    }

    return {};
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showSection(sectionName) {
    const aliases = {
        chat: "chatSection",
        planner: "plannerSection",
        calculator: "calculatorSection",
        profile: "profileSection",
        about: "aboutSection"
    };

    const targetId = aliases[sectionName] || sectionName;
    const target = sections[targetId];

    if (!target) {
        console.warn("NutriAI: Unknown section:", sectionName);
        return;
    }

    Object.entries(sections).forEach(([id, section]) => {
        if (!section) return;

        const isActive = id === targetId;

        section.classList.toggle("active-section", isActive);
        section.classList.toggle("active", isActive);
    });

    navButtons.forEach(button => {
        const label = button.textContent.trim().toLowerCase();

        const navTargets = {
            "ai chat": "chatSection",
            "meal planner": "plannerSection",
            "calculators": "calculatorSection",
            "my profile": "profileSection",
            "about": "aboutSection"
        };

        const isActive = navTargets[label] === targetId;

        button.classList.toggle("active", isActive);

        if (isActive) {
            button.setAttribute("aria-current", "page");
        } else {
            button.removeAttribute("aria-current");
        }
    });

    window.scrollTo({
        top: 0,
        behavior: window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches ? "auto" : "smooth"
    });
}

window.showSection = showSection;


/* =========================================================
   MESSAGE FORMATTING AND RENDERING
   ========================================================= */

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
        /^### (.*)$/gm,
        "<strong>$1</strong>"
    );

    safe = safe.replace(
        /^## (.*)$/gm,
        "<strong>$1</strong>"
    );

    safe = safe.replace(
        /^# (.*)$/gm,
        "<strong>$1</strong>"
    );

    return safe.replace(/\n/g, "<br>");
}

function addMessage(message, type = "bot", options = {}) {
    if (!chatBox) return;

    const isUser = type === "user";

    const messageDiv = document.createElement("div");

    messageDiv.className = isUser
        ? "message user-message"
        : "message bot-message";

    if (options.temporary) {
        messageDiv.dataset.temporary = "true";
    }

    if (!isUser) {
        const avatar = document.createElement("div");

        avatar.className = "message-avatar";
        avatar.textContent = "N";
        avatar.setAttribute("aria-hidden", "true");

        messageDiv.appendChild(avatar);
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

    messageDiv.appendChild(content);
    chatBox.appendChild(messageDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function renderConversation() {
    if (!chatBox) return;

    chatBox.replaceChildren();

    if (chatHistory.length === 0) {
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


/* =========================================================
   CHAT HISTORY
   ========================================================= */

function saveChatHistory() {
    chatHistory = chatHistory.slice(-MAX_STORED_MESSAGES);

    writeStorage(
        STORAGE_KEYS.chat,
        JSON.stringify(chatHistory)
    );
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
                (item.role === "user" ||
                 item.role === "assistant") &&
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
    } catch (error) {
        // Supports a clean start if old stored history used HTML.
        chatHistory = [];
    }
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


/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function showTyping() {
    removeTyping();

    if (!chatBox) return;

    const wrapper = document.createElement("div");
    wrapper.className = "message bot-message";
    wrapper.id = "typingIndicator";
    wrapper.setAttribute("role", "status");
    wrapper.setAttribute("aria-live", "polite");

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "N";
    avatar.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = "NutriAI is preparing your response…";

    wrapper.append(avatar, content);
    chatBox.appendChild(wrapper);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
    document.getElementById("typingIndicator")?.remove();
}


/* =========================================================
   PROFILE: SAVE, LOAD AND VALIDATE
   ========================================================= */

function setProfileStatus(message, isError = false) {
    const status = document.getElementById("profileStatus");

    if (!status) return;

    status.textContent = message;
    status.style.color = isError ? "var(--danger)" : "";
}

function saveProfile() {
    const getValue = id =>
        document.getElementById(id)?.value.trim() || "";

    const profile = {
        age: getValue("profileAge"),
        weight: getValue("profileWeight"),
        height: getValue("profileHeight"),
        goal: getValue("profileGoal"),
        diet: getValue("profileDiet"),
        activity: getValue("profileActivity"),
        allergies: getValue("profileAllergies"),
        dislikes: getValue("profileDislikes")
    };

    if (profile.age) {
        const age = Number(profile.age);

        if (!Number.isFinite(age) || age < 1 || age > 120) {
            setProfileStatus("Enter a valid age.", true);
            return;
        }
    }

    if (profile.weight) {
        const weight = Number(profile.weight);

        if (
            !Number.isFinite(weight) ||
            weight <= 0 ||
            weight > 500
        ) {
            setProfileStatus(
                "Enter a valid weight in kilograms.",
                true
            );
            return;
        }
    }

    if (profile.height) {
        const height = Number(profile.height);

        if (
            !Number.isFinite(height) ||
            height <= 0 ||
            height > 300
        ) {
            setProfileStatus(
                "Enter a valid height in centimetres.",
                true
            );
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
        profileGoal: "goal",
        profileDiet: "diet",
        profileActivity: "activity",
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

window.saveProfile = saveProfile;


/* =========================================================
   AI CHAT REQUEST
   ========================================================= */

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

    const historyForRequest = chatHistory
        .slice(-MAX_CONTEXT_MESSAGES)
        .map(item => ({ ...item }));

    const previousHistory = [...chatHistory];

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
                message: message,
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

        chatHistory = chatHistory.slice(-MAX_STORED_MESSAGES);

        addMessage(answer, "bot");
        saveChatHistory();

    } catch (error) {
        console.error("NutriAI request failed:", error);

        // Remove the failed question from persistent history.
        // Keep it visible so the user can still see what they asked.
        chatHistory = previousHistory;
        saveChatHistory();

        const errorMessage =
            error instanceof TypeError
                ? "Unable to connect to NutriAI. Check your internet connection and try again."
                : error.message ||
                  "Something went wrong. Please try again.";

        addMessage(errorMessage, "bot");

    } finally {
        removeTyping();

        isSending = false;
        sendButton.disabled = false;
        messageInput.disabled = false;

        // Restore the arrow icon used in the current HTML.
        sendButton.innerHTML = '<span aria-hidden="true">↑</span>';

        messageInput.focus();
    }
}

window.sendMessage = sendMessage;


/* =========================================================
   QUICK PROMPTS AND MEAL PLANNER
   ========================================================= */

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


/* =========================================================
   BMI CALCULATOR
   ========================================================= */

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
        result.textContent =
            "Enter a valid weight in kg and height in cm.";
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
    summary.textContent =
        `Your BMI is ${bmi.toFixed(1)} — ${category}.`;

    const note = document.createElement("small");
    note.textContent =
        "BMI is a screening measure, not a diagnosis. Adult ranges are not intended for children.";

    result.append(summary, note);
}

window.calculateBMI = calculateBMI;


/* =========================================================
   DAILY CALORIE ESTIMATE
   ========================================================= */

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
            "Enter an age from 18–100, a valid weight and a valid height.";
        return;
    }

    // Simplified estimate, not a clinical calorie prescription.
    const estimatedBMR =
        (10 * weight) +
        (6.25 * height) -
        (5 * age);

    const estimatedCalories = Math.round(estimatedBMR * 1.45);

    result.replaceChildren();

    const summary = document.createElement("p");
    summary.textContent =
        `Approximate estimate: ${estimatedCalories.toLocaleString()} kcal/day.`;

    const note = document.createElement("small");
    note.textContent =
        "This simplified estimate does not account for all individual factors and is not medical advice.";

    result.append(summary, note);
}

window.calculateCalories = calculateCalories;


/* =========================================================
   DARK MODE
   ========================================================= */

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark-mode", isDark);

    if (themeToggle) {
        themeToggle.textContent = isDark ? "☀️" : "🌙";

        themeToggle.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );

        themeToggle.setAttribute(
            "title",
            isDark ? "Switch to light mode" : "Switch to dark mode"
        );
    }
}

function loadTheme() {
    const theme = readStorage(STORAGE_KEYS.theme, "light");
    applyTheme(theme === "dark" ? "dark" : "light");
}

function toggleTheme() {
    const isDark = document.body.classList.contains("dark-mode");
    const nextTheme = isDark ? "light" : "dark";

    applyTheme(nextTheme);
    writeStorage(STORAGE_KEYS.theme, nextTheme);
}

themeToggle?.addEventListener("click", toggleTheme);


/* =========================================================
   CHAT FORM
   ========================================================= */

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
    