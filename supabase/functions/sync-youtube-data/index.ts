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

    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { channelId } = await req.json();

    console.log('Syncing YouTube data for channel:', channelId);

    // Fetch channel details
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );

    if (!channelResponse.ok) {
      const error = await channelResponse.text();
      console.error('YouTube API error:', error);
      throw new Error(`YouTube API error: ${channelResponse.status}`);
    }

    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channel = channelData.items[0];
    const snippet = channel.snippet;
    const statistics = channel.statistics;

    // Upsert creator data
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .upsert({
        channel_id: channelId,
        channel_name: snippet.title,
        description: snippet.description,
        thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
        subscriber_count: parseInt(statistics.subscriberCount || '0'),
        total_views: parseInt(statistics.viewCount || '0'),
        video_count: parseInt(statistics.videoCount || '0'),
        country: snippet.country,
        custom_url: snippet.customUrl,
        published_at: snippet.publishedAt,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'channel_id'
      })
      .select()
      .single();

    if (creatorError) {
      console.error('Creator upsert error:', creatorError);
      throw creatorError;
    }

    console.log('Creator synced:', creator.channel_name);

    // Get uploads playlist ID
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

    // Fetch recent videos from uploads playlist
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    );

    if (!playlistResponse.ok) {
      const error = await playlistResponse.text();
      console.error('Playlist API error:', error);
      throw new Error(`Playlist API error: ${playlistResponse.status}`);
    }

    const playlistData = await playlistResponse.json();
    const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(',');

    // Fetch detailed video information
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      const error = await videosResponse.text();
      console.error('Videos API error:', error);
      throw new Error(`Videos API error: ${videosResponse.status}`);
    }

    const videosData = await videosResponse.json();
    const videoRecords = videosData.items.map((video: any) => ({
      creator_id: creator.id,
      video_id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      published_at: video.snippet.publishedAt,
      view_count: parseInt(video.statistics?.viewCount || '0'),
      like_count: parseInt(video.statistics?.likeCount || '0'),
      comment_count: parseInt(video.statistics?.commentCount || '0'),
      duration: video.contentDetails.duration,
      thumbnail_url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
      tags: video.snippet.tags || [],
      category_id: video.snippet.categoryId,
      caption_available: video.contentDetails.caption === 'true',
      last_synced_at: new Date().toISOString(),
    }));

    // Upsert videos
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .upsert(videoRecords, {
        onConflict: 'video_id'
      })
      .select();

    if (videosError) {
      console.error('Videos upsert error:', videosError);
      throw videosError;
    }

    console.log(`Synced ${videos.length} videos`);

    return new Response(
      JSON.stringify({
        success: true,
        creator: {
          id: creator.id,
          name: creator.channel_name,
          subscribers: creator.subscriber_count,
        },
        videosCount: videos.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-youtube-data:', error);
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