import { useState, useRef } from 'react';
import axios from 'axios';

const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // NEW: Ref to persist sessionId across renders without triggering re-renders
    const sessionIdRef = useRef(null);

    const sendMessage = async (input, location, language) => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', text: input };
        setMessages((prev) => [...prev, userMessage]);
        
        setLoading(true);

        try {
            // POST request now includes sessionId
            const response = await axios.post('http://localhost:5000/api/chat', {
                message: input,
                location: location,
                language: language,
                sessionId: sessionIdRef.current // Send existing ID if we have one
            });

            // Save the Session ID returned by the backend (for the first turn)
            if (response.data.sessionId) {
                sessionIdRef.current = response.data.sessionId;
            }

            const botMessage = { sender: 'bot', text: response.data.reply };
            setMessages((prev) => [...prev, botMessage]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [...prev, { 
                sender: 'bot', 
                text: language === 'hi' ? 'सर्वर से संपर्क नहीं हो पा रहा है।' : 'Sorry, connection error.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return { messages, sendMessage, loading };
};

export default useChat;