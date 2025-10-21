import { GoogleGenAI } from "@google/genai";

export const analyzeVideoAnimation = async (
    videoFramesBase64: string[]
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
     const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are an expert motion analyst. Your task is to analyze the following sequence of video frames and generate a highly specific, technical prompt for a text-to-video AI. The goal is to replicate the animation *exactly* as seen in the frames, without any creative interpretation.
Describe the camera's motion path, speed, easing (e.g., ease-in, ease-out, linear), and any effects like shake, blur, or glitch. Be precise.
For example, instead of 'a fast zoom', describe it as 'a rapid dolly zoom-in, starting from a medium shot and ending on a close-up, with a sharp ease-out to a sudden stop.'
Another example: 'A smooth, slow, linear pan from left to right across the entire frame.'
Do not describe the content of the images, only the motion and effects applied to the camera. Output only the final, single-sentence prompt.`;
    
    const imageParts = videoFramesBase64.map(frame => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: frame,
        },
    }));

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }, ...imageParts] },
        config: {
            temperature: 0.1,
        }
    });
    
    let description = response.text.trim();
    // Clean up potential markdown or quotes from the response.
    if (description.startsWith('"') && description.endsWith('"')) {
        description = description.substring(1, description.length - 1);
    }
    
    return description;
};

export const generateVideo = async (
    imageBase64: string,
    prompt: string,
    setLoadingMessage: (message: string) => void,
    aspectRatio: '16:9' | '9:16'
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    setLoadingMessage("Generating video with AI...");
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: `Strictly and precisely replicate the following animation without any creative deviation: ${prompt}`,
        image: {
            imageBytes: imageBase64,
            mimeType: 'image/jpeg',
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });

    setLoadingMessage("AI is rendering your video. This may take several minutes...");

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        try {
             operation = await ai.operations.getVideosOperation({ operation: operation });
        } catch(e) {
            console.error("Error polling operation status", e);
            throw new Error("Failed to get video generation status.");
        }
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation failed or returned no URI.");
    }

    setLoadingMessage("Downloading generated video...");
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        const errorBody = await videoResponse.text();
        console.error("Video download failed:", errorBody);
        throw new Error(`Failed to download video. Status: ${videoResponse.status}`);
    }

    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    setLoadingMessage("Your video is ready!");

    return videoUrl;
};