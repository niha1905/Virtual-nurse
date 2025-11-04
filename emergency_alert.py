"""
============================================
ENHANCED EMERGENCY ALERT MODULE
============================================
Handles emergency alerts with local sound alerts and escalation
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import os
import threading
import time

class EmergencyAlertSystem:
    """
    Enhanced emergency alert system with local alerts and escalation
    """
    
    def __init__(self):
        self.active_alerts = {}  # alert_id -> alert_info
        self.acknowledgment_timeout = 30  # seconds
        self.alert_sound_enabled = True
        self.alert_sound_path = 'assets/audio/emergency_alert.wav'
        self.escalation_handlers = []
    
    def trigger_emergency(self, user_id: str, alert_type: str, 
                         message: str, severity: str = 'high') -> Dict:
        """
        Trigger an emergency alert
        
        Args:
            user_id: User identifier
            alert_type: Type of emergency
            message: Alert message
            severity: 'low', 'medium', 'high', 'critical'
        
        Returns:
            Alert information dictionary
        """
        alert_id = f"emergency_{user_id}_{int(time.time())}"
        
        alert = {
            'id': alert_id,
            'user_id': user_id,
            'type': alert_type,
            'severity': severity,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'acknowledged': False,
            'acknowledged_by': None,
            'acknowledged_at': None,
            'escalated': False,
            'escalated_at': None
        }
        
        self.active_alerts[alert_id] = alert
        
        # Trigger local alert
        self._trigger_local_alert(alert)
        
        # Start acknowledgment timeout
        self._start_acknowledgment_timer(alert_id)
        
        # Log alert
        self._log_alert(alert)
        
        return alert
    
    def _trigger_local_alert(self, alert: Dict):
        """Trigger local alert sound and visual notification"""
        print(f"🚨 EMERGENCY ALERT: {alert['message']}")
        print(f"   User: {alert['user_id']}")
        print(f"   Type: {alert['type']}")
        print(f"   Severity: {alert['severity']}")
        
        # Play alert sound (if available)
        if self.alert_sound_enabled:
            self._play_alert_sound()
        
        # Send to connected devices (WebSocket, etc.)
        # TODO: Implement WebSocket notification
    
    def _play_alert_sound(self):
        """Play alert sound file"""
        # In production, use pygame or similar to play sound
        # For now, just log
        print("🔊 Playing emergency alert sound...")
        
        # Check if sound file exists
        if os.path.exists(self.alert_sound_path):
            try:
                # Use system sound player
                import platform
                if platform.system() == 'Windows':
                    os.system(f'start {self.alert_sound_path}')
                elif platform.system() == 'Darwin':  # macOS
                    os.system(f'afplay {self.alert_sound_path}')
                else:  # Linux
                    os.system(f'aplay {self.alert_sound_path}')
            except Exception as e:
                print(f"⚠️ Could not play alert sound: {e}")
    
    def _start_acknowledgment_timer(self, alert_id: str):
        """Start timer for automatic escalation if not acknowledged"""
        def escalate_if_not_acknowledged():
            time.sleep(self.acknowledgment_timeout)
            
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                if not alert.get('acknowledged'):
                    print(f"⏰ Alert {alert_id} not acknowledged, escalating...")
                    self.escalate_alert(alert_id, 'auto')
        
        thread = threading.Thread(target=escalate_if_not_acknowledged, daemon=True)
        thread.start()
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """
        Acknowledge an alert
        
        Args:
            alert_id: Alert identifier
            acknowledged_by: User who acknowledged
        
        Returns:
            True if acknowledged successfully
        """
        if alert_id not in self.active_alerts:
            return False
        
        alert = self.active_alerts[alert_id]
        alert['acknowledged'] = True
        alert['acknowledged_by'] = acknowledged_by
        alert['acknowledged_at'] = datetime.now().isoformat()
        
        print(f"✅ Alert {alert_id} acknowledged by {acknowledged_by}")
        
        # Stop alert sound
        self._stop_alert_sound()
        
        return True
    
    def escalate_alert(self, alert_id: str, escalation_type: str = 'manual') -> bool:
        """
        Escalate an emergency alert
        
        Args:
            alert_id: Alert identifier
            escalation_type: 'manual' or 'auto'
        
        Returns:
            True if escalated successfully
        """
        if alert_id not in self.active_alerts:
            return False
        
        alert = self.active_alerts[alert_id]
        alert['escalated'] = True
        alert['escalated_at'] = datetime.now().isoformat()
        alert['escalation_type'] = escalation_type
        
        print(f"🚨 ESCALATING ALERT: {alert['message']}")
        print(f"   Escalation type: {escalation_type}")
        
        # Notify doctor
        self._notify_doctor(alert)
        
        # Send to emergency services (if configured)
        self._notify_emergency_services(alert)
        
        # Call escalation handlers
        for handler in self.escalation_handlers:
            try:
                handler(alert)
            except Exception as e:
                print(f"⚠️ Error in escalation handler: {e}")
        
        return True
    
    def _notify_doctor(self, alert: Dict):
        """Notify doctor about emergency"""
        print(f"📧 Notifying doctor about emergency: {alert['id']}")
        # TODO: Send email/SMS/notification to doctor
        # TODO: Use internal communication module
    
    def _notify_emergency_services(self, alert: Dict):
        """Notify emergency services if critical"""
        if alert.get('severity') == 'critical':
            print(f"🚨 NOTIFYING EMERGENCY SERVICES: {alert['message']}")
            # TODO: Call emergency services API
            # TODO: Send location and patient information
    
    def _stop_alert_sound(self):
        """Stop alert sound"""
        # TODO: Stop playing sound
        pass
    
    def _log_alert(self, alert: Dict):
        """Log alert to file"""
        os.makedirs('data/logs', exist_ok=True)
        log_file = f'data/logs/emergency_alerts_{datetime.now().strftime("%Y-%m-%d")}.json'
        
        try:
            alerts = []
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    alerts = json.load(f)
            
            alerts.append(alert)
            
            with open(log_file, 'w') as f:
                json.dump(alerts, f, indent=2)
        except Exception as e:
            print(f"⚠️ Error logging alert: {e}")
    
    def get_active_alerts(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get active alerts, optionally filtered by user"""
        alerts = list(self.active_alerts.values())
        
        if user_id:
            alerts = [a for a in alerts if a.get('user_id') == user_id]
        
        # Filter out acknowledged alerts
        return [a for a in alerts if not a.get('acknowledged')]
    
    def get_alert_history(self, user_id: Optional[str] = None, days: int = 7) -> List[Dict]:
        """Get alert history"""
        cutoff_date = datetime.now() - timedelta(days=days)
        log_files = []
        
        # Get log files
        log_dir = 'data/logs'
        if os.path.exists(log_dir):
            for filename in os.listdir(log_dir):
                if filename.startswith('emergency_alerts_'):
                    log_files.append(os.path.join(log_dir, filename))
        
        all_alerts = []
        for log_file in log_files:
            try:
                with open(log_file, 'r') as f:
                    alerts = json.load(f)
                    all_alerts.extend(alerts)
            except Exception:
                continue
        
        # Filter by date and user
        filtered = []
        for alert in all_alerts:
            alert_date = datetime.fromisoformat(alert.get('timestamp', ''))
            if alert_date >= cutoff_date:
                if not user_id or alert.get('user_id') == user_id:
                    filtered.append(alert)
        
        return sorted(filtered, key=lambda x: x.get('timestamp'), reverse=True)
    
    def add_escalation_handler(self, handler):
        """Add a custom escalation handler function"""
        self.escalation_handlers.append(handler)
    
    def set_acknowledgment_timeout(self, seconds: int):
        """Set acknowledgment timeout in seconds"""
        self.acknowledgment_timeout = seconds
    
    def enable_sound_alerts(self):
        """Enable sound alerts"""
        self.alert_sound_enabled = True
    
    def disable_sound_alerts(self):
        """Disable sound alerts"""
        self.alert_sound_enabled = False


# Global instance
emergency_alert_system = EmergencyAlertSystem()

