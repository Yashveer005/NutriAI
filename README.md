# 🥗 NutriAI

### Personal AI Nutrition Assistant powered by IBM watsonx.ai

NutriAI is an AI-powered nutrition assistant designed to provide personalized and practical nutrition guidance based on a user's profile, goals, dietary preferences, and activity level.

The application combines AI-powered conversations with nutrition tools such as diet planning, BMI calculation, calorie estimation, personal profiles, chat history, and a responsive modern interface.

🌐 **Live Demo:** https://nutriai-6nhd.onrender.com

---

## ✨ Features

### 🤖 AI Nutrition Assistant

Chat with NutriAI to get general nutrition guidance about:

- Healthy eating
- Weight loss
- Weight gain
- Vegetarian nutrition
- Meal suggestions
- High-protein food options
- Daily calorie guidance
- General nutrition questions

AI responses are generated using **IBM watsonx.ai**.

---

### 🍽️ Personalized Diet Planner

NutriAI can generate meal and diet suggestions based on different goals:

- 🥗 Balanced Diet
- ⚖️ Weight Loss
- 💪 Weight Gain
- 🥩 High-Protein Food Suggestions

The AI can use the user's saved nutrition profile to provide more relevant recommendations.

---

### 👤 Personal Nutrition Profile

Users can save basic information such as:

- Age
- Weight
- Height
- Nutrition goal
- Diet preference
- Activity level

The profile is stored locally in the browser using **LocalStorage**.

No personal profile data is stored in a database.

---

### 🧮 BMI Calculator

Calculate Body Mass Index using:

- Weight
- Height

The application also provides a general BMI category.

> BMI is provided as a general screening measure and is not a medical diagnosis.

---

### 🔥 Daily Calorie Estimator

NutriAI provides a basic estimate of daily calorie requirements using information such as:

- Age
- Weight
- Height

The result is intended for general educational guidance.

---

### 💬 Quick Prompts

Users can quickly start conversations using predefined prompts for:

- One-day diet plans
- Weight loss
- Weight gain
- High-protein foods

---

### 💾 Chat History

NutriAI stores the conversation locally in the browser so that the chat can remain available after refreshing the page.

---

### 🗑️ Clear Chat

Users can clear their saved conversation history with a single click.

---

### 🌙 Dark / Light Mode

The application supports both:

- ☀️ Light Mode
- 🌙 Dark Mode

The selected theme is saved locally in the browser.

---

### 📱 Responsive Interface

NutriAI is designed to work across:

- Desktop
- Laptop
- Tablet
- Mobile devices

---

## 🧠 IBM watsonx.ai Integration

NutriAI uses **IBM watsonx.ai** to generate AI-powered nutrition responses.

### AI Model

```text
meta-llama/llama-3-3-70b-instruct


🔄 Application Flow
User
  │
  ▼
NutriAI Web Interface
  │
  ├── Personal Profile
  ├── Diet Planner
  ├── BMI Calculator
  └── AI Chat
          │
          ▼
      Flask Backend
          │
          ▼
    IBM watsonx.ai
          │
          ▼
    AI-generated Response
          │
          ▼
      NutriAI Interface

🛠️ Tech Stack

Frontend
HTML5
CSS3
JavaScript
LocalStorage
Responsive Web Design
Backend
Python
Flask
REST API
AI
IBM watsonx.ai
IBM Cloud
Meta Llama 3.3 70B Instruct
Deployment
GitHub
Render
Gunicorn

📁 Project Structure

NutriAI/
│
├── app.py
├── requirements.txt
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
│
├── templates/
│   └── index.html
│
└── static/
    ├── css/
    │   └── style.css
    │
    └── js/
        └── app.js

⚙️ Local Installation
1. Clone the Repository
git clone https://github.com/Yashveer005/NutriAI.git
2. Open the Project
cd NutriAI
3. Create a Virtual Environment
Windows
python -m venv venv
macOS / Linux
python3 -m venv venv
4. Activate the Virtual Environment
Windows PowerShell
.\venv\Scripts\Activate.ps1
macOS / Linux
source venv/bin/activate
5. Install Dependencies
pip install -r requirements.txt

🔐 Environment Variables

Create a .env file in the project root:

IBM_API_KEY=your_ibm_api_key
IBM_PROJECT_ID=your_ibm_project_id
IBM_URL=https://au-syd.ml.cloud.ibm.com
Important Security Note

Never upload the .env file to GitHub.

The .env file contains sensitive IBM credentials and is excluded using .gitignore.

The repository contains .env.example with placeholder values only.

▶️ Run Locally

Start the Flask application:

python app.py

Open the application at:

http://127.0.0.1:5000

🚀 Deployment

NutriAI is deployed using Render.

Build Command
pip install -r requirements.txt
Start Command
gunicorn app:app

IBM credentials are configured through Render Environment Variables.

🔒 Security

NutriAI follows basic credential protection practices:

API keys are stored using environment variables.
.env is excluded from Git.
.env.example contains placeholder values only.
API credentials are not hard-coded into the application.
User profile information is stored locally in the browser.

⚠️ Disclaimer

NutriAI provides general nutrition information for educational purposes only.

It is not a medical diagnostic tool and does not replace a doctor, registered dietitian, nutritionist, or other qualified healthcare professional.

Nutrition requirements can vary between individuals. Users should seek professional medical advice for medical conditions, allergies, medications, or personalized dietary requirements.

👨‍💻 Created By
Yashveer Singh

MCA Student | Developer | Cybersecurity Enthusiast

NutriAI was designed and developed by Yashveer Singh as an AI-powered nutrition assistant using Python, Flask, JavaScript, and IBM watsonx.ai.

📄 License

This project is licensed under the MIT License.

See the LICENSE file for details.

⭐ Support

If you find NutriAI useful, consider giving the repository a ⭐ on GitHub.