# Module 3 — Product & Inventory Management — Implementation Plan

## Background

Modules 1 (User Management) and Module 2 (Seller & Shop Management) are fully complete with backend APIs, mobile screens, and navigation. Module 3 adds the ability for **verified sellers** to create/edit/manage product listings and for **customers** to browse, search, filter, and view product details — all per the system documentation (FR3.1–FR3.6).

### Existing Architecture Patterns We Will Follow

| Pattern | How Module 1 & 2 do it |
|---------|----------------------|
| **Models** | Mongoose schemas in `backend/models/` (one file per entity) |
| **Controllers** | Async `(req, res, next)` handlers in `backend/controllers/` with `checkValidation` + `try/catch/next(error)` |
| **Routes** | Express Router in `backend/routes/` with `protect`, `authorize`, `requireVerifiedSeller` middleware |
| **Validators** | `express-validator` chains exported from `backend/utils/validators.js` |
| **API response format** | `{ success: true/false, message: '...', data }` |
| **Mobile screens** | React Native functional components with `StyleSheet`, using `apiClient` from `src/api/client.js` |
| **Navigation** | Stack navigators in `AppNavigator.js`, split by role |
| **Auth** | JWT via `AuthContext`, stored in AsyncStorage |
| **Styling** | Brand color `#8B2635`, card-based UI, `borderRadius: 14–16`, consistent fonts |

---

## Proposed Changes

### Backend — Product Model

#### [NEW] [Product.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/models/Product.js)

A new Mongoose model for product listings, linked to the Seller model:

```
Product Schema Fields:
├── seller          → ObjectId ref 'Seller' (required, indexed)
├── name            → String (required, 3–200 chars)
├── description     → String (required, max 2000 chars)
├── category        → String (required, enum of clothing categories)
├── price           → Number (required, > 0, in LKR)
├── sizes           → [String] (enum: XS, S, M, L, XL, XXL, Free Size)
├── colors          → [{name: String, hexCode: String}] (min 1)
├── images          → [String] (URLs, min 1, max 10)
├── variants        → [{size, color, stock}] (per-variant stock tracking)
├── totalStock      → Number (virtual/computed from variants)
├── isPublished     → Boolean (default: true)
├── isDeleted       → Boolean (soft-delete, default: false)
├── averageRating   → Number (0–5, for Module 5)
├── totalReviews    → Number (for Module 5)
└── timestamps      → createdAt, updatedAt (auto)
```

**Categories enum** (clothing-focused for Sri Lankan boutique):
`Saree & Traditional`, `Dresses`, `Tops & Blouses`, `Pants & Trousers`, `Skirts`, `Men's Shirts`, `Men's Trousers`, `Kids Wear`, `Accessories`, `Footwear`, `Other`

**Indexes**: `seller + isPublished + isDeleted`, text index on `name + description`

---

### Backend — Product Controller

#### [NEW] [productController.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/controllers/productController.js)

| Function | FR | Route | Description |
|----------|-----|-------|-------------|
| `addProduct` | FR3.1 | POST `/api/products` | Verified seller creates a new product listing |
| `getProducts` | FR3.2 | GET `/api/products` | Customer browses/searches/filters products (paginated) |
| `getProductById` | FR3.3 | GET `/api/products/:id` | View full product detail page |
| `getMyProducts` | FR3.4 | GET `/api/products/seller/my-products` | Seller views their own products list |
| `updateProduct` | FR3.4 | PUT `/api/products/:id` | Seller edits own product info |
| `updateStock` | FR3.5 | PUT `/api/products/:id/stock` | Seller updates stock per variant |
| `unpublishProduct` | FR3.6 | PUT `/api/products/:id/unpublish` | Seller hides product from customers |
| `republishProduct` | FR3.6 | PUT `/api/products/:id/republish` | Seller re-publishes a hidden product |
| `deleteProduct` | FR3.6 | DELETE `/api/products/:id` | Seller soft-deletes a product |
| `adminUnpublishProduct` | FR3.6 | PUT `/api/products/admin/:id/unpublish` | Admin force-unpublishes any product |
| `getProductsByShop` | FR3.2 | GET `/api/products/shop/:sellerId` | Get all products for a specific shop |

**Key behaviors:**
- `getProducts` supports: keyword `search`, `category`, `minPrice`, `maxPrice`, `size`, `color`, `inStock` (boolean), `sortBy` (newest/price_low/price_high/popular), `page`, `limit`
- Stock is tracked at the **variant level** (size × color). `totalStock` is computed
- When `totalStock` reaches 0, the product auto-shows as "Out of Stock"
- Seller's `productCount` on the Seller model is incremented/decremented when products are added/deleted

---

### Backend — Product Routes

#### [NEW] [productRoutes.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/routes/productRoutes.js)

```
Public Routes (authenticated customer):
  GET   /api/products                    → Browse/search/filter products
  GET   /api/products/:id                → View product detail
  GET   /api/products/shop/:sellerId     → Products by shop

Seller Routes (JWT + verified seller):
  GET   /api/products/seller/my-products → View own products
  POST  /api/products                    → Add new product
  PUT   /api/products/:id                → Edit product
  PUT   /api/products/:id/stock          → Update stock levels
  PUT   /api/products/:id/unpublish      → Unpublish product
  PUT   /api/products/:id/republish      → Republish product
  DELETE /api/products/:id               → Soft-delete product

Admin Routes (JWT + admin role):
  PUT   /api/products/admin/:id/unpublish → Force unpublish any product
```

---

### Backend — Validators

#### [MODIFY] [validators.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/utils/validators.js)

Add Module 3 validation chains:
- `addProductValidation` — validates all product creation fields
- `updateProductValidation` — optional fields for editing
- `updateStockValidation` — validates variants array with size/color/stock
- `productIdValidation` — validates `:id` param as MongoId

---

### Backend — Server Registration

#### [MODIFY] [server.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/backend/server.js)

Uncomment and register the products route:
```diff
-// app.use('/api/products', require('./routes/productRoutes'));
+app.use('/api/products', require('./routes/productRoutes'));
```

---

### Mobile App — New Screens

#### [NEW] Seller Screens (Product Management)

| Screen | File | Description |
|--------|------|-------------|
| **MyProductsScreen** | `screens/MyProductsScreen.js` | Lists all seller's products with status badges, stock indicators, and action buttons. Pull-to-refresh. "Add Product" FAB. |
| **AddProductScreen** | `screens/AddProductScreen.js` | Multi-section form: name, description, category (picker), price, sizes (checkboxes), colors (input), images (URLs for now), stock per variant. |
| **EditProductScreen** | `screens/EditProductScreen.js` | Pre-filled edit form (same layout as Add). |
| **ManageStockScreen** | `screens/ManageStockScreen.js` | Shows all variants with current stock, editable quantity inputs, save button. |

#### [NEW] Customer Screens (Product Browsing)

| Screen | File | Description |
|--------|------|-------------|
| **ProductBrowseScreen** | `screens/ProductBrowseScreen.js` | Replaces the placeholder HomeScreen. Shows product grid with search bar, category chips, and filter modal. Paginated with infinite scroll. |
| **ProductDetailScreen** | `screens/ProductDetailScreen.js` | Full product view: image gallery, name, price, size/color selectors, stock status, description, seller info (tappable → shop profile), "Add to Cart" / "Buy Now" buttons (placeholders for Module 4). |
| **SearchFilterScreen** | `screens/SearchFilterScreen.js` | Filter modal/sheet: category, price range, sizes, colors, in-stock toggle. |

---

### Mobile App — Navigation Updates

#### [MODIFY] [AppNavigator.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/navigation/AppNavigator.js)

- Add all new screens to the appropriate stacks:
  - **SellerAppStack**: MyProducts, AddProduct, EditProduct, ManageStock
  - **CustomerAppStack**: ProductBrowse (replace Home placeholder), ProductDetail, SearchFilter

---

### Mobile App — Dashboard Updates

#### [MODIFY] [SellerDashboardScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/SellerDashboardScreen.js)

- Update "My Products" menu item to navigate to `MyProducts` screen (remove placeholder text)

#### [MODIFY] [HomeScreen.js](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/mobile/src/screens/HomeScreen.js)

- Replace the "Products Coming Soon" placeholder with actual product browsing content that fetches and displays products from the API

---

### README Update

#### [MODIFY] [README.md](file:///c:/Users/itsme/OneDrive/Desktop/Ceylon-boutique/README.md)

- Update Module 3 status from `🔲 Not Started` to `✅ Complete`
- Add full "API Endpoints — Module 3" section with all routes
- Add `products` collection to the Database Collections table
- Add request/response body examples

---

## File Summary

| Type | File | Action |
|------|------|--------|
| Backend Model | `backend/models/Product.js` | **NEW** |
| Backend Controller | `backend/controllers/productController.js` | **NEW** |
| Backend Routes | `backend/routes/productRoutes.js` | **NEW** |
| Backend Validators | `backend/utils/validators.js` | **MODIFY** (add Module 3 validations) |
| Backend Server | `backend/server.js` | **MODIFY** (register route) |
| Mobile Screen | `mobile/src/screens/MyProductsScreen.js` | **NEW** |
| Mobile Screen | `mobile/src/screens/AddProductScreen.js` | **NEW** |
| Mobile Screen | `mobile/src/screens/EditProductScreen.js` | **NEW** |
| Mobile Screen | `mobile/src/screens/ManageStockScreen.js` | **NEW** |
| Mobile Screen | `mobile/src/screens/ProductBrowseScreen.js` | **NEW** |
| Mobile Screen | `mobile/src/screens/ProductDetailScreen.js` | **NEW** |
| Mobile Screen | `mobile/src/screens/SearchFilterScreen.js` | **NEW** |
| Mobile Navigation | `mobile/src/navigation/AppNavigator.js` | **MODIFY** |
| Mobile Screen | `mobile/src/screens/SellerDashboardScreen.js` | **MODIFY** |
| Mobile Screen | `mobile/src/screens/HomeScreen.js` | **MODIFY** |
| Documentation | `README.md` | **MODIFY** |

**Total: 9 new files + 7 modified files**

---

## Open Questions

> [!IMPORTANT]
> **Image Uploads**: The existing Module 2 uses URL strings as placeholders for images (no actual file upload). Should Module 3 follow the same approach (product images as URLs typed in by the seller), or do you want us to implement actual image upload via `expo-image-picker` + a cloud service like Cloudinary? Using URLs is simpler and consistent with what's already done. **Recommendation: Use URL strings for now, same as Module 2.**

> [!NOTE]
> **Categories**: The system doc says categories come from an "admin-managed list" (FR6.10 — Module 6). Since Module 6 isn't built yet, I'll use a hardcoded list of clothing categories in the Product model. When Module 6 is built, this can be migrated to a `categories` collection.

---

## Verification Plan

### Automated Tests
1. Start the backend server: `cd backend && npm run dev`
2. Test all 11 product API endpoints using curl/Postman
3. Verify pagination, search, and filter queries work correctly
4. Confirm seller `productCount` updates on add/delete

### Manual Verification
1. Start Expo: `cd mobile && npm start`
2. Login as a verified seller → Navigate to "My Products" → Add a product → Verify it appears
3. Edit product → Verify changes persist
4. Manage stock → Update quantities → Verify changes
5. Login as customer → Browse products → Search and filter → View product detail
6. Verify unpublish/republish hides/shows products from customer view
