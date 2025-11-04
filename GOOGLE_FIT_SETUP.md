# Google Fit API Integration Setup

## Overview

The Virtual Nurse AI system now includes full Google Fit API integration for syncing health data (vitals, activity, steps) and retrieving historical wellness metrics.

## Prerequisites

1. **Google Cloud Project**: Already configured with project ID `healthmonitoring-1eab0`
2. **Credentials File**: `client_secret_52502923312-d6q98n8lohulrqfrnihjtge8j23mpngj.apps.googleusercontent.com.json`
3. **Python Libraries**: Install required packages

## Installation

### 1. Install Required Python Packages

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

Or add to `requirements.txt` and install:
```bash
pip install -r requirements.txt
```

### 2. Enable Google Fit API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `healthmonitoring-1eab0`
3. Navigate to **APIs & Services** → **Library**
4. Search for "Google Fit API"
5. Click **Enable**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Configure the consent screen:
   - User Type: Internal (for organization) or External (for public)
   - App name: Virtual Nurse AI
   - User support email: Your email
   - Scopes: The following scopes are used:
     - `https://www.googleapis.com/auth/fitness.activity.read`
     - `https://www.googleapis.com/auth/fitness.activity.write`
     - `https://www.googleapis.com/auth/fitness.heart_rate.read`
     - `https://www.googleapis.com/auth/fitness.heart_rate.write`
     - `https://www.googleapis.com/auth/fitness.body.read`
     - `https://www.googleapis.com/auth/fitness.body.write`

## Authentication Flow

### First Time Authentication

When you first call the sync endpoint, the system will:

1. Check for existing authentication token
2. If no token exists, open a browser window for OAuth2 authentication
3. User authorizes the application
4. Token is saved to `data/google_fit_token.pickle` (or per-user token files)
5. Subsequent requests use the saved token

### API Endpoints

#### Authenticate
```bash
POST /api/health/authenticate
{
    "user_id": "1"
}
```

#### Sync Vitals
```bash
POST /api/health/sync
{
    "user_id": "1",
    "data_type": "vitals"
}
```

#### Sync Activity
```bash
POST /api/health/sync
{
    "user_id": "1",
    "data_type": "activity",
    "activity": {
        "steps": 5000,
        "activity_type": "walking",
        "duration": 3600
    }
}
```

#### Retrieve Data
```bash
GET /api/health/retrieve?user_id=1&data_type=vitals&days=30
```

## Data Types Synced

### Vitals
- **Heart Rate**: Synced to Google Fit heart rate data source
- **Body Temperature**: Synced to Google Fit body temperature (if supported)
- **Oxygen Saturation**: Stored locally (not a standard Google Fit metric)

### Activity
- **Steps**: Synced to Google Fit step count
- **Activity Segments**: Exercise/activity types synced to Google Fit

## Token Management

- Tokens are stored in `data/google_fit_token.pickle` (or per-user: `data/google_fit_token_{user_id}.pickle`)
- Tokens automatically refresh when expired
- Tokens are user-specific for multi-user support

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Solution**: 
1. Check OAuth consent screen is configured
2. Ensure all required scopes are added
3. Verify redirect URI matches: `http://localhost`

### Error: "Google API libraries not available"

**Solution**: Install required packages:
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### Error: "Credentials file not found"

**Solution**: Ensure `client_secret_52502923312-d6q98n8lohulrqfrnihjtge8j23mpngj.apps.googleusercontent.com.json` is in the project root directory

### Authentication Window Doesn't Open

**Solution**: 
1. Check if browser is blocked
2. Manually navigate to the URL shown in console
3. Copy the authorization code from redirect URL

## Security Notes

- **Credentials File**: Keep `client_secret_*.json` secure and never commit to public repositories
- **Token Files**: Token files contain sensitive access tokens - keep them secure
- **Production**: Use environment variables for credentials in production
- **HTTPS**: Use HTTPS in production for OAuth redirects

## Testing

1. Start the backend server:
```bash
python backend_template.py
```

2. Authenticate (first time):
```bash
curl -X POST http://127.0.0.1:5000/api/health/authenticate \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1"}'
```

3. Sync vitals:
```bash
curl -X POST http://127.0.0.1:5000/api/health/sync \
  -H "Content-Type: application/json" \
  -d '{"user_id": "1", "data_type": "vitals"}'
```

4. Check Google Fit app on your phone - you should see the synced data!

## Integration with System

The Google Fit integration automatically:
- Syncs vitals when updated via `/api/vitals/update`
- Stores activity data from the system
- Retrieves historical data for analytics
- Works seamlessly with the analytics engine

## Next Steps

1. ✅ Install Google API libraries
2. ✅ Enable Google Fit API in Cloud Console
3. ✅ Configure OAuth consent screen
4. ✅ Test authentication
5. ✅ Test data sync
6. ✅ Verify data in Google Fit app

## Support

For issues:
- Check Google Fit API documentation: https://developers.google.com/fit
- Review OAuth2 flow: https://developers.google.com/identity/protocols/oauth2
- Check error logs in backend console

