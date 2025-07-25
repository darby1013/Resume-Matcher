'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Calendar, CheckCircle, Clock, Pause, X, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Goal {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  progress_percentage: number;
  target_date?: string;
  is_recurring: boolean;
  detected_from_journal: boolean;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface GoalsResponse {
  goals: Goal[];
  total: number;
}

const GOAL_CATEGORIES = [
  { value: 'health', label: 'Health & Fitness' },
  { value: 'career', label: 'Career' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'personal_development', label: 'Personal Development' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'hobby', label: 'Hobby' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

const GOAL_STATUSES = [
  { value: 'not_started', label: 'Not Started', icon: Clock, color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', icon: Target, color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'paused', label: 'Paused', icon: Pause, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'abandoned', label: 'Abandoned', icon: X, color: 'bg-red-100 text-red-800' },
];

export default function GoalsPanel() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    target_date: '',
    is_recurring: false,
  });
  const { toast } = useToast();

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/goals/');
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }

      const data: GoalsResponse = await response.json();
      setGoals(data.goals);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error loading goals",
        description: "There was an issue loading your goals.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const createGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.category) {
      toast({
        title: "Missing information",
        description: "Please provide a title and category for your goal.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/v1/goals/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newGoal.title.trim(),
          description: newGoal.description.trim() || undefined,
          category: newGoal.category,
          target_date: newGoal.target_date || undefined,
          is_recurring: newGoal.is_recurring,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      toast({
        title: "Goal created!",
        description: "Your new goal has been added successfully.",
      });

      setNewGoal({
        title: '',
        description: '',
        category: '',
        target_date: '',
        is_recurring: false,
      });
      setShowCreateDialog(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error creating goal",
        description: "There was an issue creating your goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateGoal = async (goalId: number, updates: Partial<Goal>) => {
    try {
      const response = await fetch(`/api/v1/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      toast({
        title: "Goal updated!",
        description: "Your goal has been updated successfully.",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error updating goal",
        description: "There was an issue updating your goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (goalId: number) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      toast({
        title: "Goal deleted",
        description: "Your goal has been deleted successfully.",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error deleting goal",
        description: "There was an issue deleting your goal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusInfo = (status: string) => {
    return GOAL_STATUSES.find(s => s.value === status) || GOAL_STATUSES[0];
  };

  const getCategoryLabel = (category: string) => {
    return GOAL_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const groupedGoals = goals.reduce((acc, goal) => {
    if (!acc[goal.status]) {
      acc[goal.status] = [];
    }
    acc[goal.status].push(goal);
    return acc;
  }, {} as Record<string, Goal[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Goals & Targets</span>
            </CardTitle>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Goal title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                  
                  <Textarea
                    placeholder="Goal description (optional)"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  />
                  
                  <Select 
                    value={newGoal.category} 
                    onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="date"
                    placeholder="Target date (optional)"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  />
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={newGoal.is_recurring}
                      onChange={(e) => setNewGoal({ ...newGoal, is_recurring: e.target.checked })}
                    />
                    <label htmlFor="recurring" className="text-sm">Recurring goal</label>
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button onClick={createGoal} className="flex-1 bg-purple-600 hover:bg-purple-700">
                      Create Goal
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Goals by Status */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-200">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="p-8 text-center text-gray-500">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No goals yet</p>
            <p className="text-sm">Create your first goal to start tracking your progress!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {GOAL_STATUSES.map((statusInfo) => {
            const statusGoals = groupedGoals[statusInfo.value] || [];
            if (statusGoals.length === 0) return null;

            return (
              <div key={statusInfo.value}>
                <div className="flex items-center space-x-2 mb-4">
                  <statusInfo.icon className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{statusInfo.label}</h3>
                  <Badge variant="secondary">{statusGoals.length}</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusGoals.map((goal) => (
                    <Card key={goal.id} className="border-gray-200 hover:border-purple-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{goal.title}</h4>
                            {goal.description && (
                              <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-1 ml-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingGoal(goal)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteGoal(goal.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline">{getCategoryLabel(goal.category)}</Badge>
                            {goal.detected_from_journal && (
                              <Badge variant="secondary" className="text-xs">AI Detected</Badge>
                            )}
                          </div>
                          
                          {goal.status === 'in_progress' && (
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span>{Math.round(goal.progress_percentage)}%</span>
                              </div>
                              <Progress value={goal.progress_percentage} className="h-2" />
                            </div>
                          )}
                          
                          {goal.target_date && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <Badge className={getStatusInfo(goal.status).color}>
                              {getStatusInfo(goal.status).label}
                            </Badge>
                            
                            <Select 
                              value={goal.status} 
                              onValueChange={(value) => updateGoal(goal.id, { status: value })}
                            >
                              <SelectTrigger className="w-32 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GOAL_STATUSES.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}