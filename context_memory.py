"""
============================================
CONTEXT MEMORY MODULE
============================================
Maintains conversation history for natural, context-aware interactions
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import deque
import json

class ContextMemory:
    """
    Short-term conversation memory for maintaining dialogue context
    """
    
    def __init__(self, max_history: int = 10, max_age_minutes: int = 30):
        self.max_history = max_history
        self.max_age = timedelta(minutes=max_age_minutes)
        self.conversations = {}  # user_id -> conversation history
        self.current_context = {}  # Active context for current user
    
    def add_exchange(self, user_id: str, user_input: str, assistant_response: str, 
                     metadata: Optional[Dict] = None):
        """
        Add a conversation exchange to memory
        
        Args:
            user_id: User identifier
            user_input: What the user said
            assistant_response: What the assistant responded
            metadata: Additional context (intent, entities, etc.)
        """
        if user_id not in self.conversations:
            self.conversations[user_id] = deque(maxlen=self.max_history)
        
        exchange = {
            'timestamp': datetime.now().isoformat(),
            'user_input': user_input,
            'assistant_response': assistant_response,
            'metadata': metadata or {}
        }
        
        self.conversations[user_id].append(exchange)
        self._update_context(user_id)
    
    def get_recent_history(self, user_id: str, n: int = 5) -> List[Dict]:
        """
        Get recent conversation history
        
        Args:
            user_id: User identifier
            n: Number of recent exchanges to return
        
        Returns:
            List of conversation exchanges
        """
        if user_id not in self.conversations:
            return []
        
        # Filter out old conversations
        now = datetime.now()
        recent = []
        
        for exchange in list(self.conversations[user_id]):
            exchange_time = datetime.fromisoformat(exchange['timestamp'])
            if now - exchange_time <= self.max_age:
                recent.append(exchange)
        
        # Update conversation list to remove old entries
        self.conversations[user_id] = deque(recent, maxlen=self.max_history)
        
        return recent[-n:] if len(recent) > n else recent
    
    def get_context(self, user_id: str) -> Dict:
        """
        Get current conversation context
        
        Args:
            user_id: User identifier
        
        Returns:
            Context dictionary with relevant information
        """
        if user_id not in self.current_context:
            self._update_context(user_id)
        
        return self.current_context.get(user_id, {})
    
    def _update_context(self, user_id: str):
        """Update context based on recent conversation"""
        history = self.get_recent_history(user_id, n=self.max_history)
        
        context = {
            'recent_topics': [],
            'mentioned_entities': set(),
            'active_intents': [],
            'emotional_state': None,
            'conversation_flow': []
        }
        
        # Extract information from recent exchanges
        for exchange in history:
            metadata = exchange.get('metadata', {})
            
            # Track topics/intents
            if 'intent' in metadata:
                context['active_intents'].append(metadata['intent'])
            
            # Track entities mentioned (medications, symptoms, etc.)
            if 'entities' in metadata:
                context['mentioned_entities'].update(metadata['entities'])
            
            # Track emotional state
            if 'mood' in metadata:
                context['emotional_state'] = metadata['mood']
            
            # Track conversation flow
            context['conversation_flow'].append({
                'user': exchange['user_input'],
                'assistant': exchange['assistant_response']
            })
        
        # Convert set to list for JSON serialization
        context['mentioned_entities'] = list(context['mentioned_entities'])
        
        # Keep only unique recent intents
        context['active_intents'] = list(set(context['active_intents'][-5:]))
        
        self.current_context[user_id] = context
    
    def clear_context(self, user_id: str):
        """Clear conversation context for a user"""
        if user_id in self.conversations:
            self.conversations[user_id].clear()
        if user_id in self.current_context:
            del self.current_context[user_id]
    
    def get_contextual_response_hints(self, user_id: str) -> Dict:
        """
        Get hints for generating contextual responses
        
        Returns:
            Dictionary with context hints
        """
        context = self.get_context(user_id)
        history = self.get_recent_history(user_id, n=3)
        
        hints = {
            'has_recent_context': len(history) > 0,
            'last_topic': history[-1]['user_input'] if history else None,
            'mentioned_items': context.get('mentioned_entities', []),
            'current_mood': context.get('emotional_state'),
            'conversation_continuity': len(history) > 1
        }
        
        return hints


# Global instance
context_memory = ContextMemory()

