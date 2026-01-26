const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');
require('dotenv').config();

const watsonxAI = WatsonXAI.newInstance({
    version: '2024-05-31',
    serviceUrl: process.env.WATSONX_AI_SERVICE_URL,
});

const translateText = async (text, targetLang) => {
    if (!targetLang || targetLang === 'en' || targetLang === 'english') return text;

    const modelId = 'ibm/granite-3-8b-instruct'; 
    const projectId = process.env.WATSONX_AI_PROJECT_ID;

    let languageName = "English";
    const lowerLang = targetLang.toLowerCase();
    
    if (lowerLang === 'hi' || lowerLang === 'hindi') languageName = "Hindi (Devanagari script)";
    else if (lowerLang === 'mr' || lowerLang === 'marathi') languageName = "Marathi";
    else if (lowerLang === 'gu' || lowerLang === 'gujarati') languageName = "Gujarati";
    else if (lowerLang === 'pa' || lowerLang === 'punjabi') languageName = "Punjabi";
    else languageName = targetLang;

    // FR-E1: Strict Translation Prompt
    const fullInput = `[INST] <<SYS>>
You are a professional agricultural translator.
Task: Translate the text below into ${languageName}.

CRITICAL RULES:
1. **DO NOT TRANSLATE CHEMICAL/MEDICINE NAMES.** Keep them in English (e.g., "Imidacloprid", "Amoxicillin").
2. **MAINTAIN SAFETY TONE:** Keep words like "STOP", "DANGER", "WARNING" emphasized.
3. **NO FILLER:** Do not say "Here is the translation". Just output the result.
4. **FORMATTING:** Keep bullet points, bolding, and numbers exactly as they are.
<</SYS>>

Text to translate:
${text}

Translation: [/INST]`;

    const payload = {
        modelId,
        input: fullInput,
        parameters: {
            decoding_method: 'greedy',
            max_new_tokens: 900,
            repetition_penalty: 1.1,
        },
        projectId,
    };

    try {
        const response = await watsonxAI.generateText(payload);
        const result = response.result.results[0].generated_text;
        return result.replace(/\[\/?INST\]/g, '').trim();
    } catch (error) {
        console.error("IBM API Error (Translation):", error.message);
        return text + "\n\n(Note: Translation service unavailable, showing English response.)";
    }
};

module.exports = { translateText };