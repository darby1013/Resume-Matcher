import logging
import json
from typing import List, Dict, Any, Optional, Tuple
from textblob import TextBlob
from openai import AsyncOpenAI
from app.core import settings
from app.models.insight import InsightType
from app.models.mood_entry import MoodType
from app.models.goal import GoalCategory

logger = logging.getLogger(__name__)


class AIAnalysisService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if hasattr(settings, 'OPENAI_API_KEY') else None

    async def analyze_journal_entry(self, content: str) -> Dict[str, Any]:
        """
        Comprehensive analysis of a journal entry including:
        - Sentiment analysis
        - Mood detection
        - Goal extraction
        - Insights generation
        """
        try:
            # Basic sentiment analysis using TextBlob
            sentiment_score = self._analyze_sentiment(content)
            
            # AI-powered analysis
            ai_analysis = await self._get_ai_analysis(content) if self.client else {}
            
            # Extract mood information
            mood_analysis = self._extract_mood_analysis(content, ai_analysis.get('mood', {}))
            
            # Extract goals
            goals = ai_analysis.get('goals', [])
            
            # Generate insights
            insights = ai_analysis.get('insights', [])
            
            return {
                'sentiment_score': sentiment_score,
                'mood_analysis': mood_analysis,
                'goals': goals,
                'insights': insights,
                'word_count': len(content.split()),
                'ai_analysis_available': self.client is not None
            }
            
        except Exception as e:
            logger.error(f"Error analyzing journal entry: {str(e)}")
            return {
                'sentiment_score': self._analyze_sentiment(content),
                'mood_analysis': self._fallback_mood_analysis(content),
                'goals': [],
                'insights': [],
                'word_count': len(content.split()),
                'ai_analysis_available': False,
                'error': str(e)
            }

    def _analyze_sentiment(self, content: str) -> float:
        """Analyze sentiment using TextBlob (-1 to 1 scale)"""
        try:
            blob = TextBlob(content)
            return blob.sentiment.polarity
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {str(e)}")
            return 0.0

    async def _get_ai_analysis(self, content: str) -> Dict[str, Any]:
        """Get comprehensive AI analysis using OpenAI"""
        if not self.client:
            return {}
            
        try:
            prompt = f"""
            Analyze this journal entry and provide insights in the following JSON format:
            {{
                "mood": {{
                    "primary_mood": "one of: very_happy, happy, neutral, sad, very_sad, anxious, stressed, excited, calm, angry, grateful, frustrated",
                    "intensity": "1-10 scale",
                    "energy_level": "1-10 scale", 
                    "stress_level": "1-10 scale"
                }},
                "insights": [
                    {{
                        "type": "one of: mood, productivity, relationships, goals, emotional_health, patterns, recommendations",
                        "title": "Brief insight title",
                        "content": "Detailed insight description",
                        "confidence": "0-1 scale"
                    }}
                ],
                "goals": [
                    {{
                        "title": "Goal title",
                        "description": "Goal description", 
                        "category": "one of: health, career, relationships, personal_development, finance, education, hobby, travel, other",
                        "confidence": "0-1 scale"
                    }}
                ]
            }}

            Journal Entry:
            {content}
            
            Provide only the JSON response, no additional text.
            """

            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert journal analyst and therapist. Analyze journal entries with empathy and insight."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )

            result = response.choices[0].message.content
            return json.loads(result)
            
        except Exception as e:
            logger.error(f"Error in AI analysis: {str(e)}")
            return {}

    def _extract_mood_analysis(self, content: str, ai_mood: Dict[str, Any]) -> Dict[str, Any]:
        """Extract mood analysis from AI results or fallback to keyword analysis"""
        if ai_mood:
            return {
                'mood': ai_mood.get('primary_mood', 'neutral'),
                'intensity': ai_mood.get('intensity', 5.0),
                'energy_level': ai_mood.get('energy_level'),
                'stress_level': ai_mood.get('stress_level'),
                'detected_automatically': True
            }
        
        return self._fallback_mood_analysis(content)

    def _fallback_mood_analysis(self, content: str) -> Dict[str, Any]:
        """Fallback mood analysis using keyword matching"""
        content_lower = content.lower()
        
        # Simple keyword-based mood detection
        mood_keywords = {
            'very_happy': ['ecstatic', 'overjoyed', 'thrilled', 'elated', 'euphoric'],
            'happy': ['happy', 'glad', 'pleased', 'content', 'joyful', 'cheerful'],
            'excited': ['excited', 'enthusiastic', 'pumped', 'energetic'],
            'grateful': ['grateful', 'thankful', 'blessed', 'appreciative'],
            'calm': ['calm', 'peaceful', 'serene', 'relaxed', 'tranquil'],
            'anxious': ['anxious', 'worried', 'nervous', 'uneasy', 'concerned'],
            'stressed': ['stressed', 'overwhelmed', 'pressure', 'tension'],
            'sad': ['sad', 'disappointed', 'down', 'blue', 'melancholy'],
            'very_sad': ['depressed', 'devastated', 'heartbroken', 'miserable'],
            'angry': ['angry', 'furious', 'irritated', 'mad', 'frustrated'],
            'frustrated': ['frustrated', 'annoyed', 'bothered', 'vexed']
        }
        
        mood_scores = {}
        for mood, keywords in mood_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content_lower)
            if score > 0:
                mood_scores[mood] = score
        
        if mood_scores:
            primary_mood = max(mood_scores, key=mood_scores.get)
            intensity = min(mood_scores[primary_mood] * 2 + 3, 10)  # Scale based on keyword frequency
        else:
            primary_mood = 'neutral'
            intensity = 5.0
        
        return {
            'mood': primary_mood,
            'intensity': float(intensity),
            'energy_level': None,
            'stress_level': None,
            'detected_automatically': True
        }

    async def generate_weekly_insights(self, journal_entries: List[str]) -> List[Dict[str, Any]]:
        """Generate weekly insights based on multiple journal entries"""
        if not self.client or not journal_entries:
            return []
            
        try:
            combined_content = "\n---\n".join(journal_entries)
            
            prompt = f"""
            Analyze these journal entries from the past week and provide weekly insights:
            
            {combined_content}
            
            Provide insights in this JSON format:
            {{
                "insights": [
                    {{
                        "type": "patterns",
                        "title": "Weekly Pattern Analysis",
                        "content": "Analysis of patterns noticed this week",
                        "confidence": 0.8
                    }},
                    {{
                        "type": "recommendations", 
                        "title": "Recommendations for Next Week",
                        "content": "Actionable recommendations based on the week's entries",
                        "confidence": 0.9
                    }}
                ]
            }}
            """
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a thoughtful journal analyst providing weekly insights and recommendations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get('insights', [])
            
        except Exception as e:
            logger.error(f"Error generating weekly insights: {str(e)}")
            return []