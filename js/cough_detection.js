// ============================================
// COUGH DETECTION MODULE
// ============================================

(function(){
    let mediaStream = null;
    let mediaRecorder = null;
    let chunks = [];
    let monitorInterval = null;
    let isActive = false;

    function log(msg){ try{ console.log(msg); }catch(e){} }

    async function initMicrophone() {
        if (mediaStream) return mediaStream;
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return mediaStream;
        } catch (e) {
            console.warn('Cough detection microphone denied', e);
            return null;
        }
    }

    async function startMonitoring() {
        if (isActive) return;
        const stream = await initMicrophone();
        if (!stream) return;

        const options = getRecorderOptions();
        mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        mediaRecorder.onstop = onClipReady;

        isActive = true;
        scheduleNextClip();
        updateUI(true);
        log('✅ Cough detection monitoring started');
    }

    function stopMonitoring() {
        isActive = false;
        if (monitorInterval) { clearTimeout(monitorInterval); monitorInterval = null; }
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            try { mediaRecorder.stop(); } catch(e){}
        }
        updateUI(false);
        log('⚠️ Cough detection monitoring stopped');
    }

    function getRecorderOptions() {
        const types = [
            { mimeType: 'audio/webm;codecs=opus' },
            { mimeType: 'audio/webm' },
            { mimeType: '' }
        ];
        for (const t of types) {
            if (!t.mimeType || MediaRecorder.isTypeSupported(t.mimeType)) return t;
        }
        return {};
    }

    function scheduleNextClip() {
        if (!isActive) return;
        // Record a short 2s clip every 10s
        startClip(2000);
        monitorInterval = setTimeout(scheduleNextClip, 10000);
    }

    function startClip(durationMs) {
        try {
            chunks = [];
            mediaRecorder.start();
            setTimeout(() => {
                try { mediaRecorder.stop(); } catch(e){}
            }, durationMs);
        } catch (e) {
            console.warn('MediaRecorder start failed', e);
        }
    }

    function onClipReady() {
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: chunks[0].type || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result; // data:... base64
            sendForDetection(base64);
        };
        reader.readAsDataURL(blob);
        chunks = [];
    }

    async function sendForDetection(dataUrl) {
        try {
            const res = await fetch(API_ENDPOINTS.detectCough, {
                method: 'POST',
                ...FETCH_OPTIONS,
                body: JSON.stringify({ user_id: '1', audio_data: dataUrl })
            });
            if (!res.ok) return;
            const data = await res.json();
            const result = data.cough_detection;
            if (result && result.detected) {
                onCoughDetected(result);
            }
        } catch (e) {
            console.warn('Cough detection API failed', e);
        }
    }

    function onCoughDetected(result) {
        try {
            const countEl = document.getElementById('coughCount');
            const lastEl = document.getElementById('lastCough');
            if (countEl) {
                const current = parseInt(countEl.textContent || '0', 10) || 0;
                countEl.textContent = String(current + (result.frequency || 1));
            }
            if (lastEl) {
                lastEl.textContent = new Date(result.timestamp || Date.now()).toLocaleTimeString();
            }
            // Optional: small chime
            if (navigator.vibrate) navigator.vibrate(100);
        } catch (e) {}
    }

    function updateUI(active) {
        const statusEl = document.getElementById('coughStatus');
        if (!statusEl) return;
        const text = statusEl.querySelector('.detection-text') || statusEl;
        if (text) text.textContent = active ? 'Monitoring...' : 'Inactive';
    }

    // Manual control only
    document.addEventListener('DOMContentLoaded', () => {
        // Add manual control buttons
        const coughCard = document.querySelector('.detection-card');
        if (coughCard) {
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'detection-controls';
            controlsDiv.innerHTML = `
                <button class="btn-primary" id="startCoughBtn">
                    <i data-lucide="play"></i> Start Monitoring
                </button>
                <button class="btn-secondary hidden" id="stopCoughBtn">
                    <i data-lucide="square"></i> Stop
                </button>
            `;
            coughCard.appendChild(controlsDiv);

            // Add button listeners
            const startBtn = document.getElementById('startCoughBtn');
            const stopBtn = document.getElementById('stopCoughBtn');
            
            startBtn.addEventListener('click', () => {
                startMonitoring();
                startBtn.classList.add('hidden');
                stopBtn.classList.remove('hidden');
            });
            
            stopBtn.addEventListener('click', () => {
                stopMonitoring();
                stopBtn.classList.add('hidden');
                startBtn.classList.remove('hidden');
            });

            // Initialize status
            const statusText = document.querySelector('#coughStatus .detection-text');
            if (statusText) statusText.textContent = 'Click Start to begin monitoring';
        }
    });

    // expose for manual control
    window.coughDetection = { start: startMonitoring, stop: stopMonitoring };
})();


