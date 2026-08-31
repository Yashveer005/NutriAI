// ============================================================
// NutriAI - Frontend Application
// ============================================================


// =========================
// DOM ELEMENTS
// =========================

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const themeToggle =
    document.getElementById("themeToggle");

const navButtons =
    document.querySelectorAll(".nav-btn");


const sections = {

    chat:
        document.getElementById("chatSection"),

    planner:
        document.getElementById("plannerSection"),

    calculator:
        document.getElementById("calculatorSection"),

    profile:
        document.getElementById("profileSection"),

    about:
        document.getElementById("aboutSection")

};


// =========================
// NAVIGATION
// =========================

navButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const sectionName =
                button.dataset.section;

            showSection(sectionName);

        }
    );

});


function showSection(sectionName) {

    navButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.section === sectionName
        );

    });


    Object.entries(sections).forEach(
        ([name, section]) => {

            if (!section) {
                return;
            }

            section.classList.toggle(
                "active",
                name === sectionName
            );

        }
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// =========================
// HTML SECURITY
// =========================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// =========================
// AI RESPONSE FORMAT
// =========================

function formatMessage(message) {

    let safeMessage =
        escapeHtml(message);


    safeMessage =
        safeMessage.replace(
            /\*\*(.*?)\*\*/g,
            "<strong>$1</strong>"
        );


    safeMessage =
        safeMessage.replace(
            /^### (.*)$/gm,
            "<strong>$1</strong>"
        );


    safeMessage =
        safeMessage.replace(
            /^## (.*)$/gm,
            "<strong>$1</strong>"
        );


    safeMessage =
        safeMessage.replace(
            /^# (.*)$/gm,
            "<strong>$1</strong>"
        );


    safeMessage =
        safeMessage.replace(
            /^[-•] (.*)$/gm,
            "• $1"
        );


    safeMessage =
        safeMessage.replace(
            /\n/g,
            "<br>"
        );


    return safeMessage;

}


// =========================
// ADD CHAT MESSAGE
// =========================

function addMessage(
    message,
    type = "bot"
) {

    const messageDiv =
        document.createElement("div");


    messageDiv.className =
        `message ${type}`;


    if (type === "bot") {

        messageDiv.innerHTML = `

            <div class="avatar">
                🥗
            </div>

            <div class="bubble">

                <strong>
                    NutriAI
                </strong>

                <p>
                    ${formatMessage(message)}
                </p>

            </div>

        `;

    } else {

        messageDiv.innerHTML = `

            <div class="bubble">

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>

        `;

    }


    chatBox.appendChild(
        messageDiv
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;

}


// =========================
// TYPING
// =========================

function showTyping() {

    removeTyping();


    const typingDiv =
        document.createElement("div");


    typingDiv.className =
        "message bot";


    typingDiv.id =
        "typingIndicator";


    typingDiv.innerHTML = `

        <div class="avatar">
            🥗
        </div>

        <div class="bubble">

            <strong>
                NutriAI
            </strong>

            <p>
                Thinking... 🤔
            </p>

        </div>

    `;


    chatBox.appendChild(
        typingDiv
    );


    chatBox.scrollTop =
        chatBox.scrollHeight;

}


function removeTyping() {

    const typingIndicator =
        document.getElementById(
            "typingIndicator"
        );


    if (typingIndicator) {

        typingIndicator.remove();

    }

}


// =========================
// PROFILE
// =========================

function getSavedProfile() {

    const savedProfile =
        localStorage.getItem(
            "nutriAIProfile"
        );


    if (!savedProfile) {

        return {};

    }


    try {

        return JSON.parse(
            savedProfile
        );

    } catch (error) {

        console.error(
            "Profile read error:",
            error
        );

        return {};

    }

}


// =========================
// SAVE PROFILE
// =========================

function saveProfile() {

    const profile = {

        age:
            document.getElementById(
                "profileAge"
            ).value.trim(),

        weight:
            document.getElementById(
                "profileWeight"
            ).value.trim(),

        height:
            document.getElementById(
                "profileHeight"
            ).value.trim(),

        goal:
            document.getElementById(
                "goal"
            ).value,

        diet:
            document.getElementById(
                "diet"
            ).value,

        activity:
            document.getElementById(
                "activity"
            ).value

    };


    localStorage.setItem(
        "nutriAIProfile",
        JSON.stringify(profile)
    );


    const status =
        document.getElementById(
            "profileStatus"
        );


    status.textContent =
        "✓ Profile saved successfully on this device.";


    console.log(
        "NutriAI Profile Saved:",
        profile
    );

}


// =========================
// LOAD PROFILE
// =========================

function loadProfile() {

    const profile =
        getSavedProfile();


    if (!profile) {
        return;
    }


    const age =
        document.getElementById(
            "profileAge"
        );

    const weight =
        document.getElementById(
            "profileWeight"
        );

    const height =
        document.getElementById(
            "profileHeight"
        );

    const goal =
        document.getElementById(
            "goal"
        );

    const diet =
        document.getElementById(
            "diet"
        );

    const activity =
        document.getElementById(
            "activity"
        );


    if (age) {
        age.value =
            profile.age || "";
    }


    if (weight) {
        weight.value =
            profile.weight || "";
    }


    if (height) {
        height.value =
            profile.height || "";
    }


    if (goal) {
        goal.value =
            profile.goal || "";
    }


    if (diet) {
        diet.value =
            profile.diet || "";
    }


    if (activity) {
        activity.value =
            profile.activity || "";
    }

}


// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (!message) {
        return;
    }


    addMessage(
        message,
        "user"
    );


    messageInput.value =
        "";


    sendButton.disabled =
        true;


    sendButton.textContent =
        "Thinking...";


    showTyping();


    try {

        const profile =
            getSavedProfile();


        const response =
            await fetch(
                "/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message:
                            message,

                        profile:
                            profile

                    })

                }
            );


        const data =
            await response.json();


        removeTyping();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Something went wrong."
            );

        }


        addMessage(
            data.response ||
            "I couldn't generate a response.",
            "bot"
        );


        saveChatHistory();


    } catch (error) {

        removeTyping();


        console.error(
            "NutriAI Error:",
            error
        );


        addMessage(
            "Sorry, I couldn't process your request right now. Please try again.",
            "bot"
        );

    } finally {

        sendButton.disabled =
            false;


        sendButton.textContent =
            "Send ➤";


        messageInput.focus();

    }

}


// =========================
// QUICK PROMPTS
// =========================

function sendQuickMessage(message) {

    showSection("chat");

    messageInput.value =
        message;

    sendMessage();

}


// =========================
// DIET PLANNER
// =========================

function usePlannerPrompt(prompt) {

    showSection("chat");

    messageInput.value =
        prompt;

    sendMessage();

}


// =========================
// BMI
// =========================

function calculateBMI() {

    const weight =
        parseFloat(
            document.getElementById(
                "bmiWeight"
            ).value
        );


    const height =
        parseFloat(
            document.getElementById(
                "bmiHeight"
            ).value
        );


    const result =
        document.getElementById(
            "bmiResult"
        );


    if (
        !weight ||
        !height ||
        weight <= 0 ||
        height <= 0
    ) {

        result.textContent =
            "Please enter a valid weight and height.";

        return;

    }


    const heightMeters =
        height / 100;


    const bmi =
        weight /
        (heightMeters * heightMeters);


    let category;


    if (bmi < 18.5) {

        category =
            "Underweight";

    } else if (bmi < 25) {

        category =
            "Normal range";

    } else if (bmi < 30) {

        category =
            "Overweight";

    } else {

        category =
            "Obesity range";

    }


    result.innerHTML = `

        Your BMI is
        <strong>
            ${bmi.toFixed(1)}
        </strong>

        — ${category}.

        <br>

        <small>
            BMI is a general screening measure,
            not a diagnosis.
        </small>

    `;

}


// =========================
// CALORIE ESTIMATE
// =========================

function calculateCalories() {

    const age =
        parseFloat(
            document.getElementById(
                "calorieAge"
            ).value
        );


    const weight =
        parseFloat(
            document.getElementById(
                "calorieWeight"
            ).value
        );


    const height =
        parseFloat(
            document.getElementById(
                "calorieHeight"
            ).value
        );


    const result =
        document.getElementById(
            "calorieResult"
        );


    if (
        !age ||
        !weight ||
        !height ||
        age <= 0 ||
        weight <= 0 ||
        height <= 0
    ) {

        result.textContent =
            "Please enter valid age, weight and height.";

        return;

    }


    const bmr =
        (10 * weight) +
        (6.25 * height) -
        (5 * age);


    const estimatedCalories =
        bmr * 1.45;


    result.innerHTML = `

        Estimated daily calories:

        <strong>
            ${Math.round(
                estimatedCalories
            )} kcal/day
        </strong>

        <br>

        <small>
            General estimate based on
            the information provided.
        </small>

    `;

}


// =========================
// DARK MODE
// =========================

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "nutriAITheme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );


        if (themeToggle) {

            themeToggle.textContent =
                "☀️";

        }

    } else {

        document.body.classList.remove(
            "dark-mode"
        );


        if (themeToggle) {

            themeToggle.textContent =
                "🌙";

        }

    }

}


function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    localStorage.setItem(
        "nutriAITheme",
        isDark
            ? "dark"
            : "light"
    );


    if (themeToggle) {

        themeToggle.textContent =
            isDark
                ? "☀️"
                : "🌙";

    }

}


if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        toggleTheme
    );

}


// =========================
// CHAT HISTORY
// =========================

function saveChatHistory() {

    localStorage.setItem(
        "nutriAIChat",
        chatBox.innerHTML
    );

}


function loadChatHistory() {

    const savedChat =
        localStorage.getItem(
            "nutriAIChat"
        );


    if (!savedChat) {
        return;
    }


    chatBox.innerHTML =
        savedChat;

}


// =========================
// CLEAR CHAT
// =========================

function clearChat() {

    localStorage.removeItem(
        "nutriAIChat"
    );


    chatBox.innerHTML = `

        <div class="message bot">

            <div class="avatar">
                🥗
            </div>

            <div class="bubble">

                <strong>
                    NutriAI
                </strong>

                <p>
                    Chat cleared successfully. 👋
                </p>

                <p>
                    How can I help you today?
                </p>

            </div>

        </div>

    `;

}


// =========================
// ENTER KEY
// =========================

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// =========================
// INITIALIZATION
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadProfile();

        loadTheme();

        loadChatHistory();

        if (messageInput) {

            messageInput.focus();

        }

    }
);