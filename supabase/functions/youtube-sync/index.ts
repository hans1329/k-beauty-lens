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
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!YOUTUBE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { channelId, action } = await req.json();

    if (!channelId) {
      throw new Error('Channel ID is required');
    }

    console.log(`Syncing YouTube channel: ${channelId}`);

    // Parse channel identifier (URL, handle, or ID)
    let actualChannelId = channelId.trim();
    let apiUrl = '';
    
    // Check if it's a URL
    if (actualChannelId.includes('youtube.com') || actualChannelId.includes('youtu.be')) {
      console.log('Detected YouTube URL, extracting identifier');
      
      // Extract handle from URL like youtube.com/@username
      const handleMatch = actualChannelId.match(/@([^/\?]+)/);
      if (handleMatch) {
        const handle = handleMatch[1];
        console.log(`Extracted handle: @${handle}`);
        apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${handle}&key=${YOUTUBE_API_KEY}`;
      } else {
        // Extract channel ID from URL like youtube.com/channel/UCxxxxxx
        const channelMatch = actualChannelId.match(/\/channel\/([^/\?]+)/);
        if (channelMatch) {
          actualChannelId = channelMatch[1];
          console.log(`Extracted channel ID: ${actualChannelId}`);
          apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${actualChannelId}&key=${YOUTUBE_API_KEY}`;
        } else {
          throw new Error('Could not extract channel ID or handle from URL. Please use channel ID (UCxxxxx), handle (@username), or full URL.');
        }
      }
    } 
    // Check if it's a handle (@username)
    else if (actualChannelId.startsWith('@')) {
      const handle = actualChannelId.substring(1);
      console.log(`Using handle: @${handle}`);
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${handle}&key=${YOUTUBE_API_KEY}`;
    } 
    // Assume it's a channel ID (UCxxxxx)
    else {
      console.log(`Using channel ID: ${actualChannelId}`);
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${actualChannelId}&key=${YOUTUBE_API_KEY}`;
    }

    // Fetch channel information
    console.log('API URL (key masked):', apiUrl.replace(YOUTUBE_API_KEY, 'MASKED'));
    
    const channelResponse = await fetch(apiUrl);

    console.log(`YouTube API response status: ${channelResponse.status}`);

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      console.error('YouTube API error response:', errorText);
      throw new Error(`YouTube API returned status ${channelResponse.status}: ${errorText}`);
    }

    const channelData = await channelResponse.json();
    console.log(`Channel data received:`, JSON.stringify(channelData, null, 2));

    // Check for API errors even with 200 status
    if (channelData.error) {
      console.error('YouTube API error in response:', channelData.error);
      throw new Error(`YouTube API error: ${channelData.error.message || JSON.stringify(channelData.error)}`);
    }

    if (!channelData.items || channelData.items.length === 0) {
      console.error('No channel found in YouTube API response');
      return new Response(
        JSON.stringify({ 
          error: 'CHANNEL_NOT_FOUND',
          message: `No YouTube channel found with handle ${channelId}`
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const channel = channelData.items[0];
    const snippet = channel.snippet;
    const statistics = channel.statistics;

    // Upsert creator data (use the actual channel ID from API response)
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .upsert({
        channel_id: channel.id,
        channel_name: snippet.title,
        subscriber_count: parseInt(statistics.subscriberCount || '0'),
        total_views: parseInt(statistics.viewCount || '0'),
        video_count: parseInt(statistics.videoCount || '0'),
        description: snippet.description,
        thumbnail_url: snippet.thumbnails?.high?.url,
        country: snippet.country,
        custom_url: snippet.customUrl,
        published_at: snippet.publishedAt,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'channel_id' })
      .select()
      .single();

    if (creatorError) {
      console.error('Creator upsert error:', creatorError);
      throw creatorError;
    }

    console.log('Creator synced:', creator.channel_name);

    // Check for the most recent video to enable incremental sync
    const { data: latestVideo } = await supabase
      .from('videos')
      .select('published_at')
      .eq('creator_id', creator.id)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch videos from the channel
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
    
    // Build API URL with publishedAfter parameter for incremental sync
    let videosApiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    
    if (latestVideo?.published_at) {
      const publishedAfter = new Date(latestVideo.published_at).toISOString();
      videosApiUrl += `&publishedAfter=${publishedAfter}`;
      console.log(`Incremental sync: fetching videos published after ${publishedAfter}`);
    } else {
      console.log('First sync: fetching latest 50 videos');
    }
    
    const videosResponse = await fetch(videosApiUrl);

    if (!videosResponse.ok) {
      console.error(`Failed to fetch videos: ${videosResponse.status}`);
      // If videos fetch fails, still return the creator data
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Channel synced successfully, but videos could not be fetched',
          creator 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videosData = await videosResponse.json();
    const videoIds = videosData.items?.map((item: any) => item.contentDetails.videoId) || [];

    if (videoIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Channel synced but no videos found',
          creator 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch detailed video information
    const videoDetailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
    );

    if (!videoDetailsResponse.ok) {
      console.error(`Failed to fetch video details: ${videoDetailsResponse.status}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Channel synced successfully, but video details could not be fetched',
          creator 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoDetailsData = await videoDetailsResponse.json();

    // Process and insert videos
    const videoInserts = videoDetailsData.items.map((video: any) => ({
      creator_id: creator.id,
      video_id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      published_at: video.snippet.publishedAt,
      view_count: parseInt(video.statistics.viewCount || '0'),
      like_count: parseInt(video.statistics.likeCount || '0'),
      comment_count: parseInt(video.statistics.commentCount || '0'),
      duration: video.contentDetails.duration,
      thumbnail_url: video.snippet.thumbnails?.high?.url,
      tags: video.snippet.tags || [],
      category_id: video.snippet.categoryId,
      caption_available: video.contentDetails.caption === 'true',
      last_synced_at: new Date().toISOString(),
    }));

    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .upsert(videoInserts, { onConflict: 'video_id' })
      .select();

    if (videosError) {
      console.error('Videos upsert error:', videosError);
      throw videosError;
    }

    console.log(`Synced ${videos.length} videos for ${creator.channel_name}`);

    // Sync comments for each video (limit to 10 top comments per video)
    let totalComments = 0;
    for (const video of videos) {
      try {
        const commentsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${video.video_id}&order=relevance&maxResults=10&key=${YOUTUBE_API_KEY}`
        );

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          
          if (commentsData.items && commentsData.items.length > 0) {
            const commentInserts = commentsData.items.map((item: any) => {
              const comment = item.snippet.topLevelComment.snippet;
              return {
                video_id: video.id,
                comment_id: item.snippet.topLevelComment.id,
                author_name: comment.authorDisplayName,
                text_content: comment.textDisplay,
                like_count: parseInt(comment.likeCount || '0'),
                reply_count: parseInt(item.snippet.totalReplyCount || '0'),
                published_at: comment.publishedAt,
              };
            });

            const { error: commentsError } = await supabase
              .from('comments')
              .upsert(commentInserts, { onConflict: 'comment_id' });

            if (!commentsError) {
              totalComments += commentInserts.length;
            }
          }
        }
      } catch (commentError) {
        console.log(`Could not fetch comments for video ${video.video_id}:`, commentError);
        // Continue even if comments fail (might be disabled)
      }

      // Store thumbnail analysis data
      if (video.thumbnail_url) {
        try {
          await supabase
            .from('thumbnail_analysis')
            .upsert({
              video_id: video.id,
              thumbnail_url: video.thumbnail_url,
              analyzed_at: new Date().toISOString(),
            }, { onConflict: 'video_id' });
        } catch (thumbnailError) {
          console.log(`Could not store thumbnail analysis for video ${video.video_id}:`, thumbnailError);
        }
      }
    }

    console.log(`Synced ${totalComments} comments across ${videos.length} videos`);

    // Batch analyze sentiment for all comments
    if (totalComments > 0) {
      try {
        const allComments = await supabase
          .from('comments')
          .select('id, text_content')
          .in('video_id', videos.map(v => v.id))
          .limit(50);

        if (allComments.data && allComments.data.length > 0) {
          console.log(`Analyzing sentiment for ${allComments.data.length} comments...`);
          
          const sentimentResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-sentiment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ comments: allComments.data })
          });

          if (sentimentResponse.ok) {
            const sentimentData = await sentimentResponse.json();
            console.log('Sentiment analysis complete:', sentimentData.analysis);
          }
        }
      } catch (sentimentError) {
        console.log('Could not analyze sentiment:', sentimentError);
      }
    }

    // Extract brands and keywords from video descriptions
    for (const video of videos.slice(0, 10)) { // Analyze first 10 videos
      if (video.description) {
        try {
          console.log(`Extracting brands from video: ${video.title}`);
          
          const extractResponse = await fetch(`${SUPABASE_URL}/functions/v1/extract-brands`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              text: video.description,
              videoId: video.id
            })
          });

          if (extractResponse.ok) {
            const extractData = await extractResponse.json();
            console.log(`Extracted ${extractData.extraction.brand_mentions?.length || 0} brand mentions`);
          }
        } catch (extractError) {
          console.log(`Could not extract brands for video ${video.id}:`, extractError);
        }
      }
    }

    console.log(`Sync complete: ${videos.length} videos, ${totalComments} comments analyzed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        creator,
        videosCount: videos.length,
        commentsCount: totalComments,
        message: `Successfully synced ${videos.length} videos and ${totalComments} comments from ${creator.channel_name}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in youtube-sync function:', error);
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