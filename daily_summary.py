"""
============================================
DAILY SUMMARY MODULE
============================================
Generates morning and evening health summary reports
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json

class DailySummary:
    """
    Generates daily health summaries for patients
    """
    
    def __init__(self):
        self.summaries = {}  # user_id -> summary history
    
    def generate_morning_summary(self, user_id: str, vitals: Dict, 
                                 reminders: List[Dict], alerts: List[Dict]) -> str:
        """
        Generate morning health summary
        
        Args:
            user_id: Patient identifier
            vitals: Current vital signs
            reminders: Upcoming medication reminders
            alerts: Active alerts
        
        Returns:
            Text summary for voice/display
        """
        summary_parts = []
        
        # Greeting
        current_hour = datetime.now().hour
        if current_hour < 12:
            greeting = "Good morning"
        else:
            greeting = "Good morning"  # Still morning summary
        
        summary_parts.append(f"{greeting}! Here's your health summary for today.")
        
        # Vitals summary
        summary_parts.append(self._format_vitals_summary(vitals))
        
        # Medication reminders
        if reminders:
            summary_parts.append(self._format_reminders(reminders, "morning"))
        
        # Alerts
        if alerts:
            summary_parts.append(self._format_alerts_summary(alerts))
        else:
            summary_parts.append("No critical alerts at this time.")
        
        # Encouragement
        summary_parts.append("Have a healthy day! Remember to stay hydrated and take your medications on time.")
        
        summary_text = " ".join(summary_parts)
        
        # Store summary
        self._store_summary(user_id, "morning", summary_text, vitals, reminders, alerts)
        
        return summary_text
    
    def generate_evening_summary(self, user_id: str, vitals: Dict, 
                                reminders_completed: List[Dict], 
                                activities: List[Dict], alerts: List[Dict]) -> str:
        """
        Generate evening health summary
        
        Args:
            user_id: Patient identifier
            vitals: Current vital signs
            reminders_completed: Medications taken today
            activities: Activities performed today
            alerts: Alerts from today
        
        Returns:
            Text summary for voice/display
        """
        summary_parts = []
        
        # Greeting
        summary_parts.append("Good evening! Here's your health summary for today.")
        
        # Daily achievements
        if reminders_completed:
            summary_parts.append(self._format_completed_reminders(reminders_completed))
        else:
            summary_parts.append("No medications were logged today.")
        
        # Vitals summary
        summary_parts.append(self._format_vitals_summary(vitals))
        
        # Activities
        if activities:
            summary_parts.append(self._format_activities(activities))
        
        # Alerts summary
        if alerts:
            summary_parts.append(self._format_alerts_summary(alerts, "today"))
        
        # Sleep encouragement
        summary_parts.append("Get a good night's rest. Your health monitoring continues throughout the night.")
        
        summary_text = " ".join(summary_parts)
        
        # Store summary
        self._store_summary(user_id, "evening", summary_text, vitals, 
                          reminders_completed, alerts, activities)
        
        return summary_text
    
    def _format_vitals_summary(self, vitals: Dict) -> str:
        """Format vital signs into summary text"""
        parts = []
        
        if 'heartRate' in vitals:
            hr = vitals['heartRate']
            status = "normal" if 60 <= hr <= 100 else "abnormal"
            parts.append(f"Your heart rate is {hr} beats per minute, which is {status}.")
        
        if 'temperature' in vitals:
            temp = vitals['temperature']
            status = "normal" if 97.0 <= temp <= 99.5 else "abnormal"
            parts.append(f"Your temperature is {temp}°F, which is {status}.")
        
        if 'oxygen' in vitals:
            oxygen = vitals['oxygen']
            status = "good" if oxygen >= 95 else "low"
            parts.append(f"Your oxygen saturation is {oxygen}%, which is {status}.")
        
        return " ".join(parts) if parts else "Your vital signs are being monitored."
    
    def _format_reminders(self, reminders: List[Dict], time_of_day: str) -> str:
        """Format medication reminders"""
        if not reminders:
            return ""
        
        parts = [f"You have {len(reminders)} medication{'s' if len(reminders) > 1 else ''} scheduled for {time_of_day}:"]
        
        for rem in reminders[:3]:  # Limit to first 3
            medicine = rem.get('medicine', 'medication')
            time = rem.get('time', '')
            dosage = rem.get('dosage', '')
            
            time_str = f" at {time}" if time else ""
            dosage_str = f" ({dosage})" if dosage else ""
            
            parts.append(f"{medicine}{dosage_str}{time_str}.")
        
        if len(reminders) > 3:
            parts.append(f"And {len(reminders) - 3} more reminder{'s' if len(reminders) - 3 > 1 else ''}.")
        
        return " ".join(parts)
    
    def _format_completed_reminders(self, completed: List[Dict]) -> str:
        """Format completed medications"""
        if not completed:
            return ""
        
        count = len(completed)
        return f"Great job! You've taken {count} medication{'s' if count > 1 else ''} today as prescribed."
    
    def _format_activities(self, activities: List[Dict]) -> str:
        """Format daily activities"""
        if not activities:
            return ""
        
        # Count activity types
        activity_types = {}
        for activity in activities:
            activity_type = activity.get('type', 'activity')
            activity_types[activity_type] = activity_types.get(activity_type, 0) + 1
        
        parts = ["Today you've been active with:"]
        for activity_type, count in activity_types.items():
            parts.append(f"{count} {activity_type}{'s' if count > 1 else ''}.")
        
        return " ".join(parts)
    
    def _format_alerts_summary(self, alerts: List[Dict], period: str = "currently") -> str:
        """Format alerts summary"""
        if not alerts:
            return ""
        
        critical_count = sum(1 for a in alerts if a.get('severity') == 'high')
        
        if critical_count > 0:
            return f"There {'are' if critical_count > 1 else 'is'} {critical_count} critical alert{'s' if critical_count > 1 else ''} {period}. Please review them."
        else:
            return f"You have {len(alerts)} alert{'s' if len(alerts) > 1 else ''} {period}."
    
    def _store_summary(self, user_id: str, summary_type: str, summary_text: str,
                      vitals: Dict, reminders: List, alerts: List, activities: Optional[List] = None):
        """Store summary for history"""
        if user_id not in self.summaries:
            self.summaries[user_id] = []
        
        summary_record = {
            'date': datetime.now().isoformat(),
            'type': summary_type,  # 'morning' or 'evening'
            'summary': summary_text,
            'vitals': vitals,
            'reminders': reminders,
            'alerts': alerts,
            'activities': activities or []
        }
        
        self.summaries[user_id].append(summary_record)
        
        # Keep only last 30 days
        if len(self.summaries[user_id]) > 60:  # 30 days * 2 summaries per day
            self.summaries[user_id] = self.summaries[user_id][-60:]
    
    def get_summary_history(self, user_id: str, days: int = 7) -> List[Dict]:
        """Get summary history for a user"""
        if user_id not in self.summaries:
            return []
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        return [
            s for s in self.summaries[user_id]
            if datetime.fromisoformat(s['date']) >= cutoff_date
        ]


# Global instance
daily_summary = DailySummary()

