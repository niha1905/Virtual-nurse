/* ============================================
   API CONFIGURATION
   ============================================ */

// Backend API Base URL
const API_BASE_URL = 'http://127.0.0.1:5000';

// Gemini API Configuration
// The API key should be injected by the server during initialization
// This will be populated dynamically when the application starts
window.GEMINI_API_KEY = null;

// Google OAuth2 Configuration
const GOOGLE_CONFIG = {
    client_id: '52502923312-d6q98n8lohulrqfrnihjtge8j23mpngj.apps.googleusercontent.com',
    scopes: 'email profile https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.blood_glucose.read https://www.googleapis.com/auth/fitness.blood_pressure.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.oxygen_saturation.read https://www.googleapis.com/auth/fitness.temperature.read',
    redirect_uri: `${API_BASE_URL}/api/auth/google/callback`
};
window.GOOGLE_CONFIG = GOOGLE_CONFIG;

// API Endpoints
const API_ENDPOINTS = {
    voice: `${API_BASE_URL}/api/voice`,
    respond: `${API_BASE_URL}/api/respond`,
    vitals: `${API_BASE_URL}/api/vitals`,
    vitalsUpdate: `${API_BASE_URL}/api/vitals/update`,
    alerts: `${API_BASE_URL}/api/alerts`,
    alertsAcknowledge: `${API_BASE_URL}/api/alerts/acknowledge`,
    alertsEscalate: `${API_BASE_URL}/api/alerts/escalate`,
    alertsEmergency: `${API_BASE_URL}/api/alerts/emergency`,
    reminders: `${API_BASE_URL}/api/reminders`,
    remindersCreate: `${API_BASE_URL}/api/reminders/create`,
    remindersTaken: `${API_BASE_URL}/api/reminders/taken`,
    // Doctor dashboard endpoints
    patients: `${API_BASE_URL}/api/patients`,
    patientDetail: `${API_BASE_URL}/api/patients`, // use ?patient_id=ID
    reports: `${API_BASE_URL}/api/reports`,
    reportsCreate: `${API_BASE_URL}/api/reports/create`,
    reportsShare: `${API_BASE_URL}/api/reports/share`,
    authLogin: `${API_BASE_URL}/api/auth/login`,
    authLogout: `${API_BASE_URL}/api/auth/logout`,
    authSession: `${API_BASE_URL}/api/auth/session`,
    authRegister: `${API_BASE_URL}/api/auth/register`,
    predictHealthRisk: `${API_BASE_URL}/api/predict/health-risk`,
    // New endpoints
    summaryMorning: `${API_BASE_URL}/api/summary/morning`,
    summaryEvening: `${API_BASE_URL}/api/summary/evening`,
    analytics: `${API_BASE_URL}/api/analytics`,
    analyticsPatterns: `${API_BASE_URL}/api/analytics/patterns`,
    analyticsVisualization: `${API_BASE_URL}/api/analytics/visualization`,
    healthSync: `${API_BASE_URL}/api/health/sync`,
    healthRetrieve: `${API_BASE_URL}/api/health/retrieve`,
    healthAuthenticate: `${API_BASE_URL}/api/health/authenticate`,
    speakerRegister: `${API_BASE_URL}/api/speaker/register`,
    speakerIdentify: `${API_BASE_URL}/api/speaker/identify`,
    context: `${API_BASE_URL}/api/context`,
    detectFall: `${API_BASE_URL}/api/detect/fall`,
    detectCough: `${API_BASE_URL}/api/detect/cough`
};

// Fetch Options with credentials and dynamic Authorization header
function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    try {
        const raw = localStorage.getItem('user_session');
        if (raw) {
            const session = JSON.parse(raw);
            if (session && session.token) {
                headers['Authorization'] = `Bearer ${session.token}`;
            }
        }
    } catch (e) { /* ignore */ }
    return headers;
}

const FETCH_OPTIONS = {
    credentials: 'include',
    get headers() { return getAuthHeaders(); }
};
