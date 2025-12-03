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
    console.log(`Syncing TikTok user: ${cleanUsername}`);

    // Fetch user info
    const userResponse = await fetch(
      `https://tiktok-api23.p.rapidapi.com/api/user/info?uniqueId=${encodeURIComponent(cleanUsername)}`,
      {
        headers: {
          'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('TikTok user API error:', userResponse.status, errorText);
      throw new Error(`Failed to fetch TikTok user: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('TikTok user data:', JSON.stringify(userData).substring(0, 500));

    const userInfo = userData?.userInfo?.user || userData?.user || userData;
    const userStats = userData?.userInfo?.stats || userData?.stats || {};

    if (!userInfo?.uniqueId && !userInfo?.id) {
      return new Response(
        JSON.stringify({ error: 'USER_NOT_FOUND', message: 'TikTok user not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert creator data
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .upsert({
        channel_id: `tiktok_${userInfo.id || userInfo.uniqueId}`,
        channel_name: userInfo.nickname || userInfo.uniqueId,
        subscriber_count: userStats.followerCount || userStats.follower_count || 0,
        total_views: userStats.heartCount || userStats.heart_count || 0,
        video_count: userStats.videoCount || userStats.video_count || 0,
        description: userInfo.signature || '',
        thumbnail_url: userInfo.avatarLarger || userInfo.avatarMedium || userInfo.avatar_thumb?.url_list?.[0],
        country: null,
        custom_url: `@${userInfo.uniqueId || cleanUsername}`,
        published_at: null,
        last_synced_at: new Date().toISOString(),
        platform: 'tiktok',
      }, { onConflict: 'channel_id' })
      .select()
      .single();

    if (creatorError) {
      console.error('Creator upsert error:', creatorError);
      throw creatorError;
    }

    console.log('TikTok creator synced:', creator.channel_name);

    // Fetch user posts/videos
    const postsResponse = await fetch(
      `https://tiktok-api23.p.rapidapi.com/api/user/posts?uniqueId=${encodeURIComponent(cleanUsername)}&count=30`,
      {
        headers: {
          'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
        },
      }
    );

    let videosCount = 0;
    let totalComments = 0;

    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      const posts = postsData?.itemList || postsData?.items || [];
      console.log(`Fetched ${posts.length} TikTok posts`);

      // Process videos
      const videoInserts = posts.map((post: any) => ({
        creator_id: creator.id,
        video_id: `tiktok_${post.id}`,
        title: post.desc || 'Untitled',
        description: post.desc || '',
        published_at: new Date(post.createTime * 1000).toISOString(),
        view_count: post.stats?.playCount || post.playCount || 0,
        like_count: post.stats?.diggCount || post.diggCount || 0,
        comment_count: post.stats?.commentCount || post.commentCount || 0,
        duration: `PT${post.video?.duration || 0}S`,
        thumbnail_url: post.video?.cover || post.video?.dynamicCover,
        tags: post.challenges?.map((c: any) => c.title) || [],
        category_id: null,
        caption_available: false,
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
          console.log(`Synced ${videosCount} TikTok videos`);

          // Fetch comments for each video (limit to first 5 videos)
          for (const video of (videos || []).slice(0, 5)) {
            try {
              const videoId = video.video_id.replace('tiktok_', '');
              const commentsResponse = await fetch(
                `https://tiktok-api23.p.rapidapi.com/api/comment/list?aweme_id=${videoId}&count=10`,
                {
                  headers: {
                    'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com',
                    'x-rapidapi-key': RAPIDAPI_KEY,
                  },
                }
              );

              if (commentsResponse.ok) {
                const commentsData = await commentsResponse.json();
                const comments = commentsData?.comments || [];

                if (comments.length > 0) {
                  const commentInserts = comments.map((comment: any) => ({
                    video_id: video.id,
                    comment_id: `tiktok_${comment.cid || comment.id}`,
                    author_name: comment.user?.nickname || 'Anonymous',
                    text_content: comment.text || '',
                    like_count: comment.digg_count || 0,
                    reply_count: comment.reply_comment_total || 0,
                    published_at: new Date(comment.create_time * 1000).toISOString(),
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
              console.log(`Could not fetch comments for TikTok video:`, commentError);
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
        message: `TikTok creator synced successfully`,
        creator,
        videosCount,
        commentsCount: totalComments,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in tiktok-sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
