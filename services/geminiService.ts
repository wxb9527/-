
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIResponse = async (userMessage: string, history: { role: string, parts: { text: string }[] }[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: `你是一个温柔、耐心的大学心理咨询助手。你的目标是倾听学生的问题，提供情感支持，并根据需要引导他们寻求专业线下咨询。
        如果学生表现出严重的自残或自杀倾向（危机状态），请务必通过文字提醒他们拨打系统内置的紧急联系电话。
        你的回复应该简洁、富有同情心，避免说教。`,
        temperature: 0.7,
        topP: 0.8,
      },
    });

    return response.text || "对不起，我现在无法回应，请尝试联系我们的在线老师。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "系统繁忙，请稍后再试或直接拨打紧急求助电话。";
  }
};
