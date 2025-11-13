import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Trash2, Search, Sparkles, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VERIFIED_CHANNELS = [
  { name: "PONY Makeup", handle: "@PONYMakeup" },
  { name: "Edward Avila", handle: "@Edward_Avila" },
  { name: "Joan Kim", handle: "https://www.youtube.com/user/joankeem" },
  { name: "Soyoon", handle: "@soy00n" },
  { name: "씬님 (Ssin)", handle: "https://www.youtube.com/user/Hines382" },
  { name: "다예 Daily Daye", handle: "https://www.youtube.com/c/다예DailyDaye" },
  { name: "레오제이 (LeoJ)", handle: "https://www.youtube.com/c/LeoJMakeup" },
];

interface Creator {
  id: string;
  channel_id: string;
  channel_name: string;
  subscriber_count: number;
  video_count: number;
  thumbnail_url: string;
  last_synced_at: string;
  country: string;
}

const Creators = () => {
  const [channelId, setChannelId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [isLoadingCreators, setIsLoadingCreators] = useState(false);
  const [deletingCreatorId, setDeletingCreatorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("last_synced_at");
  const [currentPage, setCurrentPage] = useState(1);
  const [resyncingCreatorId, setResyncingCreatorId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [analyzingCreatorId, setAnalyzingCreatorId] = useState<string | null>(null);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [abortAnalysis, setAbortAnalysis] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ current: 0, total: 0 });
  const itemsPerPage = 20;

  const handleSync = async (channelIdToSync?: string) => {
    const targetChannelId = channelIdToSync || channelId.trim();
    
    if (!targetChannelId) {
      toast.error("Please enter a valid YouTube channel ID");
      return;
    }

    setIsLoading(true);
    if (channelIdToSync) {
      setSyncingChannelId(channelIdToSync);
    }

    try {
      const { data, error } = await supabase.functions.invoke('youtube-sync', {
        body: { channelId: targetChannelId }
      });

      if (error) {
        console.error('Sync error:', error);
        toast.error(`Failed to sync channel: ${error.message}`);
        return;
      }

      toast.success(data.message || 'Channel synced successfully!');
      if (!channelIdToSync) {
        setChannelId("");
      }
      
      loadCreators();
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setSyncingChannelId(null);
    }
  };

  const loadCreators = async () => {
    setIsLoadingCreators(true);
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('last_synced_at', { ascending: false });

      if (error) throw error;
      setCreators(data || []);
      setFilteredCreators(data || []);
    } catch (error) {
      console.error('Error loading creators:', error);
      toast.error('Failed to load creators');
    } finally {
      setIsLoadingCreators(false);
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    let filtered = [...creators];

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.channel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.channel_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'subscriber_count':
          return b.subscriber_count - a.subscriber_count;
        case 'video_count':
          return b.video_count - a.video_count;
        case 'channel_name':
          return a.channel_name.localeCompare(b.channel_name);
        case 'last_synced_at':
        default:
          return new Date(b.last_synced_at).getTime() - new Date(a.last_synced_at).getTime();
      }
    });

    setFilteredCreators(filtered);
    setCurrentPage(1);
  }, [searchQuery, sortBy, creators]);

  const handleDeleteCreator = async (creatorId: string) => {
    if (!confirm('Are you sure you want to delete this creator and all their videos?')) {
      return;
    }

    setDeletingCreatorId(creatorId);
    try {
      const { error } = await supabase
        .from('creators')
        .delete()
        .eq('id', creatorId);

      if (error) throw error;

      toast.success('Creator deleted successfully');
      loadCreators();
    } catch (error) {
      console.error('Error deleting creator:', error);
      toast.error('Failed to delete creator');
    } finally {
      setDeletingCreatorId(null);
    }
  };

  const handleResyncCreator = async (channelId: string, creatorId: string) => {
    setResyncingCreatorId(creatorId);
    try {
      await handleSync(channelId);
      toast.success('Creator re-synced successfully');
      loadCreators();
    } catch (error) {
      console.error('Error re-syncing creator:', error);
      toast.error('Failed to re-sync creator');
    } finally {
      setResyncingCreatorId(null);
    }
  };

  const handleSyncAll = async () => {
    if (creators.length === 0) {
      toast.error('No creators to sync');
      return;
    }

    if (!confirm(`Are you sure you want to re-sync all ${creators.length} creators? This may take several minutes.`)) {
      return;
    }

    setIsSyncingAll(true);
    let successCount = 0;
    let failCount = 0;

    for (const creator of creators) {
      try {
        await handleSync(creator.channel_id);
        successCount++;
        toast.success(`Synced ${successCount}/${creators.length}: ${creator.channel_name}`);
      } catch (error) {
        console.error(`Failed to sync ${creator.channel_name}:`, error);
        failCount++;
      }
    }

    setIsSyncingAll(false);
    loadCreators();
    
    if (failCount === 0) {
      toast.success(`All ${successCount} creators synced successfully!`);
    } else {
      toast.error(`Synced ${successCount} creators, ${failCount} failed`);
    }
  };

  const handleAnalyzeCreator = async (creatorId: string, creatorName: string, skipStateManagement = false) => {
    if (!skipStateManagement) {
      setAnalyzingCreatorId(creatorId);
    }
    try {
      // Get creator's videos and comments
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('id, description, title')
        .eq('creator_id', creatorId);

      if (videosError) throw videosError;

      if (!videos || videos.length === 0) {
        toast.error('No videos found for this creator. Please sync first.');
        return;
      }

      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id, text_content')
        .in('video_id', videos.map(v => v.id))
        .limit(50);

      if (commentsError) throw commentsError;

      // Run sentiment analysis
      if (comments && comments.length > 0) {
        const sentimentResponse = await supabase.functions.invoke('analyze-sentiment', {
          body: { comments }
        });

        if (sentimentResponse.error) {
          console.error('Sentiment analysis error:', sentimentResponse.error);
        } else {
          toast.success(`Sentiment analysis complete for ${creatorName}`);
        }
      }

      // Run brand extraction for first 10 videos
      let brandCount = 0;
      for (const video of videos.slice(0, 10)) {
        if (video.description) {
          const extractResponse = await supabase.functions.invoke('extract-brands', {
            body: { 
              text: video.description,
              videoId: video.id
            }
          });

          if (!extractResponse.error) {
            brandCount++;
          }
        }
      }

      toast.success(`Analysis complete: ${comments?.length || 0} comments, ${brandCount} videos analyzed`);
      loadCreators();
    } catch (error) {
      console.error('Error analyzing creator:', error);
      toast.error('Failed to analyze creator');
    } finally {
      if (!skipStateManagement) {
        setAnalyzingCreatorId(null);
      }
    }
  };

  const handleAnalyzeAll = async () => {
    if (creators.length === 0) {
      toast.error('No creators to analyze');
      return;
    }

    if (!confirm(`Analyze all ${creators.length} creators? This will run sentiment and brand analysis on existing data.`)) {
      return;
    }

    setIsAnalyzingAll(true);
    setAbortAnalysis(false);
    setAnalysisProgress({ current: 0, total: creators.length });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < creators.length; i++) {
      const creator = creators[i];
      setAnalysisProgress({ current: i + 1, total: creators.length });
      // Check if user requested to stop
      if (abortAnalysis) {
        toast.error(`Analysis stopped. Completed ${successCount}/${creators.length} creators`);
        break;
      }

      setAnalyzingCreatorId(creator.id);
      try {
        await handleAnalyzeCreator(creator.id, creator.channel_name, true);
        successCount++;
      } catch (error) {
        console.error(`Failed to analyze ${creator.channel_name}:`, error);
        failCount++;
      } finally {
        setAnalyzingCreatorId(null);
      }
    }

    setIsAnalyzingAll(false);
    setAbortAnalysis(false);
    setAnalysisProgress({ current: 0, total: 0 });
    
    if (!abortAnalysis) {
      if (failCount === 0) {
        toast.success(`All ${successCount} creators analyzed successfully!`);
      } else {
        toast.error(`Analyzed ${successCount} creators, ${failCount} failed`);
      }
    }
  };

  const handleStopAnalysis = () => {
    setAbortAnalysis(true);
    toast.info('Stopping analysis after current creator...');
  };

  const paginatedCreators = filteredCreators.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCreators.length / itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Creators Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage YouTube channels and sync creator data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add YouTube Channel</CardTitle>
            <CardDescription>
              Enter a YouTube channel ID, handle, or URL to sync creator data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="UCxxxxxx or @username or https://youtube.com/@username"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={() => handleSync()}
                disabled={isLoading || !channelId.trim()}
                className="rounded-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Channel'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Creators ({filteredCreators.length})</CardTitle>
                <CardDescription>
                  {isAnalyzingAll ? (
                    <span className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing {analysisProgress.current} of {analysisProgress.total} creators...
                    </span>
                  ) : (
                    'Browse and manage synced creators'
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSyncAll}
                  disabled={isSyncingAll || isAnalyzingAll}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  title="Re-sync all creators from YouTube"
                >
                  {isSyncingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={handleAnalyzeAll}
                  disabled={isAnalyzingAll || isSyncingAll}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  title="Analyze all creators (sentiment + brands)"
                >
                  {isAnalyzingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {isAnalyzingAll && (
              <div className="mt-4 flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <span className="text-sm text-destructive font-medium">
                  Analysis in progress - Current creator will complete before stopping
                </span>
                <Button
                  onClick={handleStopAnalysis}
                  disabled={abortAnalysis}
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                >
                  {abortAnalysis ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Stop Analysis
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or channel ID..."
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
                  <SelectItem value="last_synced_at">Last Synced</SelectItem>
                  <SelectItem value="subscriber_count">Subscribers</SelectItem>
                  <SelectItem value="video_count">Videos</SelectItem>
                  <SelectItem value="channel_name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoadingCreators ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : paginatedCreators.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No creators found' : 'No creators synced yet'}
              </p>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Subscribers</TableHead>
                        <TableHead>Videos</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Last Synced</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCreators.map((creator) => (
                        <TableRow key={creator.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {creator.thumbnail_url && (
                                <img
                                  src={creator.thumbnail_url}
                                  alt={creator.channel_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium">{creator.channel_name}</p>
                                <p className="text-xs text-muted-foreground">{creator.channel_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{creator.subscriber_count.toLocaleString()}</TableCell>
                          <TableCell>{creator.video_count}</TableCell>
                          <TableCell>{creator.country || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {analyzingCreatorId === creator.id ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span className="text-xs">Analyzing...</span>
                                </div>
                                <Progress value={undefined} className="h-1" />
                              </div>
                            ) : (
                              new Date(creator.last_synced_at).toLocaleDateString()
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleResyncCreator(creator.channel_id, creator.id)}
                                disabled={resyncingCreatorId === creator.id || isSyncingAll}
                                size="sm"
                                variant="ghost"
                                className="rounded-full hover:bg-primary/10 hover:text-primary"
                                title="Re-sync this creator"
                              >
                                {resyncingCreatorId === creator.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                onClick={() => handleAnalyzeCreator(creator.id, creator.channel_name)}
                                disabled={analyzingCreatorId === creator.id || isSyncingAll || isAnalyzingAll}
                                size="sm"
                                variant="ghost"
                                className="rounded-full hover:bg-secondary/50 hover:text-secondary-foreground"
                                title="Analyze sentiment + brands"
                              >
                                {analyzingCreatorId === creator.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                onClick={() => handleDeleteCreator(creator.id)}
                                disabled={deletingCreatorId === creator.id || isSyncingAll}
                                size="sm"
                                variant="ghost"
                                className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Delete this creator"
                              >
                                {deletingCreatorId === creator.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredCreators.length)} of{' '}
                      {filteredCreators.length} creators
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

export default Creators;
