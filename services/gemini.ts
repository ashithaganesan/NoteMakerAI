
import { GoogleGenAI, Type } from "@google/genai";

export interface FileData {
  data: string; // base64
  mimeType: string;
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const prepareParts = (input: string | FileData, prompt: string) => {
  if (typeof input === 'string') {
    return { parts: [{ text: `${prompt}\n\nContent:\n${input}` }] };
  }
  return { 
    parts: [
      { text: prompt },
      { inlineData: { data: input.data, mimeType: input.mimeType } }
    ] 
  };
};

export const generateSummary = async (input: string | FileData) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prepareParts(input, "Create a comprehensive summary sheet of the main points in bullet points. Return as a JSON array of strings."),
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return JSON.parse(response.text);
};

export const generateFlashcards = async (input: string | FileData) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prepareParts(input, "Generate a minimum of 20 high-quality active recall flashcards based on this material. You must generate at least 20 cards. If the material is extensive, generate up to 50 flashcards. Focus on key concepts, definitions, and facts."),
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ["question", "answer"]
        }
      }
    }
  });
  return JSON.parse(response.text);
};

export const generateQuiz = async (input: string | FileData) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prepareParts(input, "Generate 10 conceptual MCQs based on this material with detailed explanations."),
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.OBJECT,
              properties: { A: { type: Type.STRING }, B: { type: Type.STRING }, C: { type: Type.STRING }, D: { type: Type.STRING } },
              required: ["A", "B", "C", "D"]
            },
            correct_answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correct_answer", "explanation"]
        }
      }
    }
  });
  return JSON.parse(response.text);
};
