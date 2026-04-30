# Module 2: Seller & Shop Management — Implementation Plan

## Project Analysis Summary

I've thoroughly analyzed your entire codebase. Here's what's already in place:

| Layer | What Exists (Module 1) |
|-------|----------------------|
| **Backend** | `server.js`, `config/db.js`, `models/User.js` + `Address.js`, `controllers/userController.js`, `routes/userRoutes.js`, `middleware/auth.js` + `errorHandler.js` + `rateLimiter.js`, `utils/validators.js` |
| **Mobile** | `App.js`, `api/client.js`, `context/AuthContext.js`, `navigation/AppNavigator.js`, 8 screens (Welcome, Login, Register, Home, Profile, EditProfile, ChangePassword, AddressManagement), 4 components (Button, InputField, LoadingSpinner, AddressCard) |
| **Patterns** | Express + Mongoose, JWT auth with `protect` + `authorize` middleware, `express-validator` for input validation, consistent `{ success, message, ... }` JSON responses, Expo React Native with stack navigation, AuthContext for state |

> [!NOTE]
> The existing `User.js` model already has `role: enum ['customer', 'seller', 'admin']` — perfect! The auth middleware already has `authorize(...roles)` ready for role-based access. The `WelcomeScreen` already has a "Register as Seller" link placeholder.

---

## Proposed Changes

### Component 1: Backend — Seller Model

#### [NEW] [Seller.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/models/Seller.js)

A new Mongoose model for the seller/shop profile, linked to the `User` model via `ObjectId` reference. This follows the **same pattern** as `Address.js` (a separate collection referencing `User`).

**Schema fields:**
```js
{
  user:              ObjectId → ref 'User'  (1-to-1, required, unique)
  shopName:          String   (required, unique, 3-100 chars)
  shopDescription:   String   (max 1000 chars)
  shopLogo:          String   (URL — placeholder for now, image upload in future)
  shopBanner:        String   (URL — placeholder)
  categoryFocus:     String   (e.g., "Casual Wear", "Saree & Traditional")
  businessRegNumber: String   (required — business registration certificate number)
  nicNumber:         String   (required — National Identity Card)
  documentsUrl:      String   (URL to uploaded doc — placeholder for file upload)
  bankName:          String   (required)
  bankBranch:        String   (required)
  bankAccountNumber: String   (required)
  bankAccountName:   String   (required)
  contactAddress: {
    addressLine1:    String   (required)
    addressLine2:    String
    city:            String   (required)
    province:        String   (enum — 9 Sri Lankan provinces)
    postalCode:      String   (5-digit)
  }
  verificationStatus: String  (enum: 'pending', 'approved', 'rejected', 'suspended', 'removed')
  rejectionReason:    String
  suspensionReason:   String
  productCount:       Number  (default 0 — updated by Module 3)
  averageRating:      Number  (default 0 — updated by Module 5)
  totalReviews:       Number  (default 0)
  timestamps:         true    (createdAt, updatedAt)
}
```

> [!IMPORTANT]
> **Design Decision — Separate `Seller` collection vs. embedding in `User`:**  
> We use a **separate collection** (like `Address`) because the seller profile has many fields unrelated to the user account. This keeps the `User` model clean and follows the existing pattern.
> The `user` field creates a 1-to-1 link: one User (with role: 'seller') → one Seller profile.

---

### Component 2: Backend — Seller Controller

#### [NEW] [sellerController.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/controllers/sellerController.js)

All controller functions follow the **exact same pattern** as `userController.js`:
- `try/catch` wrapping with `next(error)`
- `checkValidation(req, res)` for express-validator errors
- Consistent `{ success, message, ... }` response format

**Functions to implement (mapped to system docs):**

| Function | FR | Method + Route | Auth |
|----------|-----|----------------|------|
| `registerSeller` | FR2.1 | `POST /api/sellers/register` | No (public) |
| `loginSeller` | FR2.1 | `POST /api/sellers/login` | No (public) |
| `getMyShop` | FR2.3 | `GET /api/sellers/my-shop` | Seller |
| `getShopPublic` | FR2.3 | `GET /api/sellers/shop/:id` | Customer/Any |
| `updateShopInfo` | FR2.4 | `PUT /api/sellers/my-shop` | Seller (verified) |
| `updateDocuments` | FR2.5 | `PUT /api/sellers/my-shop/documents` | Seller (verified) |
| `getSellerDashboard` | FR2.3 | `GET /api/sellers/dashboard` | Seller |
| `getAllSellers` | FR6.4 | `GET /api/sellers/admin/all` | Admin |
| `getSellerDetails` | FR6.4 | `GET /api/sellers/admin/:id` | Admin |
| `verifySeller` | FR2.2 | `PUT /api/sellers/admin/:id/verify` | Admin |
| `suspendSeller` | FR2.6 | `PUT /api/sellers/admin/:id/suspend` | Admin |
| `removeSeller` | FR2.6 | `PUT /api/sellers/admin/:id/remove` | Admin |

**Key logic details:**

1. **`registerSeller`** — Creates both a `User` (role: 'seller') and a `Seller` profile in one operation. Uses a Mongoose transaction to ensure atomicity.
2. **`loginSeller`** — Same login logic as customer but enforces `role === 'seller'`. Returns verification status so the mobile app knows which dashboard to show (pending vs. active).
3. **`getMyShop`** — Seller views their own shop profile. If status is 'pending', returns limited data with a "pending" indicator.
4. **`updateShopInfo`** — Only allowed if `verificationStatus === 'approved'`.
5. **`verifySeller`** — Admin approves or rejects. Sets status and optional rejection reason.

---

### Component 3: Backend — Seller Routes

#### [NEW] [sellerRoutes.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/routes/sellerRoutes.js)

Follows the **exact same structure** as `userRoutes.js`:

```
Public:
  POST /register      → registerSeller
  POST /login         → loginSeller
  GET  /shop/:id      → getShopPublic      (anyone can view a shop)

Protected (Seller):
  GET  /my-shop        → getMyShop
  GET  /dashboard      → getSellerDashboard
  PUT  /my-shop        → updateShopInfo      (verified only)
  PUT  /my-shop/documents → updateDocuments  (verified only)

Protected (Admin):
  GET  /admin/all              → getAllSellers
  GET  /admin/:id              → getSellerDetails
  PUT  /admin/:id/verify       → verifySeller
  PUT  /admin/:id/suspend      → suspendSeller
  PUT  /admin/:id/remove       → removeSeller
```

---

### Component 4: Backend — Validators Update

#### [MODIFY] [validators.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/utils/validators.js)

**Add new validation arrays** (appended after existing Module 1 validators):

- `sellerRegisterValidation` — Validates all registration fields (shop name, personal details, business docs, bank details, contact address)
- `sellerLoginValidation` — Same as `loginValidation` (email + password)
- `updateShopValidation` — Optional fields for shop name, description, category focus
- `updateDocumentsValidation` — Business reg number, NIC, document URL
- `sellerIdValidation` — `param('id').isMongoId()`
- `verifySellerValidation` — Status (approved/rejected) + optional rejection reason

---

### Component 5: Backend — Auth Middleware Enhancement

#### [MODIFY] [auth.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/middleware/auth.js)

Add a new `requireVerifiedSeller` middleware that checks:
1. User is authenticated (via `protect`)
2. User role is `'seller'`
3. Seller profile exists with `verificationStatus === 'approved'`

This is used on routes like `PUT /my-shop` where only verified sellers can make changes.

---

### Component 6: Backend — Server Registration

#### [MODIFY] [server.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/server.js)

Uncomment and activate the seller routes:

```diff
 app.use('/api/users', require('./routes/userRoutes'));
-// app.use('/api/sellers', require('./routes/sellerRoutes'));
+app.use('/api/sellers', require('./routes/sellerRoutes'));
```

---

### Component 7: Mobile — Seller Screens

> [!NOTE]
> All screens follow the **exact same patterns** as existing Module 1 screens: `SafeAreaView`, `StyleSheet.create`, the `#8B2635` brand color, the `Button` and `InputField` components, and the `useAuth()` hook.

#### [NEW] [SellerRegisterScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/SellerRegisterScreen.js)

Multi-step registration form (4 steps matching the system docs):
- **Step 1:** Personal details (name, email, phone, password)
- **Step 2:** Shop details (shop name, description, category focus)
- **Step 3:** Document upload (business registration number, NIC number)
- **Step 4:** Bank account details + contact address

Uses `apiClient.post('/api/sellers/register', ...)` and navigates to `SellerPending` on success.

#### [NEW] [SellerLoginScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/SellerLoginScreen.js)

Same layout as `LoginScreen.js` but posts to `/api/sellers/login`. After login, checks `verificationStatus` to decide navigation:
- `pending` → `SellerPending` screen
- `approved` → `SellerDashboard` screen
- `rejected` → Show rejection message with option to reapply

#### [NEW] [SellerPendingScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/SellerPendingScreen.js)

Simple informational screen shown when seller is awaiting verification:
- "Your shop is under review" message
- Estimated timeline (3-5 business days)
- Logout button
- Refresh button to recheck status

#### [NEW] [SellerDashboardScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/SellerDashboardScreen.js)

The seller's home screen after verification. Shows:
- Shop name and status badge
- Quick stats cards (product count, rating — placeholder 0s until Modules 3 & 5)
- Navigation cards: "My Products" (Module 3 placeholder), "Orders" (Module 4 placeholder), "My Shop Profile", "Settings"

#### [NEW] [SellerShopProfileScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/SellerShopProfileScreen.js)

Displays the seller's shop profile details. Has an "Edit Shop" button that navigates to `EditShop`.

#### [NEW] [EditShopScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/EditShopScreen.js)

Pre-filled form for editing shop name, description, and category focus. Same pattern as `EditProfileScreen.js`.

---

### Component 8: Mobile — Navigation Update

#### [MODIFY] [AppNavigator.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/navigation/AppNavigator.js)

Add a **third navigation stack** for seller flow, alongside `AuthStack` and `AppStack`:

```
SellerAuthStack:    SellerLogin → SellerRegister
SellerPendingStack: SellerPending (status = pending)
SellerAppStack:     SellerDashboard → SellerShopProfile → EditShop

Navigation logic:
  if (!user) → AuthStack (customer auth + seller auth entry)
  if (user.role === 'seller' && verificationStatus === 'pending') → SellerPendingStack
  if (user.role === 'seller' && verificationStatus === 'approved') → SellerAppStack
  if (user.role === 'customer') → AppStack (existing)
```

#### [MODIFY] [WelcomeScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/WelcomeScreen.js)

Wire the existing "Register as Seller" link to navigate to `SellerRegister`.

#### [MODIFY] [AuthContext.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/context/AuthContext.js)

Add `sellerLogin` and `sellerRegister` functions alongside existing `login` and `register`. Store `verificationStatus` in context for navigation decisions.

---

### Component 9: README Update

#### [MODIFY] [README.md](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/README.md)

- Update Module 2 status from `🔲 Not Started` to `✅ Complete`
- Add full **API Endpoints — Module 2** table (same format as Module 1)
- Add `.env` variables if any new ones are needed (none for Module 2)

---

## Open Questions

> [!IMPORTANT]
> **Q1: File uploads for business documents and shop images?**
> The system docs mention uploading business registration certificates and shop logo/banner images. For now, I'll implement these as **URL string fields** (sellers paste a link). Real file upload (using `multer` + cloud storage like Cloudinary/AWS S3) can be added as a follow-up. Is this acceptable for your current scope?

> [!IMPORTANT]
> **Q2: Email notifications?**
> The docs mention sending emails when a seller is approved/rejected. Should I set up email sending now (requires an email service like SendGrid/Nodemailer + SMTP), or should we skip email for now and rely on the API response / in-app checking? Setting up email would require new `.env` variables.

> [!IMPORTANT]
> **Q3: Which team member is building Module 2?**
> This plan creates **9 new files** and modifies **5 existing files**. If one team member is building the entire module, I'll create everything. If it's split among members, I can organize the files by person.

---

## File Summary

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `backend/models/Seller.js` | Seller/Shop Mongoose model |
| **NEW** | `backend/controllers/sellerController.js` | All 12 seller endpoint handlers |
| **NEW** | `backend/routes/sellerRoutes.js` | Express router for `/api/sellers` |
| **MODIFY** | `backend/utils/validators.js` | Add seller validation rules |
| **MODIFY** | `backend/middleware/auth.js` | Add `requireVerifiedSeller` middleware |
| **MODIFY** | `backend/server.js` | Register seller routes |
| **NEW** | `mobile/src/screens/SellerRegisterScreen.js` | Multi-step seller registration |
| **NEW** | `mobile/src/screens/SellerLoginScreen.js` | Seller login screen |
| **NEW** | `mobile/src/screens/SellerPendingScreen.js` | Pending verification screen |
| **NEW** | `mobile/src/screens/SellerDashboardScreen.js` | Seller home dashboard |
| **NEW** | `mobile/src/screens/SellerShopProfileScreen.js` | View shop profile |
| **NEW** | `mobile/src/screens/EditShopScreen.js` | Edit shop info |
| **MODIFY** | `mobile/src/navigation/AppNavigator.js` | Add seller navigation stacks |
| **MODIFY** | `mobile/src/screens/WelcomeScreen.js` | Wire seller link |
| **MODIFY** | `mobile/src/context/AuthContext.js` | Add seller auth functions |
| **MODIFY** | `README.md` | Add Module 2 docs |

---

## Verification Plan

### Automated Tests
1. **Start backend server:** `cd backend && npm run dev` — verify no crash
2. **Test all 12 endpoints** with Postman/curl:
   - `POST /api/sellers/register` → new seller + user created
   - `POST /api/sellers/login` → JWT returned with seller info
   - `GET /api/sellers/my-shop` → seller profile returned
   - `PUT /api/sellers/admin/:id/verify` → status changes to approved
   - All other CRUD operations
3. **Start mobile app:** `cd mobile && npm start` — scan QR, verify:
   - "Register as Seller" link works from Welcome screen
   - Multi-step registration completes
   - Pending dashboard shows after registration
   - After admin approval, seller dashboard loads

### Manual Verification
- Have one team member register as seller, another approve via admin API call (Postman)
- Verify MongoDB Atlas shows both `users` and `sellers` collections with linked documents
