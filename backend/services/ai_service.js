const { IamAuthenticator } = require("ibm-cloud-sdk-core");
const { TextGenerationService } = require("@ibm-cloud/watsonx-ai");
const { buildSystemPrompt } = require("./prompt_builder");
require("dotenv").config();

/**
 * 🧠 AGRO-INTELLIGENCE ENGINE
 * IBM WatsonX (Granite) – Production Safe Version
 * Safety Gates + Validators enabled
 */

// ---------------- SAFETY UTILITIES ----------------

const preCheckRisk = (input) => {
  const text = input.toLowerCase();

  const animalKeywords = [
    "cow", "buffalo", "goat", "sheep", "chicken",
    "poultry", "animal", "cattle", "calf"
  ];
  const medKeywords = [
    "dose", "dosage", "injection", "medicine",
    "antibiotic", "paracetamol", "inject", "mg", "ml"
  ];

  const hasAnimal = animalKeywords.some(w => text.includes(w));
  const hasMed = medKeywords.some(w => text.includes(w));

  if (hasAnimal && hasMed) {
    return {
      blocked: true,
      reason: "ANIMAL_MED_RISK",
      safeResponse:
        "I cannot provide specific medical dosages or injection instructions for animals. " +
        "This can be fatal if calculated incorrectly.\n\n" +
        "**Please consult a Veterinary Doctor immediately.**\n\n" +
        "I can still help with:\n" +
        "1. Supportive care\n" +
        "2. Hygiene & isolation\n" +
        "3. Symptom identification"
    };
  }

  const harmKeywords = [
    "suicide", "kill myself", "die",
    "end my life", "drink poison"
  ];

  if (harmKeywords.some(w => text.includes(w))) {
    return {
      blocked: true,
      reason: "HARM_RISK",
      safeResponse:
        "I hear deep distress in your words.\n\n" +
        "📞 **Call Kiran Mental Health Helpline: 1800-599-0019**\n" +
        "or dial **112** immediately.\n\n" +
        "Your life is more valuable than any crop or loan."
    };
  }

  return { blocked: false };
};

const validateAiOutput = (text) => {
  const clean = text.toLowerCase();

  const dosagePattern = /\d+\s*(mg|ml|gm|gram|liter|cc|iu)/i;
  const bannedMeds = [
    "amoxicillin", "ciprofloxacin",
    "azithromycin", "tamiflu",
    "oseltamivir", "diclofenac"
  ];

  if (dosagePattern.test(clean) || bannedMeds.some(m => clean.includes(m))) {
    return {
      safe: false,
      fallback:
        "I can help explain the condition, but I cannot prescribe exact chemical dosages " +
        "or antibiotics.\n\n" +
        "✅ Please consult a Veterinarian or Krishi Kendra for region-specific treatment."
    };
  }

  return { safe: true };
};

// ---------------- WATSONX CLIENT ----------------

const watsonx = new TextGenerationService({
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSONX_AI_APIKEY,
  }),
  serviceUrl: process.env.WATSONX_AI_SERVICE_URL,
});

// ---------------- MAIN GENERATOR ----------------

const generateAiResponse = async (
  userPrompt,
  context = "",
  history = "",
  turnCount = 0
) => {

  // 1️⃣ PRE-SAFETY GATE
  const riskCheck = preCheckRisk(userPrompt);
  if (riskCheck.blocked) {
    console.log(`🛡️ Safety Gate Triggered: ${riskCheck.reason}`);
    return riskCheck.safeResponse;
  }

  // 2️⃣ CRISIS CONTEXT
  const crisisKeywords = [
    "ruin", "died", "suicide",
    "debt", "emergency", "loss",
    "failed", "destroy"
  ];
  const isCrisis = crisisKeywords.some(w =>
    userPrompt.toLowerCase().includes(w)
  );

  // 3️⃣ SYSTEM PROMPT
  const systemInstruction = buildSystemPrompt(
    context,
    isCrisis,
    history,
    turnCount
  );

  const finalPrompt =
    `${systemInstruction}\n\nUser: ${userPrompt}\nAssistant:`;

  console.log(`🤖 AI Request: "${userPrompt}"`);

  try {
    // 4️⃣ CALL WATSONX
    const response = await watsonx.generateText({
      modelId: "ibm/granite-3-8b-instruct",
      input: finalPrompt,
      parameters: {
        temperature: 0.1,
        max_new_tokens: 900,
      },
      projectId: process.env.WATSONX_AI_PROJECT_ID,
    });

    const text =
      response?.result?.results?.[0]?.generated_text?.trim();

    if (!text) {
      throw new Error("Empty response from WatsonX");
    }

    // 5️⃣ POST-VALIDATION
    const validation = validateAiOutput(text);
    if (!validation.safe) {
      console.warn("⚠️ Output safety violation detected");
      return validation.fallback;
    }

    return text;

  } catch (error) {
    console.error("🔴 AI Service Error:", error.message);
    return "I am currently unable to access the agricultural knowledge system. Please try again shortly.";
  }
};

module.exports = { generateAiResponse };
