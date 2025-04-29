
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays } from 'date-fns';
import TokenUsageChart from '@/components/TokenUsageChart';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AnalyticsData {
  totalGenerations: number;
  imageGenerations: number;
  videoGenerations: number;
  audioGenerations: number;
  mediaByModel: Record<string, number>;
}

interface DailyGeneration {
  date: string;
  count: number;
}

const MediaAnalyticsDashboard = () => {
  const [period, setPeriod] = useState<'7days' | '30days' | 'all'>('7days');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalGenerations: 0,
    imageGenerations: 0,
    videoGenerations: 0,
    audioGenerations: 0,
    mediaByModel: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dailyGenerations, setDailyGenerations] = useState<DailyGeneration[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Get the date range based on the selected period
      let startDate;
      const today = new Date();
      
      if (period === '7days') {
        startDate = subDays(today, 7);
      } else if (period === '30days') {
        startDate = subDays(today, 30);
      }

      // Fetch data from Supabase
      let query = supabase
        .from('media_analytics')
        .select('*')
        .eq('event_type', 'generation_completed');
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data
      const imageGenerations = data.filter(item => item.media_type === 'image').length;
      const videoGenerations = data.filter(item => item.media_type === 'video').length;
      const audioGenerations = data.filter(item => item.media_type === 'audio').length;
      
      // Calculate generations by model
      const mediaByModel: Record<string, number> = {};
      data.forEach(item => {
        const modelId = item.model_id || 'unknown';
        mediaByModel[modelId] = (mediaByModel[modelId] || 0) + 1;
      });
      
      setAnalyticsData({
        totalGenerations: data.length,
        imageGenerations,
        videoGenerations,
        audioGenerations,
        mediaByModel
      });
      
      // Generate daily generations data
      const dailyData = generateDailyGenerations(data);
      setDailyGenerations(dailyData);
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateDailyGenerations = (data: any[]): DailyGeneration[] => {
    // Create a map to store generations by day
    const generationsByDay: Record<string, number> = {};
    
    // Get the range of days based on the selected period
    const today = new Date();
    let daysToInclude = 7;
    
    if (period === '30days') {
      daysToInclude = 30;
    } else if (period === 'all') {
      // For "all", include days from the oldest generation to today
      if (data.length > 0) {
        // Fix: Convert date strings to timestamps for comparison
        const dates = data.map(item => new Date(item.created_at).getTime());
        const oldestDate = new Date(Math.min(...dates));
        // Fix: Use getTime() for calculating the difference in milliseconds
        const diffTime = Math.abs(today.getTime() - oldestDate.getTime());
        daysToInclude = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    
    // Initialize days with zero counts
    for (let i = 0; i < daysToInclude; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      generationsByDay[dateStr] = 0;
    }
    
    // Count generations by day
    data.forEach(item => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (generationsByDay[date] !== undefined) {
        generationsByDay[date]++;
      }
    });
    
    // Convert map to array and sort by date
    const result = Object.entries(generationsByDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => {
      // Fix: Convert string dates to timestamps for comparison
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
    
    return result;
  };

  const formatGenerationData = (dailyData: DailyGeneration[]): { date: string; usado: number; limite: number }[] => {
    // This is just a mock, in a real app you would get the limit from your token service
    const dailyLimit = 100;
    
    return dailyData.map(item => ({
      date: format(new Date(item.date), 'dd/MM'),
      usado: item.count,
      limite: dailyLimit
    }));
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Media Generation Analytics</CardTitle>
          <CardDescription>
            Overview of media generation activities
          </CardDescription>
          
          <div className="flex justify-end">
            <Tabs defaultValue={period} onValueChange={(value) => setPeriod(value as any)}>
              <TabsList>
                <TabsTrigger value="7days">7 Days</TabsTrigger>
                <TabsTrigger value="30days">30 Days</TabsTrigger>
                <TabsTrigger value="all">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Generation Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <span className="text-2xl font-bold">{analyticsData.totalGenerations}</span>
                      <span className="text-sm text-muted-foreground">Total Generations</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <span className="text-2xl font-bold">{analyticsData.imageGenerations}</span>
                      <span className="text-sm text-muted-foreground">Images</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <span className="text-2xl font-bold">{analyticsData.videoGenerations}</span>
                      <span className="text-sm text-muted-foreground">Videos</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border rounded-lg">
                      <span className="text-2xl font-bold">{analyticsData.audioGenerations}</span>
                      <span className="text-sm text-muted-foreground">Audio</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Daily Generations</CardTitle>
                </CardHeader>
                <CardContent>
                  <TokenUsageChart data={formatGenerationData(dailyGenerations)} />
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Generations by Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead>Generations</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(analyticsData.mediaByModel).map(([model, count]) => (
                        <TableRow key={model}>
                          <TableCell className="font-medium">{model}</TableCell>
                          <TableCell>{count}</TableCell>
                          <TableCell>
                            {analyticsData.totalGenerations > 0
                              ? `${((count / analyticsData.totalGenerations) * 100).toFixed(1)}%`
                              : '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaAnalyticsDashboard;
