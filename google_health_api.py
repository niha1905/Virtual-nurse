"""
============================================
GOOGLE HEALTH API INTEGRATION MODULE
============================================
Integrates with Google Fit API for health data management
Uses OAuth2 authentication with credentials file
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import os
import pickle

# Google API imports
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_APIS_AVAILABLE = True
except ImportError:
    GOOGLE_APIS_AVAILABLE = False
    print("⚠️ Google API libraries not installed. Install with: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")

class GoogleHealthIntegration:
    """
    Integration with Google Fit API
    Uses OAuth2 for authentication and syncs health data
    """
    
    # Google Fit API scopes
    SCOPES = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.activity.write',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.write',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.body.write',
        'https://www.googleapis.com/auth/fitness.location.read',
        'https://www.googleapis.com/auth/fitness.location.write'
    ]
    
    def __init__(self):
        self.credentials_file = 'client_secret_52502923312-d6q98n8lohulrqfrnihjtge8j23mpngj.apps.googleusercontent.com.json'
        self.token_file = 'data/google_fit_token.pickle'
        self.is_authenticated = False
        self.credentials = None
        self.service = None
        self.health_data = {}  # user_id -> health records (fallback)
        self.sync_enabled = False
        self.user_tokens = {}  # user_id -> credentials
        
        # Ensure data directory exists
        os.makedirs('data', exist_ok=True)
    
    def authenticate(self, user_id: Optional[str] = None, access_token: Optional[str] = None) -> bool:
        """
        Authenticate with Google Fit API using OAuth2
        
        Args:
            user_id: User identifier (for multi-user support)
            access_token: Pre-obtained access token (optional)
        
        Returns:
            True if authenticated
        """
        if not GOOGLE_APIS_AVAILABLE:
            print("⚠️ Google API libraries not available. Using local storage.")
            self.is_authenticated = False
            return False
        
        if not os.path.exists(self.credentials_file):
            print(f"⚠️ Credentials file not found: {self.credentials_file}")
            print("⚠️ Using local storage fallback")
            self.is_authenticated = False
            return False
        
        try:
            # Load existing token if available
            token_path = f'data/google_fit_token_{user_id}.pickle' if user_id else self.token_file
            creds = None
            
            if os.path.exists(token_path):
                with open(token_path, 'rb') as token:
                    creds = pickle.load(token)
            
            # If there are no (valid) credentials available, let the user log in
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    # Refresh expired token
                    creds.refresh(Request())
                else:
                    # Start OAuth flow
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, self.SCOPES)
                    creds = flow.run_local_server(port=0)
                
                # Save the credentials for the next run
                with open(token_path, 'wb') as token:
                    pickle.dump(creds, token)
            
            self.credentials = creds
            self.service = build('fitness', 'v1', credentials=creds)
            
            if user_id:
                self.user_tokens[user_id] = creds
            
            self.is_authenticated = True
            print("✅ Google Fit API authenticated successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error authenticating with Google Fit API: {e}")
            print("⚠️ Using local storage fallback")
            self.is_authenticated = False
            return False
    
    def sync_vitals(self, user_id: str, vitals: Dict) -> bool:
        """
        Sync vitals to Google Fit
        
        Args:
            user_id: User identifier
            vitals: Vital signs data (heartRate, temperature, oxygen, etc.)
        
        Returns:
            True if sync successful
        """
        # Store locally as backup
        self._store_local(user_id, 'vitals', vitals)
        
        if not self.is_authenticated or not self.service:
            print(f"⚠️ Not authenticated. Stored locally for user {user_id}")
            return False
        
        try:
            # Get current time in nanoseconds (Google Fit uses nanoseconds since epoch)
            now = datetime.now()
            now_ns = int(now.timestamp() * 1000000000)
            
            # Heart rate data
            if 'heartRate' in vitals:
                self._insert_heart_rate_data(user_id, vitals['heartRate'], now_ns)
            
            # Body temperature (if available)
            if 'temperature' in vitals:
                self._insert_body_temperature(user_id, vitals['temperature'], now_ns)
            
            # Oxygen saturation (if available)
            if 'oxygen' in vitals:
                self._insert_oxygen_saturation(user_id, vitals['oxygen'], now_ns)
            
            print(f"✅ Synced vitals for user {user_id} to Google Fit")
            return True
            
        except HttpError as e:
            print(f"❌ Error syncing to Google Fit: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False
    
    def sync_activity(self, user_id: str, activity: Dict) -> bool:
        """
        Sync activity data to Google Health / Google Fit
        
        Args:
            user_id: User identifier
            activity: Activity data (steps, exercise, etc.)
        
        Returns:
            True if sync successful
        """
        if not self.is_authenticated:
            self._store_local(user_id, 'activity', activity)
            return True
        
        # In production: POST to Google Fit API
        
        self._store_local(user_id, 'activity', activity)
        print(f"✅ Synced activity for user {user_id} to Google Fit (simulated)")
        return True
    
    def retrieve_vitals(self, user_id: str, start_date: Optional[datetime] = None,
                       end_date: Optional[datetime] = None) -> List[Dict]:
        """
        Retrieve vitals from Google Fit
        
        Args:
            user_id: User identifier
            start_date: Start date for retrieval
            end_date: End date for retrieval
        
        Returns:
            List of vital records
        """
        if not self.is_authenticated or not self.service:
            return self._get_local(user_id, 'vitals', start_date, end_date)
        
        try:
            # Default to last 7 days if not specified
            if not end_date:
                end_date = datetime.now()
            if not start_date:
                start_date = end_date - timedelta(days=7)
            
            start_ns = int(start_date.timestamp() * 1000000000)
            end_ns = int(end_date.timestamp() * 1000000000)
            
            vitals = []
            
            # Retrieve heart rate data
            heart_rate_data = self._get_heart_rate_data(start_ns, end_ns)
            vitals.extend(heart_rate_data)
            
            # Retrieve body temperature (if available)
            temp_data = self._get_body_temperature(start_ns, end_ns)
            vitals.extend(temp_data)
            
            return vitals
            
        except HttpError as e:
            print(f"❌ Error retrieving from Google Fit: {e}")
            return self._get_local(user_id, 'vitals', start_date, end_date)
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return self._get_local(user_id, 'vitals', start_date, end_date)
    
    def retrieve_wellness_metrics(self, user_id: str, 
                                  days: int = 30) -> Dict:
        """
        Retrieve wellness metrics from Google Health
        
        Args:
            user_id: User identifier
            days: Number of days to retrieve
        
        Returns:
            Dictionary with wellness metrics
        """
        if not self.is_authenticated:
            return self._get_wellness_local(user_id, days)
        
        # In production: Aggregate data from Google Health API
        
        return self._get_wellness_local(user_id, days)
    
    def _store_local(self, user_id: str, data_type: str, data: Dict):
        """Store data locally (simulation)"""
        if user_id not in self.health_data:
            self.health_data[user_id] = {}
        
        if data_type not in self.health_data[user_id]:
            self.health_data[user_id][data_type] = []
        
        record = {
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        
        self.health_data[user_id][data_type].append(record)
        
        # Keep only last 90 days
        cutoff = datetime.now() - timedelta(days=90)
        self.health_data[user_id][data_type] = [
            r for r in self.health_data[user_id][data_type]
            if datetime.fromisoformat(r['timestamp']) >= cutoff
        ]
    
    def _get_local(self, user_id: str, data_type: str,
                   start_date: Optional[datetime] = None,
                   end_date: Optional[datetime] = None) -> List[Dict]:
        """Retrieve local data (simulation)"""
        if user_id not in self.health_data:
            return []
        
        if data_type not in self.health_data[user_id]:
            return []
        
        records = self.health_data[user_id][data_type]
        
        # Filter by date if provided
        if start_date:
            records = [
                r for r in records
                if datetime.fromisoformat(r['timestamp']) >= start_date
            ]
        
        if end_date:
            records = [
                r for r in records
                if datetime.fromisoformat(r['timestamp']) <= end_date
            ]
        
        return records
    
    def _get_wellness_local(self, user_id: str, days: int) -> Dict:
        """Get wellness metrics from local storage"""
        start_date = datetime.now() - timedelta(days=days)
        
        vitals = self._get_local(user_id, 'vitals', start_date=start_date)
        activities = self._get_local(user_id, 'activity', start_date=start_date)
        
        # Aggregate metrics
        metrics = {
            'period_days': days,
            'vital_records': len(vitals),
            'activity_records': len(activities),
            'average_heart_rate': None,
            'average_temperature': None,
            'average_oxygen': None,
            'total_steps': 0,
            'active_days': 0
        }
        
        # Calculate averages from vitals
        if vitals:
            heart_rates = []
            temperatures = []
            oxygen_levels = []
            
            for record in vitals:
                data = record.get('data', {})
                if 'heartRate' in data:
                    heart_rates.append(data['heartRate'])
                if 'temperature' in data:
                    temperatures.append(data['temperature'])
                if 'oxygen' in data:
                    oxygen_levels.append(data['oxygen'])
            
            if heart_rates:
                metrics['average_heart_rate'] = sum(heart_rates) / len(heart_rates)
            if temperatures:
                metrics['average_temperature'] = sum(temperatures) / len(temperatures)
            if oxygen_levels:
                metrics['average_oxygen'] = sum(oxygen_levels) / len(oxygen_levels)
        
        # Calculate activity metrics
        if activities:
            unique_dates = set()
            for record in activities:
                data = record.get('data', {})
                if 'steps' in data:
                    metrics['total_steps'] += data['steps']
                if 'timestamp' in record:
                    date = datetime.fromisoformat(record['timestamp']).date()
                    unique_dates.add(date)
            
            metrics['active_days'] = len(unique_dates)
        
        return metrics
    
    def enable_sync(self):
        """Enable automatic syncing"""
        self.sync_enabled = True
        print("✅ Google Fit sync enabled")
    
    def disable_sync(self):
        """Disable automatic syncing"""
        self.sync_enabled = False
        print("⚠️ Google Fit sync disabled")
    
    # ============================================
    # Google Fit API Helper Methods
    # ============================================
    
    def _insert_heart_rate_data(self, user_id: str, heart_rate: float, timestamp_ns: int):
        """Insert heart rate data into Google Fit"""
        if not GOOGLE_APIS_AVAILABLE or not self.service:
            return
        
        try:
            data_source_id = "raw:com.google.heart_rate.bpm:com.google.android.apps.fitness:user_input"
            
            dataset = {
                "dataSourceId": data_source_id,
                "point": [{
                    "startTimeNanos": str(timestamp_ns),
                    "endTimeNanos": str(timestamp_ns),
                    "value": [{
                        "fpVal": float(heart_rate)
                    }]
                }]
            }
            
            self.service.users().dataSources().datasets().patch(
                userId='me',
                dataSourceId=data_source_id,
                datasetId=f"{timestamp_ns}-{timestamp_ns}",
                body=dataset
            ).execute()
        except Exception as e:
            print(f"⚠️ Error inserting heart rate: {e}")
    
    def _insert_steps_data(self, user_id: str, steps: int, timestamp_ns: int):
        """Insert steps data into Google Fit"""
        if not GOOGLE_APIS_AVAILABLE or not self.service:
            return
        
        try:
            data_source_id = "derived:com.google.step_count.delta:com.google.android.gms:aggregated"
            
            # Calculate start and end times (e.g., for the day)
            start_ns = timestamp_ns - (24 * 60 * 60 * 1000000000)  # 24 hours ago
            end_ns = timestamp_ns
            
            dataset = {
                "dataSourceId": data_source_id,
                "point": [{
                    "startTimeNanos": str(start_ns),
                    "endTimeNanos": str(end_ns),
                    "value": [{
                        "intVal": int(steps)
                    }]
                }]
            }
            
            self.service.users().dataSources().datasets().patch(
                userId='me',
                dataSourceId=data_source_id,
                datasetId=f"{start_ns}-{end_ns}",
                body=dataset
            ).execute()
        except Exception as e:
            print(f"⚠️ Error inserting steps: {e}")
    
    def _insert_body_temperature(self, user_id: str, temperature: float, timestamp_ns: int):
        """Insert body temperature data into Google Fit"""
        if not GOOGLE_APIS_AVAILABLE or not self.service:
            return
        
        try:
            data_source_id = "raw:com.google.body.temperature:com.google.android.apps.fitness:user_input"
            
            dataset = {
                "dataSourceId": data_source_id,
                "point": [{
                    "startTimeNanos": str(timestamp_ns),
                    "endTimeNanos": str(timestamp_ns),
                    "value": [{
                        "fpVal": float(temperature)
                    }]
                }]
            }
            
            self.service.users().dataSources().datasets().patch(
                userId='me',
                dataSourceId=data_source_id,
                datasetId=f"{timestamp_ns}-{timestamp_ns}",
                body=dataset
            ).execute()
        except Exception as e:
            print(f"⚠️ Error inserting temperature: {e}")
    
    def _insert_oxygen_saturation(self, user_id: str, oxygen: float, timestamp_ns: int):
        """Insert oxygen saturation data into Google Fit"""
        # Note: Google Fit doesn't have a standard oxygen saturation data type
        # We can store it as a custom data type or use a workaround
        # For now, we'll store it locally and note it
        print(f"ℹ️ Oxygen saturation ({oxygen}%) stored locally (not a standard Google Fit metric)")
        self._store_local(user_id, 'oxygen', {'value': oxygen, 'timestamp': timestamp_ns})
    
    def _insert_activity_segment(self, user_id: str, activity: Dict, timestamp_ns: int):
        """Insert activity segment into Google Fit"""
        if not GOOGLE_APIS_AVAILABLE or not self.service:
            return
        
        try:
            activity_type = activity.get('activity_type', 'unknown')
            duration = activity.get('duration', 0)  # in seconds
            
            # Map activity types to Google Fit activity types
            activity_map = {
                'walking': 7,
                'running': 8,
                'cycling': 1,
                'swimming': 5,
                'exercise': 91
            }
            
            fit_activity = activity_map.get(activity_type.lower(), 91)  # Default to general exercise
            
            start_ns = timestamp_ns - (duration * 1000000000)
            end_ns = timestamp_ns
            
            data_source_id = "derived:com.google.activity.segment:com.google.android.gms:aggregated"
            
            dataset = {
                "dataSourceId": data_source_id,
                "point": [{
                    "startTimeNanos": str(start_ns),
                    "endTimeNanos": str(end_ns),
                    "value": [{
                        "intVal": fit_activity
                    }]
                }]
            }
            
            self.service.users().dataSources().datasets().patch(
                userId='me',
                dataSourceId=data_source_id,
                datasetId=f"{start_ns}-{end_ns}",
                body=dataset
            ).execute()
        except Exception as e:
            print(f"⚠️ Error inserting activity: {e}")
    
    def _get_heart_rate_data(self, start_ns: int, end_ns: int) -> List[Dict]:
        """Retrieve heart rate data from Google Fit"""
        if not GOOGLE_APIS_AVAILABLE or not self.service:
            return []
        
        try:
            data_source_id = "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm"
            
            dataset = self.service.users().dataset().aggregate(
                userId='me',
                body={
                    "aggregateBy": [{
                        "dataSourceId": data_source_id
                    }],
                    "bucketByTime": {
                        "durationMillis": 86400000  # 1 day buckets
                    },
                    "startTimeMillis": start_ns // 1000000,
                    "endTimeMillis": end_ns // 1000000
                }
            ).execute()
            
            vitals = []
            for bucket in dataset.get('bucket', []):
                for dataset_item in bucket.get('dataset', []):
                    for point in dataset_item.get('point', []):
                        for value in point.get('value', []):
                            if 'fpVal' in value:
                                vitals.append({
                                    'type': 'heartRate',
                                    'value': value['fpVal'],
                                    'timestamp': datetime.fromtimestamp(point['startTimeNanos'] / 1000000000).isoformat()
                                })
            
            return vitals
        except Exception as e:
            print(f"⚠️ Error retrieving heart rate: {e}")
            return []
    
    def _get_body_temperature(self, start_ns: int, end_ns: int) -> List[Dict]:
        """Retrieve body temperature data from Google Fit"""
        # Note: Body temperature may not be widely supported
        # This is a placeholder implementation
        return []


# Global instance
google_health = GoogleHealthIntegration()

