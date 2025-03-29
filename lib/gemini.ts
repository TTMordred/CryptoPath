import { GoogleGenerativeAI } from "@google/generative-ai";
import { projectInfo, faqQuestions, reportSummary, type MainFeature } from "./project-knowledge";

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

// Get relevant feature information
function getRelevantFeatures(query: string): MainFeature[] {
  const normalizedQuery = query.toLowerCase();
  return projectInfo.mainFeatures.filter(feature => 
    normalizedQuery.includes(feature.name.toLowerCase()) ||
    feature.capabilities.some(cap => normalizedQuery.includes(cap.toLowerCase()))
  );
}

// Format all core features
function getAllCoreFeatures(): string {
  const features = projectInfo.mainFeatures;
  return `Here are our exciting core features:

🔍 **Search & Blockchain Explorer**
- Multi-chain transaction search and analysis
- Interactive graph visualization of transactions
- Smart contract verification and interaction
- Advanced filtering and analytics

📊 **Market Overview & TopTokens**
- Real-time cryptocurrency market data and trends
- Global market metrics with caps and volumes
- Fear & Greed Index with sentiment analysis
- Customizable watchlists and price alerts

💼 **Portfolio Tracker**
- Multi-wallet and multi-chain asset tracking
- Performance analytics with historical charts
- Transaction history with gas analysis
- Asset allocation visualization

🖼️ **NFT Marketplace**
- Trade NFTs across multiple chains
- Collection exploration with metadata filtering
- Floor price tracking and analytics
- Seamless wallet integration

💧 **Faucet**
- Get free PATH tokens on BSC Testnet
- Test features without real funds
- Automated network switching
- Balance monitoring

💱 **Token Swap**
- Cross-chain token exchange
- Real-time price impact calculation
- Customizable slippage settings
- Complete transaction history

🥩 **Staking**
- Multiple staking pools with various APY rates
- Flexible and locked staking periods
- Auto-compounding rewards
- Detailed staking analytics

🎮 **Click2Earn Game**
- Earn PATH tokens through gameplay
- Strategic progression system
- Competitive leaderboards
- Direct wallet rewards`;
}

// Get feature list based on query
function getFeatureList(query: string): string {
  if (query.match(/how many|number of|list of|what|feature|main/i)) {
    return getAllCoreFeatures();
  }
  return '';
}

// Format features for display
function formatFeatures(features: MainFeature[]): string {
  return features.map(f => `**${f.name}**:\n${f.description}\n\nCapabilities:\n${
    f.capabilities.map(c => `- ${c}`).join('\n')
  }`).join('\n\n');
}

// System prompt that provides context about the project
function getSystemPrompt(query: string): string {
  const relevantFeatures = getRelevantFeatures(query);
  const featureList = getFeatureList(query);
  
  return `
You are the AI assistant for CryptoPath, a comprehensive blockchain explorer and visualization platform.

Project Overview:
${projectInfo.description}

${featureList || (relevantFeatures.length > 0 ? formatFeatures(relevantFeatures) : '')}

Key Information:
- Supported networks: ${projectInfo.components.blockchain.supportedNetworks.join(', ')}
- Advanced tech stack with ${projectInfo.techStack.apiIntegrations.length} integrated APIs
- Full mobile compatibility and responsive design
- Secure wallet integration and transaction handling

When answering:
1. Always mention ALL core features when asked about features
2. Use emojis and clear formatting for better readability
3. Be specific about actual features and capabilities
4. Provide clear, actionable information
5. Keep responses engaging and informative

Remember: CryptoPath is more than just a blockchain explorer - it's a complete platform for blockchain interaction, portfolio management, NFT trading, token swapping, staking, and gamified earning!
`;
}

export async function getChatResponse(messages: ChatMessage[]) {
  try {
    const userQuery = messages[messages.length - 1].content;
    
    // Get FAQ match if available
    const relevantFAQ = faqQuestions.find(faq => 
      userQuery.toLowerCase().includes(faq.question.toLowerCase()) ||
      faq.question.toLowerCase().includes(userQuery.toLowerCase())
    );

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
          parts: [{ text: getSystemPrompt(userQuery) }]
        },
        // FAQ answer if available
        ...(relevantFAQ ? [
          {
            role: "user",
            parts: [{ text: "Here is a relevant FAQ answer:" }]
          },
          {
            role: "model",
            parts: [{ text: relevantFAQ.answer }]
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
  "What is CryptoPath and what are its main features?",
  "How can I explore blockchain transactions?",
  "Tell me about the NFT marketplace",
  "How does staking work?",
  "What is the Click2Earn game feature?",
  "How do I use the Token Swap feature?"
];