// ============================================
// FALL DETECTION MODULE
// ============================================

class FallDetectionManager {
    constructor() {
        this.isMonitoring = false;
        this.sensorListeners = [];
        this.lastDetection = null;
        this.fallHistory = [];
        this.init();
    }

    init() {
        console.log('Fall Detection Manager initialized');
        this.setupEventListeners();
        this.checkSensorSupport();
    }

    setupEventListeners() {
        // Monitoring button
        const monitoringBtn = document.getElementById('startFallMonitoring');
        if (monitoringBtn) {
            monitoringBtn.addEventListener('click', () => {
                if (this.isMonitoring) {
                    this.stopMonitoring();
                } else {
                    this.startMonitoring();
                }
            });
        }
    }

    checkSensorSupport() {
        // Check if DeviceMotionEvent is supported
        if (window.DeviceMotionEvent) {
            console.log('✅ Device motion sensors supported');
            this.sensorSupported = true;
        } else {
            console.warn('⚠️ Device motion sensors not supported');
            this.sensorSupported = false;
        }
    }

    startMonitoring() {
        if (!this.sensorSupported) {
            alert('Device motion sensors are not supported on this device.');
            return;
        }

        if (this.isMonitoring) {
            console.log('Fall detection already monitoring');
            return;
        }

        try {
            // Request permission for motion sensors
            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                DeviceMotionEvent.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.initializeSensorMonitoring();
                    } else {
                        alert('Motion sensor permission denied. Fall detection cannot work.');
                    }
                });
            } else {
                // Permission not required (older browsers)
                this.initializeSensorMonitoring();
            }
        } catch (error) {
            console.error('Error starting fall monitoring:', error);
            alert('Error starting fall detection. Please check browser permissions.');
        }
    }

    initializeSensorMonitoring() {
        this.isMonitoring = true;
        this.updateMonitoringStatus(true);

        // Listen for device motion events
        window.addEventListener('devicemotion', (event) => {
            this.handleSensorData(event);
        });

        // Also listen for device orientation (fallback)
        window.addEventListener('deviceorientation', (event) => {
            // Can be used as additional data
        });

        console.log('✅ Fall detection monitoring started');
        this.showNotification('Fall detection monitoring active', 'success');
    }

    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;
        this.updateMonitoringStatus(false);

        // Remove event listeners
        window.removeEventListener('devicemotion', this.handleSensorData);
        window.removeEventListener('deviceorientation', this.handleSensorData);

        console.log('⚠️ Fall detection monitoring stopped');
        this.showNotification('Fall detection monitoring stopped', 'info');
    }

    handleSensorData(event) {
        if (!this.isMonitoring) return;

        try {
            // Extract accelerometer data
            const accel = event.accelerationIncludingGravity || event.acceleration;
            
            if (!accel) {
                return;
            }

            const sensorData = {
                accel_x: accel.x || 0,
                accel_y: accel.y || 0,
                accel_z: accel.z || 0,
                gyro_x: event.rotationRate?.alpha || 0,
                gyro_y: event.rotationRate?.beta || 0,
                gyro_z: event.rotationRate?.gamma || 0,
                timestamp: Date.now()
            };

            // Calculate magnitude for quick threshold check
            const magnitude = Math.sqrt(
                sensorData.accel_x ** 2 +
                sensorData.accel_y ** 2 +
                sensorData.accel_z ** 2
            );

            // Quick threshold check before sending to ML model
            if (magnitude > 12.0) {  // Potential fall indicator
                this.sendToFallDetection(sensorData);
            }

            // Update sensor visualization
            this.updateSensorDisplay(sensorData);
        } catch (error) {
            console.error('Error processing sensor data:', error);
        }
    }

    async sendToFallDetection(sensorData) {
        try {
            const response = await fetch(API_ENDPOINTS.detectFall, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({
                    user_id: '1',
                    sensor_data: sensorData
                })
            });

            if (response.ok) {
                const data = await response.json();
                const fallDetection = data.fall_detection;

                if (fallDetection && fallDetection.detected) {
                    this.handleFallDetected(fallDetection);
                }
            }
        } catch (error) {
            console.error('Error sending to fall detection API:', error);
        }
    }

    handleFallDetected(detectionResult) {
        console.log('🚨 FALL DETECTED!', detectionResult);
        
        this.lastDetection = detectionResult;
        this.fallHistory.push({
            ...detectionResult,
            timestamp: new Date().toISOString()
        });

        // Keep only last 10 detections
        if (this.fallHistory.length > 10) {
            this.fallHistory.shift();
        }

        // Update UI
        this.updateFallStatus('detected', detectionResult);
        
        // Show emergency alert
        this.showEmergencyAlert(detectionResult);

        // Play alert sound
        this.playAlertSound();

        // Log to analytics
        this.logFallIncident(detectionResult);
    }

    updateFallStatus(status, detectionResult = null) {
        const statusEl = document.getElementById('fallStatus');
        const lastEl = document.getElementById('lastFallCheck');
        const confidenceEl = document.getElementById('fallConfidence');

        if (statusEl) {
            statusEl.className = `fall-status ${status}`;
            const statusText = statusEl.querySelector('.status-text') || statusEl;
            if (statusText) {
                statusText.textContent = status === 'detected' 
                    ? '🚨 FALL DETECTED!' 
                    : status === 'monitoring' 
                    ? 'Monitoring...' 
                    : 'Not Active';
            }
        }

        if (lastEl) {
            lastEl.textContent = detectionResult 
                ? new Date(detectionResult.timestamp).toLocaleTimeString()
                : 'Never';
        }

        if (confidenceEl && detectionResult) {
            confidenceEl.textContent = `${(detectionResult.confidence * 100).toFixed(1)}%`;
        }

        // Update dashboard function if available
        if (window.updateFallDetection) {
            window.updateFallDetection(
                status,
                detectionResult ? new Date(detectionResult.timestamp).toLocaleString() : 'Never'
            );
        }
    }

    updateMonitoringStatus(isMonitoring) {
        const monitoringBtn = document.getElementById('startFallMonitoring');
        const statusIndicator = document.getElementById('fallMonitoringStatus');

        if (monitoringBtn) {
            monitoringBtn.innerHTML = isMonitoring
                ? '<i data-lucide="square"></i> Stop Monitoring'
                : '<i data-lucide="play"></i> Start Monitoring';
            lucide.createIcons();
        }

        if (statusIndicator) {
            statusIndicator.innerHTML = isMonitoring
                ? '<i data-lucide="activity" class="status-icon active"></i> Monitoring Active'
                : '<i data-lucide="square" class="status-icon"></i> Not Monitoring';
            lucide.createIcons();
        }

        this.updateFallStatus(isMonitoring ? 'monitoring' : 'inactive');
    }

    updateSensorDisplay(sensorData) {
        const sensorDisplay = document.getElementById('sensorDisplay');
        if (!sensorDisplay) return;

        const magnitude = Math.sqrt(
            sensorData.accel_x ** 2 +
            sensorData.accel_y ** 2 +
            sensorData.accel_z ** 2
        ).toFixed(2);

        sensorDisplay.innerHTML = `
            <div class="sensor-values">
                <div class="sensor-value">
                    <label>X:</label>
                    <span>${sensorData.accel_x.toFixed(2)}</span>
                </div>
                <div class="sensor-value">
                    <label>Y:</label>
                    <span>${sensorData.accel_y.toFixed(2)}</span>
                </div>
                <div class="sensor-value">
                    <label>Z:</label>
                    <span>${sensorData.accel_z.toFixed(2)}</span>
                </div>
                <div class="sensor-value">
                    <label>Magnitude:</label>
                    <span class="${magnitude > 12 ? 'warning' : ''}">${magnitude}</span>
                </div>
            </div>
        `;
    }

    showEmergencyAlert(detectionResult) {
        // Trigger emergency modal
        const emergencyModal = document.getElementById('emergencyModal');
        if (emergencyModal) {
            emergencyModal.classList.add('active');
            
            // Update emergency message
            const emergencyMsg = document.getElementById('emergencyMessage');
            if (emergencyMsg) {
                emergencyMsg.textContent = `Fall detected with ${(detectionResult.confidence * 100).toFixed(1)}% confidence. Immediate assistance required!`;
            }

            // Start countdown
            if (window.startCountdown) {
                window.startCountdown();
            }
        } else {
            // Fallback: show alert
            alert(`🚨 FALL DETECTED!\n\nConfidence: ${(detectionResult.confidence * 100).toFixed(1)}%\n\nEmergency services will be notified if not acknowledged.`);
        }
    }

    playAlertSound() {
        // Play alert sound
        const audio = new Audio('assets/audio/emergency_alert.wav');
        audio.volume = 1.0;
        audio.play().catch(e => {
            console.log('Could not play alert sound:', e);
            // Use system beep as fallback
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        });
    }

    logFallIncident(detectionResult) {
        // Log to analytics
        console.log('Fall incident logged:', detectionResult);
        
        // Could also send to analytics endpoint
        // fetch(API_ENDPOINTS.analyticsPatterns, ...)
    }


    getFallHistory() {
        return this.fallHistory;
    }

    getLastDetection() {
        return this.lastDetection;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `message message-${type} fade-in-up`;
        notification.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i> ${message}`;
        
        const container = document.querySelector('.dashboard-container') || document.body;
        container.insertBefore(notification, container.firstChild);
        
        lucide.createIcons();
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Global instance
const fallDetectionManager = new FallDetectionManager();
window.fallDetectionManager = fallDetectionManager;

