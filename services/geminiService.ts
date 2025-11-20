
import { GoogleGenAI, Chat, Type, Schema, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { LessonResponse, UserProfile } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

// Schema for structured JSON output
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING, description: "Your natural English reply" },
    voice_script: { type: Type.STRING, description: "Clean text for TTS" },
    correction: { type: Type.STRING, nullable: true, description: "Correction if user made a mistake, else empty" },
    next_question: { type: Type.STRING, description: "The next question to keep conversation going" },
  },
  required: ["reply", "voice_script", "next_question"],
};

let chatSession: Chat | null = null;

export const startLessonSession = async (user: UserProfile, topic: string): Promise<LessonResponse> => {
  try {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    // Initial prompt to start the conversation context
    const initialMessage = `
      START CONVERSATION.
      User Level: ${user.level}
      Topic: ${topic}
      
      Action: Start with a VERY SHORT, natural greeting (max 1 sentence). Then immediately ask the first question about the topic.
    `;

    const result = await chatSession.sendMessage({ message: initialMessage });
    const text = result.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as LessonResponse;

  } catch (error) {
    console.error("Error starting lesson:", error);
    throw error;
  }
};

// Resume a session with existing history
export const resumeLessonSession = async (history: Content[]): Promise<void> => {
    try {
        chatSession = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              responseSchema: responseSchema,
            },
            history: history
        });
    } catch (error) {
        console.error("Error resuming lesson:", error);
        throw error;
    }
};

export const submitUserAudioText = async (userText: string): Promise<LessonResponse> => {
  if (!chatSession) {
    throw new Error("Session not started");
  }

  try {
    const message = `User said: "${userText}"`;
    const result = await chatSession.sendMessage({ message });
    const text = result.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as LessonResponse;
  } catch (error) {
    console.error("Error submitting text:", error);
    throw error;
  }
};

// Helper to get current history for saving state
export const getChatHistory = async (): Promise<Content[]> => {
    if (!chatSession) return [];
    // The SDK doesn't expose a direct synchronous getter for history in the interface 
    // but we can assume the chat object maintains it. 
    // However, the Google GenAI SDK `Chat` object usually has a `getHistory()` method.
    return await chatSession.getHistory();
};
