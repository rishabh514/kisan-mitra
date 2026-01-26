import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import useVoice from '../../hooks/useVoice';
import { Mic, MicOff, Send } from 'lucide-react';

const ChatInput = ({ onSendMessage, disabled, language }) => {
    const [text, setText] = useState('');
    
    // Pass the 'language' prop to the hook!
    const { isListening, transcript, startListening, setTranscript } = useVoice(language);

    // When voice input finishes, update the text box
    useEffect(() => {
        if (transcript) {
            setText(transcript);
            setTranscript('');
        }
    }, [transcript, setTranscript]);

    const handleSend = () => {
        if (text.trim() && !disabled) {
            onSendMessage(text);
            setText('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Text labels based on language
    const placeholders = {
        en: isListening ? "Listening..." : "Ask about crops, pests, or weather...",
        hi: isListening ? "सुन रहा हूँ..." : "फसलों, कीटों या मौसम के बारे में पूछें..."
    };

    const buttonLabels = {
        en: "Send",
        hi: "भेजें"
    };

    return (
        <div style={{
            display: 'flex',
            gap: '10px',
            padding: '15px',
            borderTop: '1px solid #eee',
            backgroundColor: 'white',
            alignItems: 'center',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px'
        }}>
            {/* Microphone Button */}
            <button
                onClick={startListening}
                disabled={disabled || isListening}
                title={language === 'hi' ? "बोलें" : "Speak"}
                style={{
                    background: isListening ? '#ff4444' : '#f0f0f0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isListening ? 'default' : 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: isListening ? '0 0 8px rgba(255,0,0,0.4)' : 'none'
                }}
            >
                {isListening ? <MicOff color="white" size={20} /> : <Mic color="#555" size={20} />}
            </button>

            {/* Text Input */}
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                placeholder={placeholders[language] || placeholders.en}
                style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '30px',
                    border: '1px solid #ccc',
                    outline: 'none',
                    fontSize: '1rem',
                    backgroundColor: disabled ? '#f9f9f9' : 'white'
                }}
            />

            {/* Send Button */}
            <Button onClick={handleSend} disabled={disabled || !text.trim()}>
                <Send size={18} style={{ marginRight: '5px' }} /> 
                {buttonLabels[language] || buttonLabels.en}
            </Button>
        </div>
    );
};

export default ChatInput;