
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mediaAnalyticsService } from '@/services/mediaAnalyticsService';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DailyStats {
  date: string;
  total: number;
  completed: number;
  failed: number;
  cached: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const MEDIA_TYPES = ['image', 'video', 'audio'];
const EVENT_TYPES = ['generation_started', 'generation_completed', 'generation_failed', 'cache_used'];

const AdminAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<'7days' | '30days' | 'all'>('7days');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [mediaTypeData, setMediaTypeData] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [eventsByStatus, setEventsByStatus] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get the analytics data
      const result = await mediaAnalyticsService.getEventStats(period);
      if (!result.success) {
        throw new Error('Failed to fetch analytics data');
      }
      
      setStats(result);
      
      // Process data for media type chart
      const mediaTypeCounts: Record<string, number> = {};
      MEDIA_TYPES.forEach(type => {
        mediaTypeCounts[type] = result.data.filter((item: any) => item.media_type === type).length;
      });
      
      setMediaTypeData(Object.entries(mediaTypeCounts).map(([name, value]) => ({ name, value })));
      
      // Process data for daily stats
      const dailyData = processDailyStats(result.data);
      setDailyStats(dailyData);
      
      // Process events by status
      const eventStatusData: Record<string, number> = {};
      EVENT_TYPES.forEach(type => {
        eventStatusData[type] = result.data.filter((item: any) => item.event_type === type).length;
      });
      
      setEventsByStatus([
        { name: 'Started', value: eventStatusData['generation_started'] || 0 },
        { name: 'Completed', value: eventStatusData['generation_completed'] || 0 },
        { name: 'Failed', value: eventStatusData['generation_failed'] || 0 },
        { name: 'Cached', value: eventStatusData['cache_used'] || 0 }
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processDailyStats = (data: any[]): DailyStats[] => {
    const today = new Date();
    let daysToInclude = 7;
    
    if (period === '30days') {
      daysToInclude = 30;
    } else if (period === 'all' && data.length > 0) {
      // For "all", determine the oldest date
      const dates = data.map(item => new Date(item.created_at).getTime());
      const oldestDate = new Date(Math.min(...dates));
      const diffTime = Math.abs(today.getTime() - oldestDate.getTime());
      daysToInclude = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    const result: DailyStats[] = [];
    
    // Create entries for each day
    for (let i = 0; i < daysToInclude; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = format(date, 'dd/MM');
      
      // Filter data for this date
      const dayData = data.filter(item => {
        const itemDate = format(new Date(item.created_at), 'yyyy-MM-dd');
        return itemDate === dateStr;
      });
      
      result.unshift({
        date: displayDate,
        total: dayData.length,
        completed: dayData.filter(item => item.event_type === 'generation_completed').length,
        failed: dayData.filter(item => item.event_type === 'generation_failed').length,
        cached: dayData.filter(item => item.event_type === 'cache_used').length
      });
    }
    
    return result;
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Media Analytics</h2>
        <p className="text-muted-foreground mt-2">
          Detailed metrics and insights about media generation
        </p>
      </div>

      <div className="flex justify-end">
        <Tabs defaultValue={period} onValueChange={(value) => setPeriod(value as any)}>
          <TabsList>
            <TabsTrigger value="7days">7 Days</TabsTrigger>
            <TabsTrigger value="30days">30 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Media Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Media Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mediaTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mediaTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Event Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily Stats Chart */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyStats}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="completed" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="failed" stroke="#ff7300" />
                    <Line type="monotone" dataKey="cached" stroke="#0088FE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Events Table */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Media Type</TableHead>
                    <TableHead>Model</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.data?.slice(0, 10).map((event: any) => (
                    <TableRow key={event.id}>
                      <TableCell>{format(new Date(event.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>{event.event_type.replace('_', ' ')}</TableCell>
                      <TableCell>{event.media_type}</TableCell>
                      <TableCell>{event.model_id || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
