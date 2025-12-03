import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    
    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      console.error('RAPIDAPI_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean username - remove @ if present
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    
    console.log(`Searching TikTok for username: ${cleanUsername}`);

    // Search for TikTok account
    const searchResponse = await fetch(
      `https://tiktok-api23.p.rapidapi.com/api/search/account?keyword=${encodeURIComponent(cleanUsername)}&cursor=0&search_id=0`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('TikTok API error:', searchResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search TikTok', details: errorText }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log('TikTok search response:', JSON.stringify(searchData).substring(0, 500));

    // Extract user list from response
    const users = searchData?.data?.user_list || searchData?.user_list || [];
    
    // Map to a cleaner format
    const results = users.map((item: any) => {
      const userInfo = item?.user_info || item;
      return {
        id: userInfo?.uid || userInfo?.user_id || userInfo?.id,
        uniqueId: userInfo?.unique_id || userInfo?.uniqueId,
        nickname: userInfo?.nickname,
        avatarUrl: userInfo?.avatar_thumb?.url_list?.[0] || userInfo?.avatar_medium?.url_list?.[0] || userInfo?.avatarMedium,
        followerCount: userInfo?.follower_count || userInfo?.followerCount || 0,
        followingCount: userInfo?.following_count || userInfo?.followingCount || 0,
        videoCount: userInfo?.aweme_count || userInfo?.videoCount || 0,
        signature: userInfo?.signature,
        verified: userInfo?.custom_verify || userInfo?.verified || false,
      };
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        total: results.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tiktok-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
