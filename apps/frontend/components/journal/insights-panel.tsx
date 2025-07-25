'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Heart, Target, Lightbulb, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Insight {
  id: number;
  type: string;
  title: string;
  content: string;
  confidence_score?: number;
  created_at: string;
}

interface MoodTrend {
  date: string;
  mood: string;
  intensity: number;
  energy_level?: number;
  stress_level?: number;
}

export default function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [moodTrends, setMoodTrends] = useState<MoodTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const { toast } = useToast();

  const fetchInsights = async (days: number = 7) => {
    try {
      setLoading(true);
      
      // Fetch recent insights
      const insightsResponse = await fetch(`/api/v1/insights/recent?days=${days}&limit=20`);
      if (!insightsResponse.ok) {
        throw new Error('Failed to fetch insights');
      }
      const insightsData = await insightsResponse.json();
      setInsights(insightsData.insights);

      // Fetch mood trends
      const moodResponse = await fetch(`/api/v1/insights/mood-trends?days=${days}`);
      if (!moodResponse.ok) {
        throw new Error('Failed to fetch mood trends');
      }
      const moodData = await moodResponse.json();
      setMoodTrends(moodData.mood_trends);
      
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast({
        title: "Error loading insights",
        description: "There was an issue loading your insights.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(selectedPeriod);
  }, [selectedPeriod]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'mood':
        return <Heart className="w-4 h-4" />;
      case 'productivity':
        return <TrendingUp className="w-4 h-4" />;
      case 'goals':
        return <Target className="w-4 h-4" />;
      case 'patterns':
        return <Brain className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'mood':
        return 'bg-pink-100 text-pink-800';
      case 'productivity':
        return 'bg-green-100 text-green-800';
      case 'goals':
        return 'bg-blue-100 text-blue-800';
      case 'patterns':
        return 'bg-purple-100 text-purple-800';
      case 'emotional_health':
        return 'bg-orange-100 text-orange-800';
      case 'relationships':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'very_happy':
      case 'happy':
      case 'excited':
      case 'grateful':
        return 'bg-green-100 text-green-800';
      case 'calm':
      case 'neutral':
        return 'bg-blue-100 text-blue-800';
      case 'anxious':
      case 'stressed':
        return 'bg-orange-100 text-orange-800';
      case 'sad':
      case 'very_sad':
      case 'frustrated':
      case 'angry':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatMoodName = (mood: string) => {
    return mood.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card className="border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>AI Insights & Patterns</span>
            </CardTitle>
            <div className="flex space-x-2">
              {[7, 30, 90].map((days) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Insights */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <span>Recent Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  </div>
                ))}
              </div>
            ) : insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No insights available for this period.</p>
                <p className="text-sm">Write more journal entries to generate insights!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${getInsightColor(insight.type)}`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{insight.content}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{format(new Date(insight.created_at), 'MMM d, yyyy')}</span>
                          {insight.confidence_score && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(insight.confidence_score * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Trends */}
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-pink-600" />
              <span>Mood Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : moodTrends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No mood data available for this period.</p>
                <p className="text-sm">Continue journaling to track your mood patterns!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {moodTrends.slice(0, 10).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {format(new Date(trend.date), 'MMM d')}
                        </span>
                      </div>
                      <Badge className={getMoodColor(trend.mood)}>
                        {formatMoodName(trend.mood)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-600">
                        Intensity: {Math.round(trend.intensity)}/10
                      </div>
                      {trend.energy_level && (
                        <div className="text-xs text-gray-600">
                          Energy: {Math.round(trend.energy_level)}/10
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {moodTrends.length > 10 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm">
                      View All Trends
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}