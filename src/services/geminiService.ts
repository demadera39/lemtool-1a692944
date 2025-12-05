import { Marker, EmotionType, AnalysisReport } from '../types';
import { supabase } from './supabaseService';

export interface GeminiAnalysisResult {
  markers: Marker[];
  report: AnalysisReport;
}

export type AnalysisProgressCallback = (progress: number, message: string) => void;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper to fetch a screenshot as base64
async function getWebsiteScreenshotBase64(url: string): Promise<string | null> {
  try {
    // Use maxheight parameter to capture tall pages (up to 10000px)
    // This ensures we get the full page content for long pages like apple.com
    const screenshotServiceUrl = `https://image.thum.io/get/width/1200/maxheight/8000/fullpage/wait/8/noanimate/${url}`;
    
    console.log('Capturing screenshot with maxheight/8000:', url);
    
    const response = await fetch(screenshotServiceUrl);
    if (!response.ok) throw new Error('Screenshot fetch failed');
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Log the image dimensions for debugging
        const img = new Image();
        img.onload = () => {
          console.log(`Screenshot captured: ${img.width}x${img.height}px`);
        };
        img.src = base64;
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn("Screenshot capture failed:", e);
    return null;
  }
}

// Slice image into 16:9 aspect ratio chunks
async function sliceImageBase64(base64Full: string): Promise<{ slices: string[], sliceHeights: number[], totalHeight: number, totalWidth: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject("No canvas ctx"); return; }

      const totalWidth = img.width;
      const totalHeight = img.height;

      // Use a fixed viewport height of 500px for better slicing coverage
      // This creates more slices, ensuring markers are distributed across the entire page
      const sliceHeight = 500;

      const slices: string[] = [];
      const sliceHeights: number[] = [];
      const numSlices = Math.ceil(totalHeight / sliceHeight);

      canvas.width = totalWidth;

      for (let i = 0; i < numSlices; i++) {
        const sourceY = i * sliceHeight;
        // The last slice might be shorter
        const currentSliceHeight = Math.min(sliceHeight, totalHeight - sourceY);

        // Resize canvas to fit this specific slice exactly
        canvas.height = currentSliceHeight;
        ctx.clearRect(0, 0, totalWidth, currentSliceHeight);

        ctx.drawImage(img, 0, sourceY, totalWidth, currentSliceHeight, 0, 0, totalWidth, currentSliceHeight);

        const data = canvas.toDataURL('image/png').split(',')[1];
        slices.push(data);
        sliceHeights.push(currentSliceHeight);
      }
      resolve({ slices, sliceHeights, totalHeight, totalWidth });
    };
    img.onerror = reject;
    img.src = base64Full;
  });
}

export async function analyzeWebsite(url: string, onProgress?: AnalysisProgressCallback): Promise<GeminiAnalysisResult> {
  try {
    // Get screenshot first
    onProgress?.(10, 'Capturing website screenshot...');
    const screenshot = await getWebsiteScreenshotBase64(url);
    
    if (!screenshot) {
      onProgress?.(100, 'Analysis complete');
      return generateFallbackAnalysis(url, null);
    }

    onProgress?.(30, 'Processing screenshot...');
    console.log("Starting Slice & Conquer Analysis...");

    // Slice the image into 16:9 chunks
    const { slices, sliceHeights, totalHeight } = await sliceImageBase64(screenshot);
    console.log(`Sliced into ${slices.length} chunks. Total Height: ${totalHeight}px`);

    onProgress?.(50, 'Analyzing emotional triggers...');
    
    // Call the edge function with sliced data
    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { 
        url, 
        slices,
        sliceHeights,
        totalHeight,
        screenshot: screenshot.split(',')[1]
      }
    });

    onProgress?.(80, 'Processing analysis results...');

    if (error) {
      console.error('Analysis error:', error);
      throw error;
    }

    // If we have a rawResponse, it means parsing failed
    if (data.rawResponse) {
      console.warn('AI returned non-JSON response, using fallback');
      onProgress?.(100, 'Analysis complete');
      return generateFallbackAnalysis(url, screenshot);
    }

    // Process markers with exact coordinate clamping to match GitHub version
    const markers: Marker[] = (data.markers || []).map((m: any) => ({
      id: generateId(),
      x: Math.max(1, Math.min(99, m.x || 50)),
      y: Math.max(0, Math.min(100, m.y || 50)),
      layer: m.layer || 'emotions',
      comment: m.comment || '',
      source: 'AI' as const,
      emotion: m.emotion,
      need: m.need,
      brief_type: m.brief_type
    }));

    const report: AnalysisReport = {
      ...data.report,
      screenshot: screenshot || undefined
    };

    onProgress?.(100, 'Analysis complete');
    return { markers, report };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    onProgress?.(100, 'Analysis complete');
    // Return fallback analysis
    const screenshot = await getWebsiteScreenshotBase64(url);
    return generateFallbackAnalysis(url, screenshot);
  }
}

function generateFallbackAnalysis(url: string, screenshot: string | null): GeminiAnalysisResult {
  const emotions: EmotionType[] = [
    EmotionType.JOY,
    EmotionType.DESIRE,
    EmotionType.FASCINATION,
    EmotionType.SATISFACTION,
    EmotionType.SADNESS,
    EmotionType.DISGUST
  ];
  
  const markers: Marker[] = Array.from({ length: 8 }, (_, i) => ({
    id: generateId(),
    x: 20 + Math.random() * 60,
    y: 15 + Math.random() * 70,
    layer: 'emotions' as const,
    emotion: emotions[Math.floor(Math.random() * emotions.length)],
    comment: 'AI-detected emotional trigger point (demo mode)',
    source: 'AI' as const,
  }));

  const report: AnalysisReport = {
    overallScore: 65 + Math.floor(Math.random() * 25),
    summary: 'Analysis is running in demo mode. The website shows emotional engagement through design elements. Connect Gemini API for full analysis.',
    targetAudience: 'General web users',
    audienceSplit: [
      { label: 'Early Adopters', percentage: 45 },
      { label: 'Mainstream Users', percentage: 35 },
      { label: 'Late Adopters', percentage: 20 }
    ],
    personas: [
      {
        name: 'Demo User',
        role: 'Web Visitor',
        bio: 'Regular internet user exploring the website',
        goals: 'Find relevant information quickly',
        quote: 'I want websites that are easy to understand',
        techLiteracy: 'Mid',
        psychographics: 'Values simplicity and clarity',
        values: ['Efficiency', 'Clarity', 'Trust'],
        frustrations: ['Complex navigation', 'Slow loading']
      }
    ],
    brandValues: ['User-Friendly', 'Professional', 'Trustworthy'],
    keyFindings: [
      {
        title: 'Visual Design',
        description: 'The layout provides clear visual hierarchy',
        type: 'positive'
      },
      {
        title: 'User Flow',
        description: 'Navigation could be simplified',
        type: 'negative'
      }
    ],
    suggestions: [
      'Enhance visual consistency',
      'Optimize loading speed',
      'Improve mobile responsiveness',
      'Add more trust signals'
    ],
    layoutStructure: [
      { type: 'hero', estimatedHeight: 600, backgroundColorHint: 'light' },
      { type: 'features', estimatedHeight: 800, backgroundColorHint: 'light' },
      { type: 'cta', estimatedHeight: 400, backgroundColorHint: 'light' }
    ],
    sdtScores: {
      autonomy: { score: 7, justification: 'Users have reasonable control over their experience' },
      competence: { score: 7, justification: 'Interface provides adequate feedback' },
      relatedness: { score: 6, justification: 'Social elements could be enhanced' }
    },
    creativeBrief: {
      problemStatement: 'Users need clearer pathways to key information',
      targetEmotion: 'Confidence and Clarity',
      howMightWe: 'How might we simplify navigation while maintaining depth?',
      strategicDirection: 'Focus on progressive disclosure and intuitive flows',
      actionableSteps: [
        'Redesign primary navigation',
        'Add contextual help',
        'Improve visual hierarchy'
      ],
      benchmarks: [
        { name: 'Apple.com', reason: 'Clean, minimal design approach' }
      ]
    },
    screenshot: screenshot || undefined
  };

  return { markers, report };
}
