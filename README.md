# Ceylon Boutique Marketplace

Sri Lanka's Authentic Clothing Boutique Marketplace App  
**Version:** 1.0.0 | **Team Size:** 6 Members | **Status:** In Development

---

## Project Structure

```
WMT-PROJECT/
├── backend/      # Node.js + Express REST API
└── mobile/       # Expo React Native app
```

---

## Module Progress

| Module | Description | Status |
|--------|-------------|--------|
| Module 1 | User Management (Customer Accounts) | ✅ Complete |
| Module 2 | Seller & Shop Management | ✅ Complete |
| Module 3 | Product & Inventory Management | ✅ Complete |
| Module 4 | Order Management | ✅ Complete |
| Module 5 | Reviews & Ratings | 🔲 Not Started |
| Module 6 | Admin & Platform Management (Web) | 🔲 Not Started |

---

## Prerequisites

Make sure these are installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [Expo Go](https://expo.dev/go) app on your phone (for testing)
- A [MongoDB Atlas](https://cloud.mongodb.com) account (free M0 cluster)

---

## Step 1 — MongoDB Atlas Setup (One-time, done by one team member)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Click **"Create a Free Cluster"** → choose **M0 (Free)** → select any region
3. Under **Database Access** → Add a new database user (username + password)
4. Under **Network Access** → Add IP Address → choose **"Allow access from anywhere"** (`0.0.0.0/0`)
5. Go to your cluster → click **"Connect"** → **"Connect your application"**
6. Copy the connection string — it looks like:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Add your database name to the URI:
   ```
   mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/ceylon_boutique?retryWrites=true&w=majority
   ```
8. Share this URI with your team (via a secure channel — NOT in Git)

---

## Step 2 — Backend Setup (Local Development)

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create your .env file from the template
copy .env.example .env    # Windows
# OR
cp .env.example .env      # Mac/Linux

# 4. Open .env and fill in your values:
#    - MONGODB_URI = your Atlas connection string from Step 1
#    - JWT_SECRET  = generate one by running: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
#    - PORT        = 5000

# 5. Start the development server
npm run dev
```

The API will run at: `http://localhost:5000`  
Test it: open a browser and go to `http://localhost:5000` — you should see a JSON response.

---

## Step 3 — Mobile App Setup (Local Development)

```bash
# 1. Navigate to mobile folder
cd mobile

# 2. Install dependencies
npm install

# 3. Set your backend URL
#    Open: mobile/src/api/client.js
#    Change BASE_URL to your local machine's IP address (NOT localhost)
#    Find your IP: run "ipconfig" in Windows terminal → look for IPv4 Address
#    Example: const BASE_URL = 'http://192.168.1.45:5000';

# 4. Start the Expo development server
npm start

# 5. On your phone:
#    - Install "Expo Go" from the App Store or Play Store
#    - Scan the QR code shown in the terminal
#    - Your phone and computer must be on the SAME Wi-Fi network
```

---

## Step 4 — Deploy Backend to Render (Production)

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)
2. Go to [https://render.com](https://render.com) and sign up/login
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Name:** `ceylon-boutique-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Under **"Environment Variables"**, add:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = your generated secret
   - `JWT_EXPIRE` = `7d`
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = `*`
7. Click **"Create Web Service"**
8. Wait for deployment — your API will be at: `https://ceylon-boutique-api.onrender.com`

9. **Update mobile app:** open `mobile/src/api/client.js` and change `BASE_URL` to your Render URL

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for signing tokens | 64-char random hex string |
| `JWT_EXPIRE` | Token expiry duration | `7d` |
| `CORS_ORIGIN` | Allowed origins for CORS | `*` or your app domain |

---

## API Endpoints — Module 1 (User Management)

Base URL: `http://localhost:5000` (dev) or `https://your-app.onrender.com` (prod)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/users/register` | No | Register a new customer |
| POST | `/api/users/login` | No | Login and get JWT token |
| GET | `/api/users/profile` | Yes | Get your profile |
| PUT | `/api/users/profile` | Yes | Update name and phone |
| PUT | `/api/users/change-password` | Yes | Change password |
| GET | `/api/users/addresses` | Yes | List all addresses |
| POST | `/api/users/addresses` | Yes | Add a new address |
| PUT | `/api/users/addresses/:id` | Yes | Edit an address |
| DELETE | `/api/users/addresses/:id` | Yes | Delete an address |
| PUT | `/api/users/addresses/:id/default` | Yes | Set default address |
| PUT | `/api/users/deactivate` | Yes | Deactivate account |

**Auth Header format:** `Authorization: Bearer <your_token>`

---

## API Endpoints — Module 2 (Seller & Shop Management)

### Public Routes (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sellers/register` | Register a new seller (creates User + Shop) |
| POST | `/api/sellers/login` | Seller login (returns verification status) |
| GET | `/api/sellers/shop/:id` | View a shop's public profile |

### Seller Routes (JWT Required — role: seller)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sellers/my-shop` | View own shop profile |
| GET | `/api/sellers/dashboard` | Get seller dashboard data |
| PUT | `/api/sellers/my-shop` | Edit shop info (verified only) |
| PUT | `/api/sellers/my-shop/documents` | Update business documents (verified only) |

### Admin Routes (JWT Required — role: admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sellers/admin/all` | List all sellers (with filters) |
| GET | `/api/sellers/admin/:id` | Get full seller details |
| PUT | `/api/sellers/admin/:id/verify` | Approve or reject a seller |
| PUT | `/api/sellers/admin/:id/suspend` | Suspend a seller |
| PUT | `/api/sellers/admin/:id/remove` | Permanently remove a seller |

### Seller Registration — Request Body Example

```json
{
  "fullName": "Kasun Perera",
  "email": "kasun@email.com",
  "phone": "0771234567",
  "password": "MyPass123",
  "confirmPassword": "MyPass123",
  "shopName": "Colombo Silk House",
  "shopDescription": "Premium handloom sarees from Sri Lanka",
  "categoryFocus": "Saree & Traditional",
  "businessRegNumber": "PV00123456",
  "nicNumber": "200012345678",
  "bankName": "Commercial Bank",
  "bankBranch": "Colombo Fort",
  "bankAccountNumber": "1234567890",
  "bankAccountName": "Kasun Perera",
  "contactAddress": {
    "addressLine1": "45 Galle Road",
    "addressLine2": "Floor 2",
    "city": "Colombo",
    "province": "Western",
    "postalCode": "10100"
  }
}
```

### Admin Verify Seller — Request Body

```json
{
  "status": "approved"
}
```
or
```json
{
  "status": "rejected",
  "rejectionReason": "Business registration document is not valid"
}
```

### Admin Filter Sellers — Query Parameters

```
GET /api/sellers/admin/all?status=pending&search=silk&page=1&limit=10
```

---

## API Endpoints — Module 3 (Product & Inventory Management)

### Public Routes (JWT Required — any authenticated user)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Browse, search, and filter products (paginated) |
| GET | `/api/products/:id` | View full product detail page |
| GET | `/api/products/shop/:sellerId` | Get all published products for a shop |

### Seller Routes (JWT Required — verified seller only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/seller/my-products` | View own product listings (with status filter) |
| POST | `/api/products` | Add a new product listing |
| PUT | `/api/products/:id` | Edit product info (name, description, price, etc.) |
| PUT | `/api/products/:id/stock` | Update stock quantity per variant |
| PUT | `/api/products/:id/unpublish` | Hide product from customers |
| PUT | `/api/products/:id/republish` | Make hidden product visible again |
| DELETE | `/api/products/:id` | Soft-delete a product |

### Admin Routes (JWT Required — role: admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/products/admin/:id/unpublish` | Force-unpublish any product |

### Browse Products — Query Parameters

```
GET /api/products?search=saree&category=Saree%20%26%20Traditional&minPrice=1000&maxPrice=5000&size=M&color=Red&inStock=true&sortBy=newest&page=1&limit=10
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Keyword search on product name and description |
| `category` | string | Filter by product category |
| `minPrice` | number | Minimum price (LKR) |
| `maxPrice` | number | Maximum price (LKR) |
| `size` | string | Filter by size (e.g. S, M, L, XL) |
| `color` | string | Filter by color name |
| `inStock` | boolean | Show only in-stock products (`true`) |
| `sortBy` | string | Sort order: `newest`, `price_low`, `price_high`, `popular` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

### Add Product — Request Body Example

```json
{
  "name": "Handloom Cotton Saree",
  "description": "Beautiful handloom cotton saree from Kandy region. Perfect for daily wear and casual occasions.",
  "category": "Saree & Traditional",
  "price": 3500,
  "sizes": ["Free Size"],
  "colors": [
    { "name": "Red", "hexCode": "#FF0000" },
    { "name": "Blue", "hexCode": "#0000FF" }
  ],
  "images": [
    "https://example.com/saree-red.jpg",
    "https://example.com/saree-blue.jpg"
  ],
  "variants": [
    { "size": "Free Size", "color": "Red", "stock": 15 },
    { "size": "Free Size", "color": "Blue", "stock": 10 }
  ]
}
```

### Update Stock — Request Body Example

```json
{
  "variants": [
    { "size": "Free Size", "color": "Red", "stock": 8 },
    { "size": "Free Size", "color": "Blue", "stock": 0 }
  ]
}
```

### Product Categories

The following categories are available for product listings:

| Category |
|----------|
| Saree & Traditional |
| Dresses |
| Tops & Blouses |
| Pants & Trousers |
| Skirts |
| Men's Shirts |
| Men's Trousers |
| Kids Wear |
| Accessories |
| Footwear |
| Other |

### My Products — Query Parameters

```
GET /api/products/seller/my-products?status=published&page=1&limit=20
```

| Parameter | Values | Description |
|-----------|--------|-------------|
| `status` | `published`, `unpublished`, `out_of_stock` | Filter own products by status |

---

## API Endpoints — Module 4 (Order Management)

### Customer Routes (JWT Required)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | Yes | Place a new order |
| GET | `/api/orders/my-orders` | Yes | View order history (with status filter) |
| GET | `/api/orders/:id` | Yes | View full order detail |
| PUT | `/api/orders/:id/cancel` | Yes | Cancel a pending order |

### Seller Routes (JWT Required — role: seller, verified)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/seller/my-orders` | View incoming orders for own products |
| GET | `/api/orders/seller/:id` | View full detail of a specific order |
| PUT | `/api/orders/seller/:id/confirm` | Confirm a pending order |
| PUT | `/api/orders/seller/:id/ship` | Mark order as shipped (with optional tracking info) |

### Admin Routes (JWT Required — role: admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/admin/all` | List all orders platform-wide (with filters) |
| GET | `/api/orders/admin/:id` | View full detail of any order |
| PUT | `/api/orders/admin/:id/cancel` | Cancel order (before shipped) |
| PUT | `/api/orders/admin/:id/deliver` | Mark order as delivered |

### Order Status Lifecycle

```
Pending → Confirmed → Shipped → Delivered
              ↘           ↘
           Cancelled   (Admin can cancel up to Confirmed only)
```

| Status | Who Changes It | Customer Can Cancel? | Admin Can Cancel? |
|--------|----------------|---------------------|------------------|
| `pending` | System (on placement) | ✅ Yes | ✅ Yes |
| `confirmed` | Seller | ❌ No | ✅ Yes |
| `shipped` | Seller | ❌ No | ❌ No |
| `delivered` | Admin | ❌ No | ❌ No |
| `cancelled` | Customer / Admin | — | — |

### Place Order — Request Body Example

```json
{
  "items": [
    {
      "product": "664f1a2b3c4d5e6f7a8b9c0d",
      "size": "M",
      "color": "Red",
      "quantity": 2
    },
    {
      "product": "664f1a2b3c4d5e6f7a8b9c0e",
      "size": "Free Size",
      "color": "Blue",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "label": "Home",
    "addressLine1": "45 Galle Road",
    "addressLine2": "Floor 2",
    "city": "Colombo",
    "province": "Western",
    "postalCode": "10100"
  },
  "paymentMethod": "COD"
}
```

> **Payment Methods:** `COD` (Cash on Delivery) or `card` (simulated as paid — real gateway pluggable later).

### Cancel Order — Request Body

```json
{
  "reason": "Changed my mind about the color"
}
```

### Ship Order — Request Body (Seller)

```json
{
  "courierName": "DHL Express",
  "trackingNumber": "DHL123456789LK"
}
```

> Both fields are optional. You can ship without entering courier details.

### My Orders — Query Parameters

```
GET /api/orders/my-orders?status=pending&page=1&limit=10
```

| Parameter | Values | Description |
|-----------|--------|-------------|
| `status` | `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` | Filter by order status |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |

### Admin All Orders — Query Parameters

```
GET /api/orders/admin/all?status=pending&paymentMethod=COD&paymentStatus=pending&search=CB-171&page=1&limit=20
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by order status |
| `paymentMethod` | `COD` or `card` | Filter by payment method |
| `paymentStatus` | `pending`, `paid`, `refund_initiated` | Filter by payment status |
| `search` | string | Search by order number (e.g. `CB-171`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

---

## Database Collections (MongoDB)

| Collection | Module | Description |
|------------|--------|-------------|
| `users` | Module 1 | Customer, Seller, and Admin accounts |
| `addresses` | Module 1 | Customer delivery addresses |
| `sellers` | Module 2 | Seller shop profiles (linked to users) |
| `products` | Module 3 | Product listings with variants and stock (linked to sellers) |
| `orders` | Module 4 | Customer orders with embedded items, status history, and shipping address |

---

## Team Conventions

- Never commit `.env` files — they contain secrets
- Always create a feature branch: `git checkout -b feature/your-feature-name`
- Write clear commit messages: `feat: add login endpoint` / `fix: password validation bug`
- Test your API endpoints with Postman before pushing
- Each module has its own controller, route, and model files

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | React Native (Expo) |
| Backend API | Node.js + Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT (JSON Web Tokens) |
| Password Security | bcryptjs |
| Deployment (API) | Render |
| Deployment (Mobile) | Expo Go (dev) / EAS Build (prod) |
