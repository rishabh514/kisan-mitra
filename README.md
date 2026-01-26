# 🌾 Agro-Resilience Agent

An AI-powered agricultural chatbot designed to improve decision-making for small-scale farmers in India. The system combines large language models, real-time weather data, and curated agricultural knowledge to deliver timely, context-aware farming guidance in local languages.

---

## 📌 Overview

Indian farmers face increasing uncertainty due to climate variability, pest outbreaks, and limited access to expert agronomy advice. **Agro-Resilience Agent** addresses this gap by providing:

* Context-aware agricultural guidance through conversational AI
* Weather-driven recommendations for farming operations
* Multilingual support (English & Hindi) to improve accessibility
* A safety-first, responsible AI design suitable for real-world deployment

The system is built to be simple, scalable, and usable even by farmers with limited technical exposure.

---

## ✨ Key Features

### 🌱 Intelligent Agricultural Chat

* Natural language queries about crops, pests, and best practices
* Context retention across conversations using session management
* Retrieval-Augmented Generation (RAG) for grounded, reliable responses

### 🌦 Weather-Aware Recommendations

* Real-time weather data via OpenWeatherMap
* Location-specific advisories
* Alerts for weather-sensitive activities (e.g., irrigation, spraying)

### 🌐 Multilingual Support

* English and Hindi language support
* Automatic translation of AI responses
* Designed to reduce the digital and language divide

### 🗣 Voice Interaction

* Speech-to-text input for ease of use
* Text-to-speech responses for hands-free interaction
* Suitable for field usage

### 🛡 Safety-First Design

* Built-in safeguards against unsafe agricultural or medical advice
* Explicit avoidance of chemical dosage prescriptions
* Redirection to experts where human intervention is required

---

## 🛠 Technology Stack

### Frontend

* React 18
* Axios
* React Markdown
* Custom hooks for chat, voice, and weather handling

### Backend

* Node.js + Express
* IBM Watsonx AI (Granite models for text generation)
* LangChain for AI orchestration
* OpenWeatherMap API for weather context

### AI & Data

* Retrieval-Augmented Generation (RAG) using curated agricultural documents
* Trust-weighted knowledge retrieval
* Session-based conversational memory

---

## 📁 Project Structure

```
ra/
├── backend/
│   ├── data/                  # Agricultural reference documents
│   ├── rag_database/           # RAG knowledge chunks
│   ├── services/               # AI, weather, translation, session logic
│   ├── utils/
│   └── index.js                # Express server
├── frontend/
│   ├── src/
│   │   ├── components/         # Chat UI & layout
│   │   ├── hooks/              # Chat, voice, weather hooks
│   │   ├── i18n/               # Language files (EN / HI)
│   │   └── App.js
├── docs/                       # Reports & Responsible AI docs
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites

* Node.js (v14+)
* npm or yarn
* IBM Watsonx AI credentials
* OpenWeatherMap API key

---

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
WATSONX_AI_SERVICE_URL=your_service_url
WATSONX_AI_PROJECT_ID=your_project_id
WEATHER_API_KEY=your_openweathermap_api_key
```

Start the server:

```bash
npm start
```

Backend runs on: `http://localhost:5000`

---

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🔌 API Overview

### POST `/api/chat`

Provides agricultural advice using AI, weather context, and RAG.

**Request**

```json
{
  "message": "Best practices for wheat irrigation",
  "location": "Delhi",
  "language": "en",
  "sessionId": "optional"
}
```

**Response**

```json
{
  "reply": "AI-generated response",
  "sessionId": "session_id"
}
```

---

## 🧠 Responsible AI Principles

* **Safety**: No chemical dosage or medical prescriptions
* **Transparency**: Clear AI identity and limitations
* **Fairness**: Region-agnostic, source-verified advice
* **Privacy**: No personal data storage, session-based memory only

Responsible AI guidelines are documented in `/docs/ResponsibleAI.md`.

---

## 📚 Knowledge Base

The RAG system is built using verified agricultural sources including:

* General agriculture practices
* Horticulture guidelines
* Integrated Pest Management (IPM) references

Documents are chunked and indexed for fast, reliable retrieval.

---

This project is developed as part of the **1M1B (1 Million for 1 Billion)** initiative.

---

**Built with ❤️ to support Indian farmers through responsible AI**



* Tighten this further for **hackathon submission**
* Rewrite it for **internship / recruiter evaluation**
* Create a **short GitHub description + topics**
* Add a **system architecture diagram (text-only)**

Just tell me 🔥
