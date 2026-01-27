const { WatsonXAI } = require("@ibm-cloud/watsonx-ai");
const { buildSystemPrompt } = require("./prompt_builder");
require("dotenv").config();

/**
 * 🧠 AGRO-INTELLIGENCE ENGINE (IBM WatsonX Granite Edition)
 * SAFETY UPGRADE v2.2
 * FIX: Corrected SDK Instantiation & Method Call
 */

// ------------------------------------------------------------------
// 1. INITIALIZE WATSONX SERVICE CORRECTLY
// ------------------------------------------------------------------
const watsonxAiService = WatsonXAI.newInstance({
    version: '2024-05-31',
    serviceUrl: process.env.WATSONX_AI_SERVICE_URL,
});

// ------------------------------------------------------------------
// SAFETY UTILITIES
// ------------------------------------------------------------------

/**
 * FR-A1: Pre-LLM Risk Gate
 * Blocks high-risk animal medicine & self-harm queries
 */
const preCheckRisk = (input) => {
  const text = input.toLowerCase();

  // 1️⃣ Animal medical dosage block
  const animalKeywords = [
    "cow", "buffalo", "goat", "sheep",
    "chicken", "poultry", "animal",
    "cattle", "calf"
  ];
  const medKeywords = [
    "dose", "dosage", "injection",
    "medicine", "antibiotic",
    "paracetamol", "inject",
    "mg", "ml"
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
        "However, I can help with:\n" +
        "1. Supportive care (diet & hygiene)\n" +
        "2. Isolation protocols\n" +
        "3. Identifying symptoms"
    };
  }

  // 2️⃣ Suicide / self-harm escalation
  const harmKeywords = [
    "suicide", "kill myself", "die",
    "end my life", "drink poison"
  ];

  if (harmKeywords.some(w => text.includes(w))) {
    return {
      blocked: true,
      reason: "HARM_RISK",
      safeResponse:
        "I am hearing great distress in your words.\n\n" +
        "📞 **Call the Government Helpline: 1800-599-0019** (Kiran Mental Health) " +
        "or dial **112** immediately.\n\n" +
        "Your life is more valuable than any crop or loan."
    };
  }

  return { blocked: false };
};

/**
 * FR-A2: Post-LLM Output Validator
 * Blocks specific dosages & antibiotics
 */
const validateAiOutput = (text) => {
  const clean = text.toLowerCase();

  const dosagePattern = /\d+\s*(\.|,)?\d*\s*(mg|ml|gm|gram|liter|cc|iu)/i;
  const bannedMeds = [
    "amoxicillin", "ciprofloxacin",
    "azithromycin", "tamiflu",
    "oseltamivir", "diclofenac"
  ];

  if (dosagePattern.test(clean) || bannedMeds.some(m => clean.includes(m))) {
    return {
      safe: false,
      fallback:
        "I have identified the condition, but I am restricted from prescribing " +
        "specific chemical dosages or antibiotics to ensure safety.\n\n" +
        "✅ Please consult a Veterinarian or Krishi Kendra officer for exact treatment."
    };
  }

  return { safe: true };
};

// ------------------------------------------------------------------
// MAIN AI GENERATOR
// ------------------------------------------------------------------

const generateAiResponse = async (
  userPrompt,
  context = "",
  history = "",
  turnCount = 0
) => {

  // 1️⃣ PRE-COMPUTATION SAFETY GATE
  const riskCheck = preCheckRisk(userPrompt);
  if (riskCheck.blocked) {
    console.log(`🛡️ [Safety Gate] ${riskCheck.reason}`);
    return riskCheck.safeResponse;
  }

  // 2️⃣ Crisis detection (persona shaping)
  const crisisKeywords = [
    "ruin", "died", "suicide",
    "debt", "emergency",
    "loss", "failed", "destroy"
  ];
  const isCrisis = crisisKeywords.some(w =>
    userPrompt.toLowerCase().includes(w)
  );

  // 3️⃣ Build system persona
  const systemInstruction = buildSystemPrompt(
    context,
    isCrisis,
    history,
    turnCount
  );

  const finalPrompt =
    `${systemInstruction}\n\n` +
    `User: ${userPrompt}\n` +
    `Assistant:`;

  console.log(`🤖 AI Request: "${userPrompt}" [Turn ${turnCount}]`);

  try {
    // 4️⃣ IBM WatsonX – CORRECTED CALL
    // We use .generateText() on the initialized service instance
    const response = await watsonxAiService.generateText({
      modelId: "ibm/granite-3-8b-instruct",
      projectId: process.env.WATSONX_AI_PROJECT_ID,
      input: finalPrompt,
      parameters: {
        decoding_method: 'greedy',
        temperature: 0.1,
        max_new_tokens: 900
      }
    });

    // 5️⃣ Extract text safely
    const text = response?.result?.results?.[0]?.generated_text?.trim();

    if (!text) {
      throw new Error("Empty response from WatsonX");
    }

    // 6️⃣ POST-COMPUTATION SAFETY VALIDATOR
    const validation = validateAiOutput(text);
    if (!validation.safe) {
      console.warn("⚠️ [Safety Validator] Output blocked");
      return validation.fallback;
    }

    return text;

  } catch (error) {
    console.error("🔴 [AI Service Error]:", error.message);
    if (error.body) console.error("Details:", error.body); 
    return "Namaste. I am temporarily unable to access the agricultural knowledge system. Please try again shortly.";
  }
};

module.exports = { generateAiResponse };
