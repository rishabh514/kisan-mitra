import { useState, useEffect, useRef } from 'react';

const useVoice = (language = 'en') => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check browser support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Stop after one sentence
            recognitionRef.current.interimResults = false;

            // DYNAMIC LANGUAGE SWITCHING
            // 'hi-IN' = Hindi (India), 'en-IN' = English (India)
            recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

            recognitionRef.current.onresult = (event) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Voice Error:", event.error);
                if (event.error === 'not-allowed') {
                    alert("Please allow microphone access.");
                }
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [language]); // Critical: Re-run this effect when 'language' changes

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            try {
                setTranscript(''); // Clear previous text
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error("Mic start error:", error);
            }
        } else if (!recognitionRef.current) {
            alert("Voice input is not supported in this browser. Please use Chrome.");
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    return { isListening, transcript, startListening, stopListening, setTranscript };
};

export default useVoice;