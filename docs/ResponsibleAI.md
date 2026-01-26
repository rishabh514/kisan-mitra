# Responsible AI Considerations

## 1. Fairness
The Agro-Resilience Agent is designed to provide unbiased advice regardless of the farmer's location or farm size. We strictly use verified agricultural data (FAO, Government of India) to prevent hallucinated advice that could harm crops.

## 2. Transparency
- **AI Identity:** The bot clearly identifies itself as an AI assistant, not a human expert.
- **Data Source:** When providing weather advice, the system cites OpenWeatherMap.
- **Limitations:** Users are informed that AI advice should be verified with local authorities for critical decisions.

## 3. Privacy
- No personally identifiable information (PII) such as phone numbers or addresses is stored.
- Location data is processed only transiently to fetch weather API data.