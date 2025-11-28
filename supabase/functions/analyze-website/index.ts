import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, screenshot } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Prepare the prompt for Gemini
    const systemPrompt = `You are an expert UX researcher and emotional design analyst. Analyze the provided website screenshot section and identify emotional triggers.

IMPORTANT COORDINATE INSTRUCTIONS:
- The screenshot shows a full webpage from top to bottom
- Y-coordinates (0-100) represent the ENTIRE page height
- Y=0 is the top of the page, Y=100 is the bottom
- Distribute markers throughout the ENTIRE vertical range (top, middle, and bottom sections)
- Look at the full page structure: hero, features, testimonials, footer, etc.
- Place markers accurately where visual elements trigger emotions

Return your analysis as a JSON object with this exact structure:
{
  "emotional_triggers": [
    {
      "emotion_type": "JOY|DESIRE|FASCINATION|SATISFACTION|NEUTRAL|SADNESS|DISGUST|BOREDOM|DISSATISFACTION",
      "x": 0-100,
      "y": 0-100,
      "comment": "Brief explanation of what element triggers this emotion"
    }
  ],
  "overall_ux_emotion_score": 0-100,
  "target_audience_analysis": "Description of target audience",
  "self_determination_theory_scores": {
    "autonomy": { "score": 0-10, "justification": "Brief explanation" },
    "competence": { "score": 0-10, "justification": "Brief explanation" },
    "relatedness": { "score": 0-10, "justification": "Brief explanation" }
  },
  "key_findings_and_suggestions": ["Finding 1", "Finding 2", ...]
}`;

    const requestBody: any = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            { text: `Website URL: ${url}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    };

    // If screenshot is provided, add it to the request
    if (screenshot) {
      requestBody.contents[0].parts.push({
        inline_data: {
          mime_type: "image/png",
          data: screenshot.split(',')[1] // Remove data:image/png;base64, prefix
        }
      });
    }

    // Call Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    // Extract the generated content
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No content generated from Gemini");
    }

    // Try to parse JSON from the response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", generatedText);
      // Return a fallback structure
      return new Response(JSON.stringify({
        rawResponse: generatedText,
        markers: [],
        report: {
          overallScore: 50,
          summary: generatedText.substring(0, 500),
          targetAudience: "General users",
          sdtScores: {
            autonomy: { score: 5, justification: "Analysis in progress" },
            competence: { score: 5, justification: "Analysis in progress" },
            relatedness: { score: 5, justification: "Analysis in progress" }
          }
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform the Gemini response to our expected format
    const emotionTypeMap: Record<string, string> = {
      'JOY': 'Joy',
      'DESIRE': 'Desire',
      'FASCINATION': 'Fascination',
      'SATISFACTION': 'Satisfaction',
      'NEUTRAL': 'Neutral',
      'SADNESS': 'Sadness',
      'DISGUST': 'Disgust',
      'BOREDOM': 'Boredom',
      'DISSATISFACTION': 'Dissatisfaction'
    };

    const markers = (parsedData.emotional_triggers || []).map((trigger: any) => ({
      x: trigger.x || 50,
      y: trigger.y || 50,
      layer: 'emotions',
      emotion: emotionTypeMap[trigger.emotion_type] || 'Neutral',
      comment: trigger.comment || '',
    }));

    // Transform SDT scores to ensure they have the right structure
    const sdtScores = parsedData.self_determination_theory_scores || {};
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
      overallScore: parsedData.overall_ux_emotion_score || 70,
      summary: parsedData.target_audience_analysis || "Analysis complete",
      targetAudience: parsedData.target_audience_analysis || "General web users",
      audienceSplit: [
        { label: 'Primary', percentage: 60 },
        { label: 'Secondary', percentage: 30 },
        { label: 'Tertiary', percentage: 10 }
      ],
      personas: [],
      brandValues: [],
      keyFindings: (parsedData.key_findings_and_suggestions || []).slice(0, 3).map((f: string) => ({
        title: f.split(':')[0] || 'Insight',
        description: f.split(':')[1] || f,
        type: 'neutral'
      })),
      suggestions: parsedData.key_findings_and_suggestions || [],
      layoutStructure: [],
      sdtScores: transformedSdtScores,
      creativeBrief: {
        problemStatement: '',
        targetEmotion: '',
        howMightWe: '',
        strategicDirection: ''
      }
    };

    return new Response(JSON.stringify({ markers, report }), {
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
