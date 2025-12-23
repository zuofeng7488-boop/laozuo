import { GoogleGenAI } from "@google/genai";
import { GeneratePayload } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using the requested "Nano Banana" equivalent model
const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateStoryboardImage = async (payload: GeneratePayload): Promise<string> => {
  try {
    const parts: any[] = [];

    let hasCharacterRef = false;
    let hasEnvRef = false;

    // 1. Add Front Reference
    if (payload.referenceImageFront) {
      const base64Data = payload.referenceImageFront.split(',')[1] || payload.referenceImageFront;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({ text: "参考图 A：角色的正面视图 (Front View Reference)" });
      hasCharacterRef = true;
    }

    // 2. Add Side Reference
    if (payload.referenceImageSide) {
      const base64Data = payload.referenceImageSide.split(',')[1] || payload.referenceImageSide;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({ text: "参考图 B：角色的侧面视图 (Side View Reference)" });
      hasCharacterRef = true;
    }

    // 3. Add Full Body Reference
    if (payload.referenceImageFullBody) {
      const base64Data = payload.referenceImageFullBody.split(',')[1] || payload.referenceImageFullBody;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({ text: "参考图 C：角色的全身视图 (Full Body Reference)" });
      hasCharacterRef = true;
    }

    // 4. Add Environment Reference
    if (payload.referenceImageEnvironment) {
      const base64Data = payload.referenceImageEnvironment.split(',')[1] || payload.referenceImageEnvironment;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({ text: "参考图 D：场景环境参考 (Environment/Background Reference)" });
      hasEnvRef = true;
    }

    // Instructions based on available references
    let refInstructions = "";
    if (hasCharacterRef) {
      refInstructions += "- 角色一致性：请严格分析并参考提供的角色参考图（正面/侧面/全身），保持面部特征、发型、服装细节、身材比例在生成画面中的高度一致。\n";
    }
    
    const isUsingEnvLight = payload.lighting.includes("Match Environment Ref") || payload.lighting.includes("参考环境光");

    if (hasEnvRef) {
      refInstructions += "- 场景一致性：请参考提供的环境参考图，复用其建筑风格、材质、色彩氛围和空间结构作为背景。\n";
      
      if (isUsingEnvLight) {
        refInstructions += "- **光影一致性 (CRITICAL)**：用户选择了参考环境光。请**严格提取**环境参考图中的光照方向、色温、光源性质（软/硬）和阴影投射逻辑。让新生成的角色完全融合进这套光影系统中，不要使用通用的布光。\n";
      }
    } else if (isUsingEnvLight) {
       // Fallback instructions if user selected the option but forgot the image
       refInstructions += "- 光影设定：用户希望使用“环境参考光”，但未提供参考图。请根据场景描述的物理环境，自动构建最自然、真实的光照逻辑。\n";
    }

    // 5. Construct the prompt
    // We translate the prompt structure to help the model understand the context better with Chinese inputs.
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
      model: MODEL_NAME,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: payload.aspectRatio as "16:9" | "4:3" | "1:1" | "3:4" | "9:16",
        }
      }
    });

    // 6. Extract Image
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      const content = candidate.content;
      
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