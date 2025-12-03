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
    
    console.log(`Searching Instagram for username: ${cleanUsername}`);

    // Search for Instagram user info
    const searchResponse = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(cleanUsername)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Instagram API error:', searchResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search Instagram', details: errorText }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log('Instagram search response:', JSON.stringify(searchData).substring(0, 500));

    // Extract user data from response
    const userData = searchData?.data || searchData;
    
    if (!userData || !userData.username) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = {
      id: userData.id,
      username: userData.username,
      fullName: userData.full_name,
      avatarUrl: userData.profile_pic_url || userData.profile_pic_url_hd,
      followerCount: userData.follower_count || 0,
      followingCount: userData.following_count || 0,
      postCount: userData.media_count || 0,
      bio: userData.biography,
      isVerified: userData.is_verified || false,
      isPrivate: userData.is_private || false,
      externalUrl: userData.external_url,
      category: userData.category,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in instagram-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
