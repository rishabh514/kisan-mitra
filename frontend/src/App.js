import React, { useState } from 'react';
import ChatWindow from './components/Chat/ChatWindow';
import Navbar from './components/Layout/Navbar';
import './App.css'; 

function App() {
  // State for Language ('en' or 'hi')
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <div className="app-container">
      <Navbar language={language} toggleLanguage={toggleLanguage} />
      
      <main>
         {/* Pass language down to ChatWindow */}
         <ChatWindow language={language} />
      </main>
    </div>
  );
}

export default App;