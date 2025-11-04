"""
============================================
SPEAKER IDENTIFICATION MODULE
============================================
Identifies speakers (patient, doctor, caretaker) from voice characteristics
"""

import os
import json
from typing import Dict, Optional, List
from datetime import datetime
import numpy as np

class SpeakerIdentifier:
    """
    Speaker identification system using voice characteristics
    """
    
    def __init__(self):
        self.speaker_profiles = {}  # Store voice profiles
        self.current_speaker = None
        self.profiles_file = 'data/speaker_profiles.json'
        self.load_profiles()
    
    def load_profiles(self):
        """Load saved speaker profiles"""
        if os.path.exists(self.profiles_file):
            try:
                with open(self.profiles_file, 'r') as f:
                    self.speaker_profiles = json.load(f)
            except Exception as e:
                print(f"⚠️ Error loading speaker profiles: {e}")
                self.speaker_profiles = {}
    
    def save_profiles(self):
        """Save speaker profiles to disk"""
        os.makedirs('data', exist_ok=True)
        try:
            with open(self.profiles_file, 'w') as f:
                json.dump(self.speaker_profiles, f, indent=2)
        except Exception as e:
            print(f"⚠️ Error saving speaker profiles: {e}")
    
    def extract_voice_features(self, audio_data: bytes) -> Dict:
        """
        Extract voice characteristics from audio
        In production, this would use actual audio processing libraries
        """
        # TODO: Implement actual audio feature extraction
        # - Pitch (fundamental frequency)
        # - Formant frequencies
        # - Spectral characteristics
        # - Voice quality metrics
        
        # Placeholder: Return simulated features
        return {
            'pitch_mean': np.random.uniform(80, 300),
            'pitch_std': np.random.uniform(5, 20),
            'formant_1': np.random.uniform(400, 800),
            'formant_2': np.random.uniform(1000, 2000),
            'spectral_centroid': np.random.uniform(1000, 4000),
            'voice_quality': 'normal'
        }
    
    def register_speaker(self, user_id: str, role: str, audio_samples: List[bytes]) -> bool:
        """
        Register a new speaker with voice samples
        
        Args:
            user_id: Unique user identifier
            role: 'patient', 'doctor', or 'caretaker'
            audio_samples: List of audio samples for training
        
        Returns:
            True if registration successful
        """
        try:
            # Extract features from all samples
            features_list = [self.extract_voice_features(sample) for sample in audio_samples]
            
            # Compute average features
            avg_features = {
                'pitch_mean': np.mean([f['pitch_mean'] for f in features_list]),
                'pitch_std': np.mean([f['pitch_std'] for f in features_list]),
                'formant_1': np.mean([f['formant_1'] for f in features_list]),
                'formant_2': np.mean([f['formant_2'] for f in features_list]),
                'spectral_centroid': np.mean([f['spectral_centroid'] for f in features_list]),
            }
            
            # Store profile
            self.speaker_profiles[user_id] = {
                'role': role,
                'features': avg_features,
                'registered_at': datetime.now().isoformat(),
                'samples_count': len(audio_samples)
            }
            
            self.save_profiles()
            return True
            
        except Exception as e:
            print(f"❌ Error registering speaker: {e}")
            return False
    
    def identify_speaker(self, audio_data: bytes) -> Optional[Dict]:
        """
        Identify speaker from audio sample
        
        Args:
            audio_data: Audio sample to analyze
        
        Returns:
            Dict with user_id, role, and confidence, or None if not identified
        """
        if not self.speaker_profiles:
            return None
        
        try:
            # Extract features from audio
            features = self.extract_voice_features(audio_data)
            
            best_match = None
            best_score = 0.0
            
            # Compare with all registered speakers
            for user_id, profile in self.speaker_profiles.items():
                profile_features = profile['features']
                
                # Calculate similarity score (Euclidean distance in feature space)
                score = self._calculate_similarity(features, profile_features)
                
                if score > best_score:
                    best_score = score
                    best_match = {
                        'user_id': user_id,
                        'role': profile['role'],
                        'confidence': min(score * 100, 100.0)  # Convert to percentage
                    }
            
            # Only return if confidence is above threshold
            if best_match and best_match['confidence'] > 70.0:
                self.current_speaker = best_match
                return best_match
            
            return None
            
        except Exception as e:
            print(f"❌ Error identifying speaker: {e}")
            return None
    
    def _calculate_similarity(self, features1: Dict, features2: Dict) -> float:
        """
        Calculate similarity between two feature sets
        Returns value between 0 and 1
        """
        # Normalize features and compute similarity
        # This is a simplified version - in production, use ML models
        
        pitch_diff = abs(features1['pitch_mean'] - features2['pitch_mean']) / 300.0
        formant1_diff = abs(features1['formant_1'] - features2['formant_1']) / 800.0
        formant2_diff = abs(features1['formant_2'] - features2['formant_2']) / 2000.0
        
        # Weighted average (lower differences = higher similarity)
        similarity = 1.0 - (pitch_diff * 0.4 + formant1_diff * 0.3 + formant2_diff * 0.3)
        
        return max(0.0, min(1.0, similarity))
    
    def get_current_speaker(self) -> Optional[Dict]:
        """Get the currently identified speaker"""
        return self.current_speaker
    
    def set_speaker_by_id(self, user_id: str):
        """Manually set speaker by user ID"""
        if user_id in self.speaker_profiles:
            profile = self.speaker_profiles[user_id]
            self.current_speaker = {
                'user_id': user_id,
                'role': profile['role'],
                'confidence': 100.0
            }


# Global instance
speaker_identifier = SpeakerIdentifier()

