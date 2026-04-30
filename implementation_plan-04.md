# Module 4: Order Management — Implementation Plan

## Goal

Implement the complete **Order Management** module for Ceylon Boutique Marketplace, covering the full order lifecycle: placement, seller notification, status progression (Pending → Confirmed → Shipped → Delivered), cancellation, and admin oversight. This follows the exact architecture, coding patterns, and conventions established in Modules 1–3.

---

## Background & Context

### What We Already Have (Modules 1–3)

| Layer | Pattern | Files |
|-------|---------|-------|
| **Models** | Mongoose schemas with `timestamps: true`, indexes, pre-save hooks | `User.js`, `Address.js`, `Seller.js`, `Product.js` |
| **Controllers** | `async (req, res, next)` + `try/catch` + `next(error)`, `checkValidation()` helper | `userController.js`, `sellerController.js`, `productController.js` |
| **Routes** | `express.Router()`, grouped by Public → Protected → Seller → Admin | `userRoutes.js`, `sellerRoutes.js`, `productRoutes.js` |
| **Middleware** | `protect`, `authorize(role)`, `requireVerifiedSeller` | `auth.js` |
| **Validators** | `express-validator` `body()` / `param()` chains, exported as arrays | `validators.js` |

### What Module 4 Needs (from System Documentation)

- **FR4.1** — Place an Order (Customer)
- **FR4.2** — Auto-notify seller on order placement (simplified as in-DB, no email service)
- **FR4.3** — View Order History (Customer / Seller / Admin)
- **FR4.4** — View Order Detail & Status Tracking
- **FR4.5** — Order Status Lifecycle: `Pending → Confirmed → Shipped → Delivered`
- **FR4.6** — Seller Updates Order Status (Confirm / Ship)
- **FR4.7** — Cancel Order (Customer before Confirmed, Admin before Shipped)
- **FR4.8** — Admin Order Oversight (list all, filter, view detail, cancel, mark delivered)

---

## Proposed Changes

### 1. Database Design — Order Model

#### [NEW] [Order.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/models/Order.js)

A single `orders` collection handles the full order. Each order has embedded `items` (one per product/variant purchased). This avoids a separate `orderItems` collection and keeps queries simple — matching the embedded-subdocument pattern used in `Product.js` (variants).

```
Order Schema:
├── customer        → ObjectId ref 'User' (the buyer)
├── orderNumber     → String (auto-generated: "CB-1714500000000-XXXX")
├── items[]         → Embedded subdocuments:
│   ├── product     → ObjectId ref 'Product'
│   ├── seller      → ObjectId ref 'Seller'
│   ├── productName → String (snapshot — preserved even if product edited)
│   ├── productImage→ String (snapshot)
│   ├── category    → String (snapshot)
│   ├── size        → String
│   ├── color       → String
│   ├── quantity    → Number (min 1)
│   ├── price       → Number (per-unit price at time of order)
│   └── itemTotal   → Number (price × quantity)
├── shippingAddress → Embedded object (snapshot from customer's address):
│   ├── label, addressLine1, addressLine2, city, province, postalCode
├── paymentMethod   → String enum ['COD', 'card']
├── paymentStatus   → String enum ['pending', 'paid', 'refund_initiated'] default 'pending'
├── subtotal        → Number (sum of all itemTotals)
├── deliveryFee     → Number (default 0, for future use)
├── totalAmount     → Number (subtotal + deliveryFee)
├── status          → String enum ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
├── statusHistory[] → Embedded array:
│   ├── status      → String
│   ├── timestamp   → Date
│   ├── note        → String (e.g., "Cancelled by customer", tracking number)
│   └── updatedBy   → String enum ['customer', 'seller', 'admin', 'system']
├── cancellationReason → String (if cancelled)
├── trackingNumber  → String (added when shipped)
├── courierName     → String (added when shipped)
├── timestamps      → createdAt, updatedAt (auto)
```

**Key design decisions:**
- **Snapshot product data** into order items (name, image, price) so the order record is immutable even if the seller later edits or deletes the product.
- **Single `status` field** on the order level (not per-item) — this keeps it simple for an MVP. The system doc treats orders as having one status.
- **`statusHistory` array** provides a full audit trail with timestamps, exactly matching FR4.4's "order status timeline with timestamps."
- **`orderNumber`** is a human-friendly ID (e.g., `CB-1714500000000-A3F2`) separate from MongoDB `_id`.

**Indexes:**
```javascript
orderSchema.index({ customer: 1, createdAt: -1 });        // Customer order history
orderSchema.index({ 'items.seller': 1, createdAt: -1 });   // Seller order queries
orderSchema.index({ status: 1 });                          // Status filtering
orderSchema.index({ orderNumber: 1 }, { unique: true });   // Lookup by order number
```

---

### 2. Controller — Order Controller

#### [NEW] [orderController.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/controllers/orderController.js)

Following the exact pattern from `productController.js` and `sellerController.js`:

```javascript
const { validationResult } = require('express-validator');
const checkValidation = (req, res) => { /* same helper */ };
```

**Endpoints implemented:**

| # | Function | FR | Route | Actor |
|---|----------|----|-------|-------|
| 1 | `placeOrder` | FR4.1 | `POST /api/orders` | Customer |
| 2 | `getMyOrders` | FR4.3 | `GET /api/orders/my-orders` | Customer |
| 3 | `getOrderDetail` | FR4.4 | `GET /api/orders/:id` | Customer |
| 4 | `cancelOrder` | FR4.7 | `PUT /api/orders/:id/cancel` | Customer |
| 5 | `getSellerOrders` | FR4.3 | `GET /api/orders/seller/my-orders` | Seller |
| 6 | `getSellerOrderDetail` | FR4.4 | `GET /api/orders/seller/:id` | Seller |
| 7 | `confirmOrder` | FR4.6 | `PUT /api/orders/seller/:id/confirm` | Seller |
| 8 | `shipOrder` | FR4.6 | `PUT /api/orders/seller/:id/ship` | Seller |
| 9 | `getAllOrders` | FR4.8 | `GET /api/orders/admin/all` | Admin |
| 10 | `getAdminOrderDetail` | FR4.8 | `GET /api/orders/admin/:id` | Admin |
| 11 | `adminCancelOrder` | FR4.7 | `PUT /api/orders/admin/:id/cancel` | Admin |
| 12 | `adminMarkDelivered` | FR4.5 | `PUT /api/orders/admin/:id/deliver` | Admin |

**Key logic in `placeOrder`:**

```
1. Validate request body (items, shippingAddress, paymentMethod)
2. For each item:
   a. Find the Product (must be published, not deleted)
   b. Find the matching variant (size + color)
   c. Check stock >= requested quantity
   d. Snapshot product data (name, image, price)
3. Deduct stock from each variant (update Product)
4. Fetch the customer's shipping address (or use provided one)
5. Calculate subtotal, deliveryFee, totalAmount
6. Generate unique orderNumber
7. Create Order document with status 'pending'
8. If paymentMethod === 'COD' → paymentStatus = 'pending'
9. If paymentMethod === 'card' → paymentStatus = 'paid' (simulated)
10. Return order confirmation
```

**Key logic in `cancelOrder` (Customer):**
```
1. Find order belonging to this customer
2. Check status === 'pending' (customer can ONLY cancel pending orders)
3. Restore stock for each item (increment variant stock back)
4. Set status to 'cancelled', add to statusHistory
5. If card payment → set paymentStatus to 'refund_initiated'
```

**Key logic in `confirmOrder` (Seller):**
```
1. Find order that contains items belonging to this seller
2. Check current status === 'pending'
3. Update status to 'confirmed', add to statusHistory
```

**Key logic in `shipOrder` (Seller):**
```
1. Find order containing this seller's items
2. Check current status === 'confirmed'
3. Update status to 'shipped', save courierName + trackingNumber
4. Add to statusHistory
```

---

### 3. Routes — Order Routes

#### [NEW] [orderRoutes.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/routes/orderRoutes.js)

Following the same grouped pattern as `productRoutes.js`:

```
// Customer routes (JWT required)
POST   /                       → placeOrder
GET    /my-orders               → getMyOrders
GET    /:id                     → getOrderDetail          (must be LAST)
PUT    /:id/cancel              → cancelOrder

// Seller routes (JWT + verified seller)
GET    /seller/my-orders        → getSellerOrders
GET    /seller/:id              → getSellerOrderDetail
PUT    /seller/:id/confirm      → confirmOrder
PUT    /seller/:id/ship         → shipOrder

// Admin routes (JWT + admin role)
GET    /admin/all               → getAllOrders
GET    /admin/:id               → getAdminOrderDetail
PUT    /admin/:id/cancel        → adminCancelOrder
PUT    /admin/:id/deliver       → adminMarkDelivered
```

---

### 4. Validators — Order Validation Rules

#### [MODIFY] [validators.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/utils/validators.js)

Add the following validation rule sets at the end of the file (before `module.exports`):

```javascript
// -------------------------------------------------------
// FR4.1 — Place Order
// -------------------------------------------------------
const placeOrderValidation = [
  body('items')
    .isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  body('items.*.size')
    .trim().notEmpty().withMessage('Size is required'),
  body('items.*.color')
    .trim().notEmpty().withMessage('Color is required'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress')
    .notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.addressLine1')
    .trim().notEmpty().withMessage('Address line 1 is required'),
  body('shippingAddress.city')
    .trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.province')
    .trim().notEmpty().withMessage('Province is required')
    .isIn([...9 provinces...]),
  body('shippingAddress.postalCode')
    .trim().notEmpty().withMessage('Postal code is required')
    .matches(/^[0-9]{5}$/),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['COD', 'card']).withMessage('Payment method must be COD or card'),
];

// FR4.7 — Cancel Order
const cancelOrderValidation = [
  body('reason')
    .trim().notEmpty().withMessage('Cancellation reason is required')
    .isLength({ max: 500 }),
];

// FR4.6 — Ship Order
const shipOrderValidation = [
  body('courierName').optional().trim(),
  body('trackingNumber').optional().trim(),
];

// Module 4 — Order ID param
const orderIdValidation = [
  param('id').isMongoId().withMessage('Invalid order ID'),
];
```

Update the `module.exports` to include these new validators.

---

### 5. Server Integration

#### [MODIFY] [server.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/server.js)

Uncomment and activate the order routes:

```diff
 app.use('/api/products', require('./routes/productRoutes'));
-// app.use('/api/orders', require('./routes/orderRoutes'));
+// Module 4 — Order Management
+app.use('/api/orders', require('./routes/orderRoutes'));
```

---

### 6. Seller Dashboard Integration

#### [MODIFY] [sellerController.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/controllers/sellerController.js)

Update the `getSellerDashboard` function (line 260) to query **real order data** instead of returning placeholder zeros:

```diff
-  pendingOrders: 0, totalOrders: 0, revenue: 0, // Module 4 placeholders
+  pendingOrders: await Order.countDocuments({ 'items.seller': seller._id, status: 'pending' }),
+  totalOrders: await Order.countDocuments({ 'items.seller': seller._id }),
+  revenue: (aggregate pipeline to sum totalAmount for delivered orders),
```

---

### 7. README.md Update

#### [MODIFY] [README.md](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/README.md)

1. Update **Module Progress** table: Module 4 status → `✅ Complete`
2. Add full **API Endpoints — Module 4** section with all 12 endpoints
3. Add request/response examples for `Place Order`, `Cancel Order`, `Ship Order`
4. Add `orders` to the **Database Collections** table
5. Add query parameter documentation for order filtering

---

## API Endpoint Summary

### Customer Routes (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place a new order |
| GET | `/api/orders/my-orders` | View order history (with status filter) |
| GET | `/api/orders/:id` | View order detail |
| PUT | `/api/orders/:id/cancel` | Cancel a pending order |

### Seller Routes (JWT + Verified Seller)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/seller/my-orders` | View incoming orders (with status filter) |
| GET | `/api/orders/seller/:id` | View order detail for own products |
| PUT | `/api/orders/seller/:id/confirm` | Confirm a pending order |
| PUT | `/api/orders/seller/:id/ship` | Mark order as shipped (with tracking info) |

### Admin Routes (JWT + Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/admin/all` | List all orders (with filters) |
| GET | `/api/orders/admin/:id` | View full order detail |
| PUT | `/api/orders/admin/:id/cancel` | Cancel order (before shipped) |
| PUT | `/api/orders/admin/:id/deliver` | Mark order as delivered |

---

## Request/Response Examples

### Place Order — Request Body

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

### Place Order — Response (201)

```json
{
  "success": true,
  "message": "Order placed successfully! Your order number is CB-1714500000000-A3F2.",
  "order": {
    "id": "664f1a...",
    "orderNumber": "CB-1714500000000-A3F2",
    "items": [...],
    "totalAmount": 10500,
    "paymentMethod": "COD",
    "paymentStatus": "pending",
    "status": "pending",
    "createdAt": "2026-04-30T..."
  }
}
```

### Cancel Order — Request Body

```json
{
  "reason": "Changed my mind about the color"
}
```

### Ship Order — Request Body

```json
{
  "courierName": "DHL Express",
  "trackingNumber": "DHL123456789LK"
}
```

### Customer Order History — Query Parameters

```
GET /api/orders/my-orders?status=pending&page=1&limit=10
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |

### Admin All Orders — Query Parameters

```
GET /api/orders/admin/all?status=pending&paymentMethod=COD&search=CB-171&page=1&limit=20
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by order status |
| `paymentMethod` | string | Filter: `COD` or `card` |
| `search` | string | Search by order number |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |

---

## Files to Create/Modify — Summary

| Action | File | Purpose |
|--------|------|---------|
| **CREATE** | `backend/models/Order.js` | Order + OrderItem Mongoose schema |
| **CREATE** | `backend/controllers/orderController.js` | All 12 order endpoint handlers |
| **CREATE** | `backend/routes/orderRoutes.js` | Route definitions with middleware |
| **MODIFY** | `backend/utils/validators.js` | Add order validation rules |
| **MODIFY** | `backend/server.js` | Register `/api/orders` route |
| **MODIFY** | `backend/controllers/sellerController.js` | Real dashboard stats from orders |
| **MODIFY** | `README.md` | Module 4 docs, endpoints, examples |

---

## Verification Plan

### Automated Testing (via curl / Postman)

After implementation, test the complete order lifecycle:

1. **Register a customer** → get token
2. **Register a seller** → get token → admin approves seller
3. **Seller adds a product** with stock
4. **Customer places an order** → verify stock deducted
5. **Seller confirms order** → verify status change
6. **Seller ships order** → verify tracking saved
7. **Admin marks delivered** → verify final status
8. **Customer cancels a pending order** → verify stock restored
9. **Admin cancels a confirmed order** → verify stock restored
10. **Check seller dashboard** → verify real stats (pendingOrders, totalOrders, revenue)

### Server Health Check

```bash
# After restarting the dev server:
curl http://localhost:5000/
# Should return: { "success": true, "message": "Ceylon Boutique Marketplace API is running." }

# Quick test — place an order (requires valid token and product ID):
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <customer_token>" \
  -H "Content-Type: application/json" \
  -d '{ "items": [...], "shippingAddress": {...}, "paymentMethod": "COD" }'
```

---

> [!IMPORTANT]
> **No new npm packages required.** Module 4 uses only the existing dependencies (mongoose, express, express-validator, jsonwebtoken). No email or notification service is added — seller notification is handled via the in-app order list (sellers check their "Orders" tab), matching the MVP approach used in Modules 1–3.

> [!NOTE]
> **Payment gateway integration is simulated.** Per the system documentation, card payments would redirect to PayHere/Stripe. For this implementation, card orders are created with `paymentStatus: 'paid'` immediately. A real gateway can be plugged in later without changing the order model.
