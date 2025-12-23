import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import StoryboardGrid from './components/StoryboardGrid';
import PromptBar from './components/PromptBar';
import { StoryboardFrame, GlobalSettings, ShotSettings } from './types';
import { INITIAL_FRAMES, CINEMATIC_STYLES, LIGHTING_OPTIONS, CAMERA_ANGLES, CAMERA_POSITIONS, FOCAL_LENGTHS, SHOT_SIZES, APERTURE_OPTIONS } from './constants';
import { generateStoryboardImage } from './services/geminiService';

const App: React.FC = () => {
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
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to update global settings
  const handleUpdateSettings = (key: keyof GlobalSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleClearReference = (type: 'front' | 'side' | 'fullbody' | 'env') => {
    if (type === 'front') setSettings(prev => ({ ...prev, referenceImageFront: null }));
    if (type === 'side') setSettings(prev => ({ ...prev, referenceImageSide: null }));
    if (type === 'fullbody') setSettings(prev => ({ ...prev, referenceImageFullBody: null }));
    if (type === 'env') setSettings(prev => ({ ...prev, referenceImageEnvironment: null }));
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
        <title>导演分镜表 Export</title>
        <style>
          @page { margin: 0; size: A4; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 210mm; margin: 0 auto; }
          .frame-container { 
            display: flex; 
            border: 1px solid #e5e5e5; 
            margin-bottom: 25px; 
            page-break-inside: avoid;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .frame-image { 
            width: 55%; 
            background: #000;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 250px;
          }
          .frame-image img { 
            width: 100%; 
            height: 100%;
            object-fit: contain; 
          }
          .frame-details { 
            width: 45%; 
            padding: 25px; 
            font-size: 12px;
            display: flex;
            flex-direction: column;
          }
          h2 { margin-top: 0; margin-bottom: 15px; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; color: #1a1a1a; font-size: 18px; display: flex; justify-content: space-between; align-items: baseline; }
          .shot-id { color: #f59e0b; font-weight: 800; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
          .meta-item { border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; }
          .meta-label { font-weight: 700; color: #888; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
          .meta-value { color: #111; font-weight: 500; font-size: 11px; }
          .prompt-box { background: #fcfaf5; padding: 12px; border-radius: 6px; border-left: 3px solid #f59e0b; flex-grow: 1; }
          .prompt-label { font-weight: 700; margin-bottom: 6px; display: block; color: #d97706; font-size: 10px; uppercase; }
          .prompt-text { line-height: 1.5; color: #333; font-style: italic; }
          
          /* Print optimizations */
          @media print {
            body { -webkit-print-color-adjust: exact; padding: 20px; }
            .frame-container { break-inside: avoid; box-shadow: none; border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <h1 style="text-align: center; margin-bottom: 10px; font-size: 24px;">导演分镜脚本</h1>
        <p style="text-align: center; color: #666; font-size: 12px; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 1px;">Director's Storyboard Generated by Gemini AI</p>
        
        ${validFrames.map((frame, index) => `
          <div class="frame-container">
            <div class="frame-image">
              <img src="${frame.imageUrl}" />
            </div>
            <div class="frame-details">
              <h2><span class="shot-id">SHOT ${index + 1}</span></h2>
              
              <div class="meta-grid">
                <div class="meta-item">
                  <div class="meta-label">镜头角度 (Angle)</div>
                  <div class="meta-value">${frame.settings.angle.split('(')[0]}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">景别 (Shot Size)</div>
                  <div class="meta-value">${frame.settings.shotSize.split('(')[0]}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">机位 (Position)</div>
                  <div class="meta-value">${frame.settings.cameraPosition.split('(')[0]}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">焦距 (Lens)</div>
                  <div class="meta-value">${frame.settings.focalLength.split('(')[0]}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">光圈 (Aperture)</div>
                  <div class="meta-value">${frame.settings.aperture.split('(')[0]}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">光影 (Lighting)</div>
                  <div class="meta-value">${frame.settings.lighting.split('(')[0]}</div>
                </div>
                <div class="meta-item">
                  <div class="meta-label">画幅 (Ratio)</div>
                  <div class="meta-value">${frame.settings.aspectRatio}</div>
                </div>
              </div>
              
              <div class="prompt-box">
                <span class="prompt-label">SCENE DESCRIPTION</span>
                <div class="prompt-text">${frame.prompt}</div>
              </div>
            </div>
          </div>
        `).join('')}

        <script>
          // Automatically trigger print when images are likely loaded (simple delay or onload)
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          }
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
        referenceImageEnvironment: settings.referenceImageEnvironment
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
      console.error("Single generation failed", error);
      alert("生成失败，请重试。");
      setFrames(prev => prev.map(f => f.id === id ? { ...f, isLoading: false } : f));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle specific frame re-shoot with custom settings (Director's Monitor)
  const handleReShoot = async (id: number, newPrompt: string, newSettings: ShotSettings) => {
    const frame = frames.find(f => f.id === id);
    if (!frame) return;

    setIsGenerating(true);
    // Optimistic update
    setFrames(prev => prev.map(f => f.id === id ? { 
      ...f, 
      isLoading: true, 
      prompt: newPrompt,
      settings: newSettings // Update local settings immediately to show intent
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
        referenceImageFullBody: settings.referenceImageFullBody, // Use global full body ref
        referenceImageEnvironment: settings.referenceImageEnvironment
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
      console.error("Re-shoot failed", error);
      alert("重拍失败，请重试。");
      setFrames(prev => prev.map(f => f.id === id ? { ...f, isLoading: false } : f));
    } finally {
      setIsGenerating(false);
    }
  }

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
            referenceImageEnvironment: settings.referenceImageEnvironment
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
          // Revert specific frame error
          setFrames(prev => prev.map(f => f.id === task.id ? { ...f, isLoading: false } : f));
        }
      }));
    } catch (globalError) {
      console.error("Batch process error", globalError);
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
      f.id === id ? { ...f, imageUrl: null, prompt: "", isLoading: false } : f
    ));
  };

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