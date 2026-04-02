import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
console.log("GEMINI_API_KEY exists:", !!apiKey);
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface ExtractedContact {
  name: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  company?: string;
  website?: string;
  address?: string;
  notes?: string;
}

const contactSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Full name of the person." },
      email: { type: Type.STRING, description: "Email address." },
      phone: { type: Type.STRING, description: "Phone number." },
      jobTitle: { type: Type.STRING, description: "Job title or position." },
      company: { type: Type.STRING, description: "Company name." },
      website: { type: Type.STRING, description: "Company website." },
      address: { type: Type.STRING, description: "Physical address." },
      notes: { type: Type.STRING, description: "Any other relevant information found on the card." },
    },
    required: ["name"],
  },
};

export async function extractContactsFromImage(base64Image: string): Promise<ExtractedContact[]> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set.");
    }
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
          {
            text: "Extract all business card information from this image. There might be multiple cards. Structure the output as a list of contacts.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: contactSchema,
        systemInstruction: "You are a highly accurate business card scanner. Extract all details precisely. If multiple cards are present, extract each one separately. If a field is missing, omit it from the object.",
      },
    });

    if (!response.text) {
      console.error("Gemini API returned empty response.");
      return [];
    }
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error extracting contacts:", error);
    throw new Error(`Failed to call the Gemini API: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function generateFollowUpMessage(contact: any): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Generate a professional and warm follow-up email or LinkedIn message for a contact I just met. 
              Contact Details:
              Name: ${contact.name}
              Job Title: ${contact.jobTitle || 'N/A'}
              Company: ${contact.company || 'N/A'}
              Notes: ${contact.notes || 'N/A'}
              
              The message should be concise, mention it was great to meet them, and suggest staying in touch.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: "You are a professional networking assistant. Write warm, concise, and personalized follow-up messages.",
      },
    });

    return response.text || "Failed to generate message.";
  } catch (error) {
    console.error("Error generating follow-up:", error);
    return "Error generating follow-up message.";
  }
}

export async function refineFollowUpMessage(contact: any, currentMessage: string, tone: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Refine this follow-up message to have a ${tone} tone. 
              Contact Details:
              Name: ${contact.name}
              Job Title: ${contact.jobTitle || 'N/A'}
              Company: ${contact.company || 'N/A'}
              Notes: ${contact.notes || 'N/A'}
              
              Current Message:
              ${currentMessage}
              
              The refined message should be concise and maintain the ${tone} tone throughout.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: `You are a professional networking assistant. Refine the provided message to match the requested tone: ${tone}. Keep it professional and effective.`,
      },
    });

    return response.text || currentMessage;
  } catch (error) {
    console.error("Error refining follow-up:", error);
    return currentMessage;
  }
}
