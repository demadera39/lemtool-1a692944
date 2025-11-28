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
    const systemPrompt = `You are an expert UX researcher and emotional design analyst. Analyze the provided website screenshot and identify emotional triggers, user needs, and strategic insights.

For each emotional marker you identify, provide:
1. The emotion type (JOY, DESIRE, FASCINATION, SATISFACTION, NEUTRAL, SADNESS, DISGUST, BOREDOM, DISSATISFACTION)
2. X and Y coordinates (as percentages 0-100) where this emotion is triggered
3. A brief comment explaining why this element triggers this emotion

Also provide:
- Overall UX emotion score (0-100)
- Target audience analysis
- Self-Determination Theory scores (Autonomy, Competence, Relatedness)
- Key findings and suggestions

Return your analysis as a structured JSON object.`;

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
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", generatedText);
      // Return a fallback structure
      analysis = {
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
      };
    }

    return new Response(JSON.stringify(analysis), {
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
