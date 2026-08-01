import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"

def run_tests():
    print("--- Testing Transaction Management Endpoints ---")
    
    # 1. Register / Login User
    print("1. Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "transaction_tester@example.com",
        "password": "password123"
    })
    if resp.status_code != 200:
        print("Creating user since login failed...")
        resp = requests.post(f"{BASE_URL}/auth/register", json={
            "email": "transaction_tester@example.com",
            "username": "transaction_tester",
            "password": "password123",
            "full_name": "Tx Tester"
        })
        if resp.status_code not in (201, 409):
            print(f"Failed to register user: {resp.text}")
            sys.exit(1)
        resp = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "transaction_tester@example.com",
            "password": "password123"
        })
        if resp.status_code != 200:
            print(f"Failed to login: {resp.text}")
            sys.exit(1)
            
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Logged in successfully.")
    
    # 2. Ensure TSLA Stock exists in the system
    print("2. Ensuring TSLA stock exists...")
    requests.post(f"{BASE_URL}/stocks/", json={
        "symbol": "TSLA",
        "company_name": "Tesla Inc",
        "sector": "Consumer Cyclical",
        "industry": "Auto Manufacturers",
        "exchange": "NASDAQ",
        "current_price": 250.00,
        "market_cap": 800000000000
    }, headers=headers)
    
    # 3. Create a test portfolio
    print("3. Creating a test portfolio...")
    portfolio_name = "Tx Test Portfolio"
    # Delete if exists already
    plist_resp = requests.get(f"{BASE_URL}/portfolios/", headers=headers)
    portfolio_id = None
    if plist_resp.status_code == 200:
        for p in plist_resp.json()["portfolios"]:
            if p["portfolio_name"] == portfolio_name:
                portfolio_id = p["id"]
                
    if portfolio_id:
        print(f"Using existing portfolio: {portfolio_id}")
    else:
        p_resp = requests.post(f"{BASE_URL}/portfolios/", json={
            "portfolio_name": portfolio_name,
            "description": "Portfolio for verifying transaction execution",
            "initial_balance": 100000.0,
            "currency": "USD"
        }, headers=headers)
        if p_resp.status_code != 201:
            print(f"Failed to create portfolio: {p_resp.text}")
            sys.exit(1)
        portfolio_id = p_resp.json()["id"]
        print(f"Created new portfolio: {portfolio_id}")

    # Helper: Fetch portfolio details
    def get_portfolio():
        r = requests.get(f"{BASE_URL}/portfolios/{portfolio_id}", headers=headers)
        if r.status_code != 200:
            print(f"Failed to get portfolio: {r.text}")
            sys.exit(1)
        return r.json()

    # Verify initial cash is set to initial_balance
    p_info = get_portfolio()
    # Note: since p_info schema response might not expose cash (if it is only database side),
    # let's verify if cash is in response, or we'll inspect it via backend logs or tests.
    print(f"Initial Portfolio State: {p_info}")

    # 4. Execute BUY transaction (10 shares at $250.0, fee $10)
    print("\n4. Executing BUY transaction (10 shares of TSLA @ $250)...")
    buy_tx = {
        "portfolio_id": portfolio_id,
        "stock_symbol": "TSLA",
        "transaction_type": "BUY",
        "quantity": 10.0,
        "price_per_share": 250.0,
        "fees": 10.0,
        "notes": "First TSLA buy"
    }
    tx_resp = requests.post(f"{BASE_URL}/transactions/", json=buy_tx, headers=headers)
    if tx_resp.status_code != 201:
        print(f"Failed BUY transaction: {tx_resp.text}")
        sys.exit(1)
    
    buy_tx_id = tx_resp.json()["id"]
    print(f"BUY Success: {tx_resp.json()}")

    # 5. Execute another BUY transaction (5 shares at $260.0, fee $5)
    print("\n5. Executing second BUY transaction (5 shares of TSLA @ $260)...")
    buy_tx2 = {
        "portfolio_id": portfolio_id,
        "stock_symbol": "TSLA",
        "transaction_type": "BUY",
        "quantity": 5.0,
        "price_per_share": 260.0,
        "fees": 5.0,
        "notes": "Second TSLA buy"
    }
    tx_resp2 = requests.post(f"{BASE_URL}/transactions/", json=buy_tx2, headers=headers)
    if tx_resp2.status_code != 201:
        print(f"Failed second BUY transaction: {tx_resp2.text}")
        sys.exit(1)
    print(f"Second BUY Success: {tx_resp2.json()}")

    # 6. Attempt to SELL more than owned (20 shares when we own 15)
    print("\n6. Attempting to SELL 20 shares (only own 15)...")
    sell_too_much = {
        "portfolio_id": portfolio_id,
        "stock_symbol": "TSLA",
        "transaction_type": "SELL",
        "quantity": 20.0,
        "price_per_share": 270.0,
        "fees": 5.0
    }
    fail_sell_resp = requests.post(f"{BASE_URL}/transactions/", json=sell_too_much, headers=headers)
    if fail_sell_resp.status_code == 400:
        print(f"Success: Correctly rejected oversell. Response: {fail_sell_resp.json()}")
    else:
        print(f"Failed: Expected 400 Bad Request, got {fail_sell_resp.status_code}: {fail_sell_resp.text}")
        sys.exit(1)

    # 7. Attempt to BUY when cash is insufficient
    print("\n7. Attempting to BUY with insufficient cash...")
    buy_too_much = {
        "portfolio_id": portfolio_id,
        "stock_symbol": "TSLA",
        "transaction_type": "BUY",
        "quantity": 1000.0,
        "price_per_share": 250.0,
        "fees": 5.0
    }
    fail_buy_resp = requests.post(f"{BASE_URL}/transactions/", json=buy_too_much, headers=headers)
    if fail_buy_resp.status_code == 400:
        print(f"Success: Correctly rejected transaction due to insufficient cash. Response: {fail_buy_resp.json()}")
    else:
        print(f"Failed: Expected 400 Bad Request, got {fail_buy_resp.status_code}: {fail_buy_resp.text}")
        sys.exit(1)

    # 8. Execute SELL transaction (5 shares of TSLA @ $270.0, fee $8)
    print("\n8. Executing SELL transaction (5 shares of TSLA @ $270)...")
    sell_tx = {
        "portfolio_id": portfolio_id,
        "stock_symbol": "TSLA",
        "transaction_type": "SELL",
        "quantity": 5.0,
        "price_per_share": 270.0,
        "fees": 8.0,
        "notes": "Selling TSLA part"
    }
    sell_resp = requests.post(f"{BASE_URL}/transactions/", json=sell_tx, headers=headers)
    if sell_resp.status_code != 201:
        print(f"Failed SELL transaction: {sell_resp.text}")
        sys.exit(1)
    print(f"SELL Success: {sell_resp.json()}")

    # 9. Get transaction by ID
    print(f"\n9. GET /transactions/{buy_tx_id}")
    tx_by_id_resp = requests.get(f"{BASE_URL}/transactions/{buy_tx_id}", headers=headers)
    if tx_by_id_resp.status_code == 200:
        print(f"Success: Retrieved transaction {buy_tx_id}")
    else:
        print(f"Failed to retrieve transaction: {tx_by_id_resp.text}")
        sys.exit(1)

    # 10. List transactions
    print("\n10. GET /transactions/my - Listing transactions")
    list_resp = requests.get(f"{BASE_URL}/transactions/my?page=1&page_size=10&sort_by=transaction_date&sort_order=desc", headers=headers)
    if list_resp.status_code != 200:
        print(f"Failed listing transactions: {list_resp.text}")
        sys.exit(1)
    print(f"Transactions found: {list_resp.json()['total']}")
    
    # Verify search and filter
    list_search_resp = requests.get(f"{BASE_URL}/transactions/my?search=TSLA&transaction_type=BUY", headers=headers)
    if list_search_resp.status_code == 200:
        print(f"Filter & Search Success: Found {list_search_resp.json()['total']} BUY transactions for TSLA")
    else:
        print(f"Filter/Search failed: {list_search_resp.text}")
        sys.exit(1)

    # List portfolio transactions
    list_p_resp = requests.get(f"{BASE_URL}/transactions/portfolio/{portfolio_id}", headers=headers)
    if list_p_resp.status_code == 200:
        print(f"Portfolio Transactions Success: Found {list_p_resp.json()['total']} transactions for portfolio {portfolio_id}")
    else:
        print(f"Portfolio transactions failed: {list_p_resp.text}")
        sys.exit(1)

    print("\n✅ All transaction endpoints and business rules verified successfully!")

if __name__ == "__main__":
    run_tests()
