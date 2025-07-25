'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, FileText, Target, Zap, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  period_days: number;
  journal_stats: {
    total_entries: number;
    total_words: number;
    avg_words_per_entry: number;
  };
  mood_distribution: Array<{
    mood: string;
    count: number;
    avg_intensity: number;
  }>;
  goal_distribution: Array<{
    status: string;
    count: number;
  }>;
  insight_distribution: Array<{
    type: string;
    count: number;
  }>;
  activity_timeline: Array<{
    date: string;
    entries: number;
    words: number;
  }>;
}

interface ProductivityStats {
  writing_consistency: {
    current_streak: number;
    max_streak: number;
    days_with_entries: number;
    consistency_percentage: number;
  };
  word_count_trends: Record<string, number>;
  recent_insights: Array<{
    title: string;
    content: string;
    confidence_score: number;
    created_at: string;
  }>;
}

const MOOD_COLORS = {
  'very_happy': '#10B981',
  'happy': '#34D399',
  'excited': '#FBBF24',
  'grateful': '#8B5CF6',
  'calm': '#3B82F6',
  'neutral': '#6B7280',
  'anxious': '#F97316',
  'stressed': '#EF4444',
  'sad': '#8B5A8C',
  'very_sad': '#7C2D12',
  'angry': '#DC2626',
  'frustrated': '#B91C1C'
};

export default function AnalyticsDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [productivityStats, setProductivityStats] = useState<ProductivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { toast } = useToast();

  const fetchAnalytics = async (days: number = 30) => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const dashboardResponse = await fetch(`/api/v1/analytics/dashboard?days=${days}`);
      if (!dashboardResponse.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const dashboardData = await dashboardResponse.json();
      setDashboardStats(dashboardData);

      // Fetch productivity stats
      const productivityResponse = await fetch(`/api/v1/analytics/productivity?days=${days}`);
      if (!productivityResponse.ok) {
        throw new Error('Failed to fetch productivity stats');
      }
      const productivityData = await productivityResponse.json();
      setProductivityStats(productivityData);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error loading analytics",
        description: "There was an issue loading your analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [selectedPeriod]);

  const formatMoodName = (mood: string) => {
    return mood.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!dashboardStats || !productivityStats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card className="border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Analytics Dashboard</span>
            </CardTitle>
            <div className="flex space-x-2">
              {[7, 30, 90, 365].map((days) => (
                <Button
                  key={days}
                  variant={selectedPeriod === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(days)}
                  className={selectedPeriod === days ? "bg-purple-600 hover:bg-purple-700" : ""}
                >
                  {days}d
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardStats.journal_stats.total_entries}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-green-600">
                  {productivityStats.writing_consistency.current_streak}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Words</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardStats.journal_stats.total_words.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Consistency</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round(productivityStats.writing_consistency.consistency_percentage)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Writing Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardStats.activity_timeline.slice(-14)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [value, name === 'entries' ? 'Entries' : 'Words']}
                />
                <Bar dataKey="entries" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Mood Distribution */}
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-pink-600" />
              <span>Mood Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardStats.mood_distribution.map(item => ({
                    ...item,
                    name: formatMoodName(item.mood)
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dashboardStats.mood_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.mood as keyof typeof MOOD_COLORS] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Goals and Insights Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>Goal Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardStats.goal_distribution.map((goal, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={
                      goal.status === 'completed' ? 'border-green-500 text-green-700' :
                      goal.status === 'in_progress' ? 'border-blue-500 text-blue-700' :
                      'border-gray-500 text-gray-700'
                    }
                  >
                    {goal.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="font-medium">{goal.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Insight Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardStats.insight_distribution.map((insight, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Badge variant="outline">
                    {insight.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="font-medium">{insight.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}