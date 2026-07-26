import requests
import sys
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    print("--- Testing Historical Prices Endpoints ---")
    
    # 1. Login
    print("1. Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "stock_tester@example.com",
        "password": "password123"
    })
    if resp.status_code != 200:
        print("Creating user since login failed...")
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": "stock_tester@example.com",
            "username": "stock_tester",
            "password": "password123",
            "full_name": "Stock Tester"
        })
        resp = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "stock_tester@example.com",
            "password": "password123"
        })
        if resp.status_code != 200:
            print(f"Failed to login: {resp.text}")
            sys.exit(1)
            
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a stock if doesn't exist
    requests.post(f"{BASE_URL}/stocks/", json={
        "symbol": "TSLA",
        "company_name": "Tesla Inc",
        "sector": "Auto",
        "industry": "Auto",
        "exchange": "NASDAQ",
        "current_price": 250.0,
        "market_cap": 800000000000
    }, headers=headers)
    
    # 2. POST /historical-prices
    print("\n2. POST /historical-prices")
    now = datetime.utcnow()
    price_data = {
        "symbol": "TSLA",
        "date": now.isoformat() + "Z",
        "open_price": 250.0,
        "high_price": 260.0,
        "low_price": 240.0,
        "close_price": 255.0,
        "adjusted_close": 255.0,
        "volume": 100000,
        "source": "manual",
        "interval": "1d"
    }
    resp = requests.post(f"{BASE_URL}/historical-prices/", json=price_data, headers=headers)
    if resp.status_code == 201:
        print("Success: Record created.")
        price_id = resp.json()["id"]
    elif resp.status_code == 409:
        print("Record already exists. Fetching it...")
        r = requests.get(f"{BASE_URL}/historical-prices/symbol/TSLA", headers=headers)
        price_id = r.json()["data"][0]["id"]
    else:
        print(f"Failed: {resp.text}")
        sys.exit(1)
        
    # 3. Test Bulk Insert
    print("\n3. POST /historical-prices/bulk")
    bulk_data = [
        {
            "symbol": "TSLA",
            "date": (now - timedelta(days=1)).isoformat() + "Z",
            "open_price": 240.0,
            "high_price": 250.0,
            "low_price": 235.0,
            "close_price": 248.0,
            "adjusted_close": 248.0,
            "volume": 80000,
            "interval": "1d"
        },
        {
            "symbol": "TSLA",
            "date": (now - timedelta(days=1)).isoformat() + "Z", # Duplicate!
            "open_price": 240.0,
            "high_price": 250.0,
            "low_price": 235.0,
            "close_price": 248.0,
            "adjusted_close": 248.0,
            "volume": 80000,
            "interval": "1d"
        }
    ]
    resp = requests.post(f"{BASE_URL}/historical-prices/bulk", json=bulk_data, headers=headers)
    if resp.status_code == 201:
        print(f"Bulk insert success: {resp.json()}")
    else:
        print(f"Bulk insert failed: {resp.text}")
        sys.exit(1)
        
    # 4. GET /historical-prices/symbol/{symbol}/range
    print("\n4. GET /historical-prices/symbol/TSLA/range")
    start = (now - timedelta(days=5)).isoformat() + "Z"
    end = now.isoformat() + "Z"
    resp = requests.get(f"{BASE_URL}/historical-prices/symbol/TSLA/range?start_date={start}&end_date={end}&interval=1d", headers=headers)
    if resp.status_code == 200:
        print(f"Success: Found {resp.json()['total']} records in range.")
    else:
        print(f"Range failed: {resp.text}")
        sys.exit(1)
        
    # 5. Validation Check (High Level)
    print("\n5. Testing validation (high level)")
    bad_data = price_data.copy()
    bad_data["high_price"] = 10.0  # Lower than open
    bad_data["date"] = (now - timedelta(days=10)).isoformat() + "Z"
    resp = requests.post(f"{BASE_URL}/historical-prices/?validation_level=high", json=bad_data, headers=headers)
    if resp.status_code == 400:
        print("Success: Caught validation error properly.")
    else:
        print(f"Failed: Should have been 400 Bad Request, got {resp.status_code}")
        sys.exit(1)

    print("\nAll historical data endpoints tested successfully!")

if __name__ == "__main__":
    run_tests()
