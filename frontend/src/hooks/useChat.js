import { useState, useRef } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Ref to persist sessionId across renders
    const sessionIdRef = useRef(null);

    const sendMessage = async (input, location, language) => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE}/api/chat`, {
                message: input,
                location: location,
                language: language,
                sessionId: sessionIdRef.current
            });

            // Persist sessionId returned by backend
            if (response.data.sessionId) {
                sessionIdRef.current = response.data.sessionId;
            }

            const botMessage = { sender: 'bot', text: response.data.reply };
            setMessages((prev) => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text: language === 'hi'
                        ? 'सर्वर से संपर्क नहीं हो पा रहा है।'
                        : 'Sorry, connection error.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return { messages, sendMessage, loading };
};

export default useChat;
