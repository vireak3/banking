#!/bin/bash
#
# Banking Platform Automated Test Suite
# Comprehensive test script for the banking microservices platform
#

BASE="http://localhost"
PASS_COUNT=0
FAIL_COUNT=0

echo ""
echo "========================================"
echo "  Banking Platform Test Suite"
echo "========================================"
echo ""

run_test() {
    local test_name=$1
    local cmd=$2
    
    echo "[$(($PASS_COUNT + $FAIL_COUNT + 1))] $test_name..."
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo "✓ PASS - $test_name"
        ((PASS_COUNT++))
    else
        echo "✗ FAIL - $test_name"
        ((FAIL_COUNT++))
    fi
}

# Test 1: Register first user
echo "Registering Alice..."
ALICE_RESPONSE=$(curl -s -X POST "$BASE/api/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"Alice-TestUser","email":"alice.test@example.com","password":"SecurePass123!","role":"user"}')
ALICE_TOKEN=$(echo $ALICE_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$ALICE_TOKEN" ]; then
    echo "✓ PASS - Register Alice"
    ((PASS_COUNT++))
else
    echo "✗ FAIL - Register Alice"
    ((FAIL_COUNT++))
fi

# Test 2: Register second user
echo "Registering Bob..."
BOB_RESPONSE=$(curl -s -X POST "$BASE/api/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"Bob-TestUser","email":"bob.test@example.com","password":"SecurePass456!","role":"user"}')
BOB_TOKEN=$(echo $BOB_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$BOB_TOKEN" ]; then
    echo "✓ PASS - Register Bob"
    ((PASS_COUNT++))
else
    echo "✗ FAIL - Register Bob"
    ((FAIL_COUNT++))
fi

# Test 3: Create account for Alice
echo "Creating account for Alice..."
ALICE_ACCOUNT=$(curl -s -X POST "$BASE/api/spring/accounts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ALICE_TOKEN" \
    -d '{"userId":1,"balance":1000}')
ALICE_ACCOUNT_ID=$(echo $ALICE_ACCOUNT | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -n1)

if [ ! -z "$ALICE_ACCOUNT_ID" ]; then
    echo "✓ PASS - Create Account Alice"
    ((PASS_COUNT++))
else
    echo "✗ FAIL - Create Account Alice"
    ((FAIL_COUNT++))
fi

# Test 4: Create account for Bob
echo "Creating account for Bob..."
BOB_ACCOUNT=$(curl -s -X POST "$BASE/api/spring/accounts" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $BOB_TOKEN" \
    -d '{"userId":2,"balance":500}')
BOB_ACCOUNT_ID=$(echo $BOB_ACCOUNT | grep -o '"id":[0-9]*' | cut -d':' -f2 | head -n1)

if [ ! -z "$BOB_ACCOUNT_ID" ]; then
    echo "✓ PASS - Create Account Bob"
    ((PASS_COUNT++))
else
    echo "✗ FAIL - Create Account Bob"
    ((FAIL_COUNT++))
fi

# Test 5: Execute transfer
echo "Executing transfer from Alice to Bob..."
TRANSFER=$(curl -s -X POST "$BASE/api/spring/transactions/transfer" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ALICE_TOKEN" \
    -d "{\"fromAccount\":$ALICE_ACCOUNT_ID,\"toAccount\":$BOB_ACCOUNT_ID,\"amount\":300}")
HASH=$(echo $TRANSFER | grep -o '"blockchainHash":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$HASH" ]; then
    echo "✓ PASS - Execute Transfer"
    ((PASS_COUNT++))
else
    echo "✗ FAIL - Execute Transfer"
    ((FAIL_COUNT++))
fi

# Test 6: Verify blockchain hash
echo "Verifying transaction hash..."
VERIFY=$(curl -s -X GET "$BASE/api/spring/blockchain/verify/$HASH" \
    -H "Authorization: Bearer $ALICE_TOKEN")

if echo $VERIFY | grep -q '"valid":true'; then
    echo "✓ PASS - Verify Blockchain"
    ((PASS_COUNT++))
else
    echo "✗ FAIL - Verify Blockchain"
    ((FAIL_COUNT++))
fi

# Test 7: Check Alice balance
echo "Checking Alice balance after transfer..."
ALICE_BALANCE=$(curl -s -X GET "$BASE/api/spring/accounts/$ALICE_ACCOUNT_ID" \
    -H "Authorization: Bearer $ALICE_TOKEN" | grep -o '"balance":[0-9.]*' | cut -d':' -f2)

if [ "$ALICE_BALANCE" = "700" ] || [ "$ALICE_BALANCE" = "700.00" ]; then
    echo "✓ PASS - Alice Balance Check"
    ((PASS_COUNT++))
else
    echo "✗ FAIL - Alice Balance Check (got $ALICE_BALANCE, expected 700)"
    ((FAIL_COUNT++))
fi

# Test 8: Check Bob balance
echo "Checking Bob balance after transfer..."
BOB_BALANCE=$(curl -s -X GET "$BASE/api/spring/accounts/$BOB_ACCOUNT_ID" \
    -H "Authorization: Bearer $BOB_TOKEN" | grep -o '"balance":[0-9.]*' | cut -d':' -f2)

if [ "$BOB_BALANCE" = "800" ] || [ "$BOB_BALANCE" = "800.00" ]; then
    echo "✓ PASS - Bob Balance Check"
    ((PASS_COUNT++))
else
    echo "✗ FAIL - Bob Balance Check (got $BOB_BALANCE, expected 800)"
    ((FAIL_COUNT++))
fi

# Print summary
echo ""
echo "========================================"
echo "  Test Results Summary"
echo "========================================"
echo ""
echo "  Total: $((PASS_COUNT + FAIL_COUNT)) | Passed: $PASS_COUNT | Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "  ✓ All tests passed!"
    exit 0
else
    echo "  ✗ Some tests failed"
    exit 1
fi
