
import { GoogleGenAI, Chat, Type, Schema, Content } from "@google/genai";
import { SYSTEM_INSTRUCTION, EXERCISE_SYSTEM_INSTRUCTION } from "../constants";
import { LessonResponse, UserProfile, ExerciseResponse, ExerciseEvaluation } from "../types";

// Initialize GenAI with the API key from process.env.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for structured JSON output (Chat)
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING, description: "Your natural English reply" },
    voice_script: { type: Type.STRING, description: "Clean text for TTS" },
    correction: { type: Type.STRING, nullable: true, description: "Correction if user made a mistake, else empty" },
    pronunciation_analysis: { type: Type.STRING, nullable: true, description: "Feedback on potential pronunciation/grammar errors" },
    next_question: { type: Type.STRING, description: "The next question or new topic starter" },
  },
  required: ["reply", "voice_script", "next_question"],
};

// Schema for Exercise Generation
const exerciseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        exercise: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                topic: { type: Type.STRING },
                instruction: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                answer_key: { type: Type.STRING },
                example: { type: Type.STRING, nullable: true }
            },
            required: ["type", "difficulty", "topic", "instruction", "question", "answer_key"]
        }
    }
};

// Schema for Exercise Evaluation
const evaluationSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: { type: Type.BOOLEAN },
        explanation: { type: Type.STRING }
    },
    required: ["isCorrect", "explanation"]
};

let chatSession: Chat | null = null;

// --- CONVERSATION FUNCTIONS ---

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

    // Dynamic Initial Prompt based on Topic
    let promptAction = "";
    if (topic.includes("Free Talk") || topic.includes("Daily Life")) {
        promptAction = "Action: Start by proactively asking about the user's day, their mood, or a random fun topic (like Food, Hobbies, or Work). Be spontaneous! Do not be formal.";
    } else {
        promptAction = `Action: Start with a VERY SHORT, natural greeting (max 1 sentence). Then immediately ask the first question about the specific topic: ${topic}.`;
    }

    const initialMessage = `
      START CONVERSATION.
      User Level: ${user.level}
      Target Topic: ${topic}
      
      ${promptAction}
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
    return await chatSession.getHistory();
};

// --- EXERCISE FUNCTIONS ---

export const generateExercise = async (level: string, topic: string): Promise<ExerciseResponse> => {
    try {
        // We don't use chat history for exercises, each is fresh
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: EXERCISE_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: exerciseSchema,
                temperature: 0.9 // High temperature for variety
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `Generate a unique English exercise. Level: ${level}. Topic: ${topic}. Randomize the type.` }]
                }
            ]
        });

        const text = result.text;
        if (!text) throw new Error("No exercise generated");
        return JSON.parse(text) as ExerciseResponse;
    } catch (error) {
        console.error("Exercise generation error:", error);
        throw error;
    }
};

export const evaluateExercise = async (question: string, userAnswer: string, correctAnswer: string): Promise<ExerciseEvaluation> => {
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                responseMimeType: "application/json",
                responseSchema: evaluationSchema
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `
                        Task: Evaluate the student's answer.
                        Question: "${question}"
                        Correct Answer/Key: "${correctAnswer}"
                        Student Answer: "${userAnswer}"

                        Rules:
                        - If the exercise is Multiple Choice, the student answer must match the key option.
                        - If open-ended (rewrite, describe), check if the meaning and grammar are correct even if it doesn't match the key exactly.
                        - Provide a short explanation.
                    `}]
                }
            ]
        });
        
        const text = result.text;
        if(!text) throw new Error("Evaluation failed");
        return JSON.parse(text) as ExerciseEvaluation;
    } catch (error) {
        console.error("Evaluation error", error);
        // Fallback simple check
        return {
            isCorrect: userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim(),
            explanation: "Automatic fallback check."
        };
    }
};
