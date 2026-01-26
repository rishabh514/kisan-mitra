const axios = require('axios');
require('dotenv').config();

const getWeather = async (city) => {
    if (!city) return null;
    const API_KEY = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        
        // FR-F1: Probabilistic Framing Logic
        let conditionText = data.weather[0].description;
        let riskAssessment = "Low Risk";
        
        if (conditionText.includes("rain") || conditionText.includes("storm")) {
            conditionText = "Possibility of Rain/Storm"; // Soften certainty
            riskAssessment = "High Risk for Spraying";
        }
        
        return {
            temp: data.main.temp,
            condition: conditionText,
            humidity: data.main.humidity,
            // FR-F2: Worst-case planning bias helper
            advisoryTag: riskAssessment
        };
    } catch (error) {
        console.error("Weather Service Error:", error.message);
        // Return null instead of throwing to allow chat to proceed without weather
        return null; 
    }
};

module.exports = { getWeather };