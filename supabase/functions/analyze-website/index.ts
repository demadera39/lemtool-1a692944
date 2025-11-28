import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function cleanJson(text: string): string {
  if (!text) return "{}";

  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(markdownRegex);
  if (match && match[1]) {
    text = match[1];
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    console.warn("AI returned non-JSON response (no braces found):", text);
    return "{}";
  }

  return text.substring(firstBrace, lastBrace + 1).trim();
}

const MULTIMODAL_MASTER_PROMPT = `
You are an Elite Senior UX Researcher analyzing the **HERO SECTION / TOP PART** of a website.
Target URL: {URL}

**CRITICAL REQUIREMENT: PRECISION & PLACEMENT**
- Coordinates (x,y) range from 0-100.
- x=0 is Left, x=100 is Right.
- y=0 is Top, y=100 is Bottom.
- Place markers at the **exact visual center** of UI elements.
- DO NOT use default coordinates like 50,50 or 0,0 or 100,100.
- DO NOT place markers on empty whitespace.

Return ONLY valid JSON wrapped in \`\`\`json \`\`\`:
{
  "markers": [
    {
      "x": number (0-100),
      "y": number (0-100),
      "comment": "The element [Name]...",
      "emotion": "Joy"|"Desire"|"Interest"|"Satisfaction"|"Neutral"|"Sadness"|"Aversion"|"Boredom"|"Dissatisfaction"
    }
  ],
  "overallScore": number (0-100),
  "summary": string,
  "targetAudience": string,
  "brandValues": [string],
  "sdtScores": { 
    "autonomy": { "score": number, "justification": string }, 
    "competence": { "score": number, "justification": string }, 
    "relatedness": { "score": number, "justification": string } 
  },
  "keyFindings": [{ "title": string, "description": string }],
  "suggestions": [string]
}
`;

const MARKER_ONLY_PROMPT = `
Analyze this **LOWER SECTION** of a website (URL: {URL}).

**COORDINATE INSTRUCTIONS**:
- This image is a SLICE of the full page.
- x=0, y=0 is TOP-LEFT of THIS image.
- x=100, y=100 is BOTTOM-RIGHT of THIS image.
- Be precise. If a button is on the left, x ~25. If on the right, x ~85.
- AVOID 50,50 or 0,0.

Return ONLY valid JSON wrapped in \`\`\`json \`\`\`:
{
  "markers": [
    {
      "x": number (0-100),
      "y": number (0-100),
      "comment": "The element [Name]...",
      "emotion": "Joy"|"Desire"|"Interest"|"Satisfaction"|"Neutral"|"Sadness"|"Aversion"|"Boredom"|"Dissatisfaction"
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, slices, sliceHeights, totalHeight, screenshot } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    if (!slices || !sliceHeights || !totalHeight) {
      throw new Error("Sliced image data is required");
    }

    console.log(`Analyzing ${slices.length} slices. Total Height: ${totalHeight}px`);

    // 1. Analyze first slice with master prompt
    const masterResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: "image/png", data: slices[0] } },
                { text: MULTIMODAL_MASTER_PROMPT.replace(/{URL}/g, url) }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        }),
      }
    );

    if (!masterResponse.ok) {
      const errorText = await masterResponse.text();
      console.error("Gemini API error:", masterResponse.status, errorText);
      throw new Error(`Gemini API error: ${masterResponse.status}`);
    }

    const masterData = await masterResponse.json();
    console.log("Master response received");
    
    const masterText = masterData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!masterText) {
      throw new Error("No content generated from Gemini");
    }

    // 2. Analyze remaining slices in parallel
    const bodyPromises = slices.slice(1).map((slice: string) =>
      fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { inline_data: { mime_type: "image/png", data: slice } },
                  { text: MARKER_ONLY_PROMPT.replace(/{URL}/g, url) }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          }),
        }
      ).then(r => r.json())
    );

    const bodyResponses = await Promise.all(bodyPromises);
    console.log(`Received ${bodyResponses.length} body slice responses`);

    // 3. Process master result
    const cleanedMasterText = cleanJson(masterText);
    const parsedMaster = JSON.parse(cleanedMasterText);

    // Transform emotion types
    const emotionTypeMap: Record<string, string> = {
      'JOY': 'Joy', 'DESIRE': 'Desire', 'FASCINATION': 'Fascination',
      'INTEREST': 'Fascination', 'SATISFACTION': 'Satisfaction',
      'NEUTRAL': 'Neutral', 'SADNESS': 'Sadness', 'DISGUST': 'Disgust',
      'AVERSION': 'Disgust', 'BOREDOM': 'Boredom', 'DISSATISFACTION': 'Dissatisfaction'
    };

    let allMarkers = (parsedMaster.markers || []).map((m: any) => ({
      x: m.x || 50,
      y: m.y || 50,
      layer: 'emotions',
      emotion: emotionTypeMap[m.emotion?.toUpperCase()] || 'Neutral',
      comment: m.comment || '',
    }));

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
          // Convert local % to local pixels
          const localYPx = (m.y / 100) * thisSliceHeight;
          // Add offset of previous slices
          const globalYPx = currentYOffset + localYPx;
          // Convert to global %
          const globalY = (globalYPx / totalHeight) * 100;

          return {
            x: m.x || 50,
            y: globalY,
            layer: 'emotions',
            emotion: emotionTypeMap[m.emotion?.toUpperCase()] || 'Neutral',
            comment: m.comment || '',
          };
        });

        allMarkers = [...allMarkers, ...processedBodyMarkers];
        currentYOffset += thisSliceHeight;

      } catch (e) {
        console.warn(`Failed to process markers for slice ${index + 1}`, e);
      }
    });

    // 6. Filter out suspicious default positions
    allMarkers = allMarkers.filter((m: any) => {
      if (m.x === 0 || m.x === 100) return false;
      if (m.x === 50 && m.y === 50) return false;
      return true;
    });

    // 7. Decluster markers
    if (allMarkers.length > 5) {
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

    const report = {
      overallScore: parsedMaster.overallScore || 70,
      summary: parsedMaster.summary || "Analysis complete",
      targetAudience: parsedMaster.targetAudience || "General web users",
      audienceSplit: [
        { label: 'Primary', percentage: 60 },
        { label: 'Secondary', percentage: 30 },
        { label: 'Tertiary', percentage: 10 }
      ],
      personas: [],
      brandValues: parsedMaster.brandValues || [],
      keyFindings: (parsedMaster.keyFindings || []).map((f: any) => ({
        title: f.title || 'Insight',
        description: f.description || '',
        type: 'neutral'
      })),
      suggestions: parsedMaster.suggestions || [],
      layoutStructure: [],
      sdtScores: transformedSdtScores,
      creativeBrief: {
        problemStatement: '',
        targetEmotion: '',
        howMightWe: '',
        strategicDirection: ''
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
