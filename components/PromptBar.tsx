import React, { useState, useRef, useEffect } from 'react';
import { Send, Clapperboard, Loader2, Layers } from 'lucide-react';

interface PromptBarProps {
  onGenerate: (prompts: string[]) => void;
  isGenerating: boolean;
  nextSlotIndex: number;
}

const PromptBar: React.FC<PromptBarProps> = ({ onGenerate, isGenerating, nextSlotIndex }) => {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Limit max height
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    // Split by newline or semicolon, filter empty strings
    const prompts = prompt
      .split(/[\n;]+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (prompts.length === 0) return;

    onGenerate(prompts);
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-neutral-800 bg-neutral-900 p-6">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute -top-10 left-0 text-xs text-neutral-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${nextSlotIndex < 9 ? 'bg-amber-500' : 'bg-red-500'}`}></span>
            {nextSlotIndex < 9 
              ? `下一个生成位置: 第 ${nextSlotIndex + 1} 格 (支持批量输入: 用回车或分号 ; 分隔)` 
              : "分镜板已满。请清除或重新生成已有画面。"}
          </div>
          
          <div className="relative flex items-center bg-neutral-950 border border-neutral-800 rounded-xl focus-within:ring-2 focus-within:ring-amber-500/50 focus-within:border-amber-500 transition-all shadow-inner">
            <div className="absolute left-4 top-4 text-neutral-500">
              <Clapperboard size={20} />
            </div>
            
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating || nextSlotIndex >= 9}
              placeholder={nextSlotIndex >= 9 ? "分镜板已满，请清理后继续。" : "描述场景... (输入多行或用分号分隔可批量生成)"}
              rows={1}
              className="w-full bg-transparent text-neutral-100 py-4 pl-12 pr-32 outline-none disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-600 resize-none overflow-hidden"
              style={{ minHeight: '56px' }}
            />

            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating || nextSlotIndex >= 9}
              className={`
                absolute right-2 top-2 bottom-2 px-6 rounded-lg font-medium text-sm flex items-center gap-2 transition-all my-auto h-auto
                ${!prompt.trim() || isGenerating || nextSlotIndex >= 9
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                  : 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'}
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  {prompt.split(/[\n;]+/).filter(s => s.trim()).length > 1 ? '批量生成' : '生成'} 
                  {prompt.split(/[\n;]+/).filter(s => s.trim()).length > 1 ? <Layers size={16} /> : <Send size={16} />}
                </>
              )}
            </button>
          </div>
          
          <div className="text-[10px] text-neutral-600 mt-2 text-right">
             Shift + Enter 换行
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptBar;