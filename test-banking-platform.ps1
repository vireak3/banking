#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Banking Platform Automated Test Suite
.DESCRIPTION
    Comprehensive test script for the banking microservices platform.
    Tests all endpoints: registration, login, account creation, transfers, blockchain verification.
.EXAMPLE
    .\test-banking-platform.ps1
#>

$ErrorActionPreference = "Continue"
$WarningPreference = "SilentlyContinue"

$base = "http://localhost"
$results = @{}

Write-Host "`n========================================`n  Banking Platform Test Suite`n========================================`n" -ForegroundColor Cyan

# Test 1: Register first user
Write-Host "[1/12] Registering Alice..." -ForegroundColor Yellow
try {
    $registerResponse = Invoke-RestMethod -Uri "$base/api/register" `
        -Method Post `
        -ContentType 'application/json' `
        -Body (@{
            name = 'Alice-TestUser'
            email = 'alice.test@example.com'
            password = 'SecurePass123!'
            role = 'user'
        } | ConvertTo-Json)
    
    $aliceToken = $registerResponse.data.token
    $results['Register Alice'] = 'PASS'
    Write-Host "[PASS] Alice registered successfully" -ForegroundColor Green
    Write-Host "  Token: $($aliceToken.Substring(0,20))..." -ForegroundColor Gray
} catch {
    $results['Register Alice'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 2: Register second user
Write-Host "`n[2/12] Registering Bob..." -ForegroundColor Yellow
try {
    $registerResponse = Invoke-RestMethod -Uri "$base/api/register" `
        -Method Post `
        -ContentType 'application/json' `
        -Body (@{
            name = 'Bob-TestUser'
            email = 'bob.test@example.com'
            password = 'SecurePass456!'
            role = 'user'
        } | ConvertTo-Json)
    
    $bobToken = $registerResponse.data.token
    $results['Register Bob'] = 'PASS'
    Write-Host "✓ Bob registered successfully" -ForegroundColor Green
} catch {
    $results['Register Bob'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 3: Login test
Write-Host "`n[3/12] Testing login endpoint..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$base/api/login" `
        -Method Post `
        -ContentType 'application/json' `
        -Body (@{
            email = 'alice.test@example.com'
            password = 'SecurePass123!'
        } | ConvertTo-Json)
    
    $results['Login'] = 'PASS'
    Write-Host "✓ Login successful" -ForegroundColor Green
} catch {
    $results['Login'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 4: Get user profile (auth test)
Write-Host "`n[4/12] Testing authenticated user endpoint..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $aliceToken" }
    $userResponse = Invoke-RestMethod -Uri "$base/api/user" `
        -Method Get `
        -Headers $headers
    
    $results['Get User'] = 'PASS'
    Write-Host "✓ User profile retrieved: $($userResponse.data.email)" -ForegroundColor Green
} catch {
    $results['Get User'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 5: Create account for Alice
Write-Host "`n[5/12] Creating account for Alice..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $aliceToken" }
    $accountResponse = Invoke-RestMethod -Uri "$base/api/spring/accounts" `
        -Method Post `
        -ContentType 'application/json' `
        -Headers $headers `
        -Body (@{
            userId = 1
            balance = 1000
        } | ConvertTo-Json)
    
    $aliceAccountId = $accountResponse.data.id
    $results['Create Account Alice'] = 'PASS'
    Write-Host "✓ Account created for Alice (ID: $aliceAccountId, Balance: $($accountResponse.data.balance))" -ForegroundColor Green
} catch {
    $results['Create Account Alice'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 6: Create account for Bob
Write-Host "`n[6/12] Creating account for Bob..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $bobToken" }
    $accountResponse = Invoke-RestMethod -Uri "$base/api/spring/accounts" `
        -Method Post `
        -ContentType 'application/json' `
        -Headers $headers `
        -Body (@{
            userId = 2
            balance = 500
        } | ConvertTo-Json)
    
    $bobAccountId = $accountResponse.data.id
    $results['Create Account Bob'] = 'PASS'
    Write-Host "✓ Account created for Bob (ID: $bobAccountId, Balance: $($accountResponse.data.balance))" -ForegroundColor Green
} catch {
    $results['Create Account Bob'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 7: Execute transfer
Write-Host "`n[7/12] Executing transfer from Alice to Bob..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $aliceToken" }
    $transferResponse = Invoke-RestMethod -Uri "$base/api/spring/transactions/transfer" `
        -Method Post `
        -ContentType 'application/json' `
        -Headers $headers `
        -Body (@{
            fromAccount = $aliceAccountId
            toAccount = $bobAccountId
            amount = 300
        } | ConvertTo-Json)
    
    $transactionHash = $transferResponse.data.blockchainHash
    $results['Execute Transfer'] = 'PASS'
    Write-Host "✓ Transfer successful (Amount: $($transferResponse.data.amount), Status: $($transferResponse.data.status))" -ForegroundColor Green
    Write-Host "  Blockchain Hash: $($transactionHash.Substring(0,20))..." -ForegroundColor Gray
} catch {
    $results['Execute Transfer'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 8: Verify blockchain hash
Write-Host "`n[8/12] Verifying transaction hash in blockchain..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $aliceToken" }
    $verifyResponse = Invoke-RestMethod -Uri "$base/api/spring/blockchain/verify/$transactionHash" `
        -Method Get `
        -Headers $headers
    
    if ($verifyResponse.data.valid) {
        $results['Verify Blockchain'] = 'PASS'
        Write-Host "✓ Hash verified successfully" -ForegroundColor Green
    } else {
        $results['Verify Blockchain'] = 'FAIL'
        Write-Host "✗ Hash verification failed" -ForegroundColor Red
    }
} catch {
    $results['Verify Blockchain'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 9: Check Alice balance after transfer
Write-Host "`n[9/12] Checking Alice balance after transfer..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $aliceToken" }
    $accountResponse = Invoke-RestMethod -Uri "$base/api/spring/accounts/$aliceAccountId" `
        -Method Get `
        -Headers $headers
    
    $aliceNewBalance = $accountResponse.data.balance
    if ($aliceNewBalance -eq 700) {
        $results['Alice Balance Check'] = 'PASS'
        Write-Host "✓ Alice balance correct: $aliceNewBalance (expected 700)" -ForegroundColor Green
    } else {
        $results['Alice Balance Check'] = 'FAIL'
        Write-Host "✗ Alice balance incorrect: $aliceNewBalance (expected 700)" -ForegroundColor Red
    }
} catch {
    $results['Alice Balance Check'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 10: Check Bob balance after transfer
Write-Host "`n[10/12] Checking Bob balance after transfer..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $bobToken" }
    $accountResponse = Invoke-RestMethod -Uri "$base/api/spring/accounts/$bobAccountId" `
        -Method Get `
        -Headers $headers
    
    $bobNewBalance = $accountResponse.data.balance
    if ($bobNewBalance -eq 800) {
        $results['Bob Balance Check'] = 'PASS'
        Write-Host "✓ Bob balance correct: $bobNewBalance (expected 800)" -ForegroundColor Green
    } else {
        $results['Bob Balance Check'] = 'FAIL'
        Write-Host "✗ Bob balance incorrect: $bobNewBalance (expected 800)" -ForegroundColor Red
    }
} catch {
    $results['Bob Balance Check'] = 'FAIL'
    Write-Host "✗ Failed: $($_)" -ForegroundColor Red
}

# Test 11: Insufficient balance error
Write-Host "`n[11/12] Testing insufficient balance rejection..." -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $aliceToken" }
    $transferResponse = Invoke-RestMethod -Uri "$base/api/spring/transactions/transfer" `
        -Method Post `
        -ContentType 'application/json' `
        -Headers $headers `
        -Body (@{
            fromAccount = $aliceAccountId
            toAccount = $bobAccountId
            amount = 10000
        } | ConvertTo-Json) -ErrorAction Stop
    
    $results['Error Handling'] = 'FAIL'
    Write-Host "✗ Transfer should have failed with insufficient balance" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        $results['Error Handling'] = 'PASS'
        Write-Host "✓ Insufficient balance correctly rejected" -ForegroundColor Green
    } else {
        $results['Error Handling'] = 'FAIL'
        Write-Host "✗ Unexpected error: $($_)" -ForegroundColor Red
    }
}

# Test 12: Unauthenticated request rejection
Write-Host "`n[12/12] Testing unauthenticated request rejection..." -ForegroundColor Yellow
try {
    $userResponse = Invoke-RestMethod -Uri "$base/api/user" `
        -Method Get `
        -ErrorAction Stop
    
    $results['Authentication'] = 'FAIL'
    Write-Host "✗ Unauthenticated request should have been rejected" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        $results['Authentication'] = 'PASS'
        Write-Host "✓ Unauthenticated requests correctly rejected with 401" -ForegroundColor Green
    } else {
        $results['Authentication'] = 'FAIL'
        Write-Host "✗ Unexpected error: $($_)" -ForegroundColor Red
    }
}

# Print summary
Write-Host "`n========================================`n  Test Results Summary`n========================================`n" -ForegroundColor Cyan

$passCount = ($results.Values | Where-Object { $_ -eq 'PASS' }).Count
$failCount = ($results.Values | Where-Object { $_ -eq 'FAIL' }).Count
$totalTests = $results.Count

foreach ($test in $results.GetEnumerator() | Sort-Object Name) {
    $status = if ($test.Value -eq 'PASS') { '✓ PASS' } else { '✗ FAIL' }
    $color = if ($test.Value -eq 'PASS') { 'Green' } else { 'Red' }
    Write-Host "  $status - $($test.Name)" -ForegroundColor $color
}

Write-Host "`n  Total: $totalTests | Passed: $passCount | Failed: $failCount`n" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host "  ✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  ✗ Some tests failed" -ForegroundColor Red
    exit 1
}
