const { ChatWatsonx } = require("@langchain/community/chat_models/ibm");
const { HumanMessage, SystemMessage } = require("@langchain/core/messages");
require('dotenv').config();

/**
 * 👁️ AGRO-VISION ENGINE (IBM Granite Vision)
 * Capabilities: Multimodal analysis of crop images
 */

const analyzeCropImage = async (base64Image, userQuery = "Identify the disease and symptoms.") => {
    
    // 1. Initialize IBM Granite Vision Model
    const visionModel = new ChatWatsonx({
        model: "ibm/granite-3-vision-instruct", // Ensure this Model ID is active in your Watsonx project
        serviceUrl: process.env.WATSONX_AI_SERVICE_URL,
        projectId: process.env.WATSONX_AI_PROJECT_ID,
        version: "2024-05-31",
        temperature: 0.1, 
        maxTokens: 1000,
    });

    // 2. Vision-Specific Safety & Persona Prompt
    const systemPrompt = `
    **ROLE:** You are an expert Agricultural Plant Pathologist. 
    **TASK:** Analyze the provided crop image.
    
    **STRICT OUTPUT RULES:**
    1. **Identify:** The crop and the specific disease/pest (e.g., "Tomato Early Blight").
    2. **Visual Evidence:** List exactly what you see (e.g., "Concentric rings on leaves", "Yellow halo").
    3. **Confidence:** State if the image is clear or blurry.
    4. **Safety:** - DO NOT prescribe specific chemical dosages (mg/ml).
       - DO NOT recommend antibiotics.
       - If the image is not a plant, say "This does not appear to be a crop."

    **FORMAT:**
    **Diagnosis:** [Name]
    **Visual Symptoms:** [List]
    **Recommended Action:** [Cultural/Organic controls only]
    `;

    try {
        console.log("👁️ [Vision Service] Analyzing image...");

        // 3. Construct Multimodal Message
        const response = await visionModel.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage({
                content: [
                    { type: "text", text: userQuery },
                    { 
                        type: "image_url", 
                        image_url: { url: `data:image/jpeg;base64,${base64Image}` } 
                    }
                ]
            })
        ]);

        return response.content;

    } catch (error) {
        console.error("🔴 [Vision Service] Error:", error.message);
        
        if (error.message.includes("model")) {
            return "System Error: The IBM Granite Vision model is not currently active in your region. Please try text description.";
        }
        return "I could not analyze this image. Please ensure it is a clear photo of a crop leaf or fruit.";
    }
};

module.exports = { analyzeCropImage };