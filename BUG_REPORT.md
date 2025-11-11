# Comprehensive Bug Report & Fixes

## 🐛 CRITICAL BUGS FOUND

### 1. **updateInvestorCredit Function - Wrong Logic** 🔴 CRITICAL
**Location:** `server/dbHelpers.js:66-77`

**Problem:**
```javascript
async function updateInvestorCredit(id, amount) {
  // Updates: starting_credit = starting_credit + $2
  // This ADDS to existing credit instead of SETTING it
}
```

**Impact:**
- When admin sets credit to 10000, it ADDS 10000 to current credit
- If investor has 500, setting to 10000 results in 10500 instead of 10000
- Fund request approvals are broken - they add the amount TWICE

**Used In:**
- `/api/admin/investors/:id/credit` - Admin setting credit
- `/api/admin/funds-requests/:id/approve` - Approving fund requests

**Status:** ❌ NEEDS FIX

---

### 2. **updateFundRequestStatus - Missing Parameter** 🔴 CRITICAL
**Location:** `server/index.js:775-779`

**Problem:**
```javascript
await dbHelpers.updateFundRequestStatus(
  id,
  'approved',
  adminResponse || 'Approved',
  reviewedBy || 'admin'  // ❌ 4 parameters passed
);

// But function signature is:
async function updateFundRequestStatus(id, status, adminNotes) {
  // ❌ Only accepts 3 parameters
}
```

**Impact:**
- `reviewedBy` parameter is ignored
- No way to track who reviewed the request

**Status:** ❌ NEEDS FIX

---

### 3. **Fund Request Approval - Wrong Credit Calculation** 🔴 CRITICAL
**Location:** `server/index.js:773`

**Problem:**
```javascript
const newCredit = request.current_credit + request.requested_amount;
await dbHelpers.updateInvestorCredit(request.investor_id, newCredit);
```

**Impact:**
- `current_credit` doesn't exist in fund_requests table
- `request.amount` is the correct field name
- Combined with bug #1, credit gets added multiple times

**Status:** ❌ NEEDS FIX

---

### 4. **updateInvestorCredit Uses Non-Existent Column** 🟡 MEDIUM
**Location:** `server/dbHelpers.js:72`

**Problem:**
```javascript
SET starting_credit = starting_credit + $2,
    remaining = remaining + $2  // ❌ 'remaining' is calculated, not stored
```

**Impact:**
- `remaining` column exists but shouldn't be used
- All queries calculate it dynamically as `starting_credit - invested`
- This creates data inconsistency

**Status:** ❌ NEEDS FIX

---

### 5. **createOrUpdateInvestment Updates Static Columns** 🟡 MEDIUM
**Location:** `server/dbHelpers.js:117-128, 136-142, 149-153`

**Problem:**
```javascript
await client.query(`
  UPDATE investors
  SET invested = invested + $2,
      remaining = remaining - $2  // ❌ Static columns that should be dynamic
  WHERE id = $1
`, [investorId, amount]);
```

**Impact:**
- `invested` and `remaining` are updated statically
- But other queries calculate them dynamically
- Can get out of sync leading to wrong balances

**Status:** ❌ NEEDS CLEANUP

---

### 6. **Schema Has Redundant Columns** 🟡 MEDIUM
**Location:** `server/schema.js:18-19`

**Problem:**
```javascript
CREATE TABLE IF NOT EXISTS investors (
  starting_credit INTEGER DEFAULT 500,
  invested INTEGER DEFAULT 0,      // ❌ Should be calculated
  remaining INTEGER DEFAULT 500,   // ❌ Should be calculated
```

**Impact:**
- Data inconsistency
- Two sources of truth

**Status:** 🟠 SCHEMA ISSUE (harder to fix, needs migration)

---

### 7. **Missing Error Handling in Admin Endpoints** 🟢 LOW
**Multiple Locations**

**Problem:**
- Some admin endpoints don't validate IDs properly
- No checks for negative amounts
- Missing transaction rollbacks in some places

**Status:** ⚠️ NEEDS IMPROVEMENT

---

## ✅ FIXES TO APPLY

### Fix #1: updateInvestorCredit - Change from ADD to SET
### Fix #2: updateFundRequestStatus - Add reviewedBy parameter
### Fix #3: Fund approval - Use correct field names
### Fix #4: Remove static column updates
### Fix #5: Add proper validation

