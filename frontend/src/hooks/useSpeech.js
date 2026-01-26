import { useState, useEffect, useRef, useCallback } from 'react';

const useSpeech = (language = 'en') => {
    // --- State ---
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    // --- Refs ---
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);
    const selectedVoiceRef = useRef(null);
    const speechTimeoutRef = useRef(null);

    // -----------------------------------------------------------
    // 1. VOICE SELECTION (Aggressive Native/Female Search)
    // -----------------------------------------------------------
    useEffect(() => {
        const initVoice = () => {
            const voices = synthRef.current.getVoices();
            if (!voices.length) return;

            let voice = null;
            if (language === 'hi') {
                voice = voices.find(v => v.lang.includes('hi') && v.name.includes('Google')) ||
                        voices.find(v => v.lang.includes('hi')) ||
                        voices.find(v => v.lang.includes('IN')); 
            } else {
                voice = voices.find(v => v.name.includes("Google US English")) ||
                        voices.find(v => v.name.includes("Microsoft Zira")) ||
                        voices.find(v => v.lang.includes('en-US'));
            }
            selectedVoiceRef.current = voice || voices[0];
        };

        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = initVoice;
        }
        initVoice();

        return () => {
            if (synthRef.current.speaking) synthRef.current.cancel();
            if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
        };
    }, [language]);

    // -----------------------------------------------------------
    // 2. MANUAL SPEECH RECOGNITION (Continuous Mode)
    // -----------------------------------------------------------
    const initRecognition = useCallback(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return null;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // CRITICAL: Continuous allows the user to speak for minutes without auto-stop
        recognition.continuous = true; 
        recognition.interimResults = true;
        recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

        return recognition;
    }, [language]);

    // We expose the raw recognition object logic to the component 
    // to handle the "Appending to Textbox" logic precisely.
    // However, this hook manages the *status* and *instance creation*.

    // -----------------------------------------------------------
    // 3. ROBUST TTS (Smart Chunking + Regex Fixes)
    // -----------------------------------------------------------
    const createSafeChunks = (text, maxLength = 160) => {
        // Split by "Major" pauses (Dots, Question marks, Hindi Danda, Newlines)
        const rawSegments = text.match(/[^.!?|。\n]+[.!?|。\n]+|[^.!?|。\n]+$/g) || [text];
        const safeChunks = [];
        let currentBuffer = "";

        for (const segment of rawSegments) {
            if ((currentBuffer + segment).length < maxLength) {
                currentBuffer += segment + " ";
            } else if (segment.length > maxLength) {
                // If segment is huge, force split by words
                if (currentBuffer.trim()) { safeChunks.push(currentBuffer.trim()); currentBuffer = ""; }
                
                const words = segment.split(' ');
                let tempChunk = "";
                for (const word of words) {
                    if ((tempChunk + " " + word).length < maxLength) {
                        tempChunk += (tempChunk ? " " : "") + word;
                    } else {
                        safeChunks.push(tempChunk);
                        tempChunk = word;
                    }
                }
                currentBuffer = tempChunk + " ";
            } else {
                if (currentBuffer.trim()) safeChunks.push(currentBuffer.trim());
                currentBuffer = segment + " ";
            }
        }
        if (currentBuffer.trim()) safeChunks.push(currentBuffer.trim());
        return safeChunks;
    };

    const speak = useCallback((text) => {
        if (!text) return;
        if (synthRef.current.speaking) synthRef.current.cancel();
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);

        // Sanitize
        const cleanText = text
            .replace(/[*#_]/g, '')
            .replace(/(\d)\.(\d)/g, '$1 point $2') // Fix "3.5"
            .replace(/\s+/g, ' ')
            .trim();

        const chunks = createSafeChunks(cleanText, 180); 
        let chunkIndex = 0;

        const playNextChunk = () => {
            if (chunkIndex >= chunks.length) {
                setIsSpeaking(false);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
            if (selectedVoiceRef.current) utterance.voice = selectedVoiceRef.current;
            utterance.rate = 1.0; 
            utterance.pitch = 1.0;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => {
                chunkIndex++;
                speechTimeoutRef.current = setTimeout(playNextChunk, 40); // 40ms buffer
            };
            utterance.onerror = () => {
                chunkIndex++;
                speechTimeoutRef.current = setTimeout(playNextChunk, 40);
            };

            synthRef.current.speak(utterance);
        };

        playNextChunk();
    }, []);

    const stopSpeaking = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return { 
        initRecognition, // Expose factory for component
        speak, 
        stopSpeaking, 
        isSpeaking 
    };
};

export default useSpeech;