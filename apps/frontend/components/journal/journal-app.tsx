'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JournalEditor from './journal-editor';
import JournalEntries from './journal-entries';
import InsightsPanel from './insights-panel';
import AnalyticsDashboard from './analytics-dashboard';
import GoalsPanel from './goals-panel';
import { BookOpen, Brain, BarChart3, Target, Sparkles } from 'lucide-react';

export default function JournalApp() {
  const [activeTab, setActiveTab] = useState('write');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Jottit AI
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              AI-Powered Journaling
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm border border-purple-100">
            <TabsTrigger 
              value="write" 
              className="flex items-center space-x-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Write</span>
            </TabsTrigger>
            <TabsTrigger 
              value="entries" 
              className="flex items-center space-x-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Entries</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="flex items-center space-x-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center space-x-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="goals" 
              className="flex items-center space-x-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write" className="space-y-6">
            <JournalEditor />
          </TabsContent>

          <TabsContent value="entries" className="space-y-6">
            <JournalEntries />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <InsightsPanel />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <GoalsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}