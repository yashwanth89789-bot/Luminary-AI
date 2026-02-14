import { GoogleGenAI, Type } from "@google/genai";
import { HighlightCategory, ChatMessage } from "../types";

export interface AIAnalysisResult {
  highlights: {
    quote: string;
    category: HighlightCategory;
    explanation?: string;
  }[];
  summary: string;
}

export const analyzeTextWithGemini = async (text: string): Promise<AIAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analyze the following text.
    1. Write a concise, high-level summary (max 3 sentences) capturing the core essence.
    2. Extract the most significant segments and categorize them into:
       - IMPORTANT (Key insights, main ideas)
       - FACT (Statistics, specific data points, dates, definitions)
       - ACTION (Instructions, next steps, to-dos)
       - WARNING (Risks, caveats, critical alerts)

    Return a JSON object with 'summary' and 'highlights'.
    For highlights, ensure the 'quote' is exact from the text.
    
    Text to analyze:
    "${text}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            highlights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  category: { 
                    type: Type.STRING, 
                    enum: [
                      HighlightCategory.IMPORTANT, 
                      HighlightCategory.FACT, 
                      HighlightCategory.ACTION, 
                      HighlightCategory.WARNING
                    ] 
                  },
                  explanation: { type: Type.STRING }
                },
                required: ["quote", "category"]
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) return { summary: "", highlights: [] };
    
    return JSON.parse(resultText) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const chatWithDocument = async (
  documentText: string, 
  question: string, 
  history: ChatMessage[]
): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert chat history to a simplified format for context
  const context = history.slice(-6).map(msg => `${msg.role}: ${msg.text}`).join('\n');

  const prompt = `
    You are a helpful assistant analyzing a specific document.
    
    Document Text:
    """
    ${documentText}
    """

    Chat History:
    ${context}

    User Question: ${question}

    Answer the user's question based strictly on the provided document text. 
    Be concise and direct. If the answer is not in the text, say so.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text || "I couldn't generate a response.";
};