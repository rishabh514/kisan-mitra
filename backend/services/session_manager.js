/**
 * 🧠 SESSION MANAGER (Stateful Memory & Risk Flags)
 * Tracks conversation history, Diagnostic Phase, and Safety Flags.
 */

const sessions = {};
const MAX_HISTORY_TURNS = 12;

/**
 * Creates or retrieves an existing session.
 * @param {string} sessionId - Unique ID from frontend (or null to create new)
 */
const getSession = (sessionId) => {
    if (!sessionId || !sessions[sessionId]) {
        const newId = sessionId || Date.now().toString();
        sessions[newId] = {
            id: newId,
            history: [],
            turnCount: 0,
            // FR-D1: Session Risk Flags
            flags: {
                animalCase: false,
                chemicalRisk: false,
                financialDistress: false,
                waterStress: false
            },
            createdAt: Date.now(),
            lastActive: Date.now()
        };
        return sessions[newId];
    }
    
    sessions[sessionId].lastActive = Date.now();
    return sessions[sessionId];
};

/**
 * Scans input text to update risk flags for the session
 */
const updateFlags = (session, text) => {
    const t = text.toLowerCase();
    
    if (t.includes('cow') || t.includes('buffalo') || t.includes('goat') || t.includes('sheep')) {
        session.flags.animalCase = true;
    }
    if (t.includes('pesticide') || t.includes('spray') || t.includes('chemical') || t.includes('poison')) {
        session.flags.chemicalRisk = true;
    }
    if (t.includes('loan') || t.includes('debt') || t.includes('money') || t.includes('bank')) {
        session.flags.financialDistress = true;
    }
    if (t.includes('dry') || t.includes('wilt') || t.includes('water') || t.includes('rain')) {
        session.flags.waterStress = true;
    }
};

/**
 * Adds a conversation turn to the session history.
 */
const addTurn = (sessionId, userMessage, botResponse) => {
    const session = getSession(sessionId);
    
    // Update Flags based on latest User Message
    updateFlags(session, userMessage);

    // FR-D3: Decision Locking Logic (Implicit via history)
    // If chemicalRisk is already true, we don't turn it off. 
    // The history retains the context of the risk.

    session.history.push({ role: 'user', content: userMessage });
    session.history.push({ role: 'assistant', content: botResponse });
    
    session.turnCount += 1;

    if (session.history.length > MAX_HISTORY_TURNS * 2) {
        session.history = session.history.slice(-(MAX_HISTORY_TURNS * 2));
    }
};

const getFormattedHistory = (sessionId) => {
    const session = getSession(sessionId);
    if (!session.history.length) return "";
    
    // Inject flag summary into history for the LLM to see context
    const flagSummary = `[Active Risks: ${Object.keys(session.flags).filter(k => session.flags[k]).join(', ')}]`;

    return `${flagSummary}\n` + session.history
        .map(msg => `${msg.role === 'user' ? 'Farmer' : 'Kisan Mitra'}: ${msg.content}`)
        .join("\n");
};

const getTurnCount = (sessionId) => {
    return sessions[sessionId]?.turnCount || 0;
};

// Cleanup routine: Remove sessions older than 1 hour
setInterval(() => {
    const now = Date.now();
    Object.keys(sessions).forEach(key => {
        if (now - sessions[key].lastActive > 3600000) delete sessions[key];
    });
}, 3600000);

module.exports = { getSession, addTurn, getFormattedHistory, getTurnCount };