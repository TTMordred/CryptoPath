import { GoogleGenerativeAI } from "@google/generative-ai";
import { projectInfo, faqQuestions, reportSummary } from "./project-knowledge";
import { getRelevantReportSections } from "./pdf-extraction";

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
  role: "user" | "model" | "system";
  content: string;
};

// System prompt that provides context about the project
const systemPrompt = `
You are the AI assistant for CryptoPath, a comprehensive blockchain explorer and visualization tool. 
Your role is to help users understand the platform's features and capabilities.

Here is key information about CryptoPath:
- Name: ${projectInfo.name}
- Description: ${projectInfo.description}
- Main features: Blockchain Explorer, Portfolio Tracker, NFT Marketplace, Transaction Visualizer
- Supported blockchain networks: Ethereum, Polygon, Solana, Avalanche

When answering questions:
1. Focus on providing accurate information about CryptoPath's features and functionality
2. Be helpful and concise in your explanations
3. If asked about technical details, provide clear explanations without unnecessary jargon
4. If you don't know something specific about CryptoPath, acknowledge this and provide general information
5. Always maintain a professional but friendly tone
`;

export async function getChatResponse(messages: ChatMessage[]) {
  try {
    // Extract the user's query from the last message
    const userQuery = messages[messages.length - 1].content;
    
    // Get relevant information from our knowledge base
    let contextualInfo = "";
    
    // Check if the query matches any FAQ
    const matchingFaq = faqQuestions.find(faq => 
      userQuery.toLowerCase().includes(faq.question.toLowerCase().slice(0, 15)) || 
      faq.question.toLowerCase().includes(userQuery.toLowerCase())
    );
    
    if (matchingFaq) {
      contextualInfo = `FAQ Answer: ${matchingFaq.answer}\n\n`;
    }
    
    // Get relevant report sections based on the query
    try {
      const relevantReportContent = await getRelevantReportSections(userQuery);
      if (relevantReportContent && !relevantReportContent.includes('No specific information')) {
        contextualInfo += `Relevant Information from Project Report:\n${relevantReportContent}\n\n`;
      }
    } catch (error) {
      console.error('Error getting report sections:', error);
    }
    
    // Prepare feature-specific context based on the query
    const lowerQuery = userQuery.toLowerCase();
    
    if (lowerQuery.includes('blockchain') || lowerQuery.includes('explorer') || lowerQuery.includes('transaction')) {
      const feature = projectInfo.mainFeatures.find(f => f.name === "Blockchain Explorer");
      if (feature) {
        contextualInfo += `About ${feature.name}: ${feature.description}\nCapabilities: ${feature.capabilities.join(", ")}\n\n`;
      }
    }
    
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('track') || lowerQuery.includes('holdings')) {
      const feature = projectInfo.mainFeatures.find(f => f.name === "Portfolio Tracker");
      if (feature) {
        contextualInfo += `About ${feature.name}: ${feature.description}\nCapabilities: ${feature.capabilities.join(", ")}\n\n`;
      }
    }
    
    if (lowerQuery.includes('nft') || lowerQuery.includes('marketplace') || lowerQuery.includes('token')) {
      const feature = projectInfo.mainFeatures.find(f => f.name === "NFT Marketplace");
      if (feature) {
        contextualInfo += `About ${feature.name}: ${feature.description}\nCapabilities: ${feature.capabilities.join(", ")}\n\n`;
      }
    }
    
    if (lowerQuery.includes('visual') || lowerQuery.includes('graph') || lowerQuery.includes('chart')) {
      const feature = projectInfo.mainFeatures.find(f => f.name === "Transaction Visualizer");
      if (feature) {
        contextualInfo += `About ${feature.name}: ${feature.description}\nCapabilities: ${feature.capabilities.join(", ")}\n\n`;
      }
    }
    
    if (lowerQuery.includes('how to') || lowerQuery.includes('guide') || lowerQuery.includes('tutorial')) {
      contextualInfo += `User Guide:\n${JSON.stringify(projectInfo.userGuide, null, 2)}\n\n`;
    }
    
    // Create a proper conversation history for the API
    const preparedMessages = [];
    
    // First, include a proper user/model chat about the system context
    preparedMessages.push({
      role: "user",
      parts: [{ text: `Please act as the CryptoPath assistant with this context: ${systemPrompt}\n${contextualInfo}` }]
    });
    
    preparedMessages.push({
      role: "model", 
      parts: [{ text: "I'll help users understand CryptoPath's features and capabilities." }]
    });
    
    // Then add the actual conversation history
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      preparedMessages.push({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }

    // Start a new chat with the prepared history
    const chat = model.startChat({
      history: preparedMessages,
    });

    // Send the user's query
    const result = await chat.sendMessage(userQuery);
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
  "How do I use the NFT marketplace?",
  "Which blockchain networks are supported?",
  "How do I connect my wallet?",
  "Can you explain the transaction visualizer?"
];