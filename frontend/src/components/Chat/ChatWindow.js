import React, { useState, useEffect, useRef } from 'react';
import useChat from '../../hooks/useChat';
import useSpeech from '../../hooks/useSpeech';
import Message from './Message'; 
import { 
    Mic, MicOff, Send, Globe, 
    Plus, Camera, Image as ImageIcon, X 
} from 'lucide-react'; // Ensure 'lucide-react' is installed
import Spinner from '../UI/Spinner';

const ChatWindow = ({ language }) => {
    // Hooks
    const { messages, sendMessage, loading: chatLoading } = useChat();
    const { initRecognition, speak, stopSpeaking } = useSpeech(language);
    
    // State
    const [input, setInput] = useState('');
    const [location, setLocation] = useState('Delhi');
    const [isMicActive, setIsMicActive] = useState(false);
    
    // UI State for Attachments
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); // Preview URL
    const [base64Image, setBase64Image] = useState(null);   // Data for API
    const [isUploading, setIsUploading] = useState(false);
    
    // Local messages to show immediate UI updates
    const [localMessages, setLocalMessages] = useState([]);

    // Refs
    const messagesEndRef = useRef(null);
    const recognitionInstance = useRef(null);
    const textBeforeMic = useRef(''); 
    const galleryInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const menuRef = useRef(null); // To detect clicks outside menu

    // Combine messages
    const displayMessages = [...messages, ...localMessages];

    // --- EFFECTS ---

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [displayMessages]);

    // Auto-speak bot messages
    useEffect(() => {
        if (displayMessages.length > 0) {
            const lastMsg = displayMessages[displayMessages.length - 1];
            if (lastMsg.sender === 'bot' && !lastMsg.spoken) {
                speak(lastMsg.text);
                lastMsg.spoken = true;
            }
        }
    }, [displayMessages.length, speak]);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowAttachMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- HANDLERS ---

    // 1. Image Selection Handler
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create Preview URL
            const previewUrl = URL.createObjectURL(file);
            setSelectedImage(previewUrl);

            // Convert to Base64 for API
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the "data:image/jpeg;base64," part
                const rawBase64 = reader.result.split(',')[1];
                setBase64Image(rawBase64);
            };
            
            // Close menu
            setShowAttachMenu(false);
        }
    };

    const clearAttachment = () => {
        setSelectedImage(null);
        setBase64Image(null);
        if (galleryInputRef.current) galleryInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    };

    // 2. Unified Send Handler
    const handleSend = async () => {
        if ((!input.trim() && !base64Image) || isUploading) return;
        
        // Stop Mic
        if (isMicActive && recognitionInstance.current) {
            recognitionInstance.current.stop();
            setIsMicActive(false);
        }
        stopSpeaking();

        // CASE A: Text + Image (Vision API)
        if (base64Image) {
            setIsUploading(true);
            try {
                // Show user message immediately
                const userMsg = { 
                    sender: 'user', 
                    text: input || (language === 'hi' ? 'छवि विश्लेषण' : 'Analyze this image'),
                    image: selectedImage // Store preview to maybe show in chat (optional)
                };
                setLocalMessages(prev => [...prev, userMsg]);
                
                // Clear input immediately for UX
                const payloadInput = input;
                setInput('');
                clearAttachment();

                // API Call
                const response = await fetch('http://localhost:5000/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: base64Image,
                        message: payloadInput,
                        language: language,
                        sessionId: localStorage.getItem('chatSessionId')
                    })
                });

                const data = await response.json();
                
                // Add bot response
                setLocalMessages(prev => [...prev, { 
                    sender: 'bot', 
                    text: data.reply,
                    spoken: false
                }]);

            } catch (error) {
                console.error("Vision Error", error);
                setLocalMessages(prev => [...prev, { 
                    sender: 'bot', 
                    text: "Error analyzing image. Please try again." 
                }]);
            } finally {
                setIsUploading(false);
            }
        } 
        // CASE B: Text Only (Standard Chat API)
        else {
            sendMessage(input, location, language);
            setInput('');
        }
    };

    // 3. Mic Handler
    const toggleMic = () => {
        if (isMicActive) {
            if (recognitionInstance.current) recognitionInstance.current.stop();
            setIsMicActive(false);
        } else {
            const recognition = initRecognition();
            if (!recognition) return alert("Browser not supported");

            textBeforeMic.current = input; 
            recognition.onstart = () => setIsMicActive(true);
            recognition.onend = () => setIsMicActive(false);
            recognition.onresult = (event) => {
                let interim = '';
                let final = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) final += event.results[i][0].transcript;
                    else interim += event.results[i][0].transcript;
                }
                setInput(textBeforeMic.current + final + interim);
            };
            recognition.start();
            recognitionInstance.current = recognition;
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isLoading = chatLoading || isUploading;

    return (
        <div className="chat-layout">
            {/* Hidden Inputs */}
            <input 
                type="file" 
                accept="image/*" 
                ref={galleryInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileSelect} 
            />
            <input 
                type="file" 
                accept="image/*" 
                capture="environment" // Forces Camera on Mobile
                ref={cameraInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileSelect} 
            />

            {/* --- MESSAGES AREA --- */}
            <div className="messages-area">
                {displayMessages.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '20vh', opacity: 0.6 }}>
                        <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌾</h2>
                        <h3 style={{ color: '#4caf50' }}>Agro-Resilience Agent</h3>
                        <p>{language === 'hi' ? 'मैं आपकी कैसे सहायता कर सकता हूँ?' : 'Ready to assist with crops & climate.'}</p>
                    </div>
                )}

                {displayMessages.map((msg, index) => (
                    <div key={index}>
                        {/* If message had an image, show thumbnail bubble first */}
                        {msg.image && (
                            <div className="msg-row user" style={{ justifyContent: 'flex-end', marginBottom: '5px' }}>
                                <img src={msg.image} alt="User upload" style={{ width: '150px', borderRadius: '12px', border: '2px solid #2e7d32' }} />
                            </div>
                        )}
                        <Message sender={msg.sender} text={msg.text} onSpeak={speak} />
                    </div>
                ))}

                {isLoading && (
                    <div className="msg-row bot">
                        <span className="sender-label">System</span>
                        <div className="msg-bubble" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <Spinner />
                            <span>{isUploading ? 'Analyzing Visuals...' : 'Thinking...'}</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT WORKSPACE (Gemini Style) --- */}
            <div className="workspace-container">
                
                {/* 1. Image Preview Section (Appears above input if image selected) */}
                {selectedImage && (
                    <div style={{ 
                        padding: '10px 15px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        backgroundColor: '#f0f4f8',
                        borderTop: '1px solid #e1e4e8'
                    }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img 
                                src={selectedImage} 
                                alt="Preview" 
                                style={{ height: '60px', borderRadius: '8px', border: '1px solid #ddd' }} 
                            />
                            <button 
                                onClick={clearAttachment}
                                style={{
                                    position: 'absolute', top: '-8px', right: '-8px',
                                    background: '#cf222e', color: 'white',
                                    border: 'none', borderRadius: '50%',
                                    width: '20px', height: '20px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                        <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: '#57606a' }}>
                            {language === 'hi' ? 'छवि संलग्न' : 'Image attached'}
                        </span>
                    </div>
                )}

                {/* 2. Main Input Bar */}
                <div className="input-row" style={{ position: 'relative' }}>
                    
                    {/* Attach Menu Popup */}
                    {showAttachMenu && (
                        <div ref={menuRef} style={{
                            position: 'absolute',
                            bottom: '60px',
                            left: '10px',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            borderRadius: '12px',
                            padding: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            zIndex: 100,
                            minWidth: '150px'
                        }}>
                            <button 
                                onClick={() => cameraInputRef.current.click()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px', border: 'none', background: 'transparent',
                                    cursor: 'pointer', textAlign: 'left', borderRadius: '8px',
                                    hover: { backgroundColor: '#f3f4f6' }
                                }}
                            >
                                <Camera size={18} color="#2e7d32" />
                                <span>{language === 'hi' ? 'कैमरा' : 'Camera'}</span>
                            </button>
                            <button 
                                onClick={() => galleryInputRef.current.click()}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px', border: 'none', background: 'transparent',
                                    cursor: 'pointer', textAlign: 'left', borderRadius: '8px'
                                }}
                            >
                                <ImageIcon size={18} color="#1976d2" />
                                <span>{language === 'hi' ? 'गैलरी' : 'Upload Image'}</span>
                            </button>
                        </div>
                    )}

                    {/* Plus / Attach Button */}
                    <button 
                        className="mic-btn"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        title="Attach"
                        disabled={isLoading}
                        style={{ backgroundColor: showAttachMenu ? '#e0e0e0' : 'transparent' }}
                    >
                        <Plus size={24} color="#57606a" />
                    </button>

                    <textarea
                        className="response-area"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={
                            isMicActive 
                                ? (language === 'hi' ? "सुन रहा हूँ..." : "Listening...") 
                                : (language === 'hi' ? "फसल या बीमारी के बारे में पूछें..." : "Ask about crops or upload photo...")
                        }
                        disabled={isLoading}
                        rows={1}
                        style={{ resize: 'none', padding: '12px' }}
                    />

                    {/* Mic Button */}
                    <button 
                        className={`mic-btn ${isMicActive ? 'active' : ''}`}
                        onClick={toggleMic}
                        disabled={isLoading}
                    >
                        {isMicActive ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>

                    {/* Send Button */}
                    <button 
                        className="send-btn" 
                        onClick={handleSend} 
                        disabled={isLoading || (!input.trim() && !base64Image)}
                    >
                        <Send size={22} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;