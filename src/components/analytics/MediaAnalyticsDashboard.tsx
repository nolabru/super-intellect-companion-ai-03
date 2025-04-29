import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, ResponsiveContainer, Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { mediaTelemetryService } from '@/services/mediaTelemetryService';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface MediaAnalyticsDashboardProps {
  userId?: string;
  className?: string;
}

const MediaAnalyticsDashboard: React.FC<MediaAnalyticsDashboardProps> = ({
  userId,
  className
}) => {
  // Date range for filtering - use a proper calculation for 7 days ago
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    to: new Date()
  });
  
  // Selected media type for filtering
  const [mediaType, setMediaType] = useState<string>('all');
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview');
  
  // Analytics data
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch analytics data based on filters
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const filters: any = {
          startDate: dateRange?.from,
          endDate: dateRange?.to
        };
        
        if (mediaType !== 'all') {
          filters.mediaType = mediaType;
        }
        
        if (userId) {
          filters.userId = userId;
        }
        
        const data = await mediaTelemetryService.getAnalytics(filters);
        setAnalyticsData(data || []);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange, mediaType, userId]);
  
  // Process data for charts
  const generateMediaTypeDistribution = () => {
    const counts = analyticsData.reduce((acc, item) => {
      const mediaType = item.media_type || 'unknown';
      acc[mediaType] = (acc[mediaType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };
  
  const generateModelUsageData = () => {
    const counts = analyticsData.reduce((acc, item) => {
      if (item.model_id) {
        acc[item.model_id] = (acc[item.model_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 models
  };
  
  const generateDailyGenerations = () => {
    const dailyCounts: Record<string, Record<string, number>> = {};
    
    analyticsData.forEach(item => {
      if (item.event_type === 'generation_complete' && item.created_at) {
        const dateStr = format(new Date(item.created_at), 'yyyy-MM-dd');
        const mediaType = item.media_type || 'unknown';
        
        if (!dailyCounts[dateStr]) {
          dailyCounts[dateStr] = {};
        }
        
        dailyCounts[dateStr][mediaType] = (dailyCounts[dateStr][mediaType] || 0) + 1;
      }
    });
    
    return Object.entries(dailyCounts)
      .map(([date, counts]) => ({
        date: format(new Date(date), 'MM/dd'),
        ...counts
      }))
      .sort((a, b) => {
        // Convert strings to dates for proper comparison
        const dateA = new Date(date);
        const dateB = new Date(date);
        return dateA.getTime() - dateB.getTime();
      });
  };
  
  const renderSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-[200px] w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    </div>
  );
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Media Analytics Dashboard</CardTitle>
        <CardDescription>
          Track and analyze media generation metrics
        </CardDescription>
        
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <div className="flex-1">
            <Label htmlFor="dateRange">Date Range</Label>
            <DateRangePicker
              value={dateRange}
              onValueChange={setDateRange}
            />
          </div>
          <div className="w-[150px]">
            <Label htmlFor="mediaTypeFilter">Media Type</Label>
            <Select
              value={mediaType}
              onValueChange={setMediaType}
            >
              <SelectTrigger id="mediaTypeFilter">
                <SelectValue placeholder="Media Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {isLoading ? (
              renderSkeleton()
            ) : (
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Generations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={generateDailyGenerations()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="image" fill="#0088FE" name="Images" />
                        <Bar dataKey="video" fill="#00C49F" name="Videos" />
                        <Bar dataKey="audio" fill="#FFBB28" name="Audio" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Media Type Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={generateMediaTypeDistribution()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {generateMediaTypeDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} events`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Models Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart layout="vertical" data={generateModelUsageData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" name="Usage Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="models">
            {isLoading ? (
              renderSkeleton()
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Model Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground pb-4">
                      Average generation times by model (in seconds)
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={generateModelUsageData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#82ca9d" name="Usage Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance">
            {isLoading ? (
              renderSkeleton()
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cache Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground pb-4">
                      Cache hit rate and performance impact
                    </p>
                    {/* Placeholder for future cache performance metrics */}
                    <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                      <p className="text-muted-foreground">
                        Not enough data available yet
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MediaAnalyticsDashboard;
