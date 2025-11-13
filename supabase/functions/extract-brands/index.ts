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
    const { text, videoId } = await req.json();

    if (!text || !videoId) {
      throw new Error('Text and videoId are required');
    }

    console.log(`Extracting brands from text for video: ${videoId}`);

    // Call Lovable AI for brand/product extraction
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
            content: `You are a K-beauty brand and product extraction expert. Extract all beauty brand names and product names from the text.
Focus on:
- Korean beauty brands (에뛰드, 이니스프리, 라네즈, 설화수, etc.)
- International brands (MAC, NARS, Fenty Beauty, etc.)
- Specific product names (cushion, tint, serum, etc.)
- Sentiment about each brand/product (positive/neutral/negative)

Return structured data with brand exposure scoring.`
          },
          {
            role: 'user',
            content: `Extract brand and product mentions from this video content:\n\n${text}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_brands',
              description: 'Extract beauty brands and products with sentiment analysis',
              parameters: {
                type: 'object',
                properties: {
                  brand_mentions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        brand_name: { type: 'string', description: 'Brand name' },
                        product_name: { type: 'string', description: 'Specific product if mentioned' },
                        mention_count: { type: 'number', description: 'Number of times mentioned' },
                        sentiment: { 
                          type: 'string', 
                          enum: ['positive', 'neutral', 'negative'],
                          description: 'Sentiment of the mention' 
                        },
                        context: { type: 'string', description: 'Brief context of the mention' }
                      },
                      required: ['brand_name', 'mention_count', 'sentiment']
                    }
                  },
                  keywords: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        keyword: { type: 'string' },
                        keyword_type: { 
                          type: 'string',
                          enum: ['product_category', 'skin_concern', 'technique', 'ingredient', 'style'],
                          description: 'Type of keyword'
                        },
                        confidence: { type: 'number', description: 'Confidence score 0-1' }
                      },
                      required: ['keyword', 'keyword_type']
                    },
                    description: 'Beauty-related keywords'
                  }
                },
                required: ['brand_mentions', 'keywords'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_brands' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log('AI response:', JSON.stringify(aiResult));

    // Extract tool call result
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const extraction = JSON.parse(toolCall.function.arguments);
    console.log('Brand extraction complete:', extraction);

    // Store brand mentions in database
    if (extraction.brand_mentions && extraction.brand_mentions.length > 0) {
      const brandInserts = extraction.brand_mentions.map((mention: any) => ({
        video_id: videoId,
        brand_name: mention.brand_name,
        product_name: mention.product_name || null,
        mention_count: mention.mention_count || 1,
        sentiment: mention.sentiment,
        context: mention.context || null
      }));

      const { error: brandError } = await supabase
        .from('brand_mentions')
        .upsert(brandInserts, { 
          onConflict: 'video_id,brand_name',
          ignoreDuplicates: false 
        });

      if (brandError) {
        console.error('Error storing brand mentions:', brandError);
      }
    }

    // Store keywords in database
    if (extraction.keywords && extraction.keywords.length > 0) {
      const keywordInserts = extraction.keywords.map((kw: any) => ({
        video_id: videoId,
        keyword: kw.keyword,
        keyword_type: kw.keyword_type,
        confidence: kw.confidence || null
      }));

      const { error: keywordError } = await supabase
        .from('video_keywords')
        .upsert(keywordInserts, { 
          onConflict: 'video_id,keyword',
          ignoreDuplicates: true 
        });

      if (keywordError) {
        console.error('Error storing keywords:', keywordError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        extraction
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-brands function:', error);
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