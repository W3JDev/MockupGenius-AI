
import React from 'react';
import { Settings2, Smartphone, Sun, Camera, Palette, Image as ImageIcon, Wand2, Loader2, Quote, AlignLeft, Sparkles, Type, Info, PenLine, SplitSquareHorizontal, Move, MonitorPlay } from 'lucide-react';
import { DeviceType, BackgroundStyle, LightingStyle, CameraAngle, MockupSettings, ContentFit } from '../types';

interface ControlsProps {
  settings: MockupSettings;
  updateSettings: (key: keyof MockupSettings, value: any) => void;
  disabled: boolean;
  onAutoConfigure: () => void;
  isAnalyzing: boolean;
  suggestedBackgrounds: BackgroundStyle[];
}

const COLOR_PRESETS = [
  "Vibrant",
  "Muted",
  "Professional Blue",
  "Warm Tones",
  "Cool Gradients",
  "Dark Mode",
  "Pastel",
  "Monochrome",
  "Cyberpunk Neon",
  "Earthy & Natural"
];

const Tooltip = ({ content }: { content: string }) => (
  <div className="group relative ml-1.5 inline-flex items-center">
    <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-help transition-colors" />
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-900/95 dark:bg-white/95 backdrop-blur-sm text-white dark:text-slate-900 text-[11px] leading-relaxed rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 text-center shadow-xl border border-white/10 dark:border-slate-900/10 pointer-events-none">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-white/95" />
    </div>
  </div>
);

const Controls: React.FC<ControlsProps> = ({ 
  settings, 
  updateSettings, 
  disabled, 
  onAutoConfigure, 
  isAnalyzing, 
  suggestedBackgrounds 
}) => {
  
  const SelectGroup = ({ 
    label, 
    icon: Icon, 
    value, 
    options, 
    field,
    tooltip
  }: { 
    label: string; 
    icon: any; 
    value: string; 
    options: Record<string, string>; 
    field: keyof MockupSettings;
    tooltip: string; 
  }) => {
    
    // Sort options so 'Auto' and 'Custom' are prioritised
    const sortedEntries = Object.entries(options).sort(([keyA, valA], [keyB, valB]) => {
        if (keyA === 'Auto') return -1;
        if (keyB === 'Auto') return 1;
        if (keyA === 'Custom') return -0.5; // Put custom second
        if (keyB === 'Custom') return 0.5;
        return 0;
    });

    return (
        <div className="mb-5">
        <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Icon className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
            {label}
            <Tooltip content={tooltip} />
        </label>
        <div className="grid grid-cols-1 gap-2">
            <select
            value={value}
            onChange={(e) => updateSettings(field, e.target.value)}
            disabled={disabled || isAnalyzing}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
            {sortedEntries.map(([key, val]) => (
                <option key={key} value={val}>
                {key === 'Auto' ? '✨ AI Auto-Select (Best Match)' : key === 'Custom' ? '🎨 Custom Text Prompt (AI Generated)' : key}
                </option>
            ))}
            </select>
        </div>
        </div>
    );
  };

  const getKeyByValue = (enumObj: any, value: string) => {
    return Object.keys(enumObj).find(key => enumObj[key] === value);
  };

  return (
    <div className="h-full">
      {/* AI Magic Button */}
      <div className="mb-8">
        <button
          onClick={onAutoConfigure}
          disabled={disabled || isAnalyzing}
          className={`
            w-full relative overflow-hidden group bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-4 rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition-all transform hover:-translate-y-0.5
            ${(disabled || isAnalyzing) ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          <div className="relative z-10 flex items-center justify-center font-semibold text-sm">
             {isAnalyzing ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                 Analyzing UI...
               </>
             ) : (
               <>
                 <Wand2 className="w-4 h-4 mr-2 animate-pulse" />
                 Auto-Configure Best Style
               </>
             )}
          </div>
          {/* Shimmer effect */}
          {!isAnalyzing && !disabled && (
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
          )}
        </button>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center uppercase tracking-wide font-medium flex items-center justify-center gap-1">
          Powered by Gemini 2.5 Vision
          <Tooltip content="Gemini analyzes your screenshot to automatically suggest the best device, background, and lighting settings." />
        </p>
      </div>

      <div className="space-y-1">
        
        {/* Marketing Tagline Input */}
        <div className="mb-5">
            <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Quote className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                Marketing Tagline
                <Tooltip content="The headline of your image. We use this to understand the 'vibe' and generating relevant filenames." />
            </label>
            <input
                type="text"
                value={settings.marketingTagline || ''}
                onChange={(e) => updateSettings('marketingTagline', e.target.value)}
                disabled={disabled || isAnalyzing}
                placeholder="e.g. Experience the Future"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:opacity-50 shadow-sm transition-colors"
            />
        </div>

        {/* Description Input */}
        <div className="mb-5">
            <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <AlignLeft className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                Description (Optional)
                <Tooltip content="Specific instructions for the AI, e.g., 'Place on a wooden desk next to a latte' or 'Add blue neon accents'." />
            </label>
            <textarea
                value={settings.description || ''}
                onChange={(e) => updateSettings('description', e.target.value)}
                disabled={disabled || isAnalyzing}
                placeholder="Describe your desired mockup... (e.g., 'Sitting on a coffee shop table next to a latte')"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:opacity-50 shadow-sm min-h-[80px] resize-y transition-colors"
            />
        </div>

        {/* A/B Test Toggle */}
        <div className="mb-6 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
           <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                  <SplitSquareHorizontal className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  Enable A/B Testing
                  <Tooltip content="Automatically generates 2 variations for each screenshot (Variant A & Variant B) with slightly different angles or lighting to help you choose the best one." />
              </label>
              <div className="relative inline-block w-10 h-6 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    name="abTesting" 
                    id="abTesting" 
                    checked={!!settings.enableAbTesting}
                    onChange={(e) => updateSettings('enableAbTesting', e.target.checked)}
                    disabled={disabled}
                    className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-indigo-600 transition-all duration-300 top-1 left-1 checked:left-[1.1rem]"
                  />
                  <label htmlFor="abTesting" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer border ${settings.enableAbTesting ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-300 dark:bg-slate-700 border-slate-300 dark:border-slate-700'}`}></label>
              </div>
           </div>
           {settings.enableAbTesting && (
               <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-2 leading-tight">
                   Generating 2x mockups per image.
               </p>
           )}
        </div>

        <SelectGroup
          label="Device Frame"
          icon={Smartphone}
          value={settings.deviceType}
          options={DeviceType}
          field="deviceType"
          tooltip="Choose the hardware that frames your screenshot. 'Auto' detects if your image is mobile (Portrait) or desktop (Landscape)."
        />

        {/* Content Fit Control */}
        <SelectGroup
          label="Screen Content Placement"
          icon={MonitorPlay}
          value={settings.contentFit || ContentFit.Cover}
          options={ContentFit}
          field="contentFit"
          tooltip="Controls how the screenshot fits inside the device. Use 'Top Align' for long scrolling screenshots."
        />

        {/* Background Selection */}
        <div className="mb-5">
            <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <ImageIcon className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                Background Scene
                <Tooltip content="The environment behind the device. Choose 'Custom Text Prompt' to write your own scene description." />
            </label>
            <select
                value={settings.backgroundStyle}
                onChange={(e) => updateSettings('backgroundStyle', e.target.value)}
                disabled={disabled || isAnalyzing}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all mb-2"
            >
                <option value={BackgroundStyle.Auto}>✨ AI Auto-Select (Complimentary Vibe)</option>
                <option value={BackgroundStyle.Custom}>🎨 Custom Text Prompt (AI Generated)</option>
                {Object.entries(BackgroundStyle)
                    .filter(([key]) => key !== 'Auto' && key !== 'Custom')
                    .map(([key, val]) => (
                    <option key={key} value={val}>
                        {key}
                    </option>
                ))}
            </select>
            
            {/* Conditional Custom Prompt Input */}
            {settings.backgroundStyle === BackgroundStyle.Custom && (
                 <div className="animate-fade-in mt-2 mb-3">
                     <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                        Describe your custom scene
                     </label>
                     <textarea
                        value={settings.customBackgroundPrompt || ''}
                        onChange={(e) => updateSettings('customBackgroundPrompt', e.target.value)}
                        disabled={disabled || isAnalyzing}
                        placeholder="e.g. A cozy coffee shop table with morning sunlight hitting a ceramic cup..."
                        className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 min-h-[60px]"
                    />
                 </div>
            )}
            
            {/* Gemini Suggestions */}
            {suggestedBackgrounds.length > 0 && settings.backgroundStyle !== BackgroundStyle.Custom && (
                <div className="animate-fade-in p-3 bg-violet-50/50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-900/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2 flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Gemini Suggestions
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedBackgrounds.map((bg, idx) => {
                            const label = getKeyByValue(BackgroundStyle, bg) || "Variant";
                            const isSelected = settings.backgroundStyle === bg;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => updateSettings('backgroundStyle', bg)}
                                    disabled={disabled || isAnalyzing}
                                    className={`
                                        text-xs px-2 py-1 rounded-md border transition-all
                                        ${isSelected 
                                            ? 'bg-violet-600 border-violet-600 text-white font-medium shadow-sm' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-400'
                                        }
                                    `}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>

        <SelectGroup
          label="Lighting"
          icon={Sun}
          value={settings.lighting}
          options={LightingStyle}
          field="lighting"
          tooltip="Determines shadow hardness and direction. 'Soft' is safe and commercial. 'Dramatic' has high contrast shadows. 'Neon' adds colored rim lights."
        />

        <SelectGroup
          label="Camera Angle"
          icon={Camera}
          value={settings.angle}
          options={CameraAngle}
          field="angle"
          tooltip="The viewpoint. 'Perspective' (3/4 view) shows depth. 'Front' is flat and symmetrical. 'Floating' adds levitation magic."
        />

        {/* Color Mood with Datalist */}
        <div className="mb-5">
          <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            <Palette className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
            Color Mood
            <Tooltip content="The color palette/filter applied. Can be a specific color (e.g. 'Blue') or a feeling (e.g. 'Cozy', 'Corporate')." />
          </label>
          <div className="relative">
            <input
                type="text"
                list="color-presets"
                value={settings.colorMood}
                onChange={(e) => updateSettings('colorMood', e.target.value)}
                disabled={disabled || isAnalyzing}
                placeholder="e.g., Professional Blue"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:opacity-50 shadow-sm transition-colors"
            />
            <datalist id="color-presets">
                {COLOR_PRESETS.map((preset) => (
                    <option key={preset} value={preset} />
                ))}
            </datalist>
          </div>
        </div>

        <hr className="my-6 border-slate-200 dark:border-slate-700" />

        {/* Metadata Refinement Section */}
        <div>
            <div className="flex items-center gap-2 mb-4">
                <PenLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Content Refinement</h3>
            </div>
            
            <div className="mb-5">
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Custom SEO Title
                    <Tooltip content="Forces the filename and title of the generated image. Useful for 'Keywords-BrandName.png' formats." />
                </label>
                <input
                    type="text"
                    value={settings.targetSeoTitle || ''}
                    onChange={(e) => updateSettings('targetSeoTitle', e.target.value)}
                    disabled={disabled || isAnalyzing}
                    placeholder="Enter custom title or leave empty..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:opacity-50 shadow-sm transition-colors"
                />
            </div>
            
            <div className="mb-5">
                <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Custom Social Caption
                    <Tooltip content="Forces the social media caption text. Use this for specific hashtags or campaign messaging." />
                </label>
                <textarea
                    value={settings.targetSocialCaption || ''}
                    onChange={(e) => updateSettings('targetSocialCaption', e.target.value)}
                    disabled={disabled || isAnalyzing}
                    placeholder="Enter custom caption or leave empty for AI generation..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 disabled:opacity-50 shadow-sm min-h-[60px] transition-colors"
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default Controls;
