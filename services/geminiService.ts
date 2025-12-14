import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { MockupSettings, DeviceType, BackgroundStyle, LightingStyle, CameraAngle, ContentFit } from "../types";

// Initialize Gemini Client
const API_KEY = process.env.API_KEY || "AIzaSyAJG-uB5zhfftJtcA0y2Pbl-2q_BU59FjI";
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Helper to pause execution
 */
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retries an async operation with exponential backoff if a 503 Overloaded error occurs.
 */
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 2000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const status = error.status || error.response?.status;
      const message = error.message?.toLowerCase() || '';

      const isRetryable = 
        status === 503 || 
        status === 429 ||
        message.includes('503') || 
        message.includes('429') ||
        message.includes('overloaded') ||
        message.includes('resource exhausted') ||
        message.includes('quota');

      if (isRetryable && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Gemini API busy (Attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
      
      throw error;
    }
  }
  throw lastError;
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes the screenshot using Gemini 2.5 Flash to suggest the best marketing style.
 */
export const analyzeAppScreenshot = async (
  imageBase64: string,
  mimeType: string
): Promise<{
  settings: Partial<MockupSettings>;
  strategy: string;
  tagline: string;
  suggestedBackgrounds: BackgroundStyle[];
  appCategory: string;
  targetAudience: string;
  detectedColors: string[];
  conversionScore: number;
  suggestedProps: string[];
}> => {
  try {
    const model = "gemini-2.5-flash";

    const prompt = `
      You are a Chief Marketing Officer (CMO) and Creative Director for a luxury design agency.
      
      Analyze this UI screenshot to create an "Award-Winning" marketing mockup.
      
      1. **Categorization**: Exact Industry (e.g., "Premium Fintech", "Gourmet F&B", "SaaS Enterprise").
      2. **Audience**: Who is the high-value buyer? (e.g., "Affluent Foodies", "C-Suite Executives").
      3. **Visual Psychology**: Top 3 hex colors. What is the "Vibe"? (e.g., "Warm Luxury", "Cool Professional", "Cyberpunk").
      4. **Conversion Score**: 0-100 based on UI clarity and premium feel.
      5. **Contextual Storytelling (CRITICAL)**: Suggest 3 specific "Premium Props" to place in the background (blurred) that tell a story.
         - F&B: "Crystal wine glass", "Artisan bread", "Linen napkin".
         - Fintech: "Montblanc pen", "Leather wallet", "Espresso cup".
         - SaaS: "Minimalist plant", "Ceramic coffee mug", "Designer glasses".
      
      Map suggestions to these Enum values:
      DeviceTypes: ${Object.values(DeviceType).join(", ")}
      BackgroundStyles: ${Object.values(BackgroundStyle).join(", ")}
      LightingStyles: ${Object.values(LightingStyle).join(", ")}
      CameraAngles: ${Object.values(CameraAngle).join(", ")}

      Return a JSON object.
    `;

    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageBase64 } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deviceType: { type: Type.STRING },
            backgroundStyle: { type: Type.STRING },
            suggestedBackgrounds: { type: Type.ARRAY, items: { type: Type.STRING } },
            lighting: { type: Type.STRING },
            angle: { type: Type.STRING },
            colorMood: { type: Type.STRING },
            marketingTagline: { type: Type.STRING },
            visualStrategy: { type: Type.STRING },
            appCategory: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            detectedColors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of Hex Codes" },
            conversionScore: { type: Type.INTEGER },
            suggestedProps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of 3 premium prop strings" }
          },
          required: ["deviceType", "backgroundStyle", "lighting", "angle", "colorMood", "marketingTagline", "visualStrategy", "suggestedBackgrounds", "appCategory", "targetAudience", "detectedColors", "conversionScore", "suggestedProps"]
        }
      }
    }));

    const result = JSON.parse(response.text || "{}");

    const getBackgroundEnum = (val: string): BackgroundStyle => {
        return Object.values(BackgroundStyle).includes(val as BackgroundStyle) 
            ? val as BackgroundStyle 
            : BackgroundStyle.Gradient;
    };

    return {
      settings: {
        deviceType: (Object.values(DeviceType).includes(result.deviceType) ? result.deviceType : DeviceType.Smartphone) as DeviceType,
        backgroundStyle: getBackgroundEnum(result.backgroundStyle),
        lighting: (Object.values(LightingStyle).includes(result.lighting) ? result.lighting : LightingStyle.Soft) as LightingStyle,
        angle: (Object.values(CameraAngle).includes(result.angle) ? result.angle : CameraAngle.Perspective) as CameraAngle,
        colorMood: result.colorMood || "Premium Dark",
      },
      strategy: result.visualStrategy || "High-end editorial presentation",
      tagline: result.marketingTagline || "Experience Excellence",
      suggestedBackgrounds: Array.isArray(result.suggestedBackgrounds) 
        ? result.suggestedBackgrounds.map(getBackgroundEnum).slice(0, 3) 
        : [],
      appCategory: result.appCategory || "General App",
      targetAudience: result.targetAudience || "General Audience",
      detectedColors: result.detectedColors || ["#000000", "#FFFFFF"],
      conversionScore: result.conversionScore || 85,
      suggestedProps: result.suggestedProps || []
    };

  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      settings: {
        deviceType: DeviceType.Smartphone,
        backgroundStyle: BackgroundStyle.Gradient,
        lighting: LightingStyle.Soft,
        angle: CameraAngle.Perspective,
        colorMood: "Clean"
      },
      strategy: "Standard professional presentation",
      tagline: "Experience the Future",
      suggestedBackgrounds: [],
      appCategory: "Technology",
      targetAudience: "Users",
      detectedColors: ["#333333"],
      conversionScore: 80,
      suggestedProps: []
    };
  }
};

/**
 * Generates SEO metadata for a specific mockup configuration.
 */
export const generateSEOMetadata = async (
  settings: MockupSettings,
  appTagline: string,
  overrides?: { title?: string, caption?: string }
): Promise<{
  seoTitle: string;
  seoKeywords: string;
  socialCaption: string;
  altText: string;
}> => {
  try {
    const model = "gemini-2.5-flash";
    const varianceSeed = Math.random().toString(36).substring(7);
    const hasTitleOverride = !!overrides?.title;
    const hasCaptionOverride = !!overrides?.caption;

    const prompt = `
      You are an expert SEO & Brand Strategist.
      
      Your Goal: Create a production-ready filename and title for this marketing asset.
      
      CONTEXT:
      - Tagline: "${appTagline}"
      - Audience: ${settings.detectedAudience || 'General'}
      - Category: ${settings.detectedAppCategory || 'App'}
      - Vibe: ${settings.colorMood}
      - Device: ${settings.deviceType}
      - Seed: ${varianceSeed}
      
      INSTRUCTIONS:
      1. **seoTitle**: MUST be a clean, brand-focused title suitable for a filename (e.g., "Fintech-Dashboard-iPhone15-Dark-Mode-Mockup"). Max 60 chars. No spaces allowed, use hyphens.
      2. **seoKeywords**: Comma-separated high-volume keywords (e.g., "app design, ui ux, ios mockup, tech branding").
      3. **socialCaption**: A ready-to-post Instagram/LinkedIn caption with 3 relevant hashtags.
      4. **altText**: Descriptive accessibility text describing the UI and the device context.

      ${hasTitleOverride ? `FORCE Title Override: "${overrides?.title}"` : ''}
      ${hasCaptionOverride ? `FORCE Caption Override: "${overrides?.caption}"` : ''}

      Output valid JSON.
    `;

    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            seoTitle: { type: Type.STRING, description: "Hyphenated filename-ready title" },
            seoKeywords: { type: Type.STRING },
            socialCaption: { type: Type.STRING },
            altText: { type: Type.STRING }
          },
          required: ["seoTitle", "seoKeywords", "socialCaption", "altText"]
        }
      }
    }));

    const result = JSON.parse(response.text || "{}");
    
    if (overrides?.title) result.seoTitle = overrides.title;
    if (overrides?.caption) result.socialCaption = overrides.caption;

    if (result.seoTitle && result.seoTitle.includes(' ')) {
        result.seoTitle = result.seoTitle.replace(/\s+/g, '-');
    }

    return result;
  } catch (e) {
    console.error("SEO Generation failed", e);
    const safeTitle = (appTagline || "App Mockup").replace(/\s+/g, '-') + "-" + Date.now();
    return {
      seoTitle: overrides?.title || safeTitle,
      seoKeywords: "app, mockup, design, ui, ux, premium",
      socialCaption: overrides?.caption || "Check out this new design. #design #uiux",
      altText: "A premium app mockup displayed on a device."
    };
  }
};

/**
 * Generates a mockup image based on the uploaded screenshot and settings.
 * USES GEMINI 3.0 PRO with DUAL-LAYER COMPOSITE RENDERING ARCHITECTURE.
 */
export const generateMockup = async (
  imageBase64: string,
  settings: MockupSettings,
  mimeType: string,
  variant: 'A' | 'B' = 'A'
): Promise<string> => {
    
    // --- 1. DEVICE PHYSICS & RENDERING ---
    const getDeviceDetails = (type: DeviceType) => {
        if (type === DeviceType.Auto) return "INTELLIGENT SELECTION: Analyze screenshot aspect ratio. If Portrait -> iPhone 15 Pro Max (Titanium). If Landscape -> MacBook Pro 16 M3 (Space Black). If Square -> iPad Pro. Render with physically correct materials (refraction, metal roughness).";
        
        switch(type) {
            case DeviceType.Smartphone: return "iPhone 15 Pro Max, Natural Titanium Finish. Ceramic Shield front. Ultra-thin uniform bezels. Micro-reflections on chamfered edges.";
            case DeviceType.MarketingHero: return "Futuristic 'Hero' Device. Frameless glass slab aesthetic. Floating presentation. Glowing subtle edge accents.";
            case DeviceType.Laptop: return "MacBook Pro 16-inch M3 Max. Space Black anodized aluminum. Liquid Retina XDR display (deep blacks). Open 90 degrees.";
            case DeviceType.Desktop: return "Apple Studio Display 5K. Aluminum stand. Minimalist desk setup with Magic Keyboard and Trackpad.";
            case DeviceType.Tablet: return "iPad Pro 12.9-inch. Thin aluminum chassis. Edge-to-Edge Liquid Retina display. Apple Pencil 2 magnetically attached.";
            case DeviceType.SmartWatch: return "Apple Watch Ultra 2. Titanium case (49mm). Orange Alpine Loop. Sapphire crystal display.";
            default: return type;
        }
    };

    // --- 2. BACKGROUND & CONTEXTUAL INTELLIGENCE ---
    const getContextualDetails = (style: BackgroundStyle, category: string, props: string[], customPrompt?: string) => {
        const cat = category?.toLowerCase() || "general";
        const propString = props && props.length > 0 ? `Background Props (Blurred): ${props.join(", ")}.` : "";

        // Handle Custom Background
        if (style === BackgroundStyle.Custom) {
            return `CUSTOM SCENE GENERATION: ${customPrompt || "A generic clean studio background"}. Ensure style matches the device realism.`;
        }

        // Specific Category Override for Auto or specific styles
        if (style === BackgroundStyle.Auto || style === BackgroundStyle.Lifestyle) {
            if (cat.includes("food") || cat.includes("restaurant") || cat.includes("drink")) {
                return `GOURMET F&B SETTING: High-end restaurant table. Warm wood or marble texture. Soft ambient candlelight. Props: Wine glass (crystal), linen napkin, artisan bread. Bokeh highlights. Warm golden hour feel.`;
            }
            if (cat.includes("finance") || cat.includes("fintech") || cat.includes("business")) {
                return `EXECUTIVE BUSINESS SETTING: Boardroom table or high-end desk. Leather desk pad. Props: Montblanc pen, espresso cup, Macbook edge. Cool professional lighting. City skyline bokeh outside window.`;
            }
            if (cat.includes("health") || cat.includes("wellness") || cat.includes("yoga")) {
                return `WELLNESS SANCTUARY: Natural stone surface. Dappled sunlight through leaves. Props: Small succulent, rolled towel, herbal tea. Soft organic shadows. Zen atmosphere.`;
            }
        }

        switch(style) {
            case BackgroundStyle.Studio: return `Infinite Cyclorama Studio. Pure color backdrop matching brand palette. No distractions. Maximum focus on device.`;
            case BackgroundStyle.Office: return `Blurred Executive Office. Glass walls, mahogany tones. Depth of field (f/2.0). Professional atmosphere. ${propString}`;
            case BackgroundStyle.Nature: return `Organic Nature Setting. Smooth river stones, moss, dappled sunlight. Zen garden aesthetic. ${propString}`;
            case BackgroundStyle.Gradient: return `Abstract Mesh Gradient (Aurora). High-end tech aesthetic. Smooth noise texture. Deep rich colors.`;
            case BackgroundStyle.Dark: return `Matte Black Carbon Fiber. "Dark Mode" aesthetic. Low-key lighting. Cyberpunk LED accents. High contrast.`;
            case BackgroundStyle.Geometric: return `3D Abstract Geometry. Glass prisms, subsurface scattering, floating shapes. Octane Render style.`;
            case BackgroundStyle.City: return `Bokeh City Skyline at Twilight. Out-of-focus street lights. Urban luxury vibe.`;
            default: return `Professional environment matching the mood: ${settings.colorMood}. ${propString}`;
        }
    };

    // --- 3. LIGHTING SYSTEM ---
    const getLightingSystem = (style: LightingStyle) => {
        const baseSystem = "THREE-POINT STUDIO SETUP: 1. Key Light (Softbox, 45 deg, Upper Left). 2. Fill Light (Reflector, 30% intensity). 3. Rim Light (Back accent, creates separation).";
        
        switch(style) {
            case LightingStyle.Soft: return `${baseSystem} Emphasize soft, wrap-around Key light. Feathered shadows. High visibility. Commercial look.`;
            case LightingStyle.Dramatic: return `${baseSystem} Increase Key/Rim contrast. Deep shadows. Silhouette effect. Moody cinematic feel.`;
            case LightingStyle.Neon: return "CYBERPUNK LIGHTING: Dual-tone Gel Lighting (Cyan Left / Magenta Right). Dark ambient. Reflective surfaces.";
            case LightingStyle.Natural: return "GOLDEN HOUR: Warm sunlight (3500K) casting long, soft shadows from side window. Organic glow. Lens flare.";
            case LightingStyle.StudioBox: return "COMMERCIAL LIGHTBOX: Pure white light. No harsh shadows. Maximum clarity. Apple Product Page style.";
            default: return `${baseSystem} Optimized for conversion.`;
        }
    };

    const devicePrompt = getDeviceDetails(settings.deviceType);
    const envPrompt = getContextualDetails(
        settings.backgroundStyle, 
        settings.detectedAppCategory || "general", 
        settings.suggestedProps || [],
        settings.customBackgroundPrompt
    );
    const lightPrompt = getLightingSystem(settings.lighting);
    
    // VARIANT LOGIC (A/B Testing)
    let variantInstruction = "";
    if (variant === 'B') {
        variantInstruction = `
            *** VARIANT B INSTRUCTION ***
            - CHANGE ANGLE: If Variant A was 3/4 view, make this slightly more top-down or a tighter close-up.
            - CHANGE LIGHTING: Shift the Key light position to create a different shadow pattern.
            - ALTERNATE PROPS: Use slightly different background elements while keeping the same theme.
        `;
    }

    // --- CONTENT FIT LOGIC ---
    let placementInstruction = "";
    if (settings.contentFit === ContentFit.TopAlign) {
        placementInstruction = "PLACEMENT: Top-Align the screenshot content. If the aspect ratio of the screenshot is taller than the device screen, crop the bottom (simulating a scroll). Ensure the status bar/header is visible.";
    } else if (settings.contentFit === ContentFit.Contain) {
        placementInstruction = "PLACEMENT: Fit the ENTIRE screenshot within the screen boundaries. If aspect ratios differ, add subtle letterboxing or pillarboxing (black bars). Do not crop important UI elements.";
    } else {
        // Cover / Default
        placementInstruction = "PLACEMENT: Fill the device screen completely (Cover). Crop edges slightly if needed to avoid black bars, but keep the center content visible.";
    }

    // --- ULTRA-PREMIUM PROMPT CONSTRUCTION V3.0 (DUAL-LAYER + PHYSICS) ---
    const prompt = `
      ACT AS: A World-Class Product Photographer (Phase One XF IQ4 150MP) & Senior 3D Render Engine (Octane/Redshift).

      TASK: Create an ULTRA-PREMIUM marketing mockup using DUAL-LAYER COMPOSITE ARCHITECTURE.

      *** CRITICAL ANTI-HALLUCINATION PROTOCOL ***
      1. FRONT FACING ONLY: The device MUST be shown from the FRONT or 3/4 FRONT view. The SCREEN MUST BE VISIBLE to the camera.
      2. NO BACK-OF-DEVICE: Do NOT render the back case of the phone. Do NOT apply the screenshot as a texture on the back of the phone.
      3. SCREEN IS A SCREEN: The input image IS THE DIGITAL DISPLAY content. It emits light. It is NOT a sticker.

      === LAYER 1: SCREEN CONTENT (ULTRA-HIGH FIDELITY) ===
      - INPUT PROCESSING: Treat the provided UI screenshot as a "Smart Object".
      - INTERNAL RESOLUTION: Upscale UI input 300% before mapping to the device to ensure "Retina" crispness.
      - TEXT PRESERVATION: Text MUST remain 100% legible and sharp. Do NOT hallucinate, blur, or "repaint" the UI text.
      - SHARPENING: Apply "High-Pass" sharpening filter ONLY to the screen smart object layer.
      - TRANSFORMATION: Apply perspective transform (bicubic interpolation) to fit the device screen perfectly.
      - ${placementInstruction}

      === LAYER 2: PHOTO-REALISTIC ENVIRONMENT (PHYSICS SIMULATION) ===
      - ${devicePrompt}
      - ${envPrompt}
      - ${lightPrompt}
      - CAMERA: 85mm Prime Lens at f/2.8.
      - DEPTH OF FIELD: progressive Gaussian blur (Screen=0%, Mid=30%, Background=90% with Bokeh).
      - RENDER ENGINE SPECS:
          * Global Illumination: ON
          * Raytracing: ON (Path Tracing)
          * Materials: Dielectric glass (IOR 1.5) for screen, Anisotropic aluminum/titanium for body.
          * Caustics: Subtle reflective caustics from the bezel.

      === COMPOSITE & FINISHING ===
      - SCREEN PHYSICS: Apply subtle 5% glass reflection and 12% screen glow OVER the UI layer, but ensure text is readable.
      - COLOR GRADING: 
         * If Lifestyle: Cinematic Teal/Orange (Warm highlights, Cool shadows).
         * If Tech: Cool Professional (Crisp Whites, Deep Blues).
      - NO ARTIFACTS: Ensure no "AI hallucinations" or fuzzy edges on the UI. The result must be indistinguishable from a studio photo even at 200% zoom.

      ${variantInstruction}

      *** BRAND ALIGNMENT ***
      - Tagline Vibe: "${settings.marketingTagline || 'Premium Quality'}"
      ${settings.detectedColors ? `- COLOR PALETTE: Integrate ${settings.detectedColors.join(", ")} into background props or ambient light tint.` : ''}
      ${settings.description ? `- USER INSTRUCTION: ${settings.description}` : ''}
      
      Output: A photorealistic, 4K resolution marketing asset.
    `;

    const contents = {
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data: imageBase64 } },
      ],
    };

    const extractImageFromResponse = (response: any) => {
        const parts = response.candidates?.[0]?.content?.parts;
        if (!parts) return null;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    };

    try {
        // Attempt 1: Gemini 3.0 Pro Image Preview (Requested 4K)
        const model = "gemini-3-pro-image-preview";
        console.log(`Generating with ${model} (Variant ${variant})...`);
        
        const response = await retryOperation(() => ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                imageConfig: {
                    aspectRatio: "4:3",
                    imageSize: "4K" // Requested 4K output for zoom clarity
                }
            }
        }));

        const imageUrl = extractImageFromResponse(response);
        if (imageUrl) return imageUrl;
        throw new Error("No image returned from Pro model.");

    } catch (error: any) {
        console.warn(`Pro model failed: ${error.message}`);
        
        // Fallback: Gemini 2.5 Flash Image
        try {
            const fallbackModel = "gemini-2.5-flash-image";
            console.log(`Fallback to ${fallbackModel}...`);
            
            const response = await retryOperation(() => ai.models.generateContent({
                model: fallbackModel,
                contents: contents,
                config: {
                    imageConfig: {
                        aspectRatio: "4:3"
                    }
                }
            }));

            const imageUrl = extractImageFromResponse(response);
            if (imageUrl) return imageUrl;
            throw new Error("No image returned from Flash fallback.");

        } catch (fallbackError: any) {
            console.error("Fallback failed:", fallbackError);
            throw new Error("Failed to generate image. Please check API Key or quota.");
        }
    }
};