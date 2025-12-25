import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StoryboardGrid from './components/StoryboardGrid';
import PromptBar from './components/PromptBar';
import { StoryboardFrame, GlobalSettings, ShotSettings } from './types';
import { INITIAL_FRAMES, CINEMATIC_STYLES, LIGHTING_OPTIONS, CAMERA_ANGLES, CAMERA_POSITIONS, FOCAL_LENGTHS, SHOT_SIZES, APERTURE_OPTIONS } from './constants';
import { generateStoryboardImage, editStoryboardImage } from './services/geminiService';
import { KeyRound, ExternalLink } from 'lucide-react';

// Declaration for AI Studio window extension
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [frames, setFrames] = useState<StoryboardFrame[]>(INITIAL_FRAMES);
  const [settings, setSettings] = useState<GlobalSettings>({
    style: CINEMATIC_STYLES[0],
    angle: CAMERA_ANGLES[0],
    cameraPosition: CAMERA_POSITIONS[0],
    focalLength: FOCAL_LENGTHS[3], // Default 50mm
    aperture: APERTURE_OPTIONS[2], // Default f/2.8
    shotSize: SHOT_SIZES[1],
    lighting: LIGHTING_OPTIONS[0],
    aspectRatio: "16:9",
    referenceImageFront: null,
    referenceImageSide: null,
    referenceImageFullBody: null,
    referenceImageEnvironment: null,
    referenceImageEnvironmentMask: null,
    referenceImageCharacter2: null,
    referenceImageCharacter3: null,
    apiEndpoint: "", // Initialize API endpoint
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        // Fallback for environments without the wrapper (dev)
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success after dialog interaction to mitigate race condition
      setHasApiKey(true);
    }
  };

  const handleApiError = async (error: any) => {
    console.error("API Error caught in App:", error);
    const msg = error.message || error.toString();
    if (msg.includes("Requested entity was not found")) {
      // API Key issue or project issue
      setHasApiKey(false);
      if (window.aistudio) {
         await window.aistudio.openSelectKey();
         setHasApiKey(true);
      }
      alert("API Key 验证失效，请重新选择有效的付费项目 API Key。");
    } else {
      alert("生成失败 (Generation Failed): " + msg);
    }
  };

  // Helper to update global settings
  const handleUpdateSettings = (key: keyof GlobalSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleClearReference = (type: 'front' | 'side' | 'fullbody' | 'env' | 'char2' | 'char3') => {
    if (type === 'front') setSettings(prev => ({ ...prev, referenceImageFront: null }));
    if (type === 'side') setSettings(prev => ({ ...prev, referenceImageSide: null }));
    if (type === 'fullbody') setSettings(prev => ({ ...prev, referenceImageFullBody: null }));
    if (type === 'env') setSettings(prev => ({ ...prev, referenceImageEnvironment: null, referenceImageEnvironmentMask: null }));
    if (type === 'char2') setSettings(prev => ({ ...prev, referenceImageCharacter2: null }));
    if (type === 'char3') setSettings(prev => ({ ...prev, referenceImageCharacter3: null }));
  };

  // Find the first empty slot to fill
  const getNextEmptySlot = () => {
    return frames.find(f => f.imageUrl === null)?.id;
  };

  const handleExport = () => {
    const validFrames = frames.filter(f => f.imageUrl);
    if (validFrames.length === 0) {
      alert("没有可导出的分镜画面。请先生成一些分镜。\nNo frames to export.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("无法打开新窗口，请允许弹出窗口以导出 PDF。\nPlease allow popups to export PDF.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shooting Script / Storyboard Export</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Courier+Prime&display=swap');
          
          @page { size: A4; margin: 10mm; }
          body { 
            font-family: 'Inter', system-ui, sans-serif; 
            color: #111; 
            line-height: 1.4; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            background: #fff;
          }
          
          .header { 
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 4px solid #000; 
            padding-bottom: 15px; 
            margin-bottom: 25px; 
          }
          .title-block h1 { 
            font-size: 28px; 
            font-weight: 900; 
            letter-spacing: 1px; 
            text-transform: uppercase; 
            margin: 0; 
            line-height: 1;
          }
          .title-block p {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
            color: #666;
          }
          .meta-block {
            text-align: right;
            font-size: 10px;
            font-family: 'Courier Prime', monospace;
          }

          .shot-table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 2px solid #000; 
          }
          
          /* Table Header */
          .thead th { 
            background: #000; 
            color: #fff; 
            font-size: 10px; 
            text-transform: uppercase; 
            font-weight: bold; 
            padding: 8px;
            text-align: left;
            border: 1px solid #000;
          }
          
          /* Rows */
          .tr { 
            page-break-inside: avoid; 
            border-bottom: 1px solid #000; 
          }
          .td { 
            padding: 0; 
            border: 1px solid #000; 
            vertical-align: top; 
          }
          
          /* --- Columns --- */
          
          /* 1. Shot Number */
          .col-shot { 
            width: 50px; 
            background: #f4f4f4; 
            text-align: center;
            vertical-align: middle;
          }
          .shot-num { 
            font-size: 24px; 
            font-weight: 900; 
            color: #000;
          }
          
          /* 2. Visual */
          .col-visual { 
            width: 38%; 
            padding: 5px;
          }
          .frame-img { 
            width: 100%; 
            display: block; 
            height: auto; 
            border: 1px solid #eee;
          }
          
          /* 3. Script / Action */
          .col-script { 
            width: 37%; 
            padding: 12px;
          }
          .script-content {
             font-family: 'Courier Prime', 'Courier New', monospace;
             font-size: 11px;
             line-height: 1.5;
             white-space: pre-wrap;
          }
          .prompt-hint {
             display: block;
             margin-top: 8px;
             padding-top: 8px;
             border-top: 1px dashed #ccc;
             font-size: 9px;
             color: #888;
             font-family: sans-serif;
             font-style: italic;
          }

          /* 4. Technical Specs */
          .col-tech { 
            width: 20%; 
            background: #fff;
            padding: 8px;
          }
          .tech-grid {
             display: grid;
             gap: 6px;
          }
          .tech-item {
             border-bottom: 1px solid #eee;
             padding-bottom: 2px;
          }
          .tech-label { 
             display: block; 
             font-weight: 800; 
             font-size: 7px; 
             color: #888; 
             text-transform: uppercase; 
             margin-bottom: 1px;
          }
          .tech-value {
             font-size: 9px;
             font-weight: 600;
             color: #000;
          }
          
          .footer { 
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff;
            padding-top: 10px;
            font-size: 9px; 
            text-align: center; 
            color: #888; 
            border-top: 1px solid #000; 
          }
          
          /* Hide footer on screen, show on print if needed, but fixed positioning is tricky in print. 
             Let's use a static footer at the end of list */
          .static-footer {
             margin-top: 30px;
             text-align: center;
             font-size: 9px;
             color: #aaa;
             text-transform: uppercase;
             letter-spacing: 2px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title-block">
            <h1>Shooting Script</h1>
            <p>Visual Storyboard & Production List</p>
          </div>
          <div class="meta-block">
            <div>DATE: ${new Date().toLocaleDateString()}</div>
            <div>PROJECT ID: ${Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
            <div>UNIT: MAIN</div>
          </div>
        </div>

        <table class="shot-table">
          <thead>
            <tr class="thead">
              <th style="width: 50px; text-align: center;">#</th>
              <th>Visual</th>
              <th>Action / Dialogue</th>
              <th>Camera / Tech</th>
            </tr>
          </thead>
          <tbody>
            ${validFrames.map((frame, index) => `
              <tr class="tr">
                <!-- Shot ID -->
                <td class="td col-shot">
                  <div class="shot-num">${index + 1}</div>
                </td>
                
                <!-- Visual -->
                <td class="td col-visual">
                  <img class="frame-img" src="${frame.imageUrl}" />
                </td>
                
                <!-- Script -->
                <td class="td col-script">
                  <div class="script-content">${frame.script || "(No script description provided)"}</div>
                  ${frame.prompt ? `<div class="prompt-hint">Visual Prompt: ${frame.prompt}</div>` : ''}
                </td>
                
                <!-- Tech Specs -->
                <td class="td col-tech">
                   <div class="tech-grid">
                      <div class="tech-item">
                        <span class="tech-label">Shot Size</span>
                        <div class="tech-value">${frame.settings.shotSize.split('(')[0]}</div>
                      </div>
                      <div class="tech-item">
                        <span class="tech-label">Angle</span>
                        <div class="tech-value">${frame.settings.angle.split('(')[0]}</div>
                      </div>
                      <div class="tech-item">
                        <span class="tech-label">Position</span>
                        <div class="tech-value">${frame.settings.cameraPosition.split('(')[0]}</div>
                      </div>
                      <div class="tech-item">
                        <span class="tech-label">Lens</span>
                        <div class="tech-value">${frame.settings.focalLength.split('(')[0]}</div>
                      </div>
                      <div class="tech-item">
                        <span class="tech-label">Aperture</span>
                        <div class="tech-value">${frame.settings.aperture.split('(')[0]}</div>
                      </div>
                      <div class="tech-item">
                        <span class="tech-label">Lighting</span>
                        <div class="tech-value">${frame.settings.lighting.split('(')[0]}</div>
                      </div>
                   </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="static-footer">
          Generated by Gemini Director's Cut • Page 1 of 1
        </div>
        
        <script>
            window.onload = () => { setTimeout(() => window.print(), 800); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Handle single frame generation (used for global regeneration)
  const handleGenerateSingle = async (prompt: string, id: number) => {
    setIsGenerating(true);
    setFrames(prev => prev.map(f => f.id === id ? { ...f, isLoading: true, prompt } : f));

    try {
      const imageUrl = await generateStoryboardImage({
        prompt,
        style: settings.style,
        angle: settings.angle,
        cameraPosition: settings.cameraPosition,
        focalLength: settings.focalLength,
        aperture: settings.aperture,
        shotSize: settings.shotSize,
        lighting: settings.lighting,
        aspectRatio: settings.aspectRatio,
        referenceImageFront: settings.referenceImageFront,
        referenceImageSide: settings.referenceImageSide,
        referenceImageFullBody: settings.referenceImageFullBody,
        referenceImageEnvironment: settings.referenceImageEnvironment,
        referenceImageEnvironmentMask: settings.referenceImageEnvironmentMask,
        referenceImageCharacter2: settings.referenceImageCharacter2,
        referenceImageCharacter3: settings.referenceImageCharacter3,
        apiEndpoint: settings.apiEndpoint, 
      });

      setFrames(prev => prev.map(f => 
        f.id === id ? { 
          ...f, 
          imageUrl, 
          isLoading: false,
          settings: { ...settings }
        } : f
      ));
    } catch (error) {
      setFrames(prev => prev.map(f => f.id === id ? { ...f, isLoading: false } : f));
      await handleApiError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle specific frame re-shoot with custom settings (Director's Monitor)
  const handleReShoot = async (id: number, newPrompt: string, newSettings: ShotSettings) => {
    const frame = frames.find(f => f.id === id);
    if (!frame) return;

    setIsGenerating(true);
    setFrames(prev => prev.map(f => f.id === id ? { 
      ...f, 
      isLoading: true, 
      prompt: newPrompt,
      settings: newSettings 
    } : f));

    try {
       const imageUrl = await generateStoryboardImage({
        prompt: newPrompt,
        style: newSettings.style,
        angle: newSettings.angle,
        cameraPosition: newSettings.cameraPosition,
        focalLength: newSettings.focalLength,
        aperture: newSettings.aperture,
        shotSize: newSettings.shotSize,
        lighting: newSettings.lighting,
        aspectRatio: newSettings.aspectRatio,
        referenceImageFront: settings.referenceImageFront,
        referenceImageSide: settings.referenceImageSide,
        referenceImageFullBody: settings.referenceImageFullBody,
        referenceImageEnvironment: settings.referenceImageEnvironment,
        referenceImageEnvironmentMask: settings.referenceImageEnvironmentMask,
        referenceImageCharacter2: settings.referenceImageCharacter2,
        referenceImageCharacter3: settings.referenceImageCharacter3,
        apiEndpoint: settings.apiEndpoint,
      });

      setFrames(prev => prev.map(f => 
        f.id === id ? { 
          ...f, 
          imageUrl, 
          isLoading: false,
          settings: newSettings
        } : f
      ));
    } catch (error) {
      setFrames(prev => prev.map(f => f.id === id ? { ...f, isLoading: false } : f));
      await handleApiError(error);
    } finally {
      setIsGenerating(false);
    }
  }

  // Handle inpainting / mask editing
  const handleEdit = async (id: number, prompt: string, maskImage: string) => {
    const frame = frames.find(f => f.id === id);
    if (!frame || !frame.imageUrl) return;

    setIsGenerating(true);
    setFrames(prev => prev.map(f => f.id === id ? { 
        ...f, 
        isLoading: true 
    } : f));

    try {
        const newImageUrl = await editStoryboardImage({
            prompt: prompt,
            image: frame.imageUrl,
            maskImage: maskImage,
            apiEndpoint: settings.apiEndpoint
        });

        setFrames(prev => prev.map(f => f.id === id ? { 
            ...f, 
            imageUrl: newImageUrl, 
            isLoading: false 
        } : f));

    } catch (error) {
        setFrames(prev => prev.map(f => f.id === id ? { ...f, isLoading: false } : f));
        await handleApiError(error);
    } finally {
        setIsGenerating(false);
    }
  };

  // Handle script text updates
  const handleUpdateScript = (id: number, script: string) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, script } : f));
  };

  // Handle batch generation from the PromptBar
  const handleBatchGenerate = async (prompts: string[]) => {
    const emptySlots = frames.filter(f => f.imageUrl === null);
    
    if (emptySlots.length === 0) {
      alert("分镜板已满！请先清理一个卡槽再生成。");
      return;
    }

    const tasks = [];
    const count = Math.min(prompts.length, emptySlots.length);

    for (let i = 0; i < count; i++) {
      tasks.push({
        id: emptySlots[i].id,
        prompt: prompts[i]
      });
    }

    setIsGenerating(true);

    // Optimistic Update: Set loading state for all target frames
    setFrames(prev => prev.map(f => {
      const task = tasks.find(t => t.id === f.id);
      return task ? { ...f, isLoading: true, prompt: task.prompt } : f;
    }));

    try {
      // Execute all generations in parallel
      await Promise.all(tasks.map(async (task) => {
        try {
          const imageUrl = await generateStoryboardImage({
            prompt: task.prompt,
            style: settings.style,
            angle: settings.angle,
            cameraPosition: settings.cameraPosition,
            focalLength: settings.focalLength,
            aperture: settings.aperture,
            shotSize: settings.shotSize,
            lighting: settings.lighting,
            aspectRatio: settings.aspectRatio,
            referenceImageFront: settings.referenceImageFront,
            referenceImageSide: settings.referenceImageSide,
            referenceImageFullBody: settings.referenceImageFullBody,
            referenceImageEnvironment: settings.referenceImageEnvironment,
            referenceImageEnvironmentMask: settings.referenceImageEnvironmentMask,
            referenceImageCharacter2: settings.referenceImageCharacter2,
            referenceImageCharacter3: settings.referenceImageCharacter3,
            apiEndpoint: settings.apiEndpoint,
          });

          setFrames(prev => prev.map(f => 
            f.id === task.id ? { 
              ...f, 
              imageUrl, 
              isLoading: false,
              settings: { ...settings }
            } : f
          ));
        } catch (error) {
          console.error(`Generation failed for frame ${task.id}`, error);
          setFrames(prev => prev.map(f => f.id === task.id ? { ...f, isLoading: false } : f));
          
          const msg = (error as any).message || "";
          if (msg.includes("Requested entity was not found")) {
             throw error; 
          }
        }
      }));
    } catch (globalError) {
      await handleApiError(globalError);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = (id: number) => {
    const frame = frames.find(f => f.id === id);
    if (!frame || !frame.prompt) return;
    handleGenerateSingle(frame.prompt, id);
  };

  const handleClearFrame = (id: number) => {
    setFrames(prev => prev.map(f => 
      f.id === id ? { ...f, imageUrl: null, prompt: "", script: "", isLoading: false } : f
    ));
  };

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-neutral-950 text-neutral-100 p-8">
        <div className="max-w-md w-full text-center space-y-8">
           <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30">
                 <KeyRound size={40} className="text-amber-500" />
              </div>
           </div>
           
           <div>
             <h1 className="text-3xl font-bold mb-2">Connect Google Cloud</h1>
             <p className="text-neutral-400">
               您正在使用 Nano Banana (Gemini 2.5 Flash)。请连接您的 API Key 以开始使用。
             </p>
           </div>

           <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-left text-xs text-neutral-400">
              <p className="mb-2 font-semibold text-neutral-300">为什么需要连接？</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>访问 Gemini 2.5 Flash 高速图像生成模型</li>
                <li>快速生成分镜画面</li>
              </ul>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="mt-4 flex items-center gap-1 text-amber-500 hover:underline"
              >
                了解计费信息 <ExternalLink size={10} />
              </a>
           </div>

           <button 
             onClick={handleSelectKey}
             className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all transform active:scale-95 shadow-lg shadow-amber-500/20"
           >
             选择项目并连接
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-neutral-100 overflow-hidden font-sans selection:bg-amber-500/30">
      {/* Left Sidebar: Controls */}
      <Sidebar 
        settings={settings} 
        updateSettings={handleUpdateSettings}
        onClearReference={handleClearReference}
        onExport={handleExport}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* The 9-Grid Storyboard */}
        <StoryboardGrid 
          frames={frames}
          onRegenerate={handleRegenerate}
          onReShoot={handleReShoot}
          onEdit={handleEdit} // New prop
          onUpdateScript={handleUpdateScript} // New prop
          onClear={handleClearFrame}
        />

        {/* Bottom Input Area */}
        <PromptBar 
          onGenerate={handleBatchGenerate}
          isGenerating={isGenerating}
          nextSlotIndex={getNextEmptySlot() ?? 9}
        />
      </div>
    </div>
  );
};

export default App;