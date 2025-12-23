import React from 'react';
import { Settings, Image as ImageIcon, Trash2, Camera, Palette, MonitorPlay, Ratio, Move3d, Sun, Aperture, Mountain, FileDown, User, CircleDot } from 'lucide-react';
import { CINEMATIC_STYLES, CAMERA_ANGLES, CAMERA_POSITIONS, SHOT_SIZES, ASPECT_RATIOS, LIGHTING_OPTIONS, FOCAL_LENGTHS, APERTURE_OPTIONS } from '../constants';
import { GlobalSettings } from '../types';

interface SidebarProps {
  settings: GlobalSettings;
  updateSettings: (key: keyof GlobalSettings, value: any) => void;
  onClearReference: (type: 'front' | 'side' | 'fullbody' | 'env') => void;
  onExport: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ settings, updateSettings, onClearReference, onExport }) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side' | 'fullbody' | 'env') => {
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
        }
      };
      reader.readAsDataURL(file);
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
            <ImageIcon size={14} /> 视觉一致性控制 (Reference)
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
                    <span className="text-[10px] text-neutral-400 font-bold mb-1">角色正面</span>
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
                       <span className="text-[8px] text-black font-bold uppercase block">角色正面</span>
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
                    <span className="text-[10px] text-neutral-400 font-bold mb-1">角色侧面</span>
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
                       <span className="text-[8px] text-white font-bold uppercase block">角色侧面</span>
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
                    <span className="text-[10px] text-neutral-400 font-bold">角色全身/立绘 (Full Body)</span>
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
                       <span className="text-[8px] text-white font-bold uppercase block">角色全身</span>
                    </div>
                  </div>
                )}
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
                    <button 
                      onClick={() => onClearReference('env')}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full transition-colors backdrop-blur-sm"
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-900/80 p-0.5 text-center">
                       <span className="text-[8px] text-white font-bold uppercase block">场景环境</span>
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
    </div>
  );
};

export default Sidebar;