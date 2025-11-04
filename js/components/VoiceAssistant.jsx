import React, { useState, useEffect } from 'react';
import voiceRecognition from './voice_recognition';

const VoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [mood, setMood] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Listen for transcript updates
        const handleTranscriptUpdate = (event) => {
            setTranscript(event.detail.transcript);
            if (event.detail.isFinal) {
                handleFinalTranscript(event.detail.transcript);
            }
        };

        window.addEventListener('transcriptUpdate', handleTranscriptUpdate);
        
        // Set up voice recognition callbacks
        voiceRecognition.setOnResult(handleFinalTranscript);
        voiceRecognition.setOnError(handleError);

        return () => {
            window.removeEventListener('transcriptUpdate', handleTranscriptUpdate);
        };
    }, []);

    const handleFinalTranscript = async (text) => {
        try {
            // Send transcript to backend for processing
            const response = await fetch('/api/voice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();
            if (data.success) {
                setResponse(data.response);
                setMood(data.mood);
                // Use browser's text-to-speech if needed
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(data.response);
                    window.speechSynthesis.speak(utterance);
                }
            } else {
                setError(data.error || 'Failed to process voice input');
            }
        } catch (err) {
            setError('Error communicating with server: ' + err.message);
        }
    };

    const handleError = (error) => {
        setError('Voice recognition error: ' + error);
        setIsListening(false);
    };

    const toggleListening = () => {
        if (!isListening) {
            // Prevent double start if underlying recognition is already active
            if (!voiceRecognition.isListening) {
                voiceRecognition.start();
            } else {
                console.warn('VoiceRecognition already active; ignoring duplicate start');
            }
            setIsListening(true);
            setError(null);
        } else {
            if (voiceRecognition.isListening) {
                voiceRecognition.stop();
            }
            setIsListening(false);
        }
    };

    return (
        <div className="voice-assistant">
            <div className="voice-controls">
                <button 
                    onClick={toggleListening}
                    className={`voice-button ${isListening ? 'listening' : ''}`}
                >
                    {isListening ? 'Stop Listening' : 'Start Listening'}
                </button>
            </div>

            <div className="transcript-container">
                <h3>You said:</h3>
                <p>{transcript || '(Listening...)'}</p>
            </div>

            {response && (
                <div className="response-container">
                    <h3>Virtual Nurse Response:</h3>
                    <p>{response}</p>
                </div>
            )}

            {mood && (
                <div className="mood-container">
                    <h3>Mood Analysis:</h3>
                    <p>Primary Emotion: {mood.primary_emotion}</p>
                    <p>Confidence: {(mood.confidence * 100).toFixed(1)}%</p>
                    {mood.concerning_indicators?.length > 0 && (
                        <div className="mood-concerns">
                            <h4>Concerns:</h4>
                            <ul>
                                {mood.concerning_indicators.map((concern, idx) => (
                                    <li key={idx}>{concern}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="error-container">
                    <p className="error">{error}</p>
                </div>
            )}
        </div>
    );
};

export default VoiceAssistant;