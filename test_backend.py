"""
Test Script for Virtual Nurse AI Backend
Run this to test if everything is working
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_endpoint(name, method, endpoint, data=None, check_html=False):
    """Test a single endpoint"""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"{'='*60}")
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url)
        else:
            response = requests.post(url, json=data)
        
        print(f"Status Code: {response.status_code}")
        
        if check_html:
            print(f"Response: {response.text[:100]}...") # Print first 100 chars of HTML
        else:
            print(f"Response:")
            print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("✅ PASS")
        else:
            print("⚠️  WARNING")
        
        return True
    except Exception as e:
        print(f"❌ FAIL: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("🧪 Virtual Nurse AI - Backend Test Suite")
    print("="*60)
    print("\n⚠️  Make sure the backend server is running!")
    print("   Run: python backend_template.py")
    print("\nPress Enter to start tests...")
    input()

    # Test 0: Index page
    test_endpoint(
        "Index Page",
        "GET",
        "/",
        check_html=True
    )

    # Test 0.1: Patient page
    test_endpoint(
        "Patient Page",
        "GET",
        "/patient",
        check_html=True
    )

    # Test 0.2: Doctor page
    test_endpoint(
        "Doctor Page",
        "GET",
        "/doctor",
        check_html=True
    )

    # Test 0.3: Caretaker page
    test_endpoint(
        "Caretaker Page",
        "GET",
        "/caretaker",
        check_html=True
    )
    
    # Test 1: Voice Processing
    test_endpoint(
        "Voice Processing",
        "POST",
        "/api/voice",
        {"text": "Hello, I have a headache"}
    )
    
    # Test 2: Get Vitals
    test_endpoint(
        "Get Patient Vitals",
        "GET",
        "/api/vitals?patient_id=1"
    )
    
    # Test 3: Get Alerts
    test_endpoint(
        "Get Alerts",
        "GET",
        "/api/alerts"
    )
    
    # Test 4: Get Reminders
    test_endpoint(
        "Get Reminders",
        "GET",
        "/api/reminders?patient_id=1"
    )
    
    # Test 5: Health Risk Prediction
    test_endpoint(
        "Health Risk Prediction",
        "POST",
        "/api/predict/health-risk",
        {"patient_id": "1"}
    )
    
    # Test 6: Authentication Session
    test_endpoint(
        "Check Auth Session",
        "GET",
        "/api/auth/session"
    )
    
    print("\n" + "="*60)
    print("✅ Test Suite Complete!")
    print("="*60)

if __name__ == "__main__":
    main()
