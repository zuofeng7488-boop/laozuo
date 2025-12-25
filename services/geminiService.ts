import { GoogleGenAI } from "@google/genai";
import { GeneratePayload, EditPayload } from "../types";

// Using "Nano Banana" (Flash Image) for Generation as requested
const GENERATION_MODEL = 'gemini-2.5-flash-image';

// Using "Nano Banana" (Flash Image) for Editing
const EDIT_MODEL = 'gemini-2.5-flash-image';

export const generateStoryboardImage = async (payload: GeneratePayload): Promise<string> => {
  const options: any = { apiKey: process.env.API_KEY };
  if (payload.apiEndpoint && payload.apiEndpoint.trim() !== "") {
    options.baseUrl = payload.apiEndpoint.trim();
  }
  
  const ai = new GoogleGenAI(options);

  try {
    const parts: any[] = [];

    let hasCharacterRef = false;
    let hasEnvRef = false;
    let hasEnvMask = false;

    // 1. Add Front Reference
    if (payload.referenceImageFront) {
      const base64Data = payload.referenceImageFront.split(',')[1] || payload.referenceImageFront;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
      parts.push({ text: "参考图 A：主角色的正面视图 (Main Character Front View)" });
      hasCharacterRef = true;
    }

    // 2. Add Side Reference
    if (payload.referenceImageSide) {
      const base64Data = payload.referenceImageSide.split(',')[1] || payload.referenceImageSide;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
      parts.push({ text: "参考图 B：主角色的侧面视图 (Main Character Side View)" });
      hasCharacterRef = true;
    }

    // 3. Add Full Body Reference
    if (payload.referenceImageFullBody) {
      const base64Data = payload.referenceImageFullBody.split(',')[1] || payload.referenceImageFullBody;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
      parts.push({ text: "参考图 C：主角色的全身视图 (Main Character Full Body)" });
      hasCharacterRef = true;
    }

    // 4. Add Additional Character 2
    if (payload.referenceImageCharacter2) {
      const base64Data = payload.referenceImageCharacter2.split(',')[1] || payload.referenceImageCharacter2;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
      parts.push({ text: "参考图 E：额外角色 2 (Additional Character 2)" });
      hasCharacterRef = true;
    }

    // 5. Add Additional Character 3
    if (payload.referenceImageCharacter3) {
      const base64Data = payload.referenceImageCharacter3.split(',')[1] || payload.referenceImageCharacter3;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
      parts.push({ text: "参考图 F：额外角色 3 (Additional Character 3)" });
      hasCharacterRef = true;
    }

    // 6. Add Environment Reference
    if (payload.referenceImageEnvironment) {
      const base64Data = payload.referenceImageEnvironment.split(',')[1] || payload.referenceImageEnvironment;
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
      parts.push({ text: "参考图 D：场景环境参考 (Environment/Background Reference)" });
      hasEnvRef = true;
    }
    
    // 7. Add Environment Mask Reference
    if (payload.referenceImageEnvironmentMask) {
      const base64Data = payload.referenceImageEnvironmentMask.split(',')[1] || payload.referenceImageEnvironmentMask;
      parts.push({ inlineData: { mimeType: 'image/png', data: base64Data } });
      parts.push({ text: "参考图 G (Mask)：环境中的角色位置遮罩 (Environment Position Mask)" });
      hasEnvMask = true;
    }

    // Instructions
    let refInstructions = "";
    if (hasCharacterRef) {
      refInstructions += "- 角色一致性：请严格分析并参考提供的所有角色参考图（主角色、角色2、角色3）。\n";
      refInstructions += "- 如果提示词中涉及多个角色，请根据参考图准确对应他们的面部特征、发型、服装细节。\n";
      refInstructions += "- 保持所有角色的身材比例在生成画面中的高度一致。\n";
    }
    
    const isUsingEnvLight = payload.lighting.includes("Match Environment Ref") || payload.lighting.includes("参考环境光");

    if (hasEnvRef) {
      refInstructions += "- 场景一致性：请参考提供的环境参考图，复用其建筑风格、材质、色彩氛围和空间结构作为背景。\n";
      if (isUsingEnvLight) {
        refInstructions += "- **光影一致性**：用户选择了参考环境光。请严格提取环境参考图中的光照方向和色温。\n";
      }
      
      if (hasEnvMask) {
          refInstructions += "- **位置强制**：检测到位置遮罩（参考图 G）。请务必将画面中的主要角色放置在遮罩中白色区域指示的位置，并尽可能保持环境背景（参考图 D）的原始构图。\n";
      }
    }

    const promptText = `
      请创建一个电影级的分镜画面 (Storyboard Frame)。
      场景描述: ${payload.prompt}
      技术规格:
      - 美术风格: ${payload.style}
      - 镜头角度: ${payload.angle}
      - 拍摄机位: ${payload.cameraPosition}
      - 镜头焦距: ${payload.focalLength}
      - 镜头光圈: ${payload.aperture}
      - 景别大小: ${payload.shotSize}
      - 光影设定: ${payload.lighting}
      
      参考图处理指令:
      ${refInstructions}
      
      要求:
      - 高质量、细节丰富的概念艺术风格。
      - ${payload.aspectRatio} 构图比例。
      - 像电影导演一样注重光影和构图设计。
    `;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: payload.aspectRatio as "16:9" | "4:3" | "1:1" | "3:4" | "9:16",
        }
      }
    });

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
             return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    throw new Error("未能生成图片 (No image generated).");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const editStoryboardImage = async (payload: EditPayload): Promise<string> => {
  const options: any = { apiKey: process.env.API_KEY };
  if (payload.apiEndpoint && payload.apiEndpoint.trim() !== "") {
    options.baseUrl = payload.apiEndpoint.trim();
  }
  const ai = new GoogleGenAI(options);

  try {
    const parts: any[] = [];
    
    // 1. Original Image (Source)
    const originalBase64 = payload.image.includes('base64,') ? payload.image.split('base64,')[1] : payload.image;
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: originalBase64
      }
    });

    // 2. Mask Image (Optional, but highly recommended for inpainting)
    if (payload.maskImage) {
      const maskBase64 = payload.maskImage.includes('base64,') ? payload.maskImage.split('base64,')[1] : payload.maskImage;
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: maskBase64
        }
      });
      // Instructions for the model to treat the second image as a mask
      parts.push({ text: "使用提供的第二张黑白图片作为遮罩(Mask)。请仅修改遮罩中白色的区域，保持其他区域不变。" });
    }

    // 3. Edit Instructions
    parts.push({ text: `修改指令 (Inpainting Request): ${payload.prompt}` });

    const response = await ai.models.generateContent({
      model: EDIT_MODEL,
      contents: { parts },
      // No aspect ratio needed for edit, it usually preserves source
    });

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData && part.inlineData.data) {
             return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    throw new Error("未能完成编辑 (Editing failed).");
    
  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
}