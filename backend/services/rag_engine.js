const fs = require('fs');
const path = require('path');

const RAG_DB_PATH = path.join(__dirname, '../rag_database');

let globalKnowledgeBase = [];
let isDbLoaded = false;

const loadKnowledgeBase = () => {
    if (isDbLoaded) return;
    
    try {
        if (!fs.existsSync(RAG_DB_PATH)) {
            console.warn("⚠️ RAG Database folder not found.");
            return;
        }

        const findJsonlFiles = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            let files = [];
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) files = files.concat(findJsonlFiles(fullPath));
                else if (entry.name.endsWith('.jsonl')) files.push(fullPath);
            }
            return files;
        };

        const files = findJsonlFiles(RAG_DB_PATH);
        globalKnowledgeBase = [];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const chunk = JSON.parse(line);
                        
                        // FR-C1: Trust Weighting & Content Extraction
                        const textContent = chunk.text || chunk.content || chunk.body;
                        const cropTag = chunk.crop || 'general';
                        
                        // Default trust is medium. We can adjust this logic if we have source metadata.
                        // For now, all file-based RAG is considered "Reference" not "Authority".
                        const trustLevel = 'medium'; 

                        if (textContent) {
                            globalKnowledgeBase.push({
                                c: textContent, 
                                k: cropTag.toString().toLowerCase(),
                                s: chunk.document || 'unknown',
                                t: trustLevel
                            });
                        }
                    } catch (e) { }
                }
            }
        }
        isDbLoaded = true;
        console.log(`✅ Knowledge Base Loaded: ${globalKnowledgeBase.length} chunks.`);
    } catch (err) {
        console.error("RAG Load Error:", err.message);
    }
};

const getLocalContext = async (query) => {
    if (!isDbLoaded) loadKnowledgeBase();
    if (globalKnowledgeBase.length === 0) return null;

    const queryLower = query.toLowerCase();
    const queryTokens = queryLower.split(' ').filter(w => w.length > 3);

    const relevantChunks = [];
    
    for (const chunk of globalKnowledgeBase) {
        let score = 0;
        const contentLower = chunk.c.toLowerCase();

        if (chunk.k && queryLower.includes(chunk.k)) score += 30;

        let keywordMatches = 0;
        for (const token of queryTokens) {
            if (contentLower.includes(token)) {
                score += 5;
                keywordMatches++;
            }
        }
        if (keywordMatches > 1) score += 5;

        if (score > 10) {
            relevantChunks.push({ content: chunk.c, score, source: chunk.s });
        }
    }

    const topChunks = relevantChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    if (topChunks.length === 0) return null;

    // FR-C3: RAG as Reference with Explicit Warning
    return topChunks.map(chunk => 
        `[SOURCE: ${chunk.source}] (TRUST: MEDIUM - DO NOT PRESCRIBE DOSAGES FROM THIS)\n${chunk.content}`
    ).join("\n\n");
};

module.exports = { getLocalContext };