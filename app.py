import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference


# Load environment variables
load_dotenv()

app = Flask(__name__)


# IBM watsonx.ai credentials
IBM_API_KEY = os.getenv("IBM_API_KEY")
IBM_PROJECT_ID = os.getenv("IBM_PROJECT_ID")
IBM_URL = os.getenv("IBM_URL")


# Check credentials
if not IBM_API_KEY or not IBM_PROJECT_ID or not IBM_URL:
    raise ValueError(
        "Missing IBM watsonx.ai credentials. "
        "Check your .env file."
    )


# IBM watsonx.ai connection
credentials = Credentials(
    url=IBM_URL,
    api_key=IBM_API_KEY
)


model = ModelInference(
    model_id="meta-llama/llama-3-3-70b-instruct",
    credentials=credentials,
    project_id=IBM_PROJECT_ID,
    params={
    "max_new_tokens": 180,
    "temperature": 0.4,
    "top_p": 0.85
    }
)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()

        user_message = data.get("message", "").strip()
        profile = data.get("profile", {})

        if not user_message:
            return jsonify({
                "error": "Please enter a message."
            }), 400

        # Read profile information
        age = profile.get("age", "")
        weight = profile.get("weight", "")
        height = profile.get("height", "")
        goal = profile.get("goal", "")
        diet = profile.get("diet", "")
        activity = profile.get("activity", "")

        profile_info = ""

        if any([age, weight, height, goal, diet, activity]):
            profile_info = f"""
User Profile:
- Age: {age or "Not provided"}
- Weight: {weight or "Not provided"} kg
- Height: {height or "Not provided"} cm
- Goal: {goal or "Not provided"}
- Diet preference: {diet or "Not provided"}
- Activity level: {activity or "Not provided"}
"""

        prompt = f"""
You are NutriAI, a concise AI nutrition assistant.

USER PROFILE:
Age: {profile.get("age", "Not provided")}
Weight: {profile.get("weight", "Not provided")} kg
Height: {profile.get("height", "Not provided")} cm
Goal: {profile.get("goal", "Not provided")}
Diet: {profile.get("diet", "Not provided")}
Activity Level: {profile.get("activity", "Not provided")}

USER QUESTION:
{user_message}

YOUR TASK:
Answer the user's question directly and briefly.

STRICT OUTPUT RULES:
- Output ONLY the final answer for the user.
- NEVER output instructions, system rules, prompt text, or meta-commentary.
- NEVER say "Use a friendly tone", "Use simple language", "Response rules", "Instructions", or similar phrases.
- NEVER repeat the user's question.
- NEVER mention that you are an AI following instructions.
- NEVER generate Python, JavaScript, HTML, CSS, or programming code.
- Do not provide information that the user did not ask for.
- Do not turn a simple question into a long article.
- Do not provide a 7-day plan unless the user explicitly asks for 7 days.
- If the user asks for one breakfast, give ONE breakfast suggestion.
- If the user asks for a breakfast plan without specifying duration, give ONE practical breakfast.
- If the user asks for a one-day plan, provide breakfast, lunch, snack, and dinner only.
- If the user asks for a multi-day plan, provide exactly the requested number of days.
- Use the user's profile when relevant.
- Respect the user's diet preference.
- Prefer common Indian foods when appropriate.
- Mention calories or macros only when requested or clearly useful.
- Keep normal answers within 80-120 words.
- Use short bullet points when useful.
- Do not add unnecessary tips, conclusions, or repeated advice.
- Do not diagnose medical conditions or prescribe treatment.
- Provide general nutrition guidance only.

EXAMPLE:
User: give me a breakfast plan?

Good response:
"🥣 Breakfast

• 2 moong dal chilla with paneer
• 1 bowl curd
• 1 fruit
• Water or unsweetened tea

A simple, filling and protein-rich breakfast."

Now answer ONLY the user's question.
"""

        response = model.generate_text(prompt=prompt)

        return jsonify({
            "response": response
        })

    except Exception as e:
        print("ERROR:", e)

        return jsonify({
            "error": "Something went wrong while generating the response.",
            "details": str(e)
        }), 500
    
    except Exception as e:
        print("ERROR:", e)

        return jsonify({
            "error": "Something went wrong while generating the response.",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )