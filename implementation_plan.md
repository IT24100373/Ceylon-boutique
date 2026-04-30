# Module 1 — User Management (Customer Accounts)

## Background

**Project**: Ceylon Boutique Marketplace — a Sri Lanka clothing boutique marketplace app.  
**This Plan**: Covers full project scaffolding + Module 1 (FR1.1–FR1.7) which handles customer registration, login, profile management, address management, and account deactivation.

**Stack**: React Native (mobile) · Node.js + Express.js (backend) · MongoDB (database)

---

## Proposed Project Structure

```
WMT-PROJECT/
├── backend/                        # Node.js + Express API server
│   ├── package.json
│   ├── .env                        # Environment variables (DB URI, JWT secret, etc.)
│   ├── .env.example                # Template for team members
│   ├── server.js                   # Entry point — starts Express app
│   ├── config/
│   │   └── db.js                   # MongoDB connection using Mongoose
│   ├── middleware/
│   │   ├── auth.js                 # JWT authentication middleware
│   │   ├── errorHandler.js         # Global error handling middleware
│   │   └── rateLimiter.js          # Login attempt rate limiting
│   ├── models/
│   │   ├── User.js                 # Customer user model (Module 1)
│   │   └── Address.js              # Delivery address model (Module 1)
│   ├── routes/
│   │   └── userRoutes.js           # All /api/users/* routes
│   ├── controllers/
│   │   └── userController.js       # Route handler logic
│   ├── utils/
│   │   └── validators.js           # Input validation helpers
│   └── .gitignore
│
├── mobile/                         # React Native app (Expo)
│   ├── package.json
│   ├── app.json
│   ├── App.js                      # Root component with navigation
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js           # Axios instance with base URL + token
│   │   ├── context/
│   │   │   └── AuthContext.js      # Auth state (token, user) shared app-wide
│   │   ├── navigation/
│   │   │   └── AppNavigator.js     # Stack navigator (Welcome→Login→Home etc.)
│   │   ├── screens/
│   │   │   ├── WelcomeScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   ├── EditProfileScreen.js
│   │   │   ├── ChangePasswordScreen.js
│   │   │   └── AddressManagementScreen.js
│   │   ├── components/
│   │   │   ├── InputField.js       # Reusable text input with validation
│   │   │   ├── Button.js           # Styled button component
│   │   │   ├── AddressCard.js      # Address list item
│   │   │   └── LoadingSpinner.js   # Loading indicator
│   │   └── utils/
│   │       └── validators.js       # Client-side validation (email, phone, password)
│   └── .gitignore
│
├── system_documentation.pdf
└── README.md
```

> [!IMPORTANT]
> **Why this structure?** Separating `backend/` and `mobile/` keeps the codebase modular so different team members can work independently. Each folder has its own `package.json` so dependencies don't conflict.

---

## Database Schema (MongoDB via Mongoose)

### User Model (`models/User.js`)

| Field | Type | Rules |
|-------|------|-------|
| `fullName` | String | Required |
| `email` | String | Required, unique, lowercase, trimmed |
| `phone` | String | Required, validated format |
| `password` | String | Required, hashed with bcrypt (min 8 chars) |
| `role` | String | Default: `"customer"` (enum: `customer`, `seller`, `admin`) |
| `isActive` | Boolean | Default: `true` (soft-delete flag for deactivation) |
| `loginAttempts` | Number | Default: `0` (tracks failed logins) |
| `lockUntil` | Date | `null` or timestamp when lock expires |
| `createdAt` | Date | Auto (timestamps: true) |
| `updatedAt` | Date | Auto (timestamps: true) |

### Address Model (`models/Address.js`)

| Field | Type | Rules |
|-------|------|-------|
| `user` | ObjectId → User | Required, ref: "User" |
| `label` | String | e.g., "Home", "Work" |
| `addressLine1` | String | Required |
| `addressLine2` | String | Optional |
| `city` | String | Required |
| `province` | String | Required |
| `postalCode` | String | Required |
| `isDefault` | Boolean | Default: `false` |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

---

## API Endpoints

All routes are prefixed with `/api/users`.

| FR | Method | Endpoint | Auth? | Description |
|----|--------|----------|-------|-------------|
| FR1.1 | POST | `/api/users/register` | No | Customer self-registration |
| FR1.2 | POST | `/api/users/login` | No | Login, returns JWT token |
| FR1.3 | GET | `/api/users/profile` | Yes | Get own profile |
| FR1.4 | PUT | `/api/users/profile` | Yes | Update name & phone (email read-only) |
| FR1.5 | PUT | `/api/users/change-password` | Yes | Change password |
| FR1.6 | GET | `/api/users/addresses` | Yes | List all addresses |
| FR1.6 | POST | `/api/users/addresses` | Yes | Add new address |
| FR1.6 | PUT | `/api/users/addresses/:id` | Yes | Edit an address |
| FR1.6 | DELETE | `/api/users/addresses/:id` | Yes | Delete an address |
| FR1.6 | PUT | `/api/users/addresses/:id/default` | Yes | Set address as default |
| FR1.7 | PUT | `/api/users/deactivate` | Yes | Soft-delete account |

---

## Key Implementation Details

### Authentication (JWT)
- On register/login → server creates a JWT token containing `{ userId, role }` with a 7-day expiry
- Token is sent back in the response body; mobile app stores it in `AsyncStorage`
- Every protected route reads the `Authorization: Bearer <token>` header via `auth.js` middleware

### Rate Limiting (FR1.2)
- Track `loginAttempts` on the User model
- After 5 failed attempts → set `lockUntil = now + 15 minutes`
- On each login attempt, check if account is locked before validating credentials

### Password Security
- Hash passwords using `bcrypt` (salt rounds: 10) before saving
- Never return the password field in any API response

### Deactivation (FR1.7)
- Sets `isActive = false` (soft delete — data retained for order history)
- Before deactivating, the system will check for active orders (placeholder check for now, full implementation in Module 4)
- Deactivated users cannot log in — they see a "contact support" message

### Address Default Logic (FR1.6)
- When setting a new default, unset the previous default first (atomic operation)
- The default address auto-populates at checkout (used in Module 4)

---

## Proposed Changes

### Backend Setup

#### [NEW] [.env.example](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/.env.example)
Template with `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE` placeholders.

#### [NEW] [package.json](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/package.json)
Dependencies: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `express-validator`, `express-rate-limit`. Dev: `nodemon`.

#### [NEW] [server.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/server.js)
Express app setup — loads env, connects to MongoDB, mounts routes, applies error handler.

#### [NEW] [config/db.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/config/db.js)
Mongoose connection with error handling and connection success logging.

---

### Backend Models

#### [NEW] [models/User.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/models/User.js)
Customer schema with pre-save bcrypt hashing and a `comparePassword` instance method.

#### [NEW] [models/Address.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/models/Address.js)
Address schema linked to User via ObjectId reference.

---

### Backend Middleware

#### [NEW] [middleware/auth.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/middleware/auth.js)
Extracts JWT from `Authorization` header, verifies it, attaches `req.user` with `userId` and `role`.

#### [NEW] [middleware/errorHandler.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/middleware/errorHandler.js)
Catches all errors, returns consistent JSON format: `{ success: false, message, errors }`.

#### [NEW] [middleware/rateLimiter.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/middleware/rateLimiter.js)
Rate limiter for the login endpoint (max 10 requests per 15 min window per IP).

---

### Backend Routes & Controllers

#### [NEW] [routes/userRoutes.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/routes/userRoutes.js)
Defines all 11 endpoints listed above with validation middleware using `express-validator`.

#### [NEW] [controllers/userController.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/controllers/userController.js)
All handler functions: `register`, `login`, `getProfile`, `updateProfile`, `changePassword`, `getAddresses`, `addAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`, `deactivateAccount`.

#### [NEW] [utils/validators.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/backend/utils/validators.js)
Reusable validation chains for registration, login, profile update, password change, and address operations.

---

### Mobile App Setup

#### [NEW] [package.json](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/package.json)
Expo-based React Native project. Dependencies: `@react-navigation/native`, `@react-navigation/stack`, `axios`, `@react-native-async-storage/async-storage`.

#### [NEW] [App.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/App.js)
Root component wrapping `AuthProvider` and `AppNavigator`.

---

### Mobile Navigation & Auth

#### [NEW] [src/navigation/AppNavigator.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/navigation/AppNavigator.js)
Stack navigator with conditional rendering: unauthenticated → Welcome/Login/Register; authenticated → Home/Profile/etc.

#### [NEW] [src/context/AuthContext.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/context/AuthContext.js)
React Context providing: `user`, `token`, `login()`, `logout()`, `register()`, `isLoading`. Persists token in AsyncStorage and auto-loads on app start.

#### [NEW] [src/api/client.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/api/client.js)
Axios instance with `baseURL` pointed at backend. Interceptor auto-attaches JWT token to every request.

---

### Mobile Screens (Module 1)

#### [NEW] [src/screens/WelcomeScreen.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/screens/WelcomeScreen.js)
App entry point with "Login" and "Register" buttons. Auto-redirects to Home if valid session exists.

#### [NEW] [src/screens/RegisterScreen.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/screens/RegisterScreen.js)
Registration form: full name, email, phone, password, confirm password, home address. Real-time validation. Calls `POST /api/users/register`.

#### [NEW] [src/screens/LoginScreen.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/screens/LoginScreen.js)
Login form: email + password. Shows error messages for wrong credentials, locked accounts, and deactivated accounts.

#### [NEW] [src/screens/HomeScreen.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/screens/HomeScreen.js)
Placeholder home screen (Browse Products — will be fully built in Module 3). Shows welcome message for now.

#### [NEW] [src/screens/ProfileScreen.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/screens/ProfileScreen.js)
Read-only profile view showing name, email, phone, registered date. Links to Edit Profile, Change Password, My Addresses, Deactivate Account.

#### [NEW] [src/screens/EditProfileScreen.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/screens/EditProfileScreen.js)
Editable form for name and phone (email is read-only). Calls `PUT /api/users/profile`.

#### [NEW] [src/screens/ChangePasswordScreen.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/screens/ChangePasswordScreen.js)
Three fields: current password, new password, confirm new password. Calls `PUT /api/users/change-password`.

#### [NEW] [src/screens/AddressManagementScreen.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/screens/AddressManagementScreen.js)
Lists saved addresses with default badge. Add, edit, delete, set-default actions. Uses a modal/form for add/edit.

---

### Shared Files

#### [NEW] [src/components/InputField.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/components/InputField.js)
Reusable text input with label, error message display, and icon support.

#### [NEW] [src/components/Button.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/components/Button.js)
Styled button with loading state, primary/secondary variants.

#### [NEW] [src/components/AddressCard.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/components/AddressCard.js)
Address list item card with default badge, edit/delete icons.

#### [NEW] [src/components/LoadingSpinner.js](file:///c:/Users/DELL/Desktop/WMT-PROJECT/mobile/src/components/LoadingSpinner.js)
Centered loading indicator overlay.

#### [NEW] [README.md](file:///c:/Users/DELL/Desktop/WMT-PROJECT/README.md)
Project overview, setup instructions for both backend and mobile, environment variable documentation, and team conventions.

---

## Open Questions

> [!IMPORTANT]
> **MongoDB Atlas**: Do you already have a MongoDB Atlas cluster set up for online hosting? If not, I'll include setup instructions. The free tier (M0) works for development.

> [!IMPORTANT]
> **Backend Hosting**: For deploying the Node.js backend online, which platform do you prefer? Options:
> - **Render** (free tier available, easy setup)
> - **Railway** (generous free tier)
> - **Vercel** (good for serverless, but less ideal for Express)
> - **AWS / DigitalOcean** (more control, not free)

> [!IMPORTANT]
> **Expo or Bare React Native?** I recommend **Expo** (managed workflow) for faster development since your team has 6 members and this is a team project. It simplifies builds, testing on real devices, and deployment. Is that okay?

> [!IMPORTANT]
> **Image uploads**: The seller registration (Module 2) requires document uploads. Should I set up **Cloudinary** or **AWS S3** for file storage from the beginning, or add it when we reach Module 2?

---

## Verification Plan

### Automated Tests
1. **Backend API testing** with Postman/Thunder Client:
   - Register a new customer → expect 201 + token
   - Register with duplicate email → expect 400
   - Login with correct credentials → expect 200 + token
   - Login with wrong password 5 times → expect 429 (locked)
   - Get profile with valid token → expect 200 + user data
   - Update profile → expect 200
   - Change password → expect 200
   - CRUD addresses → expect correct responses
   - Deactivate account → expect 200, then login should fail

2. **MongoDB verification**: Check documents are created correctly in Atlas/Compass

### Manual Verification
- Team members test on their local machines using `npm run dev`
- React Native app tested on real devices via Expo Go
- Backend tested via Postman collection (will be shared)
