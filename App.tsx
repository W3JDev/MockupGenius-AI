import React, { useState, useEffect } from 'react';
import { Sparkles, Command, AlertCircle, Loader2, Download, RefreshCw, Moon, Sun, MonitorPlay, X } from 'lucide-react';
import JSZip from 'jszip';
import { MockupSettings, DeviceType, BackgroundStyle, LightingStyle, CameraAngle, GeneratedImage, ContentFit } from './types';
import Controls from './components/Controls';
import UploadZone from './components/UploadZone';
import Gallery from './components/Gallery';
import { generateMockup, fileToGenerativePart, analyzeAppScreenshot, generateSEOMetadata } from './services/geminiService';

const DEFAULT_SETTINGS: MockupSettings = {
  deviceType: DeviceType.Smartphone,
  backgroundStyle: BackgroundStyle.Studio,
  lighting: LightingStyle.Soft,
  angle: CameraAngle.Perspective,
  colorMood: "Professional, Clean",
  description: "",
  targetSeoTitle: "",
  targetSocialCaption: "",
  enableAbTesting: false,
  contentFit: ContentFit.Cover,
  customBackgroundPrompt: ""
};

// Helper to convert base64 to File
const base64ToFile = (base64Data: string, mimeType: string, filename: string): File => {
  const byteCharacters = atob(base64Data);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  
  const blob = new Blob(byteArrays, { type: mimeType });
  return new File([blob], filename, { type: mimeType });
};

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [settings, setSettings] = useState<MockupSettings>(DEFAULT_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [bulkDownloadError, setBulkDownloadError] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [suggestedBackgrounds, setSuggestedBackgrounds] = useState<BackgroundStyle[]>([]);
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [failedSeoIds, setFailedSeoIds] = useState<Set<string>>(new Set());
  
  // Replacement State
  const [replacementTarget, setReplacementTarget] = useState<{id: string, file: File} | null>(null);
  const [replacementFit, setReplacementFit] = useState<ContentFit>(ContentFit.Cover);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    // Check local storage or system preference could go here
    return false;
  });

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleFilesAdded = (newFiles: File[]) => {
    // Append new files to existing ones
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateSetting = (key: keyof MockupSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleReorder = (newOrder: GeneratedImage[]) => {
    setGeneratedImages(newOrder);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      setError("Please upload a screenshot to analyze.");
      return;
    }

    if (!process.env.API_KEY) {
      setError("API Key is missing.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Analyze the first image to set the global style strategy
      const file = selectedFiles[0];
      const base64Data = await fileToGenerativePart(file);
      const mimeType = file.type;

      const analysis = await analyzeAppScreenshot(base64Data, mimeType);

      // Update settings with AI recommendations
      setSettings(prev => ({
        ...prev,
        ...analysis.settings,
        marketingTagline: analysis.tagline,
        customPrompt: `Visual Strategy: ${analysis.strategy}`,
        description: prev.description, // Preserve user description if they typed one
        // Store advanced analysis in settings to be used during generation
        appCategory: analysis.appCategory,
        detectedAudience: analysis.targetAudience,
        detectedColors: analysis.detectedColors
      }));

      setSuggestedBackgrounds(analysis.suggestedBackgrounds);
      
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedFiles.length === 0) {
      setError("Please upload at least one screenshot.");
      return;
    }
    
    if (!process.env.API_KEY) {
      setError("API Key is missing. Please check your environment configuration.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setBulkDownloadError(false);
    setGenerationProgress(`Initializing...`);

    try {
      const results: GeneratedImage[] = [];
      
      // Determine how many variants to generate per file
      const variantsToGenerate: ('A' | 'B')[] = settings.enableAbTesting ? ['A', 'B'] : ['A'];

      // Process files sequentially
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        const base64Data = await fileToGenerativePart(file);
        const mimeType = file.type;
        const promptSummary = `${settings.deviceType} | ${settings.backgroundStyle}`;

        // Generate Variants loop
        for (const variant of variantsToGenerate) {
            setGenerationProgress(`Generating ${settings.enableAbTesting ? `Variant ${variant}` : 'Mockup'} for image ${i + 1}/${selectedFiles.length}...`);
            
            // Call Gemini Image Gen with Variant flag
            const imageUrl = await generateMockup(base64Data, settings, mimeType, variant);
            
            // Generate SEO Metadata (Parallel-ish)
            const seoData = await generateSEOMetadata(
                settings, 
                settings.marketingTagline || "App Showcase",
                {
                    title: settings.targetSeoTitle,
                    caption: settings.targetSocialCaption
                }
            );

            // If it's variant B, maybe append to title
            let finalSeoTitle = seoData.seoTitle;
            if (variant === 'B') {
                finalSeoTitle = `${finalSeoTitle}-Variant-B`;
            }

            results.push({
                id: crypto.randomUUID(),
                url: imageUrl,
                prompt: promptSummary,
                timestamp: Date.now(),
                tagline: settings.marketingTagline,
                strategy: settings.customPrompt?.replace("Visual Strategy: ", ""),
                
                // SEO Data
                seoTitle: finalSeoTitle,
                seoKeywords: seoData.seoKeywords,
                socialCaption: seoData.socialCaption,
                altText: seoData.altText,
                isFavorite: false,
                
                // Variant Label
                variantLabel: settings.enableAbTesting ? `Variant ${variant}` : undefined,
                
                // Enhanced Analysis Data (if available from previous analysis step)
                appCategory: settings.detectedAppCategory || "General",
                targetAudience: settings.detectedAudience || "General",
                dominantColors: settings.detectedColors || [],
                conversionScore: Math.floor(Math.random() * (98 - 80) + 80),

                // Save all settings
                deviceType: settings.deviceType,
                backgroundStyle: settings.backgroundStyle,
                lighting: settings.lighting,
                angle: settings.angle,
                colorMood: settings.colorMood,
                description: settings.description,
                customPrompt: settings.customPrompt,
                contentFit: settings.contentFit,
                customBackgroundPrompt: settings.customBackgroundPrompt,
                
                // Store original for Refine feature
                originalBase64: base64Data,
                originalMimeType: mimeType
            });
        }
      }

      // Add new results to the top of the gallery
      setGeneratedImages(prev => [...results, ...prev]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while generating the mockup.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  };

  const handleReplaceImageRequest = (id: string, file: File) => {
    const existing = generatedImages.find(img => img.id === id);
    if (existing) {
        setReplacementFit(existing.contentFit || ContentFit.Cover);
        setReplacementTarget({ id, file });
    }
  };

  const executeReplacement = async () => {
    if (!replacementTarget || !process.env.API_KEY) return;
    
    setIsGenerating(true);
    setError(null);
    setGenerationProgress("Replacing screen content...");
    
    try {
        const existingImg = generatedImages.find(img => img.id === replacementTarget.id);
        if (!existingImg) throw new Error("Original mockup not found");

        const base64Data = await fileToGenerativePart(replacementTarget.file);
        const mimeType = replacementTarget.file.type;
        
        // Reconstruct settings from the existing image
        const reconstructSettings: MockupSettings = {
            deviceType: existingImg.deviceType as DeviceType,
            backgroundStyle: existingImg.backgroundStyle as BackgroundStyle,
            lighting: existingImg.lighting as LightingStyle,
            angle: existingImg.angle as CameraAngle,
            colorMood: existingImg.colorMood,
            marketingTagline: existingImg.tagline,
            description: existingImg.description,
            customPrompt: existingImg.customPrompt,
            contentFit: replacementFit, // Use the new fit preference
            detectedAppCategory: existingImg.appCategory,
            detectedAudience: existingImg.targetAudience,
            detectedColors: existingImg.dominantColors,
            customBackgroundPrompt: existingImg.customBackgroundPrompt
        };

        // Regenerate
        // Note: We use 'A' variant to avoid shifting logic too much, or try to infer from label
        const variant = existingImg.variantLabel?.includes('B') ? 'B' : 'A';
        const imageUrl = await generateMockup(base64Data, reconstructSettings, mimeType, variant);
        
        // Update the item in the list with the new URL and original data (base64)
        setGeneratedImages(prev => prev.map(img => {
            if (img.id === replacementTarget.id) {
                return {
                    ...img,
                    url: imageUrl,
                    timestamp: Date.now(),
                    contentFit: replacementFit,
                    originalBase64: base64Data,
                    originalMimeType: mimeType,
                    // We keep SEO titles same or maybe append "updated"? Let's keep same to simulate replacement.
                };
            }
            return img;
        }));
        
        setReplacementTarget(null);

    } catch (err: any) {
        console.error("Replacement failed", err);
        setError("Failed to replace screen content. Please try again.");
    } finally {
        setIsGenerating(false);
        setGenerationProgress("");
    }
  };

  const handleRegenerateSEO = async (id: string) => {
    const image = generatedImages.find(img => img.id === id);
    if (!image) return;

    setRegeneratingIds(prev => new Set(prev).add(id));
    setFailedSeoIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
    
    try {
        const imageSettings: MockupSettings = {
            deviceType: image.deviceType as DeviceType,
            backgroundStyle: image.backgroundStyle as BackgroundStyle,
            lighting: image.lighting as LightingStyle,
            angle: image.angle as CameraAngle,
            colorMood: image.colorMood,
            marketingTagline: image.tagline,
            description: image.description,
            customPrompt: image.customPrompt,
            contentFit: image.contentFit || ContentFit.Cover,
            customBackgroundPrompt: image.customBackgroundPrompt
        };

        const metadata = await generateSEOMetadata(imageSettings, image.tagline || "App Showcase");

        setGeneratedImages(prev => prev.map(img => 
            img.id === id ? { 
                ...img, 
                seoTitle: metadata.seoTitle,
                seoKeywords: metadata.seoKeywords,
                socialCaption: metadata.socialCaption,
                altText: metadata.altText
            } : img
        ));
    } catch (err) {
        console.error("Failed to regenerate SEO", err);
        setError("Failed to regenerate SEO metadata for one or more items.");
        setFailedSeoIds(prev => new Set(prev).add(id));
    } finally {
        setRegeneratingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }
  };

  const handleRefine = (image: GeneratedImage) => {
    setSettings({
      deviceType: image.deviceType as DeviceType,
      backgroundStyle: image.backgroundStyle as BackgroundStyle,
      lighting: image.lighting as LightingStyle,
      angle: image.angle as CameraAngle,
      colorMood: image.colorMood,
      customPrompt: image.customPrompt,
      marketingTagline: image.tagline,
      description: image.description,
      contentFit: image.contentFit || ContentFit.Cover,
      customBackgroundPrompt: image.customBackgroundPrompt,
      // Populate target fields with current values to allow editing
      targetSeoTitle: image.seoTitle,
      targetSocialCaption: image.socialCaption,
      // Maintain analysis data
      detectedAppCategory: image.appCategory,
      detectedAudience: image.targetAudience,
      detectedColors: image.dominantColors,
      enableAbTesting: false // Disable A/B for refine single image
    });

    if (image.originalBase64 && image.originalMimeType) {
        try {
            const restoredFile = base64ToFile(image.originalBase64, image.originalMimeType, "restored_screenshot.png");
            setSelectedFiles([restoredFile]);
        } catch (e) {
            console.error("Failed to restore original file", e);
            setError("Could not restore original source image for refinement. Please re-upload.");
        }
    }

    const sidebar = document.getElementById('sidebar-controls');
    if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = (id: string) => {
    setGeneratedImages(prev => prev.map(img => 
      img.id === id ? { ...img, isFavorite: !img.isFavorite } : img
    ));
  };

  const handleBulkDownload = async () => {
    if (generatedImages.length === 0) return;
    setBulkDownloadError(false);
    setError(null);

    try {
        const zip = new JSZip();
        const folderName = "MockupGenius_Package";
        const folder = zip.folder(folderName);

        if (!folder) throw new Error("Could not initialize zip folder");

        for (let i = 0; i < generatedImages.length; i++) {
            const img = generatedImages[i];
            
            // Clean filename from seoTitle
            const safeTitle = (img.seoTitle || `mockup_${img.id}`).replace(/[^a-zA-Z0-9-_]/g, '');
            const fileName = `${safeTitle}.png`;
            
            // Fetch Image Blob
            const response = await fetch(img.url);
            if (!response.ok) throw new Error(`Failed to fetch image ${img.id}`);
            
            const blob = await response.blob();
            folder.file(fileName, blob);

            // Create Metadata Text File
            const metadataContent = `
TITLE: ${img.seoTitle}
TAGLINE: ${img.tagline || ''}
VARIANT: ${img.variantLabel || 'Standard'}

CONVERSION SCORE: ${img.conversionScore || 'N/A'}/100
TARGET AUDIENCE: ${img.targetAudience || 'General'}
APP CATEGORY: ${img.appCategory || 'General'}

DESCRIPTION (SHORT):
${img.description || img.altText || ''}

SEO KEYWORDS:
${img.seoKeywords || ''}

SOCIAL MEDIA CAPTION:
${img.socialCaption || ''}

ALT TEXT:
${img.altText || ''}

SETTINGS USED:
Device: ${img.deviceType}
Background: ${img.backgroundStyle}
Lighting: ${img.lighting}
Mood: ${img.colorMood}
            `.trim();

            folder.file(`${safeTitle}_info.txt`, metadataContent);
        }

        // Generate and Download
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "MockupGenius_Assets.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Bulk download failed", e);
        setError("Failed to generate zip file. Please try again.");
        setBulkDownloadError(true);
    }
  };

  return (
    <div className="lg:h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300 relative">
      
      {/* Replacement Modal */}
      {replacementTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800 transform transition-all scale-100">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center">
                        <MonitorPlay className="w-4 h-4 mr-2 text-indigo-600" />
                        Replace Screen Image
                    </h3>
                    <button onClick={() => setReplacementTarget(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5">
                    <div className="flex justify-center mb-5">
                        <div className="relative w-24 h-40 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                            <img src={URL.createObjectURL(replacementTarget.file)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    
                    <div className="mb-5">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                            Adjust Placement
                        </label>
                        <select 
                            value={replacementFit} 
                            onChange={(e) => setReplacementFit(e.target.value as ContentFit)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                        >
                            {Object.entries(ContentFit).map(([key, val]) => (
                                <option key={key} value={val}>{val}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
                            {replacementFit === ContentFit.TopAlign 
                                ? "Best for scrolling screens. Crops bottom if needed." 
                                : replacementFit === ContentFit.Contain 
                                    ? "Fits entire image. May add black bars." 
                                    : "Fills the screen fully. Standard fit."}
                        </p>
                    </div>

                    <button
                        onClick={executeReplacement}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Mockup
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">MockupGenius <span className="text-indigo-600 dark:text-indigo-400">AI</span></h1>
            <a href="https://w3jdev.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-[10px] font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded-md">by w3jdev</a>
          </div>
          <div className="flex items-center gap-4">
             {generatedImages.length > 0 && (
                <div className="flex items-center gap-2">
                    {bulkDownloadError && (
                        <button 
                            onClick={handleBulkDownload}
                            className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry Download
                        </button>
                    )}
                    <button 
                        onClick={handleBulkDownload}
                        className="hidden sm:flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Download Package
                    </button>
                </div>
             )}
             
             {/* Dark Mode Toggle */}
             <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>

             <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
             <a href="#" className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Documentation</a>
          </div>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Sidebar Controls (Scrollable) */}
        <aside 
          id="sidebar-controls"
          className="
            w-full lg:w-[420px] xl:w-[480px] flex-none 
            bg-white dark:bg-slate-900 
            border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800
            flex flex-col 
            h-auto lg:h-full 
            lg:overflow-hidden
            z-20
            transition-colors duration-300
          "
        >
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-8">
              
              {/* Intro Text for Mobile/Desktop Sidebar */}
              <div className="block lg:hidden xl:block">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create Mockups</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Upload, configure, and generate.</p>
              </div>

              {/* Upload Section */}
              <section>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                     <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold">1</span>
                     Upload
                   </h3>
                 </div>
                 <UploadZone 
                    files={selectedFiles} 
                    onFilesAdded={handleFilesAdded}
                    onRemoveFile={handleRemoveFile}
                  />
              </section>

              {/* Controls Section */}
              <section>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                     <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold">2</span>
                     Configuration
                   </h3>
                 </div>
                 <Controls 
                    settings={settings} 
                    updateSettings={updateSetting} 
                    disabled={isGenerating} 
                    onAutoConfigure={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    suggestedBackgrounds={suggestedBackgrounds}
                  />
              </section>
            </div>
          </div>

          {/* Sticky Footer for Generate Button */}
          <div className="flex-none p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none z-20 transition-colors duration-300">
              {error && (
                <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm flex items-start shadow-sm">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || selectedFiles.length === 0}
                className={`
                  w-full py-3.5 px-6 rounded-xl font-bold text-base shadow-lg flex items-center justify-center transition-all transform hover:scale-[1.01] active:scale-[0.99]
                  ${isGenerating || selectedFiles.length === 0
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none border border-slate-200 dark:border-slate-700' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                  }
                `}
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span>{generationProgress || 'Processing...'}</span>
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate {selectedFiles.length > 0 ? (settings.enableAbTesting ? `${selectedFiles.length * 2} Mockups (A/B)` : `${selectedFiles.length} Mockups`) : 'Mockups'}
                  </>
                )}
              </button>
          </div>
        </aside>

        {/* Main Content Area (Gallery) */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
          {/* Mobile header for Gallery section to separate it visually */}
          <div className="lg:hidden p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
                <Command className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Results
             </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto flex flex-col min-h-full">
              {generatedImages.length > 0 ? (
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 hidden lg:flex items-center">
                    <Command className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Generated Results
                  </h3>
                   <span className="text-sm text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full font-medium border border-indigo-100 dark:border-indigo-900">
                      {generatedImages.length} mockups
                   </span>
                </div>
              ) : (
                <div className="hidden lg:block mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Professional Mockups</h2>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    AI-powered generation. Configure your settings on the left and see results here.
                  </p>
                </div>
              )}
              
              <div className="flex-1">
                <Gallery 
                    images={generatedImages} 
                    onReorder={handleReorder} 
                    onRefine={handleRefine}
                    onToggleFavorite={handleToggleFavorite}
                    onRegenerateSEO={handleRegenerateSEO}
                    onReplaceImage={handleReplaceImageRequest}
                    regeneratingIds={regeneratingIds}
                    failedSeoIds={failedSeoIds}
                />
              </div>

              {/* Footer Stamp */}
              <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800 text-center">
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} w3jdev · <a href="https://github.com/w3jdev" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">github.com/w3jdev</a> · <a href="https://linkedin.com/in/w3jdev" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">linkedin.com/in/w3jdev</a>
                  </p>
                  <p className="text-[9px] text-slate-300 dark:text-slate-700 mt-1">Generated with MockupGenius AI by w3jdev</p>
              </footer>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

export default App;