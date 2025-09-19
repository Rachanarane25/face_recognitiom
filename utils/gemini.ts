import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Function to convert base64 to a generative part
const fileToGenerativePart = (base64: string, mimeType: string) => {
  // remove data:image/png;base64, prefix
  const base64Data = base64.split(',')[1];
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
};

export const compareFaces = async (base64Image1: string, base64Image2: string): Promise<boolean> => {
  try {
    const imageParts = [
      fileToGenerativePart(base64Image1, "image/png"),
      fileToGenerativePart(base64Image2, "image/png"),
    ];
    
    const prompt = `
      As an expert facial recognition system, determine if the two images contain the same person.
      Analyze facial features carefully.
      Respond ONLY with a JSON object matching this schema:
      {
        "isSamePerson": boolean,
        "confidence": number (from 0.0 to 1.0)
      }
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [...imageParts, { text: prompt }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isSamePerson: {
                type: Type.BOOLEAN,
                description: 'True if the images are of the same person, otherwise false.',
              },
              confidence: {
                type: Type.NUMBER,
                description: 'A confidence score between 0.0 and 1.0 indicating the certainty of the match.',
              },
            },
            required: ['isSamePerson', 'confidence'],
          },
        },
    });
    
    let jsonString = response.text.trim();
    // Handle potential markdown code blocks for added robustness
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }

    const result = JSON.parse(jsonString) as { isSamePerson: boolean; confidence: number };
    
    const CONFIDENCE_THRESHOLD = 0.8;

    console.log(`Face comparison result: isSamePerson=${result.isSamePerson}, confidence=${result.confidence}`);

    return result.isSamePerson && result.confidence >= CONFIDENCE_THRESHOLD;
  } catch (error) {
    console.error("Error comparing faces:", error);
    if (error instanceof SyntaxError) {
        console.error("Failed to parse Gemini response as JSON.");
        throw new Error("Could not understand the verification response. Please try again.");
    }
    throw new Error("Could not verify face due to an API error.");
  }
};