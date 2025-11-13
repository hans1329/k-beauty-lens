import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/AdminLayout";
import { Loader2, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Video {
  id: string;
  video_id: string;
  title: string;
  published_at: string;
  view_count: number;
  like_count: number;
  thumbnail_url: string;
  creators: {
    channel_name: string;
  };
}

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("published_at");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          creators (
            channel_name
          )
        `)
        .order('published_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setVideos(data || []);
      setFilteredVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...videos];

    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.creators?.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'view_count':
          return b.view_count - a.view_count;
        case 'like_count':
          return b.like_count - a.like_count;
        case 'published_at':
        default:
          return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      }
    });

    setFilteredVideos(filtered);
    setCurrentPage(1);
  }, [searchQuery, sortBy, videos]);

  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Videos</h1>
          <p className="text-muted-foreground mt-1">
            Browse all synced videos from creators
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Videos ({filteredVideos.length})</CardTitle>
            <CardDescription>Search and filter through all synced videos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published_at">Recent</SelectItem>
                  <SelectItem value="view_count">Most Views</SelectItem>
                  <SelectItem value="like_count">Most Likes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : paginatedVideos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No videos found' : 'No videos synced yet'}
              </p>
            ) : (
              <>
                <div className="grid gap-4">
                  {paginatedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      {video.thumbnail_url && (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-40 h-24 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-2 mb-1">{video.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {video.creators?.channel_name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{video.view_count.toLocaleString()} views</span>
                          <span>{video.like_count.toLocaleString()} likes</span>
                          <span>{new Date(video.published_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        asChild
                      >
                        <a
                          href={`https://www.youtube.com/watch?v=${video.video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredVideos.length)} of{' '}
                      {filteredVideos.length} videos
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Videos;
