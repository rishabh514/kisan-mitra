import { useState } from 'react';
import axios from 'axios';

const useWeather = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchWeather = async (city) => {
        setLoading(true);
        // Using the key you provided earlier
        const API_KEY = "695246069fd1c400c943822f09cb16b7"; 
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
            );
            setWeatherData(response.data);
            return response.data;
        } catch (error) {
            console.error("Weather fetch failed:", error);
            setWeatherData(null);
        } finally {
            setLoading(false);
        }
    };

    return { weatherData, fetchWeather, loading };
};

export default useWeather;