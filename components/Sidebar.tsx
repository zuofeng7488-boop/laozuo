import React, { useState, useRef, useEffect } from 'react';
import { Settings, Image as ImageIcon, Trash2, Camera, Palette, MonitorPlay, Ratio, Move3d, Sun, Aperture, Mountain, FileDown, User, CircleDot, Users, ScanFace, Check, X, Eraser, Brush } from 'lucide-react';
import { CINEMATIC_STYLES, CAMERA_ANGLES, CAMERA_POSITIONS, SHOT_SIZES, ASPECT_RATIOS, LIGHTING_OPTIONS, FOCAL_LENGTHS, APERTURE_OPTIONS } from '../constants';
import { GlobalSettings } from '../types';

interface SidebarProps {
  settings: GlobalSettings;
  updateSettings: (key: keyof GlobalSettings, value: any) => void;
  onClearReference: (type: 'front' | 'side' | 'fullbody' | 'env' | 'char2' | 'char3') => void;
  onExport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ settings, updateSettings, onClearReference, onExport }) => {
  
  // Masking State
  const [isMaskingEnv, setIsMaskingEnv] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [lastPos, setLastPos] = useState<{x: number, y: number} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side' | 'fullbody' | 'env' | 'char2' | 'char3') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
            updateSettings('referenceImageFront', reader.result as string);
        } else if (type === 'side') {
            updateSettings('referenceImageSide', reader.result as string);
        } else if (type === 'fullbody') {
            updateSettings('referenceImageFullBody', reader.result as string);
        } else if (type === 'env') {
            updateSettings('referenceImageEnvironment', reader.result as string);
            // Clear old mask if new image uploaded
            updateSettings('referenceImageEnvironmentMask', null);
        } else if (type === 'char2') {
            updateSettings('referenceImageCharacter2', reader.result as string);
        } else if (type === 'char3') {
            updateSettings('referenceImageCharacter3', reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Masking Canvas Logic
  useEffect(() => {
    if (isMaskingEnv && canvasRef.current && imageRef.current) {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        const ctx = canvas.getContext('2d');

        const initCanvas = () => {
            canvas.width = img.clientWidth;
            canvas.height = img.clientHeight;

            // Load existing mask if present
            if (settings.referenceImageEnvironmentMask && ctx) {
                const maskImg = new Image();
                maskImg.src = settings.referenceImageEnvironmentMask;
                maskImg.onload = () => {
                    // 1. Draw the saved B&W mask onto the canvas
                    ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
                    
                    // 2. Process image data to make Black transparent
                    // The saved mask is Black (BG) and White (Stroke). 
                    // To edit it over the reference image, we need the Black to be transparent.
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        // If pixel is dark (black background)
                        if (r < 30 && g < 30 && b < 30) {
                            data[i + 3] = 0; // Set Alpha to 0
                        }
                    }
                    ctx.putImageData(imageData, 0, 0);
                };
            }
        };

        if(img.complete) {
            initCanvas();
        } else {
            img.onload = initCanvas;
        }
    }
  }, [isMaskingEnv]); // Re-run when modal opens

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isMaskingEnv || !canvasRef.current) return;
      setIsDrawing(true);
      const rect = canvasRef.current.getBoundingClientRect();
      setLastPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDrawing || !isMaskingEnv || !canvasRef.current || !lastPos) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.lineWidth = brushSize;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; // Visible brush
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      setLastPos({ x, y });
  };

  const handleMouseUp = () => {
      setIsDrawing(false);
      setLastPos(null);
  };

  const handleSaveMask = () => {
      if(canvasRef.current) {
          // Create mask image: black background, white strokes
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = canvasRef.current.width;
          maskCanvas.height = canvasRef.current.height;
          const ctx = maskCanvas.getContext('2d');
          if(ctx) {
              ctx.fillStyle = 'black';
              ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
              // Composite the drawings from the visual canvas
              // Note: Visual canvas has rgba(255,255,255,0.8). We want pure white.
              // We can just draw the canvas content on top. 
              // To ensure it's solid white, we might need a threshold or composite op, 
              // but for now let's trust the drawing is sufficient or simple draw is enough.
              // Better approach: use the same paths? No, we have raster data now.
              ctx.drawImage(canvasRef.current, 0, 0); 
              
              // Simple threshold pass to ensure solid white
              const imageData = ctx.getImageData(0,0, maskCanvas.width, maskCanvas.height);
              const data = imageData.data;
              for(let i=0; i<data.length; i+=4) {
                  // If alpha is > 0 or pixel is bright, make it full white
                  if(data[i] > 10 || data[i+3] > 0) {
                      data[i] = 255;
                      data[i+1] = 255;
                      data[i+2] = 255;
                      data[i+3] = 255;
                  } else {
                      data[i] = 0;
                      data[i+1] = 0;
                      data[i+2] = 0;
                      data[i+3] = 255; // Solid black alpha
                  }
              }
              ctx.putImageData(imageData, 0, 0);
          }
          const maskData = maskCanvas.toDataURL('image/png');
          updateSettings('referenceImageEnvironmentMask', maskData);
          setIsMaskingEnv(false);
      }
  };

  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-800 h-full flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-neutral-800">
        <h1 className="text-2xl font-bold text-amber-500 flex items-center gap-2">
          <MonitorPlay size={24} />
          导演剪辑版
        </h1>
        <p className="text-xs text-neutral-500 mt-1">AI 分镜生成器 (Director's Cut)</p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Style Selection */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Palette size={14} /> 电影风格 / 调色
          </label>
          <select 
            value={settings.style}
            onChange={(e) => updateSettings('style', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          >
            {CINEMATIC_STYLES.map((style) => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Ratio size={14} /> 画幅比例 (Aspect Ratio)
          </label>
          <select 
            value={settings.aspectRatio}
            onChange={(e) => updateSettings('aspectRatio', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
            ))}
          </select>
        </div>

        {/* Lighting Option */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Sun size={14} /> 光影设定 (Lighting)
          </label>
          <select 
            value={settings.lighting}
            onChange={(e) => updateSettings('lighting', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          >
            {LIGHTING_OPTIONS.map((light) => (
              <option key={light} value={light}>{light}</option>
            ))}
          </select>
        </div>

        {/* Camera Position */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
             <Move3d size={14} /> 拍摄机位 (Position)
          </label>
          <select 
            value={settings.cameraPosition}
            onChange={(e) => updateSettings('cameraPosition', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          >
            {CAMERA_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Focal Length */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
             <Aperture size={14} /> 镜头焦距 (Lens)
          </label>
          <select 
            value={settings.focalLength}
            onChange={(e) => updateSettings('focalLength', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          >
            {FOCAL_LENGTHS.map((len) => (
              <option key={len} value={len}>{len}</option>
            ))}
          </select>
        </div>

        {/* Aperture (NEW) */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
             <CircleDot size={14} /> 镜头光圈 (Aperture)
          </label>
          <select 
            value={settings.aperture}
            onChange={(e) => updateSettings('aperture', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          >
            {APERTURE_OPTIONS.map((ap) => (
              <option key={ap} value={ap}>{ap}</option>
            ))}
          </select>
        </div>

        {/* Camera Angle */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
             <Camera size={14} /> 镜头角度 (Angle)
          </label>
          <select 
            value={settings.angle}
            onChange={(e) => updateSettings('angle', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          >
            {CAMERA_ANGLES.map((angle) => (
              <option key={angle} value={angle}>{angle}</option>
            ))}
          </select>
        </div>

        {/* Shot Size */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Settings size={14} /> 景别选择 (Shot Size)
          </label>
          <select 
            value={settings.shotSize}
            onChange={(e) => updateSettings('shotSize', e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
          >
            {SHOT_SIZES.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Reference Image - SPLIT into Front/Side/FullBody/Env */}
        <div className="space-y-3 pt-4 border-t border-neutral-800">
           <label className="text-xs font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon size={14} /> 视觉一致性 (Reference)
          </label>
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            上传角色视图或环境图，保持画面连贯。
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            
            {/* Front View */}
            <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'front')}
                  className="hidden" 
                  id="ref-upload-front"
                />
                {!settings.referenceImageFront ? (
                  <label 
                    htmlFor="ref-upload-front"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-neutral-800/50 transition-all text-center p-2"
                  >
                    <span className="text-[10px] text-neutral-400 font-bold mb-1">主角色正面</span>
                    <ImageIcon className="text-neutral-500 group-hover:text-amber-500" size={16} />
                  </label>
                ) : (
                  <div className="relative h-24 rounded-lg overflow-hidden border border-amber-500/50 shadow-lg shadow-black/50">
                    <img 
                      src={settings.referenceImageFront} 
                      alt="Front Ref" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <button 
                      onClick={() => onClearReference('front')}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors backdrop-blur-sm"
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-500/90 p-0.5 text-center">
                       <span className="text-[8px] text-black font-bold uppercase block">主角色正面</span>
                    </div>
                  </div>
                )}
            </div>

            {/* Side View */}
             <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'side')}
                  className="hidden" 
                  id="ref-upload-side"
                />
                {!settings.referenceImageSide ? (
                  <label 
                    htmlFor="ref-upload-side"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-neutral-800/50 transition-all text-center p-2"
                  >
                    <span className="text-[10px] text-neutral-400 font-bold mb-1">主角色侧面</span>
                    <ImageIcon className="text-neutral-500 group-hover:text-amber-500" size={16} />
                  </label>
                ) : (
                  <div className="relative h-24 rounded-lg overflow-hidden border border-amber-500/50 shadow-lg shadow-black/50">
                    <img 
                      src={settings.referenceImageSide} 
                      alt="Side Ref" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <button 
                      onClick={() => onClearReference('side')}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors backdrop-blur-sm"
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-neutral-700/90 p-0.5 text-center">
                       <span className="text-[8px] text-white font-bold uppercase block">主角色侧面</span>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Full Body View */}
          <div className="mt-2 relative group">
             <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'fullbody')}
                  className="hidden" 
                  id="ref-upload-fullbody"
                />
                {!settings.referenceImageFullBody ? (
                  <label 
                    htmlFor="ref-upload-fullbody"
                    className="flex items-center justify-center w-full h-16 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-neutral-800/50 transition-all gap-2"
                  >
                     <User className="text-neutral-500 group-hover:text-amber-500" size={16} />
                    <span className="text-[10px] text-neutral-400 font-bold">主角色全身/立绘</span>
                  </label>
                ) : (
                  <div className="relative h-20 rounded-lg overflow-hidden border border-amber-500/50 shadow-lg shadow-black/50">
                    <img 
                      src={settings.referenceImageFullBody} 
                      alt="Full Body Ref" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <button 
                      onClick={() => onClearReference('fullbody')}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors backdrop-blur-sm"
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-amber-600/90 p-0.5 text-center">
                       <span className="text-[8px] text-white font-bold uppercase block">主角色全身</span>
                    </div>
                  </div>
                )}
          </div>

          {/* NEW: Additional Characters (2 Slots) */}
          <div className="mt-4 pt-2 border-t border-neutral-800/50">
             <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2 mb-2">
               <Users size={12} /> 多角色参考 (Multi-Char)
             </label>
             <div className="grid grid-cols-2 gap-2">
                {/* Character 2 */}
                <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'char2')}
                      className="hidden" 
                      id="ref-upload-char2"
                    />
                    {!settings.referenceImageCharacter2 ? (
                      <label 
                        htmlFor="ref-upload-char2"
                        className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-neutral-800/50 transition-all text-center p-2"
                      >
                        <span className="text-[9px] text-neutral-400 font-bold mb-1">额外角色 2</span>
                        <User className="text-neutral-500 group-hover:text-amber-500" size={14} />
                      </label>
                    ) : (
                      <div className="relative h-20 rounded-lg overflow-hidden border border-neutral-600 shadow-lg">
                        <img 
                          src={settings.referenceImageCharacter2} 
                          alt="Char 2 Ref" 
                          className="w-full h-full object-cover opacity-80"
                        />
                        <button 
                          onClick={() => onClearReference('char2')}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors backdrop-blur-sm"
                        >
                          <Trash2 size={10} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-purple-900/80 p-0.5 text-center">
                          <span className="text-[8px] text-white font-bold uppercase block">角色 2</span>
                        </div>
                      </div>
                    )}
                </div>

                {/* Character 3 */}
                <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'char3')}
                      className="hidden" 
                      id="ref-upload-char3"
                    />
                    {!settings.referenceImageCharacter3 ? (
                      <label 
                        htmlFor="ref-upload-char3"
                        className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-neutral-800/50 transition-all text-center p-2"
                      >
                        <span className="text-[9px] text-neutral-400 font-bold mb-1">额外角色 3</span>
                        <User className="text-neutral-500 group-hover:text-amber-500" size={14} />
                      </label>
                    ) : (
                      <div className="relative h-20 rounded-lg overflow-hidden border border-neutral-600 shadow-lg">
                        <img 
                          src={settings.referenceImageCharacter3} 
                          alt="Char 3 Ref" 
                          className="w-full h-full object-cover opacity-80"
                        />
                        <button 
                          onClick={() => onClearReference('char3')}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors backdrop-blur-sm"
                        >
                          <Trash2 size={10} />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-purple-900/80 p-0.5 text-center">
                          <span className="text-[8px] text-white font-bold uppercase block">角色 3</span>
                        </div>
                      </div>
                    )}
                </div>
             </div>
          </div>

          {/* Environment View */}
          <div className="mt-2 relative group">
             <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'env')}
                  className="hidden" 
                  id="ref-upload-env"
                />
                {!settings.referenceImageEnvironment ? (
                  <label 
                    htmlFor="ref-upload-env"
                    className="flex items-center justify-center w-full h-16 border-2 border-dashed border-neutral-700 rounded-lg cursor-pointer hover:border-amber-500 hover:bg-neutral-800/50 transition-all gap-2"
                  >
                     <Mountain className="text-neutral-500 group-hover:text-amber-500" size={16} />
                    <span className="text-[10px] text-neutral-400 font-bold">场景/环境参考 (Environment)</span>
                  </label>
                ) : (
                  <div className="relative h-20 rounded-lg overflow-hidden border border-amber-500/50 shadow-lg shadow-black/50">
                    <img 
                      src={settings.referenceImageEnvironment} 
                      alt="Env Ref" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    
                    {/* Controls Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                         {/* Mask Button */}
                         <button 
                           onClick={() => setIsMaskingEnv(true)}
                           className="bg-neutral-800 hover:bg-amber-500 hover:text-black text-white p-1.5 rounded-full shadow-lg transition-colors border border-neutral-700"
                           title="指定角色位置 (Set Position Mask)"
                         >
                            <ScanFace size={14} />
                         </button>
                         {/* Delete Button */}
                         <button 
                           onClick={() => onClearReference('env')}
                           className="bg-neutral-800 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors border border-neutral-700"
                           title="清除 (Delete)"
                         >
                            <Trash2 size={14} />
                         </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-blue-900/90 p-0.5 text-center flex justify-center items-center gap-1">
                       <span className="text-[8px] text-white font-bold uppercase">场景环境</span>
                       {settings.referenceImageEnvironmentMask && (
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" title="Mask Active"></span>
                       )}
                    </div>
                  </div>
                )}
          </div>

        </div>

        {/* Export Button */}
         <div className="space-y-3 pt-4 border-t border-neutral-800">
            <button 
              onClick={onExport}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm group"
            >
               <FileDown size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
               导出 PDF 脚本 (Export PDF)
            </button>
         </div>

      </div>

      <div className="mt-auto p-6 border-t border-neutral-800">
         <div className="text-[10px] text-neutral-600">
          Powered by Gemini 2.5 Flash Image (Nano Banana)
         </div>
      </div>
      
      {/* Environmental Masking Modal */}
      {isMaskingEnv && settings.referenceImageEnvironment && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
               {/* Header */}
               <div className="h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-6">
                   <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ScanFace size={16} className="text-amber-500" />
                      指定角色位置 (Character Position Mask)
                   </h3>
                   <button onClick={() => setIsMaskingEnv(false)} className="text-neutral-500 hover:text-white transition-colors">
                      <X size={20} />
                   </button>
               </div>
               
               {/* Canvas Area */}
               <div className="flex-1 overflow-hidden relative bg-black flex items-center justify-center p-4">
                  <div className="relative shadow-2xl border border-neutral-800">
                      <img 
                        ref={imageRef}
                        src={settings.referenceImageEnvironment} 
                        className="max-h-[70vh] max-w-full object-contain block select-none"
                        draggable={false}
                        alt="Env Mask Ref"
                      />
                      <canvas 
                        ref={canvasRef}
                        className="absolute inset-0 cursor-crosshair touch-none"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      />
                  </div>
               </div>

               {/* Toolbar */}
               <div className="h-16 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between px-6 gap-4">
                   <div className="flex items-center gap-4 text-xs font-medium text-neutral-400">
                       <div className="flex items-center gap-2">
                          <Brush size={14} />
                          <span>笔刷大小</span>
                          <input 
                            type="range" 
                            min="10" 
                            max="100" 
                            value={brushSize} 
                            onChange={(e) => setBrushSize(Number(e.target.value))} 
                            className="w-24 accent-amber-500 h-1 bg-neutral-700 rounded-lg appearance-none"
                          />
                       </div>
                       <div className="w-px h-6 bg-neutral-800"></div>
                       <button 
                         onClick={() => {
                            if(canvasRef.current) {
                                const ctx = canvasRef.current.getContext('2d');
                                if(ctx) ctx.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
                            }
                         }}
                         className="flex items-center gap-1 hover:text-red-400 transition-colors"
                       >
                          <Eraser size={14} /> 清除 (Clear)
                       </button>
                   </div>

                   <div className="flex items-center gap-3">
                       <button 
                         onClick={() => setIsMaskingEnv(false)}
                         className="px-4 py-2 rounded-lg text-xs font-bold text-neutral-400 hover:text-white transition-colors"
                       >
                          取消
                       </button>
                       <button 
                         onClick={handleSaveMask}
                         className="px-6 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                       >
                          <Check size={14} />
                          保存遮罩位置
                       </button>
                   </div>
               </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Sidebar;