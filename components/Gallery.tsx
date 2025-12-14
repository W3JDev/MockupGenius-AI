import React, { useRef, useState, useMemo } from 'react';
import { Download, ZoomIn, GripHorizontal, Sparkles, Filter, X, RefreshCcw, Star, Info, ChevronDown, ChevronUp, Copy, Wand2, Loader2, Award, AlertTriangle, RefreshCw, ImageOff, TrendingUp, Palette, ImagePlus } from 'lucide-react';
import { GeneratedImage, DeviceType, BackgroundStyle, LightingStyle } from '../types';

interface GalleryProps {
  images: GeneratedImage[];
  onReorder: (images: GeneratedImage[]) => void;
  onRefine: (image: GeneratedImage) => void;
  onToggleFavorite: (id: string) => void;
  onRegenerateSEO: (id: string) => void;
  onReplaceImage: (id: string, file: File) => void;
  regeneratingIds: Set<string>;
  failedSeoIds: Set<string>;
}

const getMoodBorderColor = (mood?: string) => {
    if (!mood) return 'border-slate-200 dark:border-slate-700';
    const m = mood.toLowerCase();
    if (m.includes('blue') || m.includes('professional') || m.includes('tech')) return 'border-blue-300 dark:border-blue-700';
    if (m.includes('warm') || m.includes('gold') || m.includes('orange')) return 'border-orange-300 dark:border-orange-700';
    if (m.includes('cool') || m.includes('cyan')) return 'border-cyan-300 dark:border-cyan-700';
    if (m.includes('dark') || m.includes('black')) return 'border-slate-600 dark:border-slate-500';
    if (m.includes('neon') || m.includes('cyber') || m.includes('fuchsia')) return 'border-fuchsia-400 dark:border-fuchsia-700';
    if (m.includes('nature') || m.includes('earth') || m.includes('wood')) return 'border-stone-300 dark:border-stone-600';
    return 'border-slate-200 dark:border-slate-700';
};

const getScoreColor = (score?: number) => {
    if (!score) return 'bg-slate-100 text-slate-600';
    if (score >= 90) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (score >= 75) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
};

const ImageWithSkeleton = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center border-b border-slate-100 dark:border-slate-700 select-none">
            <ImageOff className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-[10px] font-medium uppercase tracking-wider">Failed to load</span>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
       {!loaded && (
         <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center z-10">
             <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600 opacity-50" />
         </div>
       )}
       <img 
         src={src} 
         alt={alt} 
         className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-all duration-700 ease-out`} 
         onLoad={() => setLoaded(true)} 
         onError={() => setError(true)}
       />
    </div>
  )
}

const Gallery: React.FC<GalleryProps> = ({ images, onReorder, onRefine, onToggleFavorite, onRegenerateSEO, onReplaceImage, regeneratingIds, failedSeoIds }) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // File replacement logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetReplaceId, setTargetReplaceId] = useState<string | null>(null);

  const [filterDevice, setFilterDevice] = useState<string>('');
  const [filterBackground, setFilterBackground] = useState<string>('');
  const [filterLighting, setFilterLighting] = useState<string>('');

  const filteredImages = useMemo(() => {
    return images.filter(img => {
      const matchesDevice = !filterDevice || img.deviceType === filterDevice;
      const matchesBg = !filterBackground || img.backgroundStyle === filterBackground;
      const matchesLighting = !filterLighting || img.lighting === filterLighting;
      return matchesDevice && matchesBg && matchesLighting;
    });
  }, [images, filterDevice, filterBackground, filterLighting]);

  const hasFilters = filterDevice || filterBackground || filterLighting;

  const handleSort = () => {
    if (hasFilters) return;
    if (dragItem.current === null || dragOverItem.current === null) return;
    const _images = [...images];
    const draggedItemContent = _images.splice(dragItem.current, 1)[0];
    _images.splice(dragOverItem.current, 0, draggedItemContent);
    onReorder(_images);
    dragItem.current = dragOverItem.current;
  };

  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `mockup-${id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setFilterDevice('');
    setFilterBackground('');
    setFilterLighting('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const triggerReplace = (id: string) => {
    setTargetReplaceId(id);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && targetReplaceId) {
        onReplaceImage(targetReplaceId, e.target.files[0]);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
        <Sparkles className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Generated mockups will appear here</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start by uploading a screenshot on the left</p>
      </div>
    );
  }

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Filter Bar */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center sticky top-0 z-10 transition-colors">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mr-2">
          <Filter className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        
        <div className="flex flex-wrap gap-2 flex-1">
          <select 
            value={filterDevice} 
            onChange={(e) => setFilterDevice(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <option value="">All Devices</option>
            {Object.entries(DeviceType).map(([key, val]) => (
              <option key={key} value={val}>{key}</option>
            ))}
          </select>

          <select 
            value={filterBackground} 
            onChange={(e) => setFilterBackground(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <option value="">All Backgrounds</option>
            {Object.entries(BackgroundStyle).map(([key, val]) => (
              <option key={key} value={val}>{key}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button 
            onClick={clearFilters}
            className="flex items-center text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium px-2 py-1"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 animate-fade-in pb-12">
          {filteredImages.map((img, index) => {
            const moodBorderColor = getMoodBorderColor(img.colorMood);

            return (
                <div 
                  key={img.id}
                  draggable={!hasFilters}
                  onDragStart={(e) => {
                    if (hasFilters) { e.preventDefault(); return; }
                    dragItem.current = index;
                    e.dataTransfer.effectAllowed = 'move';
                    (e.target as HTMLElement).style.opacity = '0.5';
                  }}
                  onDragEnter={(e) => {
                    if (hasFilters) return;
                    dragOverItem.current = index;
                    e.preventDefault();
                    handleSort();
                  }}
                  onDragOver={(e) => { if (hasFilters) return; e.preventDefault(); }} 
                  onDragEnd={(e) => { if (hasFilters) return; (e.target as HTMLElement).style.opacity = '1'; }}
                  className={`
                    group relative rounded-2xl overflow-hidden transition-all duration-300 flex flex-col 
                    ${!hasFilters ? 'cursor-move' : ''}
                    ${img.isFavorite ? 'border-2' : 'border'}
                    ${moodBorderColor}
                    ${img.isFavorite 
                      ? 'bg-indigo-50/30 dark:bg-indigo-900/30 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20 shadow-xl scale-[1.01] z-10' 
                      : 'bg-white dark:bg-slate-900 hover:shadow-md'
                    }
                  `}
                >
                  {/* Primary Asset Badge */}
                  {img.isFavorite && (
                    <div className="absolute top-0 left-0 right-0 z-20 flex justify-center -mt-3">
                      <div className="bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        Primary Asset
                      </div>
                    </div>
                  )}

                  {/* Image Container */}
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <ImageWithSkeleton
                      src={img.url}
                      alt={img.altText || "Generated Mockup"}
                      className="w-full h-full object-cover group-hover:scale-105 pointer-events-none"
                    />
                    
                    {/* Favorite Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(img.id); }}
                        className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all transform hover:scale-110 z-10 
                            ${img.isFavorite 
                                ? 'bg-indigo-500 dark:bg-indigo-500 text-white ring-2 ring-white dark:ring-slate-800' 
                                : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 dark:text-slate-300 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-900'
                            }`}
                        title={img.isFavorite ? "Unmark as Primary" : "Mark as Primary Asset"}
                    >
                        <Star className={`w-4 h-4 ${img.isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* Conversion Score Badge (New) */}
                    {img.conversionScore && (
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-md shadow-sm border text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${getScoreColor(img.conversionScore)}`}>
                            <TrendingUp className="w-3 h-3" />
                            Score: {img.conversionScore}/100
                        </div>
                    )}

                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                       <div className="flex gap-2">
                         <button 
                          onClick={() => triggerReplace(img.id)}
                          className="bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-slate-900 dark:text-white px-4 py-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                          title="Replace the screen image but keep this style"
                         >
                           <ImagePlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                           <span className="text-xs font-bold">Replace Screen</span>
                         </button>
                         <button 
                          onClick={() => onRefine(img)}
                          className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-4 py-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                          title="Use these settings to create new variations"
                         >
                           <RefreshCcw className="w-4 h-4" />
                           <span className="text-xs font-bold">Refine</span>
                         </button>
                       </div>
                       <div className="absolute bottom-4 right-4 flex gap-2">
                         <button 
                          onClick={() => handleDownload(img.url, img.id)}
                          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                          title="Download high-res PNG"
                         >
                           <Download className="w-5 h-5" />
                         </button>
                         <button 
                          onClick={() => window.open(img.url, '_blank')}
                          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                          title="Open full size"
                         >
                           <ZoomIn className="w-5 h-5" />
                         </button>
                       </div>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className={`p-4 flex flex-col flex-grow border-t transition-colors ${img.isFavorite ? 'bg-indigo-50/20 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/50' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 mr-2">
                             {img.seoTitle ? (
                                 <h4 className={`text-sm font-bold leading-tight mb-1 line-clamp-2 ${img.isFavorite ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                     {img.seoTitle}
                                 </h4>
                             ) : (
                                 <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight mb-1">
                                     {img.tagline || img.prompt}
                                 </h4>
                             )}
                             <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{img.deviceType}</p>
                        </div>
                    </div>
                    
                    {/* Insights Summary (Colors & Audience) */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                            {img.dominantColors && img.dominantColors.map((color, i) => (
                                <div key={i} className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm" style={{ backgroundColor: color }} title={color}></div>
                            ))}
                        </div>
                        {img.appCategory && (
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                {img.appCategory}
                            </span>
                        )}
                    </div>

                    {/* Expandable Metadata Section */}
                    <div className={`overflow-hidden transition-all duration-300 ${expandedId === img.id ? 'max-h-[500px]' : 'max-h-0'}`}>
                        <div className="pt-2 pb-4 space-y-3 text-xs border-t border-slate-50 dark:border-slate-800 mt-2">
                            
                            {/* New Psychological Insights */}
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="block text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold mb-1">Target Audience</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{img.targetAudience || 'General'}</span>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="block text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold mb-1">Psychology</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{img.colorMood}</span>
                                </div>
                            </div>

                            {failedSeoIds.has(img.id) && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 p-2 rounded-lg flex items-center justify-between">
                                    <span className="text-[10px] font-medium flex items-center">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        SEO Generation Failed
                                    </span>
                                    <button 
                                      onClick={() => onRegenerateSEO(img.id)}
                                      className="text-[10px] font-bold underline hover:text-red-800 dark:hover:text-red-300"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                            
                            {img.seoKeywords && (
                                <div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Keywords:</span>
                                    <div className="flex flex-wrap gap-1">
                                        {img.seoKeywords.split(',').slice(0,5).map((kw, i) => (
                                            <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{kw.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {img.socialCaption && (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Caption:</span>
                                        <button onClick={() => copyToClipboard(img.socialCaption!)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300" title="Copy">
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 italic leading-relaxed bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">
                                        {img.socialCaption}
                                    </p>
                                </div>
                            )}

                            <div className="pt-2">
                               <button 
                                 onClick={() => onRegenerateSEO(img.id)}
                                 disabled={regeneratingIds.has(img.id)}
                                 className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all border
                                   ${regeneratingIds.has(img.id) 
                                     ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-400 border-indigo-100 dark:border-indigo-900 cursor-wait' 
                                     : 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700'
                                   }`}
                               >
                                  {regeneratingIds.has(img.id) ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                      Regenerating Metadata...
                                    </>
                                  ) : (
                                    <>
                                      <Wand2 className="w-3 h-3 mr-2" />
                                      {failedSeoIds.has(img.id) ? 'Retry Generation' : 'Generate New SEO Info'}
                                    </>
                                  )}
                               </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-auto flex items-center justify-between pt-2">
                       <button 
                            onClick={() => setExpandedId(expandedId === img.id ? null : img.id)}
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1"
                       >
                           {expandedId === img.id ? (
                               <>Hide Insights <ChevronUp className="w-3 h-3" /></>
                           ) : (
                               <>View Insights <ChevronDown className="w-3 h-3" /></>
                           )}
                       </button>
                       <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {new Date(img.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>
                </div>
            );
          })}
        </div>
    </div>
  );
};

export default Gallery;
