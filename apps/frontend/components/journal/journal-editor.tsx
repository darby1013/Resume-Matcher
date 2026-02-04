'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Save, Wand2, Loader2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: VoiceRecognition, ev: Event) => any) | null;
  onend: ((this: VoiceRecognition, ev: Event) => any) | null;
  onresult: ((this: VoiceRecognition, ev: any) => any) | null;
  onerror: ((this: VoiceRecognition, ev: any) => any) | null;
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
  };
  resultIndex: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => VoiceRecognition;
    webkitSpeechRecognition: new () => VoiceRecognition;
  }
}

export default function JournalEditor() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [wordCount, setWordCount] = useState(0);
  const { toast } = useToast();

  const recognitionRef = useRef<VoiceRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition if available
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setContent(prev => prev + finalTranscript + ' ');
            setInterimTranscript('');
          } else {
            setInterimTranscript(interimTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          toast({
            title: "Voice recognition error",
            description: "There was an issue with voice recognition. Please try again.",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setInterimTranscript('');
        };
      }
    }
  }, [toast]);

  useEffect(() => {
    setWordCount(content.trim().split(/\s+/).filter(word => word.length > 0).length);
  }, [content]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice recognition not supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Error starting voice recognition",
          description: "Please check your microphone permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const saveEntry = async () => {
    if (!content.trim()) {
      toast({
        title: "Empty entry",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/v1/journal/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: content.trim(),
          is_voice_transcribed: false, // You could track this based on how the content was created
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save entry');
      }

      const result = await response.json();
      setAnalysis(result.analysis);
      
      toast({
        title: "Entry saved successfully!",
        description: "Your journal entry has been saved and analyzed.",
      });

      // Clear the form
      setTitle('');
      setContent('');
      
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error saving entry",
        description: "There was an issue saving your journal entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Write Your Journal Entry</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Entry title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-purple-200 focus:border-purple-400"
            />
            
            <div className="relative">
              <Textarea
                placeholder="Start writing your thoughts... or use the microphone to speak."
                value={content + interimTranscript}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] border-purple-200 focus:border-purple-400 resize-none"
              />
              
              {interimTranscript && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                  Speaking...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  size="sm"
                  className={isRecording ? "animate-pulse" : ""}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
                
                <Badge variant="secondary" className="text-xs">
                  {wordCount} words
                </Badge>
              </div>

              <Button 
                onClick={saveEntry} 
                disabled={isSaving || !content.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Insights Panel */}
      <div className="space-y-4">
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wand2 className="w-5 h-5 text-blue-600" />
              <span>AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAnalyzing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing your entry...</span>
              </div>
            )}
            
            {analysis && !isAnalyzing && (
              <div className="space-y-4">
                {/* Mood Analysis */}
                {analysis.mood_analysis && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Detected Mood</h4>
                    <Badge className="bg-blue-100 text-blue-800">
                      {analysis.mood_analysis.mood?.replace('_', ' ')} 
                      {analysis.mood_analysis.intensity && 
                        ` (${Math.round(analysis.mood_analysis.intensity)}/10)`
                      }
                    </Badge>
                  </div>
                )}

                {/* Insights */}
                {analysis.insights && analysis.insights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Insights</h4>
                    <div className="space-y-2">
                      {analysis.insights.slice(0, 3).map((insight: any, index: number) => (
                        <div key={index} className="text-xs bg-purple-50 p-2 rounded">
                          <div className="font-medium text-purple-800">{insight.title}</div>
                          <div className="text-purple-600 mt-1">{insight.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goals */}
                {analysis.goals && analysis.goals.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Detected Goals</h4>
                    <div className="space-y-1">
                      {analysis.goals.slice(0, 2).map((goal: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {goal.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!analysis && !isAnalyzing && (
              <p className="text-sm text-gray-500">
                Save your entry to see AI-powered insights about your mood, goals, and patterns.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}