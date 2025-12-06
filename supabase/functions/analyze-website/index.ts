import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanJson(text: string): string {
  if (!text) return "{}";

  // Remove markdown code blocks
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(markdownRegex);
  if (match && match[1]) {
    text = match[1];
  }

  // Find JSON boundaries
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    console.warn("AI returned non-JSON response (no braces found)");
    return "{}";
  }

  let jsonStr = text.substring(firstBrace, lastBrace + 1).trim();
  
  // CRITICAL FIX: Remove escaped quotes that shouldn't be escaped
  // The AI sometimes returns \"x": instead of "x":
  jsonStr = jsonStr.replace(/\\"([^"]+)":/g, '"$1":');
  
  // Also fix escaped quotes in string values
  jsonStr = jsonStr.replace(/:\s*\\"([^"]*)\\"(?=\s*[,}\]])/g, ': "$1"');
  
  // Advanced cleaning for common AI mistakes:
  
  // 1. Remove trailing commas before closing braces/brackets
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
  
  // 2. Remove any non-printable or control characters except newlines/tabs
  jsonStr = jsonStr.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // 3. Ensure proper closing brackets (count and balance)
  const openBraces = (jsonStr.match(/{/g) || []).length;
  const closeBraces = (jsonStr.match(/}/g) || []).length;
  if (openBraces > closeBraces) {
    jsonStr += '}'.repeat(openBraces - closeBraces);
  }
  
  const openBrackets = (jsonStr.match(/\[/g) || []).length;
  const closeBrackets = (jsonStr.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    jsonStr += ']'.repeat(openBrackets - closeBrackets);
  }
  
  return jsonStr;
}

const MULTIMODAL_MASTER_PROMPT = `
You are a **Senior UX Researcher with 15+ years of experience** analyzing the **HERO SECTION** of a website.
Target URL: {URL}

## YOUR METHODOLOGY (Follow in Order)

### STEP 1: IDENTIFY THE TARGET AUDIENCE (PERSONAS)
Before analyzing any UI, first determine WHO this website is for:
- Read the headline, subheadline, and any visible copy
- Look at imagery choices (business people? creatives? families? developers?)
- Note the visual style (corporate? playful? technical? luxury?)
- Identify the industry and value proposition

Create **4-5 DISTINCT PERSONA ARCHETYPES** that represent the website's target users:
- Give them archetypal names (e.g., "The Skeptical Enterprise Buyer", "The Time-Pressed Founder", "The Technical Evaluator")
- These personas will be the lens through which you evaluate emotional triggers

### STEP 2: MAP THE UI STRUCTURE
Identify standard website components visible in this hero:
- **Navigation**: Logo, menu items, CTAs in header
- **Hero Section**: Primary headline, subheadline, hero image/video, primary CTA
- **Trust Signals**: Logos, testimonials snippets, stats, badges
- **Secondary Elements**: Supporting features, social proof

### STEP 3: ANALYZE EMOTIONAL TRIGGERS THROUGH PERSONA LENS
For each UI element, ask: "How would [Persona] emotionally respond to this?"

**WHAT TO ANALYZE** (Focus on these UI patterns):
- Headlines and value propositions (clarity, emotional hook)
- CTAs and buttons (action language, urgency, benefit)
- Trust indicators (credibility, social proof)
- Visual hierarchy (what draws attention first, second, third)
- Navigation clarity (can users find what they need?)
- Form friction (if visible - barriers to conversion)

**WHAT TO IGNORE** (Do NOT place markers on):
- Decorative illustrations that don't convey meaning
- Generic stock photos used as backgrounds
- Purely aesthetic gradients or patterns
- Empty whitespace or margins
- Small icons that are purely decorative

### STEP 4: MARKER PLACEMENT PRECISION
**CRITICAL**: Each marker must be placed at the **exact visual center** of the UI element.
- Coordinates (x,y) range from 0-100
- x=0 is LEFT edge, x=100 is RIGHT edge
- y=0 is TOP edge, y=100 is BOTTOM edge
- A button at the center of the page = approximately x:50
- A navigation item on the far right = approximately x:85-95
- A headline near the top = approximately y:15-25

**MARKER REQUIREMENTS**:
- Minimum 10-15 markers for hero section
- At least 4-5 per layer (emotions, needs, strategy)
- Each marker must reference a SPECIFIC, VISIBLE UI element
- Start each comment with: "The [element type] '[visible text or description]'..."

## OUTPUT JSON STRUCTURE
**CRITICAL**: Return ONLY valid JSON. No trailing commas. No unescaped quotes.
Format: \`\`\`json followed by the JSON object followed by \`\`\`

{
  "markers": [
    {
      "x": number (0-100, precise to element center),
      "y": number (0-100, precise to element center),
      "layer": "emotions" | "needs" | "strategy",
      "comment": "The [element type] '[text/description]' [analysis through persona lens]",
      "emotion": "Joy" | "Desire" | "Interest" | "Satisfaction" | "Neutral" | "Sadness" | "Aversion" | "Boredom" | "Dissatisfaction",
      "need": "Autonomy" | "Competence" | "Relatedness",
      "brief_type": "Opportunity" | "Pain Point" | "Insight"
    }
  ],
  "overallScore": number (0-100),
  "summary": "2-3 sentence executive summary of UX effectiveness",
  "targetAudience": "Primary audience description based on website signals",
  "audienceSplit": [{ "label": string, "percentage": number }],
  "brandValues": ["value1", "value2", "value3"],
  "personas": [
    { 
      "name": "Archetypal name (e.g., The Skeptical Buyer)", 
      "role": "Job title or life role", 
      "bio": "2-3 sentences about who they are", 
      "goals": "What they want to achieve", 
      "quote": "Something they might say", 
      "techLiteracy": "Low"|"Mid"|"High", 
      "psychographics": "Motivations, fears, values", 
      "values": ["value1", "value2"], 
      "frustrations": ["frustration1", "frustration2"] 
    }
  ],
  "layoutStructure": [
    { "type": "hero"|"features"|"testimonials"|"pricing"|"footer"|"cta"|"social_proof"|"faq", "estimatedHeight": number, "backgroundColorHint": "light"|"dark"|"colorful" }
  ],
  "sdtScores": { 
    "autonomy": { "score": number, "justification": "How does the UI give users control?" }, 
    "competence": { "score": number, "justification": "How does the UI help users feel capable?" }, 
    "relatedness": { "score": number, "justification": "How does the UI create connection?" } 
  },
  "creativeBrief": {
     "problemStatement": "The core UX challenge identified",
     "targetEmotion": "Primary emotion to evoke",
     "howMightWe": "HMW statement for improvement",
     "strategicDirection": "Recommended approach",
     "actionableSteps": [
       "GOAL: [User wants X]. FIX: [Specific UI change]. RESULT: Evokes [Emotion].",
       "ATTITUDE: [User thinks X]. FIX: [Specific UI change]. RESULT: Evokes [Emotion].",
       "NORM: [User believes X]. FIX: [Specific UI change]. RESULT: Evokes [Emotion]."
     ],
     "benchmarks": [{ "name": "Company/Product", "reason": "Why they do this well" }]
  },
  "keyFindings": [{ "title": string, "description": string, "type": "positive"|"negative"|"neutral" }],
  "suggestions": ["Specific, actionable UX improvement"]
}
`;

const MARKER_ONLY_PROMPT = `
You are a **Senior UX Researcher** analyzing a **BODY/FOOTER SECTION** of a website.
Target URL: {URL}

## YOUR TASK
Analyze this section slice for emotional triggers, psychological needs, and strategic UX opportunities.

## SECTION IDENTIFICATION
First, identify what type of section this is:
- **Features/Benefits**: Product capabilities, value props
- **Social Proof**: Testimonials, case studies, logos, stats
- **Pricing**: Plans, comparison tables
- **FAQ**: Questions and answers
- **CTA Block**: Conversion-focused sections
- **Footer**: Navigation, legal, contact
- **Content**: Blog previews, resources

## ANALYSIS FOCUS (What to Marker)

**MARK THESE UI ELEMENTS**:
- Headlines and section titles (emotional hook, clarity)
- Feature descriptions (benefit clarity, desire triggers)
- CTAs and buttons (action language, urgency)
- Testimonial quotes (relatedness, trust)
- Pricing elements (value perception, autonomy)
- Trust badges and logos (credibility)
- Form fields (friction points)
- Navigation links (findability)

**IGNORE THESE**:
- Decorative illustrations without meaning
- Generic background images/patterns
- Purely aesthetic icons
- Whitespace and margins
- Small decorative elements

## COORDINATE PRECISION
**CRITICAL**: This is a SLICE of the page. Coordinates are relative to THIS image only.
- x=0 is LEFT edge, x=100 is RIGHT edge
- y=0 is TOP of this slice, y=100 is BOTTOM of this slice
- Place markers at the EXACT CENTER of each UI element
- If a button is on the left third: x ≈ 15-30
- If a card is centered: x ≈ 40-60
- If an element is on the right: x ≈ 70-85

**DO NOT**:
- Place markers at 50,50 unless the element is truly centered
- Place markers at 0,0 or 100,100
- Cluster multiple markers on the same element

## MARKER REQUIREMENTS
- Minimum 8-12 markers per section slice
- At least 3-4 per layer (emotions, needs, strategy)
- Each comment must start: "The [element type] '[visible text]'..."

## OUTPUT JSON
**CRITICAL**: Return ONLY valid JSON. No trailing commas. No unescaped quotes.
Format: \`\`\`json followed by the JSON object followed by \`\`\`

{
  "markers": [
    {
      "x": number (0-100, precise to element center),
      "y": number (0-100, precise to element center),
      "layer": "emotions" | "needs" | "strategy",
      "comment": "The [element type] '[text/description]' [analysis]",
      "emotion": "Joy" | "Desire" | "Interest" | "Satisfaction" | "Neutral" | "Sadness" | "Aversion" | "Boredom" | "Dissatisfaction",
      "need": "Autonomy" | "Competence" | "Relatedness",
      "brief_type": "Opportunity" | "Pain Point" | "Insight"
    }
  ]
}
`;

function declusterMarkers(markers: any[]): any[] {
  const SPREAD_THRESHOLD = 3.0;
  const ITERATIONS = 5;

  let adjusted = JSON.parse(JSON.stringify(markers));

  for (let i = 0; i < ITERATIONS; i++) {
    for (let j = 0; j < adjusted.length; j++) {
      for (let k = j + 1; k < adjusted.length; k++) {
        let m1 = adjusted[j];
        let m2 = adjusted[k];

        let dx = m1.x - m2.x;
        let dy = m1.y - m2.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < SPREAD_THRESHOLD && dist > 0.01) {
          let overlap = SPREAD_THRESHOLD - dist;
          let moveX = (dx / dist) * overlap * 0.5;
          let moveY = (dy / dist) * overlap * 0.5;

          m1.x += moveX;
          m1.y += moveY;
          m2.x -= moveX;
          m2.y -= moveY;
        }
      }
    }
  }

  return adjusted.map((m: any) => ({
    ...m,
    x: Math.max(2, Math.min(98, m.x)),
    y: Math.max(0.5, Math.min(99.5, m.y))
  }));
}

async function callGeminiAPI(apiKey: string, parts: any[], prompt: string, maxTokens: number = 4096, model: string = "gemini-2.0-flash-exp") {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: maxTokens,
        }
      }),
    }
  );
  return response;
}

async function callLovableAI(parts: any[], prompt: string, model: string = "google/gemini-2.5-flash") {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  // Convert parts to messages format for Lovable AI
  const messages = [
    {
      role: "user",
      content: parts.map((part: any) => {
        if (part.inline_data) {
          return {
            type: "image_url",
            image_url: {
              url: `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`
            }
          };
        }
        return { type: "text", text: part.text };
      })
    }
  ];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 4096,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lovable AI error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  
  // Convert Lovable AI response format back to Gemini format
  return {
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{
            text: data.choices[0].message.content
          }]
        }
      }]
    })
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, slices, sliceHeights, totalHeight, screenshot, screenshotOnly } = await req.json();
    
    // SCREENSHOT ONLY MODE: Just capture and return a screenshot without full analysis
    if (screenshotOnly && url) {
      console.log(`Screenshot only mode for: ${url}`);
      const API_FLASH_KEY = Deno.env.get("API_FLASH_KEY");
      
      if (!API_FLASH_KEY) {
        console.log("No API_FLASH_KEY, returning null screenshot");
        return new Response(JSON.stringify({ screenshot: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      try {
        // Get full page screenshot - use response_type=json to get URL instead of binary data
        // This avoids base64 encoding issues with large images
        const apiFlashUrl = `https://api.apiflash.com/v1/urltoimage?access_key=${API_FLASH_KEY}&url=${encodeURIComponent(url)}&format=png&width=1280&full_page=true&quality=70&delay=3&response_type=json`;
        console.log("Fetching full-page screenshot URL...");
        const screenshotResponse = await fetch(apiFlashUrl);
        
        if (!screenshotResponse.ok) {
          throw new Error(`API Flash returned ${screenshotResponse.status}`);
        }
        
        const screenshotData = await screenshotResponse.json();
        console.log("Full-page screenshot captured successfully:", screenshotData.url ? "URL received" : "No URL");
        
        return new Response(JSON.stringify({ screenshot: screenshotData.url || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (e) {
        console.error("Screenshot capture failed:", e);
        return new Response(JSON.stringify({ screenshot: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!GEMINI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("No AI API key configured");
    }

    if (!slices || !sliceHeights || !totalHeight) {
      throw new Error("Sliced image data is required");
    }

    console.log(`Analyzing ${slices.length} slices. Total Height: ${totalHeight}px`);

    // 1. Analyze first slice (HERO) with master prompt - Use BEST quality
    let masterResponse;
    let usedModel = 'unknown';
    
    const parts = [
      { inline_data: { mime_type: "image/png", data: slices[0] } },
      { text: MULTIMODAL_MASTER_PROMPT.replace(/{URL}/g, url) }
    ];
    
    // STRATEGY: Prioritize user's Gemini key to save Lovable AI credits
    // Priority: User's Gemini 2.5 Flash > Lovable AI as fallback
    
    if (GEMINI_API_KEY) {
      // Use user's Gemini key first (saves Lovable AI credits)
      try {
        console.log("Analyzing hero with user's Gemini Flash");
        masterResponse = await callGeminiAPI(GEMINI_API_KEY, parts, MULTIMODAL_MASTER_PROMPT, 4096, "gemini-2.0-flash-exp");
        usedModel = 'Gemini 2.0 Flash (User Key)';
      } catch (error) {
        console.log("User's Gemini failed, trying Lovable AI:", error);
        
        // Fallback to Lovable AI if user's key fails
        if (LOVABLE_API_KEY) {
          try {
            console.log("Falling back to Lovable AI Flash");
            masterResponse = await callLovableAI(parts, MULTIMODAL_MASTER_PROMPT, "google/gemini-2.5-flash");
            usedModel = 'Gemini 2.5 Flash (Lovable AI)';
          } catch (lovableError) {
            throw new Error(`Both Gemini and Lovable AI failed: ${error}, ${lovableError}`);
          }
        } else {
          throw error;
        }
      }
    } else if (LOVABLE_API_KEY) {
      // Only use Lovable AI if no user Gemini key exists
      try {
        console.log("Using Lovable AI Flash");
        masterResponse = await callLovableAI(parts, MULTIMODAL_MASTER_PROMPT, "google/gemini-2.5-flash");
        usedModel = 'Gemini 2.5 Flash (Lovable AI)';
      } catch (error) {
        throw new Error(`Lovable AI failed: ${error}`);
      }
    } else {
      throw new Error("No AI API key configured");
    }

    const masterData = await masterResponse.json();
    
    let masterText = masterData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!masterText) {
      console.error("Empty response from AI. Response structure:", JSON.stringify(masterData, null, 2));
      
      // Try fallback to Lovable AI if using user's Gemini key
      if (GEMINI_API_KEY && LOVABLE_API_KEY && usedModel.includes('User Key')) {
        console.log("Retrying with Lovable AI due to empty Gemini response...");
        try {
          masterResponse = await callLovableAI(parts, MULTIMODAL_MASTER_PROMPT, "google/gemini-2.5-flash");
          const fallbackData = await masterResponse.json();
          const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (fallbackText) {
            console.log("✓ Hero analysis complete (Gemini 2.5 Flash - Lovable AI fallback)");
            masterText = fallbackText;
            usedModel = 'Gemini 2.5 Flash (Lovable AI fallback)';
          } else {
            throw new Error("Lovable AI also returned empty content");
          }
        } catch (fallbackError) {
          console.error("Fallback to Lovable AI failed:", fallbackError);
          throw new Error("No content generated from AI models (tried both Gemini and Lovable AI)");
        }
      } else {
        throw new Error("No content generated from AI. Response structure: " + JSON.stringify(masterData));
      }
    } else {
      console.log(`✓ Hero analysis complete (${usedModel})`);
    }

    // 2. Analyze remaining slices in BATCHES to avoid rate limiting
    // Process 4 slices at a time with retry logic
    const BATCH_SIZE = 4;
    const MAX_RETRIES = 2;
    const bodySlices = slices.slice(1);
    const bodyResponses: any[] = [];
    
    async function analyzeSliceWithRetry(slice: string, sliceIndex: number, attempt: number = 1): Promise<any> {
      const sliceParts = [
        { inline_data: { mime_type: "image/png", data: slice } },
        { text: MARKER_ONLY_PROMPT.replace(/{URL}/g, url) }
      ];
      
      try {
        let response;
        
        // STRATEGY: Prioritize user's Gemini key for body sections (saves Lovable AI credits)
        if (GEMINI_API_KEY) {
          try {
            response = await callGeminiAPI(GEMINI_API_KEY, sliceParts, MARKER_ONLY_PROMPT, 2048, "gemini-2.0-flash-exp");
          } catch (error) {
            // Fallback to Lovable AI if user's Gemini fails
            if (LOVABLE_API_KEY) {
              console.log(`User's Gemini failed on body slice ${sliceIndex + 1}, using Lovable AI Flash`);
              response = await callLovableAI(sliceParts, MARKER_ONLY_PROMPT, "google/gemini-2.5-flash");
            } else {
              throw error;
            }
          }
        } else if (LOVABLE_API_KEY) {
          response = await callLovableAI(sliceParts, MARKER_ONLY_PROMPT, "google/gemini-2.5-flash");
        } else {
          throw new Error("No AI API key configured for body slices");
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
          if (attempt < MAX_RETRIES) {
            console.warn(`⚠️ Body slice ${sliceIndex + 1} empty, retrying (attempt ${attempt + 1})...`);
            await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
            return analyzeSliceWithRetry(slice, sliceIndex, attempt + 1);
          }
          console.warn(`⚠️ Body slice ${sliceIndex + 1} returned empty after ${MAX_RETRIES} attempts`);
          return { candidates: [{ content: { parts: [{ text: '{"markers":[]}' }] } }] };
        }
        
        console.log(`✓ Body slice ${sliceIndex + 1} analyzed, text length: ${text.length}`);
        return data;
      } catch (error) {
        if (attempt < MAX_RETRIES) {
          console.warn(`❌ Body slice ${sliceIndex + 1} failed, retrying (attempt ${attempt + 1})...`);
          await new Promise(r => setTimeout(r, 1000 * attempt));
          return analyzeSliceWithRetry(slice, sliceIndex, attempt + 1);
        }
        console.error(`❌ Failed to analyze body slice ${sliceIndex + 1} after ${MAX_RETRIES} attempts:`, error);
        return { candidates: [{ content: { parts: [{ text: '{"markers":[]}' }] } }] };
      }
    }
    
    // Process slices in batches
    for (let i = 0; i < bodySlices.length; i += BATCH_SIZE) {
      const batch = bodySlices.slice(i, i + BATCH_SIZE);
      console.log(`🔍 Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(bodySlices.length / BATCH_SIZE)} (slices ${i + 1}-${Math.min(i + BATCH_SIZE, bodySlices.length)})...`);
      
      const batchPromises = batch.map((slice: string, batchIdx: number) => 
        analyzeSliceWithRetry(slice, i + batchIdx)
      );
      
      const batchResults = await Promise.all(batchPromises);
      bodyResponses.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < bodySlices.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    console.log(`Received ${bodyResponses.length} body slice responses`);


    // 3. Process master result with retry logic
    let parsedMaster;
    let cleanedMasterText = cleanJson(masterText);
    
    console.log("Raw master text length:", masterText.length);
    console.log("Cleaned master text (first 200 chars):", cleanedMasterText.substring(0, 200));
    
    try {
      parsedMaster = JSON.parse(cleanedMasterText);
      console.log("✓ Master JSON parsed successfully");
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      console.error("JSON Parse Error:", errorMsg);
      console.error("Problematic JSON (first 800 chars):", cleanedMasterText.substring(0, 800));
      
      // RETRY STRATEGY: Try again with a simpler, more reliable model
      if (LOVABLE_API_KEY) {
        try {
          console.log("Retrying with Gemini 2.5 Flash Lite (more reliable)...");
          const retryResponse = await callLovableAI(parts, MULTIMODAL_MASTER_PROMPT, "google/gemini-2.5-flash-lite");
          const retryData = await retryResponse.json();
          const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (retryText) {
            const retryCleanedText = cleanJson(retryText);
            console.log("Retry cleaned text (first 200 chars):", retryCleanedText.substring(0, 200));
            parsedMaster = JSON.parse(retryCleanedText);
            console.log("✓ Retry successful with Flash Lite");
          } else {
            throw new Error("Retry produced no text");
          }
        } catch (retryError) {
          const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
          console.error("Retry also failed:", retryMsg);
          throw new Error(`JSON parsing failed after retry: ${errorMsg}`);
        }
      } else {
        throw new Error(`JSON parsing failed and no retry available: ${errorMsg}`);
      }
    }

    // Transform emotion types (handle Interest→Fascination and Aversion→Disgust)
    const emotionTypeMap: Record<string, string> = {
      'JOY': 'Joy', 'DESIRE': 'Desire', 'INTEREST': 'Fascination', 'FASCINATION': 'Fascination',
      'SATISFACTION': 'Satisfaction', 'NEUTRAL': 'Neutral', 'SADNESS': 'Sadness',
      'AVERSION': 'Disgust', 'DISGUST': 'Disgust', 'BOREDOM': 'Boredom',
      'DISSATISFACTION': 'Dissatisfaction'
    };

    let allMarkers = (parsedMaster.markers || []).map((m: any) => {
      // Infer layer from marker properties if not explicitly set or set incorrectly
      let layer = m.layer || 'emotions';
      if (m.need && !m.emotion) {
        layer = 'needs';
      } else if (m.brief_type && !m.emotion && !m.need) {
        layer = 'strategy';
      }
      
      return {
        x: Math.max(1, Math.min(99, m.x || 50)),
        y: Math.max(0, Math.min(100, m.y || 50)),
        layer,
        emotion: layer === 'emotions' ? (emotionTypeMap[m.emotion?.toUpperCase()] || 'Neutral') : undefined,
        need: layer === 'needs' ? m.need : undefined,
        brief_type: layer === 'strategy' ? m.brief_type : undefined,
        comment: m.comment || '',
      };
    });

    // 4. Adjust master markers coordinates to global space
    const h0 = sliceHeights[0];
    allMarkers.forEach((m: any) => {
      const yPx = (m.y / 100) * h0;
      m.y = (yPx / totalHeight) * 100;
    });

    // 5. Process body slices and stitch coordinates
    let currentYOffset = h0;

    bodyResponses.forEach((respData: any, index: number) => {
      try {
        const bodyText = respData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!bodyText) {
          console.log(`⚠️ Slice ${index + 1} returned no text`);
          return;
        }

        const cleanedBodyText = cleanJson(bodyText);
        const bodyData = JSON.parse(cleanedBodyText);
        const rawMarkers = bodyData.markers || [];

        console.log(`📍 Slice ${index + 1}: Found ${rawMarkers.length} markers (Y offset: ${currentYOffset}px / ${(currentYOffset / totalHeight * 100).toFixed(1)}%)`);

        const thisSliceHeight = sliceHeights[index + 1];

        const processedBodyMarkers = rawMarkers.map((m: any) => {
          // STITCHING MATH:
          // 1. Convert local % to local pixels
          const localYPx = (m.y / 100) * thisSliceHeight;
          // 2. Add offset of previous slices
          const globalYPx = currentYOffset + localYPx;
          // 3. Convert to global %
          const globalY = (globalYPx / totalHeight) * 100;

          // Infer layer from marker properties if not explicitly set or set incorrectly
          let layer = m.layer || 'emotions';
          if (m.need && !m.emotion) {
            layer = 'needs';
          } else if (m.brief_type && !m.emotion && !m.need) {
            layer = 'strategy';
          }

          const finalY = Math.max(0, Math.min(100, globalY));
          
          console.log(`  - Marker: local Y=${m.y}% → global Y=${globalY.toFixed(1)}% (clamped: ${finalY.toFixed(1)}%)`);

          return {
            x: Math.max(1, Math.min(99, m.x || 50)),
            y: finalY,
            layer,
            emotion: layer === 'emotions' ? (emotionTypeMap[m.emotion?.toUpperCase()] || 'Neutral') : undefined,
            need: layer === 'needs' ? m.need : undefined,
            brief_type: layer === 'strategy' ? m.brief_type : undefined,
            comment: m.comment || '',
          };
        });

        allMarkers = [...allMarkers, ...processedBodyMarkers];
        currentYOffset += thisSliceHeight;

      } catch (e) {
        console.error(`❌ Failed to process markers for slice ${index + 1}:`, e);
      }
    });

    // 6. Filter out suspicious default positions (hallucination artifacts)
    allMarkers = allMarkers.filter((m: any) => {
      // Reject lazy defaults like 0,0, 50,50, 100,100
      if (m.x === 0 || m.x === 100) return false;
      // Don't filter 50,50 too aggressively in case it's legitimate
      return true;
    });

    // 7. Apply de-clustering algorithm
    if (allMarkers.length > 0) {
      allMarkers = declusterMarkers(allMarkers);
    }

    // 8. Transform SDT scores
    const sdtScores = parsedMaster.sdtScores || {};
    const transformedSdtScores = {
      autonomy: typeof sdtScores.autonomy === 'object' 
        ? sdtScores.autonomy 
        : { score: sdtScores.autonomy || 5, justification: "User control and choice" },
      competence: typeof sdtScores.competence === 'object'
        ? sdtScores.competence
        : { score: sdtScores.competence || 5, justification: "User capability support" },
      relatedness: typeof sdtScores.relatedness === 'object'
        ? sdtScores.relatedness
        : { score: sdtScores.relatedness || 5, justification: "Social connection" }
    };

    // 9. Parse personas with proper structure
    const personas = Array.isArray(parsedMaster.personas) ? parsedMaster.personas.map((p: any) => ({
      name: p.name || "Unknown Persona",
      role: p.role || "Unknown Role",
      bio: p.bio || `A ${p.role || 'user'} seeking solutions based on their core values.`,
      quote: p.quote || "I'm hoping this website solves my problem quickly.",
      goals: p.goals || "Evaluate the product/service and decide if it's a good fit.",
      techLiteracy: p.techLiteracy || "Mid",
      psychographics: p.psychographics || "",
      values: Array.isArray(p.values) ? p.values : [],
      frustrations: Array.isArray(p.frustrations) ? p.frustrations : [],
      demographics: p.demographics || "",
    })) : [];

    const report = {
      overallScore: parsedMaster.overallScore || 70,
      summary: parsedMaster.summary || "Analysis complete",
      targetAudience: parsedMaster.targetAudience || "General web users",
      audienceSplit: Array.isArray(parsedMaster.audienceSplit) && parsedMaster.audienceSplit.length > 0
        ? parsedMaster.audienceSplit
        : [{ label: 'Primary', percentage: 60 }, { label: 'Secondary', percentage: 30 }, { label: 'Tertiary', percentage: 10 }],
      personas: personas,
      brandValues: parsedMaster.brandValues || [],
      keyFindings: (parsedMaster.keyFindings || []).map((f: any) => ({
        title: f.title || 'Insight',
        description: f.description || '',
        type: f.type || 'neutral'
      })),
      suggestions: parsedMaster.suggestions || [],
      layoutStructure: Array.isArray(parsedMaster.layoutStructure) && parsedMaster.layoutStructure.length > 0
        ? parsedMaster.layoutStructure
        : [{ type: 'unknown', estimatedHeight: 3000, backgroundColorHint: 'light' }],
      sdtScores: transformedSdtScores,
      creativeBrief: parsedMaster.creativeBrief || {
        problemStatement: 'N/A',
        targetEmotion: 'N/A',
        howMightWe: 'N/A',
        strategicDirection: 'N/A',
        actionableSteps: [],
        benchmarks: []
      }
    };

    console.log(`Generated ${allMarkers.length} markers across ${slices.length} slices`);

    return new Response(JSON.stringify({ markers: allMarkers, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
