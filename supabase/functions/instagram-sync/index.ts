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
    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!RAPIDAPI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { username } = await req.json();

    if (!username) {
      throw new Error('Username is required');
    }

    // Clean username
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    console.log(`Syncing Instagram user: ${cleanUsername}`);

    // Fetch user info
    const userResponse = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(cleanUsername)}`,
      {
        headers: {
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Instagram user API error:', userResponse.status, errorText);
      throw new Error(`Failed to fetch Instagram user: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('Instagram user data:', JSON.stringify(userData).substring(0, 500));

    const userInfo = userData?.data || userData;

    if (!userInfo?.username && !userInfo?.id) {
      return new Response(
        JSON.stringify({ error: 'USER_NOT_FOUND', message: 'Instagram user not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert creator data
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .upsert({
        channel_id: `instagram_${userInfo.id || userInfo.pk}`,
        channel_name: userInfo.full_name || userInfo.username,
        subscriber_count: userInfo.follower_count || 0,
        total_views: 0, // Instagram doesn't expose total views
        video_count: userInfo.media_count || 0,
        description: userInfo.biography || '',
        thumbnail_url: userInfo.profile_pic_url_hd || userInfo.profile_pic_url,
        country: null,
        custom_url: `@${userInfo.username || cleanUsername}`,
        published_at: null,
        last_synced_at: new Date().toISOString(),
        platform: 'instagram',
      }, { onConflict: 'channel_id' })
      .select()
      .single();

    if (creatorError) {
      console.error('Creator upsert error:', creatorError);
      throw creatorError;
    }

    console.log('Instagram creator synced:', creator.channel_name);

    // Fetch user posts
    const postsResponse = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/posts?username_or_id_or_url=${encodeURIComponent(cleanUsername)}`,
      {
        headers: {
          'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    let videosCount = 0;
    let totalComments = 0;

    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      const posts = postsData?.data?.items || postsData?.items || [];
      console.log(`Fetched ${posts.length} Instagram posts`);

      // Process posts as videos
      const videoInserts = posts.slice(0, 30).map((post: any) => ({
        creator_id: creator.id,
        video_id: `instagram_${post.id || post.pk}`,
        title: (post.caption?.text || 'Untitled').substring(0, 200),
        description: post.caption?.text || '',
        published_at: new Date(post.taken_at * 1000).toISOString(),
        view_count: post.play_count || post.view_count || 0,
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        duration: post.video_duration ? `PT${Math.round(post.video_duration)}S` : null,
        thumbnail_url: post.thumbnail_url || post.image_versions2?.candidates?.[0]?.url,
        tags: post.caption?.text?.match(/#\w+/g)?.map((t: string) => t.slice(1)) || [],
        category_id: null,
        caption_available: !!post.caption?.text,
        last_synced_at: new Date().toISOString(),
      }));

      if (videoInserts.length > 0) {
        const { data: videos, error: videosError } = await supabase
          .from('videos')
          .upsert(videoInserts, { onConflict: 'video_id' })
          .select();

        if (videosError) {
          console.error('Videos upsert error:', videosError);
        } else {
          videosCount = videos?.length || 0;
          console.log(`Synced ${videosCount} Instagram posts`);

          // Fetch comments for each post (limit to first 5 posts)
          for (const video of (videos || []).slice(0, 5)) {
            try {
              const postId = video.video_id.replace('instagram_', '');
              const commentsResponse = await fetch(
                `https://instagram-scraper-api2.p.rapidapi.com/v1/comments?code_or_id_or_url=${postId}`,
                {
                  headers: {
                    'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
                    'x-rapidapi-key': RAPIDAPI_KEY,
                  },
                }
              );

              if (commentsResponse.ok) {
                const commentsData = await commentsResponse.json();
                const comments = commentsData?.data?.items || commentsData?.items || [];

                if (comments.length > 0) {
                  const commentInserts = comments.slice(0, 10).map((comment: any) => ({
                    video_id: video.id,
                    comment_id: `instagram_${comment.pk || comment.id}`,
                    author_name: comment.user?.username || 'Anonymous',
                    text_content: comment.text || '',
                    like_count: comment.comment_like_count || 0,
                    reply_count: comment.child_comment_count || 0,
                    published_at: new Date(comment.created_at * 1000).toISOString(),
                  }));

                  const { error: commentsError } = await supabase
                    .from('comments')
                    .upsert(commentInserts, { onConflict: 'comment_id' });

                  if (!commentsError) {
                    totalComments += commentInserts.length;
                  }
                }
              }
            } catch (commentError) {
              console.log(`Could not fetch comments for Instagram post:`, commentError);
            }
          }
        }
      }
    }

    // Trigger sentiment analysis if we have comments
    if (totalComments > 0) {
      try {
        const { data: allComments } = await supabase
          .from('comments')
          .select('text_content')
          .in('video_id', 
            (await supabase.from('videos').select('id').eq('creator_id', creator.id)).data?.map((v: any) => v.id) || []
          )
          .limit(100);

        if (allComments && allComments.length > 0) {
          await supabase.functions.invoke('analyze-sentiment', {
            body: { comments: allComments.map((c: any) => c.text_content) }
          });
        }
      } catch (sentimentError) {
        console.log('Sentiment analysis error:', sentimentError);
      }
    }

    // Trigger brand extraction
    try {
      const { data: videos } = await supabase
        .from('videos')
        .select('id, title, description')
        .eq('creator_id', creator.id)
        .limit(10);

      for (const video of videos || []) {
        const textToAnalyze = `${video.title}\n${video.description}`;
        await supabase.functions.invoke('extract-brands', {
          body: { text: textToAnalyze, videoId: video.id }
        });
      }
    } catch (brandError) {
      console.log('Brand extraction error:', brandError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Instagram creator synced successfully`,
        creator,
        videosCount,
        commentsCount: totalComments,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in instagram-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
