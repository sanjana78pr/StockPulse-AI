
import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_tests():
    print("--- Testing Stock Endpoints ---")
    
    # 1. Register User
    print("1. Registering User...")
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "stock_tester@example.com",
        "username": "stock_tester",
        "password": "password123",
        "full_name": "Stock Tester"
    })
    if resp.status_code not in (201, 409, 400):
        print(f"Failed to register: {resp.text}")
        sys.exit(1)
        
    # 2. Login
    print("2. Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "stock_tester@example.com",
        "password": "password123"
    })
    if resp.status_code != 200:
        print(f"Failed to login: {resp.text}")
        sys.exit(1)
    
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")
    
    # 3. Create Stock
    print("\n3. POST /stocks - Create a new stock")
    stock_data = {
        "symbol": "TSLA",
        "company_name": "Tesla Inc",
        "sector": "Consumer Cyclical",
        "industry": "Auto Manufacturers",
        "exchange": "NASDAQ",
        "current_price": 250.50,
        "market_cap": 800000000000
    }
    resp = requests.post(f"{BASE_URL}/stocks/", json=stock_data, headers=headers)
    if resp.status_code == 201:
        print("Success: Stock created.")
        stock = resp.json()
    elif resp.status_code == 409:
        print("Stock already exists, fetching it instead.")
        resp = requests.get(f"{BASE_URL}/stocks/symbol/TSLA", headers=headers)
        stock = resp.json()
    else:
        print(f"Failed to create stock: {resp.text}")
        sys.exit(1)
        
    stock_id = stock["id"]
    
    # 4. GET /stocks (List)
    print("\n4. GET /stocks - List stocks")
    resp = requests.get(f"{BASE_URL}/stocks/?page=1&page_size=10&sort_by=symbol", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success: Found {data['total']} stocks.")
    else:
        print(f"Failed to list stocks: {resp.text}")
        sys.exit(1)
        
    # 5. GET /stocks/{id}
    print(f"\n5. GET /stocks/{stock_id}")
    resp = requests.get(f"{BASE_URL}/stocks/{stock_id}", headers=headers)
    if resp.status_code == 200:
        print(f"Success: Retrieved stock by ID ({resp.json()['symbol']})")
    else:
        print(f"Failed to get stock by ID: {resp.text}")
        sys.exit(1)
        
    # 6. GET /stocks/symbol/{symbol}
    print("\n6. GET /stocks/symbol/TSLA")
    resp = requests.get(f"{BASE_URL}/stocks/symbol/TSLA", headers=headers)
    if resp.status_code == 200:
        print(f"Success: Retrieved stock by symbol ({resp.json()['company_name']})")
    else:
        print(f"Failed to get stock by symbol: {resp.text}")
        sys.exit(1)
        
    # 7. PUT /stocks/{id}
    print(f"\n7. PUT /stocks/{stock_id}")
    update_data = {"current_price": 260.00}
    resp = requests.put(f"{BASE_URL}/stocks/{stock_id}", json=update_data, headers=headers)
    if resp.status_code == 200:
        print(f"Success: Updated stock price to {resp.json()['current_price']}")
    else:
        print(f"Failed to update stock: {resp.text}")
        sys.exit(1)
        
    # 8. DELETE /stocks/{id}
    print(f"\n8. DELETE /stocks/{stock_id}")
    resp = requests.delete(f"{BASE_URL}/stocks/{stock_id}", headers=headers)
    if resp.status_code == 200:
        print("Success: Stock deleted.")
    else:
        print(f"Failed to delete stock: {resp.text}")
        sys.exit(1)
        
    print("\n[OK] All endpoints tested successfully!")

if __name__ == "__main__":
    run_tests()
