import React, { useState, useEffect } from 'react';
import { StoryboardFrame, ShotSettings } from '../types';
import { Download, RefreshCw, XCircle, Maximize2, X, Camera, Film, MonitorPlay, Save, Move3d, Sun, Aperture, CircleDot } from 'lucide-react';
import { CAMERA_ANGLES, CAMERA_POSITIONS, SHOT_SIZES, ASPECT_RATIOS, LIGHTING_OPTIONS, FOCAL_LENGTHS, APERTURE_OPTIONS } from '../constants';

interface StoryboardGridProps {
  frames: StoryboardFrame[];
  onRegenerate: (id: number) => void;
  onClear: (id: number) => void;
  onReShoot: (id: number, prompt: string, settings: ShotSettings) => void;
}

const StoryboardGrid: React.FC<StoryboardGridProps> = ({ frames, onRegenerate, onClear, onReShoot }) => {
  const [selectedFrameId, setSelectedFrameId] = useState<number | null>(null);

  // Derived state for the modal
  const selectedFrame = selectedFrameId !== null ? frames.find(f => f.id === selectedFrameId) : null;

  // Local state for editing in modal
  const [editPrompt, setEditPrompt] = useState("");
  const [editSettings, setEditSettings] = useState<ShotSettings | null>(null);

  // Sync local edit state when selected frame changes
  useEffect(() => {
    if (selectedFrame) {
      setEditPrompt(selectedFrame.prompt);
      setEditSettings(selectedFrame.settings);
    }
  }, [selectedFrameId, selectedFrame?.imageUrl]); // Reset when ID changes or Image updates (re-shoot done)

  const handleDownload = (imageUrl: string, id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `storyboard_frame_${id + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerateClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onRegenerate(id);
  };

  const handleClearClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onClear(id);
  };

  const handleReShootClick = () => {
    if (selectedFrame && editSettings) {
      onReShoot(selectedFrame.id, editPrompt, editSettings);
    }
  };

  // Helper to get short label
  const getLabel = (fullText: string) => fullText.split(' ')[0];

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-3 gap-6 auto-rows-fr">
          {frames.map((frame) => (
            <div 
              key={frame.id} 
              className={`
                aspect-video relative group rounded-xl overflow-hidden border transition-all duration-300
                ${frame.imageUrl 
                  ? 'border-neutral-800 bg-neutral-900 shadow-2xl cursor-pointer hover:border-amber-500/50' 
                  : 'border-neutral-800/50 bg-neutral-900/30 border-dashed'}
                ${frame.isLoading ? 'animate-pulse border-amber-500/30' : ''}
              `}
              onClick={() => frame.imageUrl && !frame.isLoading && setSelectedFrameId(frame.id)}
            >
              {/* Image Display */}
              {frame.isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-500">
                  <RefreshCw className="animate-spin mb-2" size={32} />
                  <span className="text-xs font-mono tracking-widest uppercase">渲染中 / Rendering...</span>
                </div>
              ) : frame.imageUrl ? (
                <>
                  <img 
                    src={frame.imageUrl} 
                    alt={`Frame ${frame.id + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 backdrop-blur-[2px]">
                    <div className="flex justify-between items-start">
                       <span className="bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded">
                         镜头 {frame.id + 1}
                       </span>
                       <div className="flex gap-2">
                         <button 
                            onClick={(e) => handleRegenerateClick(frame.id, e)}
                            title="重新生成 (使用全局设置)"
                            className="p-2 bg-neutral-800 text-white rounded-full hover:bg-amber-500 hover:text-black transition-colors"
                          >
                            <RefreshCw size={16} />
                         </button>
                         <button 
                            onClick={(e) => handleClearClick(frame.id, e)}
                            className="p-2 bg-neutral-800 text-white rounded-full hover:bg-red-500 transition-colors"
                          >
                            <XCircle size={16} />
                         </button>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-center opacity-70">
                       <div className="bg-black/50 p-2 rounded-full border border-white/20 hover:bg-amber-500 hover:text-black hover:border-transparent transition-all transform hover:scale-110">
                          <Maximize2 className="w-6 h-6" />
                       </div>
                    </div>

                    <div>
                      <p className="text-xs text-white line-clamp-2 mb-3 italic">
                        "{frame.prompt}"
                      </p>
                      <button 
                        onClick={(e) => handleDownload(frame.imageUrl!, frame.id, e)}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black py-2 rounded font-medium text-xs hover:bg-amber-400 transition-colors"
                      >
                        <Download size={14} /> 保存图片
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-neutral-700">
                    <span className="text-4xl font-bold opacity-20 block mb-2">{frame.id + 1}</span>
                    <span className="text-xs uppercase tracking-widest">空闲卡槽</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Director's Monitor (Fullscreen Modal) */}
      {selectedFrame && selectedFrame.imageUrl && editSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6" onClick={() => setSelectedFrameId(null)}>
          
          <div 
            className="w-full max-w-7xl h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl flex overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
             <button 
                className="absolute top-4 right-4 z-10 text-neutral-400 hover:text-white bg-black/50 p-2 rounded-full transition-colors"
                onClick={() => setSelectedFrameId(null)}
              >
                <X size={24} />
              </button>

            {/* Left: Preview Area */}
            <div className="flex-1 flex flex-col bg-black relative">
               <div className="flex-1 flex items-center justify-center p-8">
                 {selectedFrame.isLoading ? (
                   <div className="text-amber-500 flex flex-col items-center">
                      <RefreshCw className="animate-spin mb-4" size={48} />
                      <span className="text-lg tracking-widest uppercase">正在重拍...</span>
                   </div>
                 ) : (
                   <img 
                    src={selectedFrame.imageUrl} 
                    alt="Monitor" 
                    className="max-w-full max-h-full object-contain shadow-2xl"
                   />
                 )}
               </div>
               
               {/* Frame info bar */}
               <div className="h-14 border-t border-neutral-800 bg-neutral-900 flex items-center px-6 justify-between">
                  <div className="flex items-center gap-4 text-sm text-neutral-400 font-mono">
                    <span className="text-amber-500 font-bold">SHOT {selectedFrame.id + 1}</span>
                    <span>|</span>
                    <span>{editSettings.aspectRatio}</span>
                    <span>|</span>
                    <span>{getLabel(editSettings.focalLength)}</span>
                    <span>|</span>
                    <span>{getLabel(editSettings.aperture)}</span>
                    <span>|</span>
                    <span>{getLabel(editSettings.lighting)}</span>
                    <span>|</span>
                    <span className="uppercase">{getLabel(editSettings.style)}</span>
                  </div>
                  <button 
                     onClick={(e) => handleDownload(selectedFrame.imageUrl!, selectedFrame.id, e)}
                     className="flex items-center gap-2 text-xs text-neutral-300 hover:text-white"
                  >
                    <Download size={14} /> DOWNLOAD MASTER
                  </button>
               </div>
            </div>

            {/* Right: Controls Panel */}
            <div className="w-96 bg-neutral-900 border-l border-neutral-800 flex flex-col">
              <div className="p-6 border-b border-neutral-800">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MonitorPlay size={20} className="text-amber-500" />
                  导演监视器
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                   调整参数并重拍当前镜头
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* 1. Prompt Editor */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                     <Film size={14} /> 场景描述
                  </label>
                  <textarea 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-200 focus:border-amber-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* 2. Position Controls */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                     <Move3d size={14} /> 拍摄机位 (Position)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CAMERA_POSITIONS.map(pos => (
                      <button
                        key={pos}
                        onClick={() => setEditSettings({...editSettings, cameraPosition: pos})}
                        className={`
                          text-[10px] py-2 px-3 rounded border transition-all text-left truncate
                          ${editSettings.cameraPosition === pos 
                            ? 'bg-amber-500 text-black border-amber-500 font-bold' 
                            : 'bg-neutral-800 text-neutral-400 border-transparent hover:border-neutral-600'}
                        `}
                      >
                        {getLabel(pos)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focal Length Controls */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                     <Aperture size={14} /> 镜头焦距 (Lens)
                  </label>
                   <select
                     value={editSettings.focalLength}
                     onChange={(e) => setEditSettings({...editSettings, focalLength: e.target.value})}
                     className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded p-2 outline-none"
                  >
                     {FOCAL_LENGTHS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                 {/* Aperture Controls (NEW) */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                     <CircleDot size={14} /> 镜头光圈 (Aperture)
                  </label>
                   <select
                     value={editSettings.aperture}
                     onChange={(e) => setEditSettings({...editSettings, aperture: e.target.value})}
                     className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded p-2 outline-none"
                  >
                     {APERTURE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* 3. Angle Controls */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                     <Camera size={14} /> 镜头角度 (Angle)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CAMERA_ANGLES.map(angle => (
                      <button
                        key={angle}
                        onClick={() => setEditSettings({...editSettings, angle})}
                        className={`
                          text-[10px] py-2 px-3 rounded border transition-all text-left truncate
                          ${editSettings.angle === angle 
                            ? 'bg-amber-500 text-black border-amber-500 font-bold' 
                            : 'bg-neutral-800 text-neutral-400 border-transparent hover:border-neutral-600'}
                        `}
                      >
                        {getLabel(angle)}
                      </button>
                    ))}
                  </div>
                </div>

                 {/* 4. Shot Size Controls */}
                 <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                     <Maximize2 size={14} /> 调整景别 (Shot Size)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SHOT_SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => setEditSettings({...editSettings, shotSize: size})}
                        className={`
                          text-[10px] py-1.5 px-3 rounded-full border transition-all
                          ${editSettings.shotSize === size 
                            ? 'bg-neutral-200 text-black border-white font-bold' 
                            : 'bg-transparent text-neutral-500 border-neutral-700 hover:border-neutral-500'}
                        `}
                      >
                        {getLabel(size)}
                      </button>
                    ))}
                  </div>
                </div>

                 {/* 5. Lighting Controls */}
                 <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                     <Sun size={14} /> 光影设定 (Lighting)
                  </label>
                   <select
                     value={editSettings.lighting}
                     onChange={(e) => setEditSettings({...editSettings, lighting: e.target.value})}
                     className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded p-2 outline-none"
                  >
                     {LIGHTING_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* 6. Aspect Ratio (Optional override) */}
                 <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                     构图比例
                  </label>
                  <select
                     value={editSettings.aspectRatio}
                     onChange={(e) => setEditSettings({...editSettings, aspectRatio: e.target.value})}
                     className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs rounded p-2 outline-none"
                  >
                     {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

              </div>

              {/* Action Button */}
              <div className="p-6 border-t border-neutral-800 bg-neutral-900 z-10">
                <button 
                  onClick={handleReShootClick}
                  disabled={selectedFrame.isLoading}
                  className={`
                    w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                    ${selectedFrame.isLoading 
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                      : 'bg-amber-500 text-black hover:bg-amber-400 hover:shadow-amber-500/20 hover:translate-y-[-1px] active:translate-y-[1px]'}
                  `}
                >
                   {selectedFrame.isLoading ? <RefreshCw className="animate-spin" /> : <Save size={18} />}
                   {selectedFrame.isLoading ? "拍摄中..." : "重拍此镜头 (Re-shoot)"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardGrid;