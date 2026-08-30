#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Chaudhary Tiles ERP
Tests all API endpoints with side-effects verification
"""

import requests
import json
from datetime import datetime

# Backend base URL
BASE_URL = "https://enterprise-dashboard-43.preview.emergentagent.com/api"

# Test results tracking
test_results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name):
    test_results["passed"].append(test_name)
    print(f"✅ PASS: {test_name}")

def log_fail(test_name, reason):
    test_results["failed"].append({"test": test_name, "reason": reason})
    print(f"❌ FAIL: {test_name}")
    print(f"   Reason: {reason}")

def log_warning(test_name, reason):
    test_results["warnings"].append({"test": test_name, "reason": reason})
    print(f"⚠️  WARNING: {test_name}: {reason}")

def today_str():
    return datetime.utcnow().strftime("%Y-%m-%d")

# Global variables to store test data
team_members = []
parties = []
stock_items = []
test_employee_id = None
test_party_name = None
test_stock_item_id = None

print("=" * 80)
print("CHAUDHARY TILES ERP - BACKEND API TEST SUITE")
print("=" * 80)
print(f"Backend URL: {BASE_URL}")
print(f"Test Date: {today_str()}")
print("=" * 80)

# ============================================================================
# TEST 1: AUTH & TEAM
# ============================================================================
print("\n[TEST 1] AUTH & TEAM ENDPOINTS")
print("-" * 80)

try:
    # 1.1 GET /api/team - should return 6 seeded members
    response = requests.get(f"{BASE_URL}/team", timeout=10)
    if response.status_code == 200:
        team_members = response.json()
        if len(team_members) == 6:
            log_pass("GET /api/team returns 6 seeded members")
        else:
            log_fail("GET /api/team member count", f"Expected 6, got {len(team_members)}")
    else:
        log_fail("GET /api/team", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/team", str(e))

# 1.2 POST /api/auth/login - valid credentials
try:
    if team_members:
        test_user = team_members[0]
        login_data = {"userId": test_user["id"], "pin": "1234"}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        if response.status_code == 200:
            user = response.json()
            if user["id"] == test_user["id"]:
                log_pass("POST /api/auth/login with valid credentials")
            else:
                log_fail("POST /api/auth/login response", "User ID mismatch")
        else:
            log_fail("POST /api/auth/login valid", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/auth/login valid", str(e))

# 1.3 POST /api/auth/login - wrong PIN
try:
    if team_members:
        login_data = {"userId": team_members[0]["id"], "pin": "9999"}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        if response.status_code == 401:
            log_pass("POST /api/auth/login with wrong PIN returns 401")
        else:
            log_fail("POST /api/auth/login wrong PIN", f"Expected 401, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/auth/login wrong PIN", str(e))

# 1.4 POST /api/auth/login - unknown user ID
try:
    login_data = {"userId": "unknown-user-id-12345", "pin": "1234"}
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
    if response.status_code == 404:
        log_pass("POST /api/auth/login with unknown ID returns 404")
    else:
        log_fail("POST /api/auth/login unknown ID", f"Expected 404, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/auth/login unknown ID", str(e))

# 1.5 POST /api/team - create new employee
try:
    new_employee = {
        "name": "Test Employee Kumar",
        "username": "testemployee",
        "password": "1234",
        "role": "Test Role",
        "plant": "Sipara Plant",
        "walletLimit": 1000,
        "permissions": {"dispatch": True, "production": True}
    }
    response = requests.post(f"{BASE_URL}/team", json=new_employee, timeout=10)
    if response.status_code == 200:
        created = response.json()
        if "id" in created and created["name"] == new_employee["name"]:
            test_employee_id = created["id"]
            log_pass("POST /api/team creates new employee")
        else:
            log_fail("POST /api/team response", "Missing id or name mismatch")
    else:
        log_fail("POST /api/team", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/team", str(e))

# 1.6 PUT /api/team/{tid} - update employee
try:
    if test_employee_id:
        update_data = {
            "name": "Test Employee Kumar Updated",
            "username": "testemployee",
            "password": "1234",
            "role": "Updated Role",
            "plant": "Sipara Plant",
            "walletLimit": 2000,
            "permissions": {"dispatch": True, "production": True}
        }
        response = requests.put(f"{BASE_URL}/team/{test_employee_id}", json=update_data, timeout=10)
        if response.status_code == 200:
            updated = response.json()
            if updated["name"] == update_data["name"] and updated["walletLimit"] == 2000:
                log_pass("PUT /api/team/{tid} updates employee")
            else:
                log_fail("PUT /api/team update", "Data not updated correctly")
        else:
            log_fail("PUT /api/team", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("PUT /api/team", str(e))

# 1.7 DELETE /api/team/{tid}
try:
    if test_employee_id:
        response = requests.delete(f"{BASE_URL}/team/{test_employee_id}", timeout=10)
        if response.status_code == 200:
            log_pass("DELETE /api/team/{tid} deletes employee")
        else:
            log_fail("DELETE /api/team", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("DELETE /api/team", str(e))

# ============================================================================
# TEST 2: PARTIES CRUD
# ============================================================================
print("\n[TEST 2] PARTIES CRUD")
print("-" * 80)

# 2.1 GET /api/parties - should return 4 seeded parties
try:
    response = requests.get(f"{BASE_URL}/parties", timeout=10)
    if response.status_code == 200:
        parties = response.json()
        if len(parties) == 4:
            log_pass("GET /api/parties returns 4 seeded parties")
        else:
            log_fail("GET /api/parties count", f"Expected 4, got {len(parties)}")
    else:
        log_fail("GET /api/parties", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/parties", str(e))

# 2.2 POST /api/parties - paymentType=Due should set dues to amount
try:
    new_party_due = {
        "date": today_str(),
        "name": "Test Party Due",
        "contact": "9999888877",
        "address": "Test Address",
        "rateText": "Test Rate",
        "status": "Under Working",
        "paymentType": "Due",
        "amount": 50000,
        "img": ""
    }
    response = requests.post(f"{BASE_URL}/parties", json=new_party_due, timeout=10)
    if response.status_code == 200:
        created = response.json()
        if created.get("dues") == 50000:
            test_party_name = created["name"]
            log_pass("POST /api/parties with paymentType=Due sets dues to amount")
        else:
            log_fail("POST /api/parties dues calc", f"Expected dues=50000, got {created.get('dues')}")
    else:
        log_fail("POST /api/parties Due", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/parties Due", str(e))

# 2.3 POST /api/parties - paymentType=Advance should set dues to 0
try:
    new_party_advance = {
        "date": today_str(),
        "name": "Test Party Advance",
        "contact": "9999777766",
        "address": "Test Address",
        "rateText": "Test Rate",
        "status": "Under Working",
        "paymentType": "Advance",
        "amount": 30000,
        "img": ""
    }
    response = requests.post(f"{BASE_URL}/parties", json=new_party_advance, timeout=10)
    if response.status_code == 200:
        created = response.json()
        if created.get("dues") == 0:
            log_pass("POST /api/parties with paymentType=Advance sets dues to 0")
        else:
            log_fail("POST /api/parties Advance dues", f"Expected dues=0, got {created.get('dues')}")
    else:
        log_fail("POST /api/parties Advance", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/parties Advance", str(e))

# 2.4 PUT /api/parties - update party
try:
    if parties:
        party_id = parties[0]["id"]
        update_data = {
            "date": parties[0]["date"],
            "name": parties[0]["name"],
            "contact": "9999999999",
            "address": parties[0]["address"],
            "rateText": parties[0]["rateText"],
            "status": parties[0]["status"],
            "paymentType": parties[0]["paymentType"],
            "amount": parties[0]["amount"],
            "img": ""
        }
        response = requests.put(f"{BASE_URL}/parties/{party_id}", json=update_data, timeout=10)
        if response.status_code == 200:
            log_pass("PUT /api/parties/{pid} updates party")
        else:
            log_fail("PUT /api/parties", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("PUT /api/parties", str(e))

# 2.5 DELETE /api/parties
try:
    # Delete the test party we created
    if parties:
        # Find test party
        test_party = next((p for p in parties if "Test Party" in p.get("name", "")), None)
        if not test_party:
            # Get fresh list
            response = requests.get(f"{BASE_URL}/parties", timeout=10)
            if response.status_code == 200:
                all_parties = response.json()
                test_party = next((p for p in all_parties if "Test Party" in p.get("name", "")), None)
        
        if test_party:
            response = requests.delete(f"{BASE_URL}/parties/{test_party['id']}", timeout=10)
            if response.status_code == 200:
                log_pass("DELETE /api/parties/{pid} deletes party")
            else:
                log_fail("DELETE /api/parties", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("DELETE /api/parties", str(e))

# ============================================================================
# TEST 3: RECEIPTS WITH SIDE-EFFECTS
# ============================================================================
print("\n[TEST 3] RECEIPTS WITH SIDE-EFFECTS")
print("-" * 80)

# Refresh team and parties data
try:
    response = requests.get(f"{BASE_URL}/team", timeout=10)
    if response.status_code == 200:
        team_members = response.json()
    response = requests.get(f"{BASE_URL}/parties", timeout=10)
    if response.status_code == 200:
        parties = response.json()
except:
    pass

# 3.1 POST /api/receipts with receiverType=Employee - should credit wallet
try:
    if team_members and parties:
        employee = team_members[1]  # Monu Kumar
        party = parties[0] if parties else {"name": "Test Party"}
        
        # Get initial wallet balance
        response = requests.get(f"{BASE_URL}/wallet/summary", timeout=10)
        initial_wallet = 0
        if response.status_code == 200:
            wallet_data = response.json()
            emp_wallet = next((w for w in wallet_data["balances"] if w["name"] == employee["name"]), None)
            if emp_wallet:
                initial_wallet = emp_wallet["calculatedWallet"]
        
        # Create receipt
        receipt_data = {
            "date": today_str(),
            "party": party["name"],
            "amount": 1000,
            "mode": "Cash",
            "receiverType": "Employee",
            "receiver": employee["name"],
            "remarks": "Test receipt for wallet credit"
        }
        response = requests.post(f"{BASE_URL}/receipts", json=receipt_data, timeout=10)
        if response.status_code == 200:
            created = response.json()
            
            # Verify srNo auto-generated
            if created.get("srNo") and created["srNo"].startswith("SR-"):
                log_pass("POST /api/receipts auto-generates srNo")
            else:
                log_fail("Receipt srNo generation", f"Invalid srNo: {created.get('srNo')}")
            
            # Check wallet increased
            response = requests.get(f"{BASE_URL}/wallet/summary", timeout=10)
            if response.status_code == 200:
                wallet_data = response.json()
                emp_wallet = next((w for w in wallet_data["balances"] if w["name"] == employee["name"]), None)
                if emp_wallet:
                    new_wallet = emp_wallet["calculatedWallet"]
                    if new_wallet == initial_wallet + 1000:
                        log_pass("POST /api/receipts with receiverType=Employee credits wallet by 1000")
                    else:
                        log_fail("Receipt wallet credit", f"Expected {initial_wallet + 1000}, got {new_wallet}")
        else:
            log_fail("POST /api/receipts Employee", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/receipts Employee", str(e))

# 3.2 POST /api/receipts with receiverType=Supplier - should create expense and reduce dues
try:
    if team_members and parties:
        party = parties[0] if parties else None
        if party:
            # Get initial dues
            initial_dues = party.get("dues", 0)
            
            # Get initial expense count
            response = requests.get(f"{BASE_URL}/expenses", timeout=10)
            initial_expense_count = 0
            if response.status_code == 200:
                initial_expense_count = len(response.json())
            
            # Create receipt
            receipt_data = {
                "date": today_str(),
                "party": party["name"],
                "amount": 5000,
                "mode": "UPI / Online",
                "receiverType": "Supplier / Creditor / Contractor",
                "receiver": "Test Supplier",
                "remarks": "Test supplier payment"
            }
            response = requests.post(f"{BASE_URL}/receipts", json=receipt_data, timeout=10)
            if response.status_code == 200:
                # Check expense created
                response = requests.get(f"{BASE_URL}/expenses", timeout=10)
                if response.status_code == 200:
                    expenses = response.json()
                    auto_expense = next((e for e in expenses if "Auto synced" in e.get("remarks", "")), None)
                    if auto_expense:
                        log_pass("POST /api/receipts with receiverType=Supplier creates auto expense")
                    else:
                        log_fail("Receipt auto expense", "No auto-synced expense found")
                
                # Check dues reduced
                response = requests.get(f"{BASE_URL}/parties", timeout=10)
                if response.status_code == 200:
                    updated_parties = response.json()
                    updated_party = next((p for p in updated_parties if p["name"] == party["name"]), None)
                    if updated_party:
                        new_dues = updated_party.get("dues", 0)
                        expected_dues = max(0, initial_dues - 5000)
                        if new_dues == expected_dues:
                            log_pass("POST /api/receipts reduces party dues correctly")
                        else:
                            log_fail("Receipt dues reduction", f"Expected {expected_dues}, got {new_dues}")
            else:
                log_fail("POST /api/receipts Supplier", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/receipts Supplier", str(e))

# 3.3 Verify notification created
try:
    response = requests.get(f"{BASE_URL}/notifications", timeout=10)
    if response.status_code == 200:
        notifications = response.json()
        receipt_notif = next((n for n in notifications if n.get("type") == "receipt"), None)
        if receipt_notif:
            log_pass("POST /api/receipts creates notification")
        else:
            log_warning("Receipt notification", "No receipt notification found")
    else:
        log_fail("GET /api/notifications", f"Status {response.status_code}")
except Exception as e:
    log_fail("GET /api/notifications", str(e))

# ============================================================================
# TEST 4: EXPENSES + TRANSFER + CATEGORIES
# ============================================================================
print("\n[TEST 4] EXPENSES + TRANSFER + CATEGORIES")
print("-" * 80)

# 4.1 POST /api/expenses
try:
    if team_members:
        expense_data = {
            "date": today_str(),
            "spentBy": team_members[0]["name"],
            "category": "Tea / Food / Office Misc",
            "amount": 500,
            "remarks": "Test expense",
            "paidTo": "",
            "status": "Approved"
        }
        response = requests.post(f"{BASE_URL}/expenses", json=expense_data, timeout=10)
        if response.status_code == 200:
            log_pass("POST /api/expenses creates expense")
        else:
            log_fail("POST /api/expenses", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/expenses", str(e))

# 4.2 POST /api/expenses/transfer - same person should return 400
try:
    if team_members:
        transfer_data = {
            "fromEmp": team_members[0]["name"],
            "toEmp": team_members[0]["name"],
            "amount": 1000,
            "note": "Test transfer"
        }
        response = requests.post(f"{BASE_URL}/expenses/transfer", json=transfer_data, timeout=10)
        if response.status_code == 400:
            log_pass("POST /api/expenses/transfer with same person returns 400")
        else:
            log_fail("Expense transfer same person", f"Expected 400, got {response.status_code}")
except Exception as e:
    log_fail("POST /api/expenses/transfer same person", str(e))

# 4.3 POST /api/expenses/transfer - valid transfer
try:
    if len(team_members) >= 2:
        transfer_data = {
            "fromEmp": team_members[0]["name"],
            "toEmp": team_members[1]["name"],
            "amount": 1000,
            "note": "Test valid transfer"
        }
        response = requests.post(f"{BASE_URL}/expenses/transfer", json=transfer_data, timeout=10)
        if response.status_code == 200:
            log_pass("POST /api/expenses/transfer with different persons succeeds")
        else:
            log_fail("POST /api/expenses/transfer valid", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/expenses/transfer valid", str(e))

# 4.4 PUT /api/expenses/{eid}/status
try:
    response = requests.get(f"{BASE_URL}/expenses", timeout=10)
    if response.status_code == 200:
        expenses = response.json()
        if expenses:
            expense_id = expenses[0]["id"]
            response = requests.put(f"{BASE_URL}/expenses/{expense_id}/status", 
                                   json={"status": "Pending"}, timeout=10)
            if response.status_code == 200:
                log_pass("PUT /api/expenses/{eid}/status updates status")
            else:
                log_fail("PUT expense status", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("PUT expense status", str(e))

# 4.5 GET /api/categories
try:
    response = requests.get(f"{BASE_URL}/categories", timeout=10)
    if response.status_code == 200:
        categories = response.json()
        if len(categories) >= 5:
            log_pass("GET /api/categories returns seeded categories")
        else:
            log_fail("GET /api/categories", f"Expected at least 5, got {len(categories)}")
    else:
        log_fail("GET /api/categories", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/categories", str(e))

# 4.6 POST /api/categories - duplicate name should return 400
try:
    response = requests.post(f"{BASE_URL}/categories", json={"name": "Tea / Food / Office Misc"}, timeout=10)
    if response.status_code == 400:
        log_pass("POST /api/categories with duplicate name returns 400")
    else:
        log_fail("POST categories duplicate", f"Expected 400, got {response.status_code}")
except Exception as e:
    log_fail("POST categories duplicate", str(e))

# 4.7 POST /api/categories - new category
try:
    response = requests.post(f"{BASE_URL}/categories", json={"name": "Test Category Unique"}, timeout=10)
    if response.status_code == 200:
        created = response.json()
        test_category_id = created.get("id")
        log_pass("POST /api/categories creates new category")
        
        # 4.8 DELETE category
        if test_category_id:
            response = requests.delete(f"{BASE_URL}/categories/{test_category_id}", timeout=10)
            if response.status_code == 200:
                log_pass("DELETE /api/categories/{cid} deletes category")
            else:
                log_fail("DELETE category", f"Status {response.status_code}")
    else:
        log_fail("POST /api/categories", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/categories", str(e))

# ============================================================================
# TEST 5: STOCK
# ============================================================================
print("\n[TEST 5] STOCK MANAGEMENT")
print("-" * 80)

# 5.1 GET /api/stock - should return 7 seeded items
try:
    response = requests.get(f"{BASE_URL}/stock", timeout=10)
    if response.status_code == 200:
        stock_items = response.json()
        if len(stock_items) == 7:
            log_pass("GET /api/stock returns 7 seeded items")
        else:
            log_fail("GET /api/stock count", f"Expected 7, got {len(stock_items)}")
    else:
        log_fail("GET /api/stock", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/stock", str(e))

# 5.2 POST /api/stock - create new stock item
try:
    new_stock = {
        "name": "Test Paver Block",
        "plant": "Sipara Plant",
        "unit": "Pcs",
        "minLimit": 1000,
        "colors": {"Red": 500, "Blue": 300}
    }
    response = requests.post(f"{BASE_URL}/stock", json=new_stock, timeout=10)
    if response.status_code == 200:
        created = response.json()
        test_stock_item_id = created.get("id")
        log_pass("POST /api/stock creates new stock item")
    else:
        log_fail("POST /api/stock", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/stock", str(e))

# 5.3 POST /api/stock/adjust - ADD action
try:
    if stock_items:
        # Find a Pcs item
        pcs_item = next((s for s in stock_items if s.get("unit") == "Pcs"), None)
        if pcs_item:
            item_id = pcs_item["id"]
            color = list(pcs_item.get("colors", {}).keys())[0]
            initial_qty = pcs_item["colors"][color]
            
            adjust_data = {
                "itemId": item_id,
                "color": color,
                "action": "ADD",
                "qty": 100
            }
            response = requests.post(f"{BASE_URL}/stock/adjust", json=adjust_data, timeout=10)
            if response.status_code == 200:
                updated = response.json()
                new_qty = updated["colors"][color]
                if new_qty == initial_qty + 100:
                    log_pass("POST /api/stock/adjust with action=ADD increases quantity")
                else:
                    log_fail("Stock adjust ADD", f"Expected {initial_qty + 100}, got {new_qty}")
            else:
                log_fail("POST /api/stock/adjust ADD", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/stock/adjust ADD", str(e))

# 5.4 POST /api/stock/adjust - DEDUCT action
try:
    if stock_items:
        pcs_item = next((s for s in stock_items if s.get("unit") == "Pcs"), None)
        if pcs_item:
            # Refresh stock data
            response = requests.get(f"{BASE_URL}/stock", timeout=10)
            if response.status_code == 200:
                stock_items = response.json()
                pcs_item = next((s for s in stock_items if s["id"] == pcs_item["id"]), None)
            
            item_id = pcs_item["id"]
            color = list(pcs_item.get("colors", {}).keys())[0]
            initial_qty = pcs_item["colors"][color]
            
            adjust_data = {
                "itemId": item_id,
                "color": color,
                "action": "DEDUCT",
                "qty": 50
            }
            response = requests.post(f"{BASE_URL}/stock/adjust", json=adjust_data, timeout=10)
            if response.status_code == 200:
                updated = response.json()
                new_qty = updated["colors"][color]
                expected = max(0, initial_qty - 50)
                if new_qty == expected:
                    log_pass("POST /api/stock/adjust with action=DEDUCT decreases quantity")
                else:
                    log_fail("Stock adjust DEDUCT", f"Expected {expected}, got {new_qty}")
            else:
                log_fail("POST /api/stock/adjust DEDUCT", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/stock/adjust DEDUCT", str(e))

# 5.5 POST /api/stock/inward-cement
try:
    inward_data = {
        "plant": "Sipara Plant",
        "cementName": "PPC Cement",
        "bags": 50
    }
    
    # Get initial cement stock
    response = requests.get(f"{BASE_URL}/stock", timeout=10)
    initial_cement = 0
    if response.status_code == 200:
        stock_items = response.json()
        cement = next((s for s in stock_items if s.get("name") == "PPC Cement" and s.get("plant") == "Sipara Plant"), None)
        if cement:
            initial_cement = cement.get("colors", {}).get("General/NA", 0)
    
    response = requests.post(f"{BASE_URL}/stock/inward-cement", json=inward_data, timeout=10)
    if response.status_code == 200:
        # Verify cement increased
        response = requests.get(f"{BASE_URL}/stock", timeout=10)
        if response.status_code == 200:
            stock_items = response.json()
            cement = next((s for s in stock_items if s.get("name") == "PPC Cement" and s.get("plant") == "Sipara Plant"), None)
            if cement:
                new_cement = cement.get("colors", {}).get("General/NA", 0)
                if new_cement == initial_cement + 50:
                    log_pass("POST /api/stock/inward-cement adds bags to General/NA")
                else:
                    log_fail("Inward cement", f"Expected {initial_cement + 50}, got {new_cement}")
    else:
        log_fail("POST /api/stock/inward-cement", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/stock/inward-cement", str(e))

# ============================================================================
# TEST 6: PRODUCTION
# ============================================================================
print("\n[TEST 6] PRODUCTION WITH STOCK SIDE-EFFECTS")
print("-" * 80)

# Refresh stock data
try:
    response = requests.get(f"{BASE_URL}/stock", timeout=10)
    if response.status_code == 200:
        stock_items = response.json()
except:
    pass

# 6.1 POST /api/production - should increase stock and decrease cement
try:
    if stock_items:
        # Find a Pcs item
        pcs_item = next((s for s in stock_items if s.get("unit") == "Pcs" and s.get("plant") == "Sipara Plant"), None)
        cement_ppc = next((s for s in stock_items if s.get("name") == "PPC Cement" and s.get("plant") == "Sipara Plant"), None)
        cement_opc = next((s for s in stock_items if s.get("name") == "OPC 53 Grade Cement" and s.get("plant") == "Sipara Plant"), None)
        
        if pcs_item and cement_ppc and cement_opc:
            color = list(pcs_item.get("colors", {}).keys())[0]
            initial_pcs = pcs_item["colors"][color]
            initial_ppc = cement_ppc.get("colors", {}).get("General/NA", 0)
            initial_opc = cement_opc.get("colors", {}).get("General/NA", 0)
            
            production_data = {
                "date": today_str(),
                "plant": "Sipara Plant",
                "isOff": False,
                "items": [
                    {"itemId": pcs_item["id"], "color": color, "qty": 200}
                ],
                "ppcBags": 10,
                "opcBags": 5,
                "createdBy": "Test User"
            }
            
            response = requests.post(f"{BASE_URL}/production", json=production_data, timeout=10)
            if response.status_code == 200:
                created = response.json()
                test_production_id = created.get("id")
                
                # Verify stock increased and cement decreased
                response = requests.get(f"{BASE_URL}/stock", timeout=10)
                if response.status_code == 200:
                    stock_items = response.json()
                    updated_pcs = next((s for s in stock_items if s["id"] == pcs_item["id"]), None)
                    updated_ppc = next((s for s in stock_items if s.get("name") == "PPC Cement" and s.get("plant") == "Sipara Plant"), None)
                    updated_opc = next((s for s in stock_items if s.get("name") == "OPC 53 Grade Cement" and s.get("plant") == "Sipara Plant"), None)
                    
                    if updated_pcs and updated_ppc and updated_opc:
                        new_pcs = updated_pcs["colors"][color]
                        new_ppc = updated_ppc.get("colors", {}).get("General/NA", 0)
                        new_opc = updated_opc.get("colors", {}).get("General/NA", 0)
                        
                        pcs_correct = (new_pcs == initial_pcs + 200)
                        ppc_correct = (new_ppc == initial_ppc - 10)
                        opc_correct = (new_opc == initial_opc - 5)
                        
                        if pcs_correct and ppc_correct and opc_correct:
                            log_pass("POST /api/production increases stock and decreases cement")
                        else:
                            log_fail("Production stock side-effects", 
                                   f"PCS: {initial_pcs}→{new_pcs} (exp {initial_pcs+200}), "
                                   f"PPC: {initial_ppc}→{new_ppc} (exp {initial_ppc-10}), "
                                   f"OPC: {initial_opc}→{new_opc} (exp {initial_opc-5})")
                        
                        # 6.2 PUT /api/production - should revert and reapply
                        try:
                            updated_production = {
                                "date": today_str(),
                                "plant": "Sipara Plant",
                                "isOff": False,
                                "items": [
                                    {"itemId": pcs_item["id"], "color": color, "qty": 300}  # Changed from 200 to 300
                                ],
                                "ppcBags": 15,  # Changed from 10 to 15
                                "opcBags": 8,   # Changed from 5 to 8
                                "createdBy": "Test User"
                            }
                            
                            response = requests.put(f"{BASE_URL}/production/{test_production_id}", 
                                                   json=updated_production, timeout=10)
                            if response.status_code == 200:
                                # Verify net effect: should be initial + 300 pcs, initial - 15 ppc, initial - 8 opc
                                response = requests.get(f"{BASE_URL}/stock", timeout=10)
                                if response.status_code == 200:
                                    stock_items = response.json()
                                    final_pcs = next((s for s in stock_items if s["id"] == pcs_item["id"]), None)
                                    final_ppc = next((s for s in stock_items if s.get("name") == "PPC Cement" and s.get("plant") == "Sipara Plant"), None)
                                    final_opc = next((s for s in stock_items if s.get("name") == "OPC 53 Grade Cement" and s.get("plant") == "Sipara Plant"), None)
                                    
                                    if final_pcs and final_ppc and final_opc:
                                        final_pcs_qty = final_pcs["colors"][color]
                                        final_ppc_qty = final_ppc.get("colors", {}).get("General/NA", 0)
                                        final_opc_qty = final_opc.get("colors", {}).get("General/NA", 0)
                                        
                                        pcs_correct = (final_pcs_qty == initial_pcs + 300)
                                        ppc_correct = (final_ppc_qty == initial_ppc - 15)
                                        opc_correct = (final_opc_qty == initial_opc - 8)
                                        
                                        if pcs_correct and ppc_correct and opc_correct:
                                            log_pass("PUT /api/production reverts old and applies new correctly")
                                        else:
                                            log_fail("Production PUT revert+reapply", 
                                                   f"PCS: {final_pcs_qty} (exp {initial_pcs+300}), "
                                                   f"PPC: {final_ppc_qty} (exp {initial_ppc-15}), "
                                                   f"OPC: {final_opc_qty} (exp {initial_opc-8})")
                            else:
                                log_fail("PUT /api/production", f"Status {response.status_code}: {response.text}")
                        except Exception as e:
                            log_fail("PUT /api/production", str(e))
                        
                        # 6.3 DELETE /api/production - should revert stock
                        try:
                            response = requests.delete(f"{BASE_URL}/production/{test_production_id}", timeout=10)
                            if response.status_code == 200:
                                # Verify stock reverted to initial
                                response = requests.get(f"{BASE_URL}/stock", timeout=10)
                                if response.status_code == 200:
                                    stock_items = response.json()
                                    reverted_pcs = next((s for s in stock_items if s["id"] == pcs_item["id"]), None)
                                    reverted_ppc = next((s for s in stock_items if s.get("name") == "PPC Cement" and s.get("plant") == "Sipara Plant"), None)
                                    reverted_opc = next((s for s in stock_items if s.get("name") == "OPC 53 Grade Cement" and s.get("plant") == "Sipara Plant"), None)
                                    
                                    if reverted_pcs and reverted_ppc and reverted_opc:
                                        rev_pcs_qty = reverted_pcs["colors"][color]
                                        rev_ppc_qty = reverted_ppc.get("colors", {}).get("General/NA", 0)
                                        rev_opc_qty = reverted_opc.get("colors", {}).get("General/NA", 0)
                                        
                                        pcs_correct = (rev_pcs_qty == initial_pcs)
                                        ppc_correct = (rev_ppc_qty == initial_ppc)
                                        opc_correct = (rev_opc_qty == initial_opc)
                                        
                                        if pcs_correct and ppc_correct and opc_correct:
                                            log_pass("DELETE /api/production reverts stock correctly")
                                        else:
                                            log_fail("Production DELETE revert", 
                                                   f"PCS: {rev_pcs_qty} (exp {initial_pcs}), "
                                                   f"PPC: {rev_ppc_qty} (exp {initial_ppc}), "
                                                   f"OPC: {rev_opc_qty} (exp {initial_opc})")
                            else:
                                log_fail("DELETE /api/production", f"Status {response.status_code}: {response.text}")
                        except Exception as e:
                            log_fail("DELETE /api/production", str(e))
            else:
                log_fail("POST /api/production", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/production", str(e))

# ============================================================================
# TEST 7: D-CHALLANS
# ============================================================================
print("\n[TEST 7] D-CHALLANS WITH STOCK SIDE-EFFECTS")
print("-" * 80)

# Refresh stock data
try:
    response = requests.get(f"{BASE_URL}/stock", timeout=10)
    if response.status_code == 200:
        stock_items = response.json()
except:
    pass

# 7.1 POST /api/challans - should decrease stock
try:
    if stock_items:
        pcs_item = next((s for s in stock_items if s.get("unit") == "Pcs" and s.get("plant") == "Sipara Plant"), None)
        if pcs_item:
            color = list(pcs_item.get("colors", {}).keys())[0]
            initial_qty = pcs_item["colors"][color]
            
            challan_data = {
                "date": today_str(),
                "dcNumber": "DC-TEST-001",
                "plant": "Sipara Plant",
                "party": "Test Party",
                "siteAddr": "Test Site",
                "siteMobile": "9999999999",
                "vehicle": "BR01AB1234",
                "driverName": "Test Driver",
                "driverMobile": "8888888888",
                "photo": "",
                "items": [
                    {"itemId": pcs_item["id"], "color": color, "qty": 100}
                ],
                "createdBy": "Test User"
            }
            
            response = requests.post(f"{BASE_URL}/challans", json=challan_data, timeout=10)
            if response.status_code == 200:
                created = response.json()
                test_challan_id = created.get("id")
                
                # Verify stock decreased
                response = requests.get(f"{BASE_URL}/stock", timeout=10)
                if response.status_code == 200:
                    stock_items = response.json()
                    updated_pcs = next((s for s in stock_items if s["id"] == pcs_item["id"]), None)
                    if updated_pcs:
                        new_qty = updated_pcs["colors"][color]
                        expected = max(0, initial_qty - 100)
                        if new_qty == expected:
                            log_pass("POST /api/challans decreases stock")
                        else:
                            log_fail("Challan stock deduction", f"Expected {expected}, got {new_qty}")
                        
                        # 7.2 PUT /api/challans - should revert and reapply
                        try:
                            updated_challan = {
                                "date": today_str(),
                                "dcNumber": "DC-TEST-001-UPDATED",
                                "plant": "Sipara Plant",
                                "party": "Test Party",
                                "siteAddr": "Test Site",
                                "siteMobile": "9999999999",
                                "vehicle": "BR01AB1234",
                                "driverName": "Test Driver",
                                "driverMobile": "8888888888",
                                "photo": "",
                                "items": [
                                    {"itemId": pcs_item["id"], "color": color, "qty": 150}  # Changed from 100 to 150
                                ],
                                "createdBy": "Test User"
                            }
                            
                            response = requests.put(f"{BASE_URL}/challans/{test_challan_id}", 
                                                   json=updated_challan, timeout=10)
                            if response.status_code == 200:
                                # Verify net effect: initial - 150
                                response = requests.get(f"{BASE_URL}/stock", timeout=10)
                                if response.status_code == 200:
                                    stock_items = response.json()
                                    final_pcs = next((s for s in stock_items if s["id"] == pcs_item["id"]), None)
                                    if final_pcs:
                                        final_qty = final_pcs["colors"][color]
                                        expected = max(0, initial_qty - 150)
                                        if final_qty == expected:
                                            log_pass("PUT /api/challans reverts and reapplies correctly")
                                        else:
                                            log_fail("Challan PUT revert+reapply", f"Expected {expected}, got {final_qty}")
                            else:
                                log_fail("PUT /api/challans", f"Status {response.status_code}: {response.text}")
                        except Exception as e:
                            log_fail("PUT /api/challans", str(e))
                        
                        # 7.3 DELETE /api/challans - should restore stock
                        try:
                            response = requests.delete(f"{BASE_URL}/challans/{test_challan_id}", timeout=10)
                            if response.status_code == 200:
                                # Verify stock restored
                                response = requests.get(f"{BASE_URL}/stock", timeout=10)
                                if response.status_code == 200:
                                    stock_items = response.json()
                                    restored_pcs = next((s for s in stock_items if s["id"] == pcs_item["id"]), None)
                                    if restored_pcs:
                                        restored_qty = restored_pcs["colors"][color]
                                        if restored_qty == initial_qty:
                                            log_pass("DELETE /api/challans restores stock")
                                        else:
                                            log_fail("Challan DELETE restore", f"Expected {initial_qty}, got {restored_qty}")
                            else:
                                log_fail("DELETE /api/challans", f"Status {response.status_code}: {response.text}")
                        except Exception as e:
                            log_fail("DELETE /api/challans", str(e))
            else:
                log_fail("POST /api/challans", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/challans", str(e))

# ============================================================================
# TEST 8: DISPATCHES
# ============================================================================
print("\n[TEST 8] DISPATCHES")
print("-" * 80)

# 8.1 POST /api/dispatches
try:
    dispatch_data = {
        "date": today_str(),
        "plant": "Sipara Plant",
        "party": "Test Party",
        "vehicle": "BR01CD5678",
        "driver": "Test Driver",
        "items": [{"name": "I-Shape", "color": "Red", "qty": 500}],
        "totalQty": 500,
        "status": "Pending Dispatch",
        "challanNo": "",
        "challanImg": ""
    }
    
    response = requests.post(f"{BASE_URL}/dispatches", json=dispatch_data, timeout=10)
    if response.status_code == 200:
        created = response.json()
        test_dispatch_id = created.get("id")
        log_pass("POST /api/dispatches creates dispatch")
        
        # 8.2 POST /api/dispatches/{id}/fulfill
        try:
            fulfill_data = {
                "challanNo": "CH-12345",
                "challanImg": "base64imagedata"
            }
            response = requests.post(f"{BASE_URL}/dispatches/{test_dispatch_id}/fulfill", 
                                    json=fulfill_data, timeout=10)
            if response.status_code == 200:
                fulfilled = response.json()
                if fulfilled.get("status") == "Dispatched" and fulfilled.get("challanNo") == "CH-12345":
                    log_pass("POST /api/dispatches/{id}/fulfill sets status and challan")
                else:
                    log_fail("Dispatch fulfill", "Status or challanNo not set correctly")
        except Exception as e:
            log_fail("POST /api/dispatches/{id}/fulfill", str(e))
        
        # 8.3 DELETE /api/dispatches
        try:
            response = requests.delete(f"{BASE_URL}/dispatches/{test_dispatch_id}", timeout=10)
            if response.status_code == 200:
                log_pass("DELETE /api/dispatches/{id} deletes dispatch")
            else:
                log_fail("DELETE /api/dispatches", f"Status {response.status_code}: {response.text}")
        except Exception as e:
            log_fail("DELETE /api/dispatches", str(e))
    else:
        log_fail("POST /api/dispatches", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("POST /api/dispatches", str(e))

# ============================================================================
# TEST 9: DASHBOARD, REPORTS, FIRM, APPROVALS, BACKUP
# ============================================================================
print("\n[TEST 9] DASHBOARD, REPORTS, FIRM, APPROVALS, BACKUP")
print("-" * 80)

# 9.1 GET /api/dashboard/summary
try:
    response = requests.get(f"{BASE_URL}/dashboard/summary", timeout=10)
    if response.status_code == 200:
        summary = response.json()
        required_keys = ["todayReceipt", "todayExpense", "dispatchCount", "pendingCount"]
        if all(k in summary for k in required_keys):
            log_pass("GET /api/dashboard/summary returns all required fields")
        else:
            log_fail("Dashboard summary", f"Missing keys. Got: {list(summary.keys())}")
    else:
        log_fail("GET /api/dashboard/summary", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/dashboard/summary", str(e))

# 9.2 GET /api/reports
try:
    response = requests.get(f"{BASE_URL}/reports", timeout=10)
    if response.status_code == 200:
        reports = response.json()
        required_keys = ["totalReceipts", "totalExpenses", "totalDues", "totalProduction", "topDues", "recentExpenses"]
        if all(k in reports for k in required_keys):
            log_pass("GET /api/reports returns all required fields")
        else:
            log_fail("Reports", f"Missing keys. Got: {list(reports.keys())}")
    else:
        log_fail("GET /api/reports", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/reports", str(e))

# 9.3 GET /api/firm
try:
    response = requests.get(f"{BASE_URL}/firm", timeout=10)
    if response.status_code == 200:
        firm = response.json()
        if "name" in firm and "phone" in firm:
            log_pass("GET /api/firm returns firm details")
        else:
            log_fail("GET /api/firm", "Missing required fields")
    else:
        log_fail("GET /api/firm", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/firm", str(e))

# 9.4 PUT /api/firm
try:
    update_firm = {
        "name": "CHAUDHARY TILES & PAVERS UPDATED",
        "phone": "+91 9876543210",
        "gst": "10AAAAA0000A1Z5",
        "address": "Sipara & Nandlal Chhapra Plant, Patna, Bihar"
    }
    response = requests.put(f"{BASE_URL}/firm", json=update_firm, timeout=10)
    if response.status_code == 200:
        updated = response.json()
        if updated.get("name") == update_firm["name"]:
            log_pass("PUT /api/firm updates firm details")
        else:
            log_fail("PUT /api/firm", "Firm name not updated")
    else:
        log_fail("PUT /api/firm", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("PUT /api/firm", str(e))

# 9.5 GET /api/approvals
try:
    response = requests.get(f"{BASE_URL}/approvals", timeout=10)
    if response.status_code == 200:
        approvals = response.json()
        if len(approvals) >= 3:
            log_pass("GET /api/approvals returns seeded approvals")
            
            # 9.6 DELETE /api/approvals/{aid}
            try:
                approval_id = approvals[0]["id"]
                response = requests.delete(f"{BASE_URL}/approvals/{approval_id}", timeout=10)
                if response.status_code == 200:
                    log_pass("DELETE /api/approvals/{aid} deletes approval")
                else:
                    log_fail("DELETE /api/approvals", f"Status {response.status_code}: {response.text}")
            except Exception as e:
                log_fail("DELETE /api/approvals", str(e))
        else:
            log_fail("GET /api/approvals", f"Expected at least 3, got {len(approvals)}")
    else:
        log_fail("GET /api/approvals", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/approvals", str(e))

# 9.7 GET /api/backup
try:
    response = requests.get(f"{BASE_URL}/backup", timeout=10)
    if response.status_code == 200:
        backup = response.json()
        expected_collections = ["team", "parties", "receipts", "expenses", "categories", "stock", "production", "dispatches", "challans", "firm"]
        if all(c in backup for c in expected_collections):
            log_pass("GET /api/backup returns all collections")
        else:
            log_fail("GET /api/backup", f"Missing collections. Got: {list(backup.keys())}")
    else:
        log_fail("GET /api/backup", f"Status {response.status_code}: {response.text}")
except Exception as e:
    log_fail("GET /api/backup", str(e))

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"✅ PASSED: {len(test_results['passed'])}")
print(f"❌ FAILED: {len(test_results['failed'])}")
print(f"⚠️  WARNINGS: {len(test_results['warnings'])}")

if test_results['failed']:
    print("\n" + "=" * 80)
    print("FAILED TESTS DETAILS:")
    print("=" * 80)
    for fail in test_results['failed']:
        print(f"\n❌ {fail['test']}")
        print(f"   Reason: {fail['reason']}")

if test_results['warnings']:
    print("\n" + "=" * 80)
    print("WARNINGS:")
    print("=" * 80)
    for warn in test_results['warnings']:
        print(f"\n⚠️  {warn['test']}")
        print(f"   {warn['reason']}")

print("\n" + "=" * 80)
print("TEST EXECUTION COMPLETE")
print("=" * 80)

# Exit with appropriate code
exit(0 if len(test_results['failed']) == 0 else 1)
