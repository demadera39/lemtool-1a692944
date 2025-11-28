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
Return ONLY a valid JSON object wrapped in \`\`\`json \`\`\`.
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
Return ONLY a valid JSON object wrapped in \`\`\`json \`\`\`.
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

    // Transform emotion types (handle Interest→Fascination and Aversion→Disgust)
    const emotionTypeMap: Record<string, string> = {
      'JOY': 'Joy', 'DESIRE': 'Desire', 'INTEREST': 'Fascination', 'FASCINATION': 'Fascination',
      'SATISFACTION': 'Satisfaction', 'NEUTRAL': 'Neutral', 'SADNESS': 'Sadness',
      'AVERSION': 'Disgust', 'DISGUST': 'Disgust', 'BOREDOM': 'Boredom',
      'DISSATISFACTION': 'Dissatisfaction'
    };

    let allMarkers = (parsedMaster.markers || []).map((m: any) => ({
      x: Math.max(1, Math.min(99, m.x || 50)),
      y: Math.max(0, Math.min(100, m.y || 50)),
      layer: m.layer || 'emotions',
      emotion: emotionTypeMap[m.emotion?.toUpperCase()] || 'Neutral',
      need: m.need,
      brief_type: m.brief_type,
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
          // STITCHING MATH:
          // 1. Convert local % to local pixels
          const localYPx = (m.y / 100) * thisSliceHeight;
          // 2. Add offset of previous slices
          const globalYPx = currentYOffset + localYPx;
          // 3. Convert to global %
          const globalY = (globalYPx / totalHeight) * 100;

          return {
            x: Math.max(1, Math.min(99, m.x || 50)),
            y: globalY,
            layer: m.layer || 'emotions',
            emotion: emotionTypeMap[m.emotion?.toUpperCase()] || 'Neutral',
            need: m.need,
            brief_type: m.brief_type,
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
