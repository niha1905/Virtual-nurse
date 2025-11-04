"""
============================================
ANALYTICS ENGINE MODULE
============================================
Analyzes long-term health patterns and generates insights
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import json

class AnalyticsEngine:
    """
    Analyzes health data patterns and generates insights
    """
    
    def __init__(self):
        self.data_history = {}  # user_id -> data points
        self.insights_cache = {}  # Cached insights
    
    def add_data_point(self, user_id: str, data_type: str, value: float, 
                      metadata: Optional[Dict] = None):
        """
        Add a data point for analysis
        
        Args:
            user_id: User identifier
            data_type: Type of data (heartRate, temperature, mood_score, etc.)
            value: Numeric value
            metadata: Additional context
        """
        if user_id not in self.data_history:
            self.data_history[user_id] = []
        
        data_point = {
            'timestamp': datetime.now().isoformat(),
            'type': data_type,
            'value': value,
            'metadata': metadata or {}
        }
        
        self.data_history[user_id].append(data_point)
        
        # Keep only last 90 days
        cutoff_date = datetime.now() - timedelta(days=90)
        self.data_history[user_id] = [
            dp for dp in self.data_history[user_id]
            if datetime.fromisoformat(dp['timestamp']) >= cutoff_date
        ]
        
        # Clear cache for this user
        if user_id in self.insights_cache:
            del self.insights_cache[user_id]
    
    def analyze_patterns(self, user_id: str, period_days: int = 30) -> Dict:
        """
        Analyze health patterns over a period
        
        Args:
            user_id: User identifier
            period_days: Number of days to analyze
        
        Returns:
            Dictionary with pattern analysis
        """
        if user_id not in self.data_history:
            return {'error': 'No data available'}
        
        # Check cache
        cache_key = f"{user_id}_{period_days}"
        if cache_key in self.insights_cache:
            return self.insights_cache[cache_key]
        
        cutoff_date = datetime.now() - timedelta(days=period_days)
        recent_data = [
            dp for dp in self.data_history[user_id]
            if datetime.fromisoformat(dp['timestamp']) >= cutoff_date
        ]
        
        if not recent_data:
            return {'error': 'Insufficient data'}
        
        analysis = {
            'period_days': period_days,
            'data_points': len(recent_data),
            'patterns': {},
            'trends': {},
            'insights': []
        }
        
        # Group by data type
        by_type = defaultdict(list)
        for dp in recent_data:
            by_type[dp['type']].append(dp)
        
        # Analyze each data type
        for data_type, points in by_type.items():
            values = [p['value'] for p in points]
            
            if not values:
                continue
            
            # Calculate statistics
            mean_val = sum(values) / len(values)
            min_val = min(values)
            max_val = max(values)
            
            # Calculate trend (simple linear regression)
            trend = self._calculate_trend(points)
            
            analysis['patterns'][data_type] = {
                'mean': mean_val,
                'min': min_val,
                'max': max_val,
                'count': len(values),
                'trend': trend
            }
            
            # Generate insights
            insights = self._generate_insights(data_type, mean_val, trend, points)
            analysis['insights'].extend(insights)
        
        # Overall health trend
        analysis['trends'] = self._calculate_overall_trend(recent_data)
        
        # Cache result
        self.insights_cache[cache_key] = analysis
        
        return analysis
    
    def _calculate_trend(self, data_points: List[Dict]) -> str:
        """
        Calculate trend direction (improving, declining, stable)
        """
        if len(data_points) < 2:
            return 'stable'
        
        # Sort by timestamp
        sorted_points = sorted(data_points, key=lambda x: x['timestamp'])
        values = [p['value'] for p in sorted_points]
        
        # Simple trend: compare first half vs second half
        mid = len(values) // 2
        first_half_avg = sum(values[:mid]) / len(values[:mid])
        second_half_avg = sum(values[mid:]) / len(values[mid:])
        
        change_percent = ((second_half_avg - first_half_avg) / first_half_avg) * 100
        
        if abs(change_percent) < 2:
            return 'stable'
        elif change_percent > 0:
            return 'improving' if sorted_points[0]['type'] in ['mood_score', 'oxygen'] else 'increasing'
        else:
            return 'declining' if sorted_points[0]['type'] in ['mood_score', 'oxygen'] else 'decreasing'
    
    def _generate_insights(self, data_type: str, mean_val: float, 
                          trend: str, points: List[Dict]) -> List[str]:
        """Generate insights for a data type"""
        insights = []
        
        # Health-specific insights
        if data_type == 'heartRate':
            if mean_val > 100:
                insights.append("Heart rate has been elevated. Consider consulting your doctor.")
            elif mean_val < 60:
                insights.append("Heart rate has been lower than normal. Monitor closely.")
        
        elif data_type == 'temperature':
            if mean_val > 99.5:
                insights.append("Temperature readings have been slightly elevated. Stay hydrated.")
        
        elif data_type == 'oxygen':
            if mean_val < 95:
                insights.append("Oxygen levels have been low. This requires medical attention.")
        
        elif data_type == 'mood_score':
            if trend == 'declining':
                insights.append("Mood patterns show a declining trend. Consider discussing with healthcare provider.")
            elif trend == 'improving':
                insights.append("Mood patterns are improving. Keep up the good work!")
        
        elif data_type == 'cough_frequency':
            if mean_val > 10:  # More than 10 coughs per day
                insights.append("Cough frequency has been high. Monitor respiratory health.")
        
        # Trend-based insights
        if trend == 'improving':
            insights.append(f"{data_type.replace('_', ' ').title()} shows improvement over time.")
        elif trend == 'declining':
            insights.append(f"{data_type.replace('_', ' ').title()} shows a declining pattern.")
        
        return insights
    
    def _calculate_overall_trend(self, data_points: List[Dict]) -> Dict:
        """Calculate overall health trend"""
        # Weight different metrics
        health_scores = []
        
        for dp in data_points:
            score = 0.5  # Base score
            
            if dp['type'] == 'heartRate':
                hr = dp['value']
                if 60 <= hr <= 100:
                    score += 0.2
                elif 50 <= hr <= 110:
                    score += 0.1
            
            elif dp['type'] == 'oxygen':
                oxygen = dp['value']
                if oxygen >= 95:
                    score += 0.2
                elif oxygen >= 90:
                    score += 0.1
            
            elif dp['type'] == 'temperature':
                temp = dp['value']
                if 97.0 <= temp <= 99.5:
                    score += 0.1
            
            health_scores.append(score)
        
        if not health_scores:
            return {'overall': 'unknown', 'score': 0.5}
        
        avg_score = sum(health_scores) / len(health_scores)
        
        if avg_score >= 0.8:
            trend = 'excellent'
        elif avg_score >= 0.6:
            trend = 'good'
        elif avg_score >= 0.4:
            trend = 'moderate'
        else:
            trend = 'needs_attention'
        
        return {
            'overall': trend,
            'score': avg_score,
            'recommendation': self._get_recommendation(trend)
        }
    
    def _get_recommendation(self, trend: str) -> str:
        """Get recommendation based on trend"""
        recommendations = {
            'excellent': "Continue maintaining current health practices.",
            'good': "Keep up the good work. Maintain regular checkups.",
            'moderate': "Consider lifestyle adjustments and consult healthcare provider.",
            'needs_attention': "Immediate consultation with healthcare provider recommended."
        }
        return recommendations.get(trend, "Monitor health closely.")
    
    def get_visualization_data(self, user_id: str, data_type: str, 
                               period_days: int = 30) -> Dict:
        """
        Get data formatted for visualization (charts)
        
        Returns:
            Dictionary with time series data for charts
        """
        if user_id not in self.data_history:
            return {'labels': [], 'values': []}
        
        cutoff_date = datetime.now() - timedelta(days=period_days)
        relevant_data = [
            dp for dp in self.data_history[user_id]
            if (datetime.fromisoformat(dp['timestamp']) >= cutoff_date and
                dp['type'] == data_type)
        ]
        
        # Sort by timestamp
        relevant_data.sort(key=lambda x: x['timestamp'])
        
        labels = [dp['timestamp'] for dp in relevant_data]
        values = [dp['value'] for dp in relevant_data]
        
        return {
            'labels': labels,
            'values': values,
            'data_type': data_type
        }


# Global instance
analytics_engine = AnalyticsEngine()

