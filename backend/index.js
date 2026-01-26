require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import Services
const { generateAiResponse } = require('./services/ai_service');
const { getLocalContext } = require('./services/rag_engine');
const { getWeather } = require('./services/weather_service');
const { translateText } = require('./services/translator');
const { analyzeCropImage } = require('./services/vision_service'); 
const { getSession, addTurn, getFormattedHistory, getTurnCount } = require('./services/session_manager');

const app = express();
const PORT = process.env.PORT || 5000;

// Increase payload limit for images
app.use(express.json({ limit: '50mb' })); 
app.use(cors());

app.get('/', (req, res) => res.send('Agro-Backend Active (Gemini-Style Input v9.0)'));

// --- TEXT CHAT ENDPOINT ---
app.post('/api/chat', async (req, res) => {
    const { message, location, language, sessionId } = req.body;
    const userLang = language ? language.toString().toLowerCase() : 'en';
    const currentSession = getSession(sessionId);
    const mySessionId = currentSession.id;

    try {
        let fullContext = "";

        if (location) {
            try {
                const weather = await getWeather(location);
                if (weather) {
                    fullContext += `Current Weather in ${location}: ${weather.temp}°C, ${weather.condition}, Humidity: ${weather.humidity}%. `;
                    if (weather.humidity > 80) fullContext += "High humidity warning: Risk of fungal diseases. ";
                    if (weather.condition.toLowerCase().includes("rain")) fullContext += "CRITICAL WARNING: Rain detected. Advise NOT to spray liquids. ";
                }
            } catch (err) { console.log("Weather error:", err.message); }
        }

        try {
            const documentContext = await getLocalContext(message);
            if (documentContext) fullContext += `\nTechnical Data: ${documentContext}\n`;
        } catch (err) { console.log("RAG error:", err.message); }

        const history = getFormattedHistory(mySessionId);
        const turnCount = getTurnCount(mySessionId); 

        console.log(`AI Request: "${message}" [Session: ${mySessionId}]`);

        const englishReply = await generateAiResponse(message, fullContext, history, turnCount);
        addTurn(mySessionId, message, englishReply);

        let finalReply = englishReply;
        if (userLang !== 'en' && userLang !== 'english') {
            finalReply = await translateText(englishReply, userLang);
        }

        res.json({ reply: finalReply, sessionId: mySessionId });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

// --- VISION ENDPOINT (Updated for Text + Image) ---
app.post('/api/scan', async (req, res) => {
    // Expects: { image: "base64...", message: "optional text", sessionId: "..." }
    const { image, message, sessionId, language } = req.body;
    const userLang = language ? language.toString().toLowerCase() : 'en';
    
    // Default prompt if user sends only image
    const userQuery = message || "Identify this crop disease and list symptoms.";

    if (!image) return res.status(400).json({ error: "No image provided" });

    const currentSession = getSession(sessionId);
    const mySessionId = currentSession.id;

    try {
        // 1. Analyze Image with User Query
        const analysis = await analyzeCropImage(image, userQuery);
        
        // 2. Save to History 
        // We save the text the user typed (or a default label) + the AI response
        const userLog = message ? `[Image Upload] ${message}` : `[User uploaded an image for diagnosis]`;
        addTurn(mySessionId, userLog, analysis);

        // 3. Translate if needed
        let finalReply = analysis;
        if (userLang !== 'en' && userLang !== 'english') {
            finalReply = await translateText(analysis, userLang);
        }

        res.json({ 
            reply: finalReply, 
            sessionId: mySessionId 
        });

    } catch (error) {
        console.error("Vision API Error:", error);
        res.status(500).json({ error: "Image Analysis Failed" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));