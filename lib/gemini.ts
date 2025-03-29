import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Create a chat model instance with Gemini 1.5 Flash (more accessible model)
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    maxOutputTokens: 1000,
  }
});

export type ChatMessage = {
  role: "user" | "model";
  content: string;
};

export async function getChatResponse(messages: ChatMessage[]) {
  try {
    const chat = model.startChat({
      history: messages.slice(0, -1).map(msg => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(messages[messages.length - 1].content);
    const response = await result.response;
    let text = response.text();
    
    // Replace asterisk bold with markdown bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '**$1**');
    
    return text;
  } catch (error) {
    console.error('Error in getChatResponse:', error);
    return "I apologize, but I encountered an error. Please try again.";
  }
}

export const suggestedQuestions = [
  "What is CryptoPath?",
  "How can I explore blockchain transactions?",
  "What features does the portfolio tracking have?",
  "How do I use the NFT marketplace?"
];