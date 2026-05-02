# Module 5: Reviews & Ratings — Implementation Plan

## Project Analysis Summary

| Layer | What Exists (Modules 1–4) |
|-------|--------------------------|
| **Backend** | `server.js`, `config/db.js`, 5 models (`User`, `Address`, `Seller`, `Product`, `Order`), 4 controllers, 4 route files, 3 middleware (`auth`, `errorHandler`, `rateLimiter`), `validators.js` |
| **Mobile** | `App.js`, `api/client.js`, 2 contexts (`AuthContext`, `CartContext`), `AppNavigator.js`, 28 screens, 4 components |
| **Patterns** | Express + Mongoose, JWT auth with `protect`/`authorize`/`requireVerifiedSeller`, `express-validator`, consistent `{ success, message }` JSON responses, Expo React Native with stack navigation |

> [!NOTE]
> The `Product.js` model already has `averageRating` and `totalReviews` fields (lines 154–163). The `Seller.js` model also has `averageRating` and `totalReviews` (lines 161–170). Both are defaulted to `0`, ready for Module 5 to update. The `server.js` already has a placeholder comment: `// app.use('/api/reviews', require('./routes/reviewRoutes'));` at line 42.

---

## What Module 5 Covers (From System Documentation)

Per **Section 5.1–5.4** of `system_documentation.pdf`:

| FR | Feature | Description |
|----|---------|-------------|
| FR5.1 | Submit Review | Customer submits 1–5 star rating + optional text + optional photos (max 3) for a product/seller after a **delivered** order only |
| FR5.2 | View Product Reviews | Paginated reviews on Product Detail — sort by newest/highest/most helpful |
| FR5.3 | View Seller Ratings | Overall rating, breakdown, recent reviews on Shop Profile |
| FR5.4 | Edit Review | Customer can edit within 72 hours of submission |
| FR5.5 | Delete Own Review | Customer deletes own review; ratings recalculated |
| FR5.6 | Admin Remove Review | Admin removes policy-violating reviews with reason |

**Key Business Rules:**
- One product review + one seller review per order item
- Only delivered orders can be reviewed
- 72-hour edit window after submission
- Deleted reviews cannot be re-submitted for the same order item
- Ratings on Product and Seller models are recalculated on every create/update/delete

---

## Component 1: Backend — Review Model

### [NEW] `backend/models/Review.js`

A new Mongoose model following the same pattern as `Order.js`:

```js
{
  // --- Core References ---
  customer:       ObjectId → ref 'User'    (required — who wrote the review)
  order:          ObjectId → ref 'Order'   (required — which delivered order)
  orderItem:      ObjectId                 (required — specific item._id within order)

  // --- Review Target (one of these) ---
  reviewType:     String enum ['product', 'seller']  (required)
  product:        ObjectId → ref 'Product' (required if reviewType === 'product')
  seller:         ObjectId → ref 'Seller'  (required if reviewType === 'seller')

  // --- Review Content ---
  rating:         Number   (required, min: 1, max: 5)
  reviewText:     String   (optional, max 1000 chars, trim)
  photos:         [String] (optional, max 3 URLs)

  // --- Metadata ---
  isEdited:       Boolean  (default: false)
  editedAt:       Date     (null until edited)
  isDeleted:      Boolean  (default: false — soft delete)
  adminRemoved:   Boolean  (default: false)
  removalReason:  String   (trim, default '')

  // --- Helpful votes ---
  helpfulCount:   Number   (default: 0)

  timestamps:     true     (createdAt, updatedAt)
}
```

**Indexes:**
```js
reviewSchema.index({ product: 1, isDeleted: 1, createdAt: -1 });
reviewSchema.index({ seller: 1, isDeleted: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, order: 1, orderItem: 1, reviewType: 1 }, { unique: true });
reviewSchema.index({ order: 1 });
```

> [!IMPORTANT]
> **Unique Compound Index** ensures one review per customer per order item per type. This prevents duplicate reviews at the database level.

---

## Component 2: Backend — Review Controller

### [NEW] `backend/controllers/reviewController.js`

Follows the **exact same pattern** as `orderController.js`:
- `checkValidation(req, res)` helper
- `try/catch` with `next(error)`
- Consistent `{ success, message, ... }` responses

| Function | FR | Method + Route | Auth |
|----------|-----|----------------|------|
| `submitReview` | FR5.1 | `POST /api/reviews` | Customer |
| `getProductReviews` | FR5.2 | `GET /api/reviews/product/:productId` | Any auth user |
| `getSellerReviews` | FR5.3 | `GET /api/reviews/seller/:sellerId` | Any auth user |
| `getMyReviews` | FR5.4 | `GET /api/reviews/my-reviews` | Customer |
| `editReview` | FR5.4 | `PUT /api/reviews/:id` | Customer (author, within 72h) |
| `deleteReview` | FR5.5 | `DELETE /api/reviews/:id` | Customer (author) |
| `getOrderReviewStatus` | — | `GET /api/reviews/order/:orderId/status` | Customer |
| `markHelpful` | FR5.2 | `PUT /api/reviews/:id/helpful` | Any auth user |
| `adminGetAllReviews` | FR5.6 | `GET /api/reviews/admin/all` | Admin |
| `adminRemoveReview` | FR5.6 | `PUT /api/reviews/admin/:id/remove` | Admin |

**Key Logic for `submitReview`:**

```
1. Validate inputs (rating 1-5, reviewType, orderId, orderItemId)
2. Find the order → verify customer owns it → verify status === 'delivered'
3. Find the specific order item by orderItem ID
4. Check no existing review for this customer+order+orderItem+reviewType
5. If reviewType === 'product' → verify item.product matches provided productId
6. If reviewType === 'seller' → verify item.seller matches provided sellerId
7. Create Review document
8. Recalculate averageRating + totalReviews on Product or Seller model
```

**Rating Recalculation Helper (used by submit, edit, delete, admin-remove):**

```js
const recalculateProductRating = async (productId) => {
  const result = await Review.aggregate([
    { $match: { product: productId, reviewType: 'product', isDeleted: false, adminRemoved: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = result.length > 0 ? Math.round(result[0].avg * 10) / 10 : 0;
  const count = result.length > 0 ? result[0].count : 0;
  await Product.findByIdAndUpdate(productId, { averageRating: avg, totalReviews: count });
};
// Same pattern for recalculateSellerRating
```

**72-Hour Edit Window Check:**
```js
const hoursElapsed = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
if (hoursElapsed > 72) {
  return res.status(400).json({
    success: false,
    message: 'Edit window has expired. Reviews can only be edited within 72 hours.',
  });
}
```

---

## Component 3: Backend — Review Routes

### [NEW] `backend/routes/reviewRoutes.js`

Same structure as `orderRoutes.js`:

```
Customer routes (JWT required):
  POST   /                              → submitReview
  GET    /my-reviews                    → getMyReviews
  GET    /order/:orderId/status         → getOrderReviewStatus
  PUT    /:id                           → editReview
  DELETE /:id                           → deleteReview
  PUT    /:id/helpful                   → markHelpful

Public routes (any authenticated user):
  GET    /product/:productId            → getProductReviews
  GET    /seller/:sellerId              → getSellerReviews

Admin routes (JWT + admin):
  GET    /admin/all                     → adminGetAllReviews
  PUT    /admin/:id/remove              → adminRemoveReview
```

> [!NOTE]
> Named routes (`/my-reviews`, `/product/:productId`, `/seller/:sellerId`, `/order/:orderId/status`, `/admin/*`) are placed BEFORE `/:id` to avoid route conflicts — same pattern as `orderRoutes.js`.

---

## Component 4: Backend — Validators Update

### [MODIFY] `backend/utils/validators.js`

Append new validation arrays after the Module 4 section:

```js
// --- Module 5: Reviews & Ratings ---

const submitReviewValidation = [
  body('orderId').notEmpty().withMessage('Order ID is required').isMongoId().withMessage('Invalid order ID'),
  body('orderItemId').notEmpty().withMessage('Order item ID is required'),
  body('reviewType').notEmpty().withMessage('Review type is required')
    .isIn(['product', 'seller']).withMessage('Review type must be "product" or "seller"'),
  body('productId').optional().isMongoId().withMessage('Invalid product ID'),
  body('sellerId').optional().isMongoId().withMessage('Invalid seller ID'),
  body('rating').notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('reviewText').optional().trim()
    .isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters'),
  body('photos').optional().isArray({ max: 3 }).withMessage('Maximum 3 photos allowed'),
  body('photos.*').optional().trim().notEmpty().withMessage('Photo URL cannot be empty'),
];

const editReviewValidation = [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('reviewText').optional().trim()
    .isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters'),
  body('photos').optional().isArray({ max: 3 }).withMessage('Maximum 3 photos allowed'),
];

const reviewIdValidation = [
  param('id').isMongoId().withMessage('Invalid review ID'),
];

const adminRemoveReviewValidation = [
  body('reason').trim().notEmpty().withMessage('Removal reason is required')
    .isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
];
```

Add to `module.exports`: `submitReviewValidation`, `editReviewValidation`, `reviewIdValidation`, `adminRemoveReviewValidation`

---

## Component 5: Backend — Server Registration

### [MODIFY] `backend/server.js`

Uncomment and activate the review routes (line 42):

```diff
-// app.use('/api/reviews', require('./routes/reviewRoutes'));
+// Module 5 — Reviews & Ratings
+app.use('/api/reviews', require('./routes/reviewRoutes'));
```

---

## Component 6: Mobile — New Screens

> [!NOTE]
> All screens follow existing patterns: `SafeAreaView`, `StyleSheet.create`, `#8B2635` brand color, `apiClient` for API calls, `useAuth()` for user context.

### [NEW] `mobile/src/screens/ReviewSubmitScreen.js`

**Purpose:** Customer submits a review for a delivered order item.  
**How to reach:** `OrderDetailScreen` → "Write Review" button (visible only when `status === 'delivered'`)  

**UI Layout:**
- Product thumbnail + name (pre-filled from order item)
- **Star rating selector** — 5 tappable stars (1–5), required
- **Review type toggle** — "Rate Product" / "Rate Seller" tabs
- **Review text** — multiline TextInput (optional, max 1000 chars)
- **Photo URLs** — up to 3 text inputs for image URLs
- **Submit Review** button → POST `/api/reviews` → success toast → navigate back

### [NEW] `mobile/src/screens/ProductReviewsScreen.js`

**Purpose:** View all reviews for a product.  
**How to reach:** `ProductDetailScreen` → tap reviews count / "See All Reviews"  

**UI Layout:**
- **Rating summary header** — average rating (large), star distribution bars (5★ to 1★)
- **Sort selector** — "Newest" / "Highest Rated" / "Most Helpful"
- **Review cards list** — FlatList with pagination:
  - Reviewer name (first name + last initial), star rating, date
  - Review text, photos (if any)
  - "Helpful" button with count
  - Edit indicator if review was edited

### [NEW] `mobile/src/screens/SellerReviewsScreen.js`

**Purpose:** View all reviews for a seller/shop.  
**How to reach:** `SellerShopProfileScreen` → tap rating / "See All Reviews"  

**UI Layout:** Same as `ProductReviewsScreen` but fetches from `/api/reviews/seller/:sellerId`

### [NEW] `mobile/src/screens/MyReviewsScreen.js`

**Purpose:** Customer views all their submitted reviews.  
**How to reach:** `ProfileScreen` → "My Reviews"  

**UI Layout:**
- FlatList of own reviews with product/seller info
- Each card shows: product name, star rating, review text preview, date
- **"Edit"** button (visible only within 72h) → navigates to `EditReviewScreen`
- **"Delete"** button → confirmation alert → DELETE `/api/reviews/:id`

### [NEW] `mobile/src/screens/EditReviewScreen.js`

**Purpose:** Edit a previously submitted review (within 72-hour window).  
**How to reach:** `MyReviewsScreen` → "Edit" button  

**UI Layout:** Same form as `ReviewSubmitScreen` but pre-filled with existing data. Submit → PUT `/api/reviews/:id`

---

## Component 7: Mobile — Screen Modifications

### [MODIFY] `mobile/src/screens/OrderDetailScreen.js`

Add a "Write Review" section when `order.status === 'delivered'`:

```jsx
{/* Review Section — shown only for delivered orders */}
{order.status === 'delivered' && (
  <View style={styles.reviewSection}>
    <Text style={styles.sectionTitle}>Rate Your Purchase</Text>
    {order.items.map((item, idx) => (
      <TouchableOpacity
        key={idx}
        style={styles.reviewCard}
        onPress={() => navigation.navigate('ReviewSubmit', {
          orderId: order._id,
          orderItem: item,
        })}
      >
        <Text style={styles.reviewItemName}>{item.productName}</Text>
        <Text style={styles.reviewPrompt}>⭐ Write a Review →</Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

### [MODIFY] `mobile/src/screens/ProductDetailScreen.js`

Make the reviews count tappable to navigate to `ProductReviews`:

```jsx
{/* Replace existing rating section to add navigation */}
<TouchableOpacity
  style={styles.ratingRow}
  onPress={() => navigation.navigate('ProductReviews', { productId: product._id })}
>
  <Text style={styles.ratingStars}>...</Text>
  <Text style={styles.reviewCount}>({product.totalReviews} reviews) →</Text>
</TouchableOpacity>
```

### [MODIFY] `mobile/src/screens/ProfileScreen.js`

Add "My Reviews" action item (after "My Addresses"):

```jsx
<View style={styles.divider} />
<TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MyReviews')}>
  <Text style={styles.actionText}>⭐  My Reviews</Text>
  <Text style={styles.chevron}>›</Text>
</TouchableOpacity>
```

### [MODIFY] `mobile/src/screens/SellerShopProfileScreen.js`

Make the rating section tappable to navigate to `SellerReviews`.

---

## Component 8: Mobile — Navigation Update

### [MODIFY] `mobile/src/navigation/AppNavigator.js`

Add Module 5 screen imports and register them in `CustomerAppStack`:

```jsx
// --- Module 5 Screens (Reviews & Ratings) ---
import ReviewSubmitScreen from '../screens/ReviewSubmitScreen';
import ProductReviewsScreen from '../screens/ProductReviewsScreen';
import SellerReviewsScreen from '../screens/SellerReviewsScreen';
import MyReviewsScreen from '../screens/MyReviewsScreen';
import EditReviewScreen from '../screens/EditReviewScreen';

// Inside CustomerAppStack, add after OrderDetail:
<Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} options={{ title: 'Write Review' }} />
<Stack.Screen name="ProductReviews" component={ProductReviewsScreen} options={{ title: 'Product Reviews' }} />
<Stack.Screen name="SellerReviews" component={SellerReviewsScreen} options={{ title: 'Shop Reviews' }} />
<Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'My Reviews' }} />
<Stack.Screen name="EditReview" component={EditReviewScreen} options={{ title: 'Edit Review' }} />
```

---

## Component 9: README Update

### [MODIFY] `README.md`

1. Update Module 5 status: `🔲 Not Started` → `✅ Complete`
2. Add **API Endpoints — Module 5** section (same table format as Modules 1–4)
3. Add `reviews` to the Database Collections table

**New API table:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/reviews` | Customer | Submit a review for a product or seller |
| GET | `/api/reviews/my-reviews` | Customer | View all own reviews |
| GET | `/api/reviews/order/:orderId/status` | Customer | Check review status per order item |
| PUT | `/api/reviews/:id` | Customer | Edit own review (within 72h) |
| DELETE | `/api/reviews/:id` | Customer | Delete own review |
| PUT | `/api/reviews/:id/helpful` | Any user | Mark a review as helpful |
| GET | `/api/reviews/product/:productId` | Any user | View product reviews (paginated) |
| GET | `/api/reviews/seller/:sellerId` | Any user | View seller reviews (paginated) |
| GET | `/api/reviews/admin/all` | Admin | List all reviews with filters |
| PUT | `/api/reviews/admin/:id/remove` | Admin | Remove a policy-violating review |

**Request Body Examples:**

Submit Review:
```json
{
  "orderId": "664f1a2b3c4d5e6f7a8b9c0d",
  "orderItemId": "664f1a2b3c4d5e6f7a8b9c0e",
  "reviewType": "product",
  "productId": "664f1a2b3c4d5e6f7a8b9c0f",
  "rating": 5,
  "reviewText": "Beautiful saree, excellent quality!",
  "photos": ["https://example.com/photo1.jpg"]
}
```

Admin Remove:
```json
{
  "reason": "Inappropriate language violating community guidelines"
}
```

Query Parameters:
```
GET /api/reviews/product/:productId?sortBy=newest&page=1&limit=10
GET /api/reviews/admin/all?rating=1&reviewType=product&search=spam&page=1&limit=20
```

---

## File Summary

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `backend/models/Review.js` | Review Mongoose model with compound unique index |
| **NEW** | `backend/controllers/reviewController.js` | 10 endpoint handlers + rating recalculation helpers |
| **NEW** | `backend/routes/reviewRoutes.js` | Express router for `/api/reviews` |
| **MODIFY** | `backend/utils/validators.js` | Add 4 review validation arrays |
| **MODIFY** | `backend/server.js` | Uncomment review routes (1 line) |
| **NEW** | `mobile/src/screens/ReviewSubmitScreen.js` | Submit review form with star selector |
| **NEW** | `mobile/src/screens/ProductReviewsScreen.js` | Paginated product reviews list |
| **NEW** | `mobile/src/screens/SellerReviewsScreen.js` | Paginated seller reviews list |
| **NEW** | `mobile/src/screens/MyReviewsScreen.js` | Customer's own reviews management |
| **NEW** | `mobile/src/screens/EditReviewScreen.js` | Edit review within 72h window |
| **MODIFY** | `mobile/src/screens/OrderDetailScreen.js` | Add "Write Review" section for delivered orders |
| **MODIFY** | `mobile/src/screens/ProductDetailScreen.js` | Make reviews tappable → ProductReviews |
| **MODIFY** | `mobile/src/screens/ProfileScreen.js` | Add "My Reviews" menu item |
| **MODIFY** | `mobile/src/screens/SellerShopProfileScreen.js` | Make ratings tappable → SellerReviews |
| **MODIFY** | `mobile/src/navigation/AppNavigator.js` | Register 5 new screens |
| **MODIFY** | `README.md` | Add Module 5 API docs + update status |

**Total: 6 new files, 7 modified files**

---

## Implementation Order (Step-by-Step for Team)

> [!TIP]
> Follow this exact order. Each step builds on the previous one.

1. **Create `Review.js` model** — the foundation everything else depends on
2. **Add validators** to `validators.js` — needed before controller
3. **Create `reviewController.js`** — all backend logic
4. **Create `reviewRoutes.js`** — wire routes to controller
5. **Update `server.js`** — activate the route (1-line change)
6. **Test all 10 API endpoints with Postman** — verify backend works
7. **Create mobile screens** (`ReviewSubmitScreen`, `ProductReviewsScreen`, `SellerReviewsScreen`, `MyReviewsScreen`, `EditReviewScreen`)
8. **Update existing screens** (`OrderDetailScreen`, `ProductDetailScreen`, `ProfileScreen`, `SellerShopProfileScreen`)
9. **Update `AppNavigator.js`** — register new screens
10. **Update `README.md`** — document everything

---

## Verification Plan

### Backend Testing (Postman)
1. Register customer + seller, create product, place order, mark as delivered
2. `POST /api/reviews` — submit product review → verify Product.averageRating updates
3. `POST /api/reviews` — submit seller review → verify Seller.averageRating updates
4. `POST /api/reviews` — try duplicate → expect 400 error
5. `GET /api/reviews/product/:id` — verify paginated list with sort options
6. `PUT /api/reviews/:id` — edit within 72h → success
7. `DELETE /api/reviews/:id` — delete → verify ratings recalculated
8. `PUT /api/reviews/admin/:id/remove` — admin removes → verify customer notified

### Mobile Testing
1. Delivered order → "Write Review" button visible
2. Submit review → success toast → review appears on product page
3. Profile → "My Reviews" → list shows
4. Edit within 72h → works; after 72h → edit button hidden
5. Delete review → confirmation → removed

---

## Open Questions

> [!IMPORTANT]
> **Q1: Photo uploads?**
> The system docs mention uploading up to 3 photos per review. Like shop images, I'll implement as **URL string fields** for now. Real file upload (multer + Cloudinary) can be added later. Is this acceptable?

> [!IMPORTANT]
> **Q2: "Helpful" vote tracking?**
> Should we track which users voted "helpful" to prevent duplicate votes? This requires an additional `helpfulVotes: [ObjectId]` array field. Or keep it simple with just a count for now?

> [!IMPORTANT]
> **Q3: Should I proceed to create all files now?**
> This plan creates 6 new files and modifies 7 existing files. Confirm and I'll implement everything step by step with full production-ready code.
