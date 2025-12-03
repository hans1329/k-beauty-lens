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

    // Get user info directly using tiktok-scraper2 API
    const userResponse = await fetch(
      `https://tiktok-scraper2.p.rapidapi.com/user/info?user_name=${encodeURIComponent(cleanUsername)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'tiktok-scraper2.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('TikTok API error:', userResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search TikTok', details: errorText }),
        { status: userResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userData = await userResponse.json();
    console.log('TikTok user response:', JSON.stringify(userData).substring(0, 500));

    // Extract user info from response
    const userInfo = userData?.data?.user || userData?.user || userData;
    const userStats = userData?.data?.stats || userData?.stats || {};
    
    if (!userInfo?.uniqueId && !userInfo?.id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          results: [],
          total: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return single result as array for consistency
    const results = [{
      id: userInfo?.id || userInfo?.uid,
      uniqueId: userInfo?.uniqueId || cleanUsername,
      nickname: userInfo?.nickname,
      avatarUrl: userInfo?.avatarLarger || userInfo?.avatarMedium || userInfo?.avatarThumb,
      followerCount: userStats?.followerCount || userInfo?.followerCount || 0,
      followingCount: userStats?.followingCount || userInfo?.followingCount || 0,
      videoCount: userStats?.videoCount || userInfo?.videoCount || 0,
      signature: userInfo?.signature,
      verified: userInfo?.verified || false,
    }];

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
