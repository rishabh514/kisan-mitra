const { WatsonxAI } = require("@ibm-cloud/watsonx-ai");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { buildSystemPrompt } = require('./prompt_builder'); 
require('dotenv').config();

/**
 * 🧠 AGRO-INTELLIGENCE ENGINE (LangChain + IBM Granite Edition)
 * Requirements: @langchain/community, @langchain/core
 * SAFETY UPGRADE: v2.0 (Pre-computation Gates & Post-computation Validators)
 */

// --- SAFETY UTILITIES ---

/**
 * FR-A1: Pre-LLM Risk Gate
 * block immediately if high-risk animal medicine requests are detected.
 */
const preCheckRisk = (input) => {
  const text = input.toLowerCase();
  
  // 1. Animal Medical Dosage Block
  // Detects: "dose for cow", "injection for buffalo", "medicine amount"
  const animalKeywords = ['cow', 'buffalo', 'goat', 'sheep', 'chicken', 'poultry', 'animal', 'cattle', 'calf'];
  const medKeywords = ['dose', 'dosage', 'injection', 'medicine', 'antibiotic', 'paracetamol', 'inject', 'mg', 'ml'];
  
  const hasAnimal = animalKeywords.some(w => text.includes(w));
  const hasMed = medKeywords.some(w => text.includes(w));

  if (hasAnimal && hasMed) {
    return {
      blocked: true,
      reason: "ANIMAL_MED_RISK",
      safeResponse: "I cannot provide specific medical dosages or injection instructions for animals. This can be fatal if calculated incorrectly. \n\n**Please consult a Veterinary Doctor immediately.** \n\nHowever, I can help you with:\n1. Supportive care (Diet/Hygiene)\n2. Isolation protocols\n3. identifying symptoms."
    };
  }

  // 2. Suicide/Harm Block (Immediate Escalation)
  const harmKeywords = ['suicide', 'kill myself', 'die', 'end my life', 'drink poison'];
  if (harmKeywords.some(w => text.includes(w))) {
    return {
      blocked: true,
      reason: "HARM_RISK",
      safeResponse: "I am hearing great distress in your words. Please prioritize your life. \n\n📞 **Call the Government Helpline: 1800-599-0019** (Kiran Mental Health) or dial 112 immediately. \n\nYour life is more valuable than any crop or loan."
    };
  }

  return { blocked: false };
};

/**
 * FR-A2: Post-LLM Output Validator
 * Scans generated text for banned patterns (specific dosages, antibiotics).
 */
const validateAiOutput = (text) => {
  const clean = text.toLowerCase();

  // Rule 1: No specific dosages (mg/kg, ml/liter)
  // Regex looks for number followed closely by unit
  const dosagePattern = /\d+\s*(\.|,)?\d*\s*(mg|ml|gm|gram|liter|cc|iu)/i;
  
  // Rule 2: No Human Antibiotics/Antivirals
  const bannedMeds = ['amoxicillin', 'ciprofloxacin', 'azithromycin', 'tamiflu', 'oseltamivir', 'diclofenac'];

  if (dosagePattern.test(clean) || bannedMeds.some(m => clean.includes(m))) {
    return {
      safe: false,
      fallback: "I have identified a potential diagnosis, but I am restricted from prescribing specific chemical dosages or antibiotics to ensure safety. \n\n✅ **Action:** Please show this diagnosis to your local Veterinarian or Krishi Kendra officer to get the exact prescription for your region."
    };
  }

  return { safe: true };
};

const generateAiResponse = async (userPrompt, context = "", history = "", turnCount = 0) => {
  
  // 1. PRE-COMPUTATION SAFETY GATE
  const riskCheck = preCheckRisk(userPrompt);
  if (riskCheck.blocked) {
    console.log(`🛡️ [Safety Gate] Blocked Request: ${riskCheck.reason}`);
    return riskCheck.safeResponse;
  }

  // 2. Initialize IBM Granite via LangChain
const watsonx = new WatsonxAI({
  authType: "iam",
  apiKey: process.env.WATSONX_AI_APIKEY,
  serviceUrl: process.env.WATSONX_AI_SERVICE_URL,
  projectId: process.env.WATSONX_AI_PROJECT_ID,
});

const generate = async (prompt) => {
  const response = await watsonx.textGeneration({
    modelId: "ibm/granite-3-8b-instruct",
    input: prompt,
    parameters: {
      temperature: 0.1,
      max_new_tokens: 900,
    },
  });

  return response.results[0].generated_text;
};


  // 3. Detect Crisis (Contextual) - Kept for System Prompt logic
  const crisisKeywords = ['ruin', 'died', 'suicide', 'debt', 'emergency', 'help', 'loss', 'failed', 'destroy'];
  const isCrisis = crisisKeywords.some(w => userPrompt.toLowerCase().includes(w));

  // 4. Build Dynamic Persona (Now with Consultant constraints)
  const systemInstruction = buildSystemPrompt(context, isCrisis, history, turnCount);

  console.log(`🔹 [LangChain] Sending to IBM Granite (Turn: ${turnCount})...`);

  try {
    // 5. Create LangChain Prompt Template
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", "{system_instruction}"],
      ["human", "{input}"]
    ]);

    // 6. Create Chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // 7. Execute Chain
    const rawResponse = await chain.invoke({
      system_instruction: systemInstruction,
      input: userPrompt
    });

    let cleanText = rawResponse.trim();
    
    // 8. POST-COMPUTATION SAFETY VALIDATOR
    const validation = validateAiOutput(cleanText);
    if (!validation.safe) {
      console.warn("⚠️ [Safety Validator] Unsafe output detected. Swapping with fallback.");
      return validation.fallback;
    }

    if (!cleanText || cleanText.length < 5) {
      return "I received your query, but I need a moment to process the details. Could you please rephrase the symptoms?";
    }

    return cleanText;

  } catch (error) {
    console.error("🔴 [AI Service] LangChain/Granite Error:", error.message);
    
    if (error.message.includes("not found")) {
        return "System Error: The specific IBM Granite model is not active. Please check configuration.";
    }
    
    return "Namaste. I am currently connecting to the central agricultural database. Please check your connection.";
  }
};

module.exports = { generateAiResponse };