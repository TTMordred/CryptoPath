import { GoogleGenerativeAI } from "@google/generative-ai";
import { projectInfo, faqQuestions, reportSummary, FAQ, MainFeature } from "./project-knowledge";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// Create a chat model instance with Gemini 1.5 Flash
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

// Get relevant FAQ answer if available
function getRelevantFAQ(query: string): string | null {
  const relevantFAQ = faqQuestions.find((faq: FAQ) => 
    query.toLowerCase().includes(faq.question.toLowerCase()) ||
    faq.question.toLowerCase().includes(query.toLowerCase())
  );
  return relevantFAQ?.answer || null;
}

// Get relevant feature information
function getRelevantFeature(query: string): string | null {
  const feature = projectInfo.mainFeatures.find((f: MainFeature) =>
    query.toLowerCase().includes(f.name.toLowerCase())
  );
  
  if (feature) {
    return `${feature.description}\n\nKey capabilities:\n${feature.capabilities.map((c: string) => `- ${c}`).join('\n')}`;
  }
  return null;
}

// System prompt that provides context about the project
const systemPrompt = `
You are the AI assistant for CryptoPath, a comprehensive blockchain explorer and visualization tool.
Your role is to help users understand the platform's features and capabilities.

Key information about CryptoPath:
- Name: ${projectInfo.name}
- Description: ${projectInfo.description}
- Main features: ${projectInfo.mainFeatures.map((f: MainFeature) => f.name).join(', ')}
- Supported networks: ${projectInfo.components.blockchain.supportedNetworks.join(', ')}

When answering:
1. Use markdown bold (**text**) for emphasis on key terms
2. Be specific about CryptoPath's actual features
3. If a feature isn't explicitly listed in our data, don't claim it exists
4. Provide clear, actionable information
5. Keep responses focused and relevant
`;

export async function getChatResponse(messages: ChatMessage[]) {
  try {
    const userQuery = messages[messages.length - 1].content;
    
    // Get relevant context for the user's query
    const contextualInfo = [];
    
    // Check FAQs
    const faqAnswer = getRelevantFAQ(userQuery);
    if (faqAnswer) contextualInfo.push(faqAnswer);
    
    // Check features
    const featureInfo = getRelevantFeature(userQuery);
    if (featureInfo) contextualInfo.push(featureInfo);

    // Initialize chat with system prompt and context
    const chat = model.startChat({
      history: [
        // System prompt
        {
          role: "user",
          parts: [{ text: "Please use this context for our conversation:" }]
        },
        {
          role: "model",
          parts: [{ text: systemPrompt }]
        },
        // Relevant context if any
        ...(contextualInfo.length > 0 ? [
          {
            role: "user",
            parts: [{ text: "Here is relevant information for this query:" }]
          },
          {
            role: "model",
            parts: [{ text: contextualInfo.join('\n\n') }]
          }
        ] : []),
        // Previous conversation history
        ...messages.slice(0, -1).map(msg => ({
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.content }],
        }))
      ],
    });

    const result = await chat.sendMessage(userQuery);
    const response = await result.response;
    let text = response.text();
    
    // Ensure proper markdown formatting
    text = text.replace(/\*([^*]+)\*/g, '**$1**');
    
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