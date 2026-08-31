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
        "max_new_tokens": 500,
        "temperature": 0.7,
        "top_p": 0.9
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
You are NutriAI, an AI-powered nutrition assistant.

Your role is to provide general, practical and personalized
nutrition guidance.

{profile_info}

User question:
{user_message}

Instructions:
- Personalize your response using the profile information when available.
- Consider the user's goal, diet preference and activity level.
- Prefer simple, practical and affordable food choices.
- Consider Indian food options when appropriate.
- Provide balanced nutrition guidance.
- Do not diagnose medical conditions.
- Do not prescribe medicines or medical treatments.
- If the user mentions a serious medical condition, recommend consulting
  a qualified healthcare professional.
- Clearly mention assumptions when important information is missing.
- Do not claim to replace a doctor or registered dietitian.
- Keep the response clear and easy to understand.
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