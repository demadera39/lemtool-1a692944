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
  
  // Advanced cleaning for common AI mistakes:
  
  // 1. Remove trailing commas before closing braces/brackets
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
  
  // 2. Fix unescaped quotes in strings (basic attempt)
  // This is tricky but we try to escape quotes that appear mid-string
  jsonStr = jsonStr.replace(/"([^"]*)"([^,:}\]])/g, (match, p1, p2) => {
    // If there's a character after the quote that's not JSON syntax, likely unescaped
    if (p2 && p2.trim() && ![':', ',', '}', ']'].includes(p2.trim()[0])) {
      return `"${p1}\\"${p2}`;
    }
    return match;
  });
  
  // 3. Remove any non-printable or control characters except newlines/tabs
  jsonStr = jsonStr.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // 4. Ensure proper closing brackets (count and balance)
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
You are an Elite Senior UX Researcher analyzing the **HERO SECTION / TOP PART** of a website.
Target URL: {URL}

**TASK**:
1. Analyze this screenshot viewport for Emotional Markers, SDT Needs, and Strategic Insights.
2. Generate the **MASTER STRATEGIC REPORT** based on this primary visual context.

**CRITICAL REQUIREMENT 1: PERSONAS**
- You **MUST** generate **4 to 5 DISTINCT PERSONAS**.
- Do not just generate 1 or 2. We need a full spectrum of users (e.g., The Skeptic, The Power User, The Novice, The Decision Maker).

**CRITICAL REQUIREMENT 2: APPRAISAL THEORY BRIEF**
- The "creativeBrief" must use **Appraisal Theory Statements** to guide improvements.
- For each "actionableStep", structure it as ONE of these three types:
  1. **Goal-Based**: "GOAL: [User wants X]. FIX: [UI Change]. RESULT: Evokes [Emotion]."
  2. **Attitude-Based**: "ATTITUDE: [User thinks X]. FIX: [UI Change]. RESULT: Evokes [Emotion]."
  3. **Norm-Based**: "NORM: [User believes X]. FIX: [UI Change]. RESULT: Evokes [Emotion]."
- Provide 3-5 specific steps in this format.
- Also include "benchmarks" of real world examples.

**CRITICAL REQUIREMENT 3: PRECISION & PLACEMENT**
- **Center of Mass**: Coordinates (x,y) must range from 0-100.
  - x=0 is Left, x=100 is Right.
  - y=0 is Top, y=100 is Bottom.
- **Visual Mapping**: Place the marker at the **exact visual center** of the UI element (button, headline, image face) you are discussing.
- **DO NOT** place markers on empty whitespace or margins.
- **DO NOT** cluster markers. If you have 3 insights about one section, pick 3 distinct visual anchors within that section.

**OUTPUT JSON STRUCTURE**
**CRITICAL**: Return ONLY valid JSON. No trailing commas. No unescaped quotes. Properly closed brackets.
Format: \`\`\`json followed by the JSON object followed by \`\`\`

{
  "markers": [
    {
      "x": number (0-100),
      "y": number (0-100),
      "layer": "emotions" | "needs" | "strategy",
      "comment": "Start with: 'The element [Name/Text]...' then explain.",
      "emotion": "Joy" | "Desire" | "Interest" | "Satisfaction" | "Neutral" | "Sadness" | "Aversion" | "Boredom" | "Dissatisfaction",
      "need": "Autonomy" | "Competence" | "Relatedness",
      "brief_type": "Opportunity" | "Pain Point" | "Insight"
    }
  ],
  "overallScore": number (0-100),
  "summary": string,
  "targetAudience": string,
  "audienceSplit": [{ "label": string, "percentage": number }],
  "brandValues": [string],
  "personas": [
    { "name": string, "role": string, "bio": string, "goals": string, "quote": string, "techLiteracy": "Low"|"Mid"|"High", "psychographics": string, "values": [string], "frustrations": [string] }
  ],
  "layoutStructure": [
    { "type": "hero"|"features"|"testimonials"|"pricing"|"footer"|"cta"|"unknown"|"social_proof"|"faq", "estimatedHeight": number, "backgroundColorHint": "light"|"dark"|"colorful" }
  ],
  "sdtScores": { "autonomy": { "score": number, "justification": string }, "competence": { "score": number, "justification": string }, "relatedness": { "score": number, "justification": string } },
  "creativeBrief": {
     "problemStatement": string,
     "targetEmotion": string,
     "howMightWe": string,
     "strategicDirection": string,
     "actionableSteps": [string],
     "benchmarks": [{ "name": string, "reason": string }]
  },
  "keyFindings": [{ "title": string, "description": string, "type": "positive"|"negative"|"neutral" }],
  "suggestions": [string]
}
`;

const MARKER_ONLY_PROMPT = `
You are analyzing a **LOWER SCROLL SECTION (BODY/FOOTER)** of a website.
Target URL: {URL}

**TASK**:
Identify specific UX/UI elements in this slice that trigger emotions, fulfill psychological needs, or represent strategic opportunities.

**CRITICAL COORDINATE INSTRUCTIONS**:
- The provided image is a **SLICE** of a larger page.
- **x=0, y=0** is the TOP-LEFT of *this specific image*.
- **x=100, y=100** is the BOTTOM-RIGHT of *this specific image*.
- You **MUST** pinpoint the exact element.
- Example: If discussing a "Pricing Card" on the left, x should be ~25. If discussing a "Contact Button" on the right, x should be ~85.
- **AVOID** placing markers at exactly 50,50 or 0,0. Be precise.

**OUTPUT JSON STRUCTURE**
**CRITICAL**: Return ONLY valid JSON. No trailing commas. No unescaped quotes. Properly closed brackets.
Format: \`\`\`json followed by the JSON object followed by \`\`\`

{
  "markers": [
    {
      "x": number (0-100),
      "y": number (0-100),
      "layer": "emotions" | "needs" | "strategy",
      "comment": "Start with: 'The element [Name/Text]...' then explain.",
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

async function callGeminiAPI(apiKey: string, parts: any[], prompt: string, maxTokens: number = 4096, model: string = "gemini-2.0-flash") {
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
    const { url, slices, sliceHeights, totalHeight, screenshot } = await req.json();
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
        console.log("Analyzing hero with user's Gemini 2.5 Flash");
        masterResponse = await callGeminiAPI(GEMINI_API_KEY, parts, MULTIMODAL_MASTER_PROMPT, 4096, "gemini-2.5-flash-latest");
        usedModel = 'Gemini 2.5 Flash (User Key)';
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

    // 2. Analyze remaining slices in parallel (BODY) - Use fast, efficient model
    const bodyPromises = slices.slice(1).map(async (slice: string) => {
      const sliceParts = [
        { inline_data: { mime_type: "image/png", data: slice } },
        { text: MARKER_ONLY_PROMPT.replace(/{URL}/g, url) }
      ];
      
      try {
        let response;
        
        // STRATEGY: Prioritize user's Gemini key for body sections (saves Lovable AI credits)
        if (GEMINI_API_KEY) {
          try {
            response = await callGeminiAPI(GEMINI_API_KEY, sliceParts, MARKER_ONLY_PROMPT, 2048, "gemini-2.5-flash-latest");
          } catch (error) {
            // Fallback to Lovable AI if user's Gemini fails
            if (LOVABLE_API_KEY) {
              console.log("User's Gemini failed on body slice, using Lovable AI Flash");
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
        
        return await response.json();
      } catch (error) {
        console.warn("Failed to analyze body slice:", error);
        return { candidates: [{ content: { parts: [{ text: '{"markers":[]}' }] } }] };
      }
    });

    const bodyResponses = await Promise.all(bodyPromises);
    console.log(`Received ${bodyResponses.length} body slice responses`);

    // 3. Process master result with retry logic
    let parsedMaster;
    let cleanedMasterText = cleanJson(masterText);
    
    try {
      parsedMaster = JSON.parse(cleanedMasterText);
      console.log("✓ Master JSON parsed successfully");
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      console.error("JSON Parse Error:", errorMsg);
      console.error("Problematic JSON (first 500 chars):", cleanedMasterText.substring(0, 500));
      
      // RETRY STRATEGY: Try again with a simpler, more reliable model
      if (LOVABLE_API_KEY) {
        try {
          console.log("Retrying with Gemini 2.5 Flash Lite (more reliable)...");
          const retryResponse = await callLovableAI(parts, MULTIMODAL_MASTER_PROMPT, "google/gemini-2.5-flash-lite");
          const retryData = await retryResponse.json();
          const retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text;
          
          if (retryText) {
            const retryCleanedText = cleanJson(retryText);
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
        if (!bodyText) return;

        const cleanedBodyText = cleanJson(bodyText);
        const bodyData = JSON.parse(cleanedBodyText);
        const rawMarkers = bodyData.markers || [];

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

          return {
            x: Math.max(1, Math.min(99, m.x || 50)),
            y: globalY,
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
        console.warn(`Failed to process markers for slice ${index + 1}`, e);
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
