import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { comments } = await req.json();

    if (!comments || !Array.isArray(comments)) {
      throw new Error('Comments array is required');
    }

    console.log(`Analyzing sentiment for ${comments.length} comments`);

    // Prepare comments text for analysis
    const commentsText = comments.map(c => c.text_content).join('\n---\n');

    // Call Lovable AI for sentiment analysis
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert for beauty/cosmetics YouTube comments. Analyze comments and extract:
1. Overall sentiment (positive/negative/neutral)
2. Language detection (Korean/English/Japanese/Thai/Other)
3. Key emotions and engagement patterns
4. Questions asked by viewers

Return structured data in JSON format.`
          },
          {
            role: 'user',
            content: `Analyze these YouTube comments and provide sentiment analysis:\n\n${commentsText}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'analyze_comments',
              description: 'Analyze YouTube comments for sentiment, language, and patterns',
              parameters: {
                type: 'object',
                properties: {
                  overall_sentiment: {
                    type: 'object',
                    properties: {
                      positive: { type: 'number', description: 'Percentage of positive sentiment' },
                      neutral: { type: 'number', description: 'Percentage of neutral sentiment' },
                      negative: { type: 'number', description: 'Percentage of negative sentiment' }
                    },
                    required: ['positive', 'neutral', 'negative']
                  },
                  language_distribution: {
                    type: 'object',
                    properties: {
                      korean: { type: 'number', description: 'Percentage of Korean comments' },
                      english: { type: 'number', description: 'Percentage of English comments' },
                      japanese: { type: 'number', description: 'Percentage of Japanese comments' },
                      thai: { type: 'number', description: 'Percentage of Thai comments' },
                      other: { type: 'number', description: 'Percentage of other languages' }
                    },
                    required: ['korean', 'english', 'japanese', 'thai', 'other']
                  },
                  top_questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        category: { type: 'string', description: 'Category like product_inquiry, tutorial_help, etc' }
                      },
                      required: ['question', 'category']
                    },
                    description: 'Top 5-10 frequently asked questions'
                  },
                  engagement_insights: {
                    type: 'object',
                    properties: {
                      authenticity_score: { type: 'number', description: 'Score 0-100 indicating genuine engagement' },
                      brand_safety_score: { type: 'number', description: 'Score 0-100 indicating brand safety' },
                      community_tone: { type: 'string', description: 'Overall community vibe' }
                    },
                    required: ['authenticity_score', 'brand_safety_score', 'community_tone']
                  }
                },
                required: ['overall_sentiment', 'language_distribution', 'top_questions', 'engagement_insights'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'analyze_comments' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log('AI response:', JSON.stringify(aiResult));

    // Extract tool call result
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Sentiment analysis complete:', analysis);

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-sentiment function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});