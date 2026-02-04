'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Edit, Trash2, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface JournalEntry {
  id: number;
  title?: string;
  content: string;
  is_voice_transcribed: boolean;
  word_count: number;
  created_at: string;
  updated_at: string;
}

interface JournalEntriesResponse {
  entries: JournalEntry[];
  total: number;
  page: number;
  per_page: number;
}

export default function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchEntries = async (searchQuery: string = '', pageNum: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        per_page: '20',
      });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/v1/journal/entries?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }

      const data: JournalEntriesResponse = await response.json();
      setEntries(data.entries);
      setTotal(data.total);
      setPage(data.page);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "Error loading entries",
        description: "There was an issue loading your journal entries.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchEntries(searchTerm, 1);
      } else {
        fetchEntries('', 1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const deleteEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/journal/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      toast({
        title: "Entry deleted",
        description: "Your journal entry has been deleted successfully.",
      });

      // Refresh the entries list
      fetchEntries(searchTerm, page);
      
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error deleting entry",
        description: "There was an issue deleting your journal entry.",
        variant: "destructive",
      });
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Entries List */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle>Your Journal Entries</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search your entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-400"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No entries found matching your search.' : 'No journal entries yet. Start writing!'}
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-purple-50 ${
                      selectedEntry?.id === entry.id ? 'bg-purple-50 border-purple-300' : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {entry.title && (
                            <h3 className="font-medium text-gray-900">{entry.title}</h3>
                          )}
                          {entry.is_voice_transcribed && (
                            <Badge variant="secondary" className="text-xs">
                              Voice
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {truncateContent(entry.content)}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(entry.created_at), 'MMM d, yyyy')}</span>
                          </div>
                          <span>{entry.word_count} words</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entry Detail */}
      <div className="space-y-4">
        {selectedEntry ? (
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {selectedEntry.title || 'Untitled Entry'}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(selectedEntry.created_at), 'MMMM d, yyyy • h:mm a')}
                    </Badge>
                    {selectedEntry.is_voice_transcribed && (
                      <Badge variant="secondary" className="text-xs">
                        Voice Transcribed
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteEntry(selectedEntry.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">
                  {selectedEntry.content}
                </p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{selectedEntry.word_count} words</span>
                  {selectedEntry.created_at !== selectedEntry.updated_at && (
                    <span>Updated {format(new Date(selectedEntry.updated_at), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200">
            <CardContent className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p>Select an entry to view its details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}