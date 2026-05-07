/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { Message } from "./types";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function callGemini(systemPrompt: string, conversationHistory: Message[]) {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please configure it in the Secrets panel.");
  }

  const contents = conversationHistory.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function callGeminiOnce(prompt: string) {
  return callGemini("You are a senior transformation consultant.", [
    { role: 'user', content: prompt }
  ]);
}
