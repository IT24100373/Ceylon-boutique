# Mobile App Screen Prompts (for Google Stitch)

This document contains the prompt generation for all screen templates in the React Native app. It outlines the purpose, components, interactions, and data requirements for each screen.

---

### AddProductScreen

**Purpose:**
This screen serves as the AddProduct interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState` for state management and functional logic.
- Displays dynamic data such as: `category || 'Select a category'`, `showCategoryPicker ? '▲' : '▼'`, `cat`, `size`, `color.name ✕`, `img`, `v.size`, `v.color`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- 📋 Basic Information, Product Name *, Description *, Category *, Price (LKR) *...

---

### AddressManagementScreen

**Purpose:**
This screen serves as the AddressManagement interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `LoadingSpinner`, `AddressCard`, `Button`, `Modal`, `InputField`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useCallback`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `editingId ? 'Edit Address' : 'Add New Address'`, `form.province || 'Select Province'`, `showProvincePicker ? '▲' : '▼'`, `errors.province`, `p`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- 📍, No addresses yet, Add a delivery address to use at checkout., ✕, Province *

---

### CartScreen

**Purpose:**
This screen serves as the Cart interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useCart` for state management and functional logic.
- Displays dynamic data such as: `item.productName`, `item.size | item.color`, `LKR item.price.toLocaleString()`, `item.quantity`, `LKR cartTotal.toLocaleString()`.

**User Interactions:**
- Supports navigation to: `Home`, `Checkout`.

**Relevant Static Content Labels:**
- 🛒, Your cart is empty, Looks like you haven't added anything yet., Start Shopping, -...

---

### ChangePasswordScreen

**Purpose:**
This screen serves as the ChangePassword interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `InputField`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState` for state management and functional logic.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Choose a strong password with at least 8 characters, one uppercase letter, and one number.

---

### CheckoutScreen

**Purpose:**
This screen serves as the Checkout interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useCart`, `useState`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `address.label`, `address.addressLine1`, `address.addressLine2`, `address.city, address.province address.postalCode`, `Items (cartItems.length)`, `LKR cartTotal.toLocaleString()`.

**User Interactions:**
- Supports navigation to: `Addresses`.

**Relevant Static Content Labels:**
- Processing Payment, Please do not close this screen…, Shipping Address, You have no saved addresses., Manage Addresses...

---

### EditProductScreen

**Purpose:**
This screen serves as the EditProduct interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `category || 'Select a category'`, `showCategoryPicker ? '▲' : '▼'`, `cat`, `size`, `color.name ✕`, `img`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Loading product..., 📋 Basic Information, Product Name *, Description *, Category *...

---

### EditProfileScreen

**Purpose:**
This screen serves as the EditProfile interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `InputField`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth`, `useState` for state management and functional logic.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Email cannot be changed as it is your account identifier.

---

### EditReviewScreen

**Purpose:**
This screen serves as the EditReview interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StarSelector`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState` for state management and functional logic.
- Displays dynamic data such as: `= star && styles.starFilled]>
          rating >= star ? '★' : '☆'`, `typeLabel`, `targetName`, `⏱️ review.hoursUntilLockh remaining to edit`, `RATING_LABELS[rating]`, `reviewText.length/1000`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Update Your Rating *, (optional), (optional — max 3 URLs), Update Review

---

### EditShopScreen

**Purpose:**
This screen serves as the EditShop interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StatusBar`, `InputField`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState` for state management and functional logic.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Edit Shop Profile, Update your shop details. Changes will be visible to customers immediately., 💡 Image upload will be available in a future update. For now, you can paste a direct link to your logo/banner image.

---

### HomeScreen

**Purpose:**
This screen serves as the Home interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth` for state management and functional logic.
- Displays dynamic data such as: `Hello, user?.fullName?.split(' ')[0] 👋`.

**User Interactions:**
- Supports navigation to: `Profile`.

**Relevant Static Content Labels:**
- Discover authentic Sri Lankan boutique fashion, 🛍️, Products Coming Soon, Product browsing will be built in Module 3. For now, explore your profile and account settings., 👤  View My Profile →

---

### LoginScreen

**Purpose:**
This screen serves as the Login interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `InputField`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth`, `useState` for state management and functional logic.

**User Interactions:**
- Supports navigation to: `Register`.

**Relevant Static Content Labels:**
- Welcome Back, Login to your Ceylon Boutique account, Register

---

### ManageStockScreen

**Purpose:**
This screen serves as the ManageStock interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `📦 productName`, `variants.length variant(s) · Total stock: getTotalStock()`, `val`, `v.size`, `v.color`, `getTotalStock()`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Loading stock data..., Set all variants to:, Size, Color, Stock...

---

### MyOrdersScreen

**Purpose:**
This screen serves as the MyOrders interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `RefreshControl`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `item.orderNumber`, `item.status.toUpperCase()`, `Placed on new Date(item.createdAt).toLocaleDateString()`, `item.items.length item.items.length === 1 ? 'item' : 'items' • LKR item.totalAmount.toLocaleString()`, `+item.items.length - 3`.

**User Interactions:**
- Supports navigation to: `OrderDetail`, `Home`.

**Relevant Static Content Labels:**
- 🖼️, 🛍️, 📦, No Orders Yet, You haven't placed any orders....

---

### MyProductsScreen

**Purpose:**
This screen serves as the MyProducts interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `RefreshControl`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useCallback`, `useFocusEffect` for state management and functional logic.
- Displays dynamic data such as: `item.name`, `item.category`, `LKR item.price?.toLocaleString()`, `badge.text`, `Stock: item.totalStock`, `item.isPublished ? '🔒 Hide' : '🔓 Show'`, `tab.label (tab.count)`, `activeTab === 'all'
                  ? 'Tap the button below to add your first product!'
                  : 'No products match this filter.'`.

**User Interactions:**
- Supports navigation to: `EditProduct`, `ManageStock`, `AddProduct`.

**Relevant Static Content Labels:**
- 📦, ✏️ Edit, 📊 Stock, 🗑️, No products found...

---

### MyReviewsScreen

**Purpose:**
This screen serves as the MyReviews interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StarDisplay`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useCallback`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `'★'.repeat(filled)'☆'.repeat(5 - filled)`, `isProduct ? '🛍️ Product' : '🏪 Seller'`, `item.canEdit
              ? `✏️ Editable · $item.hoursUntilLockh left`
              : '🔒 Locked'`, `targetName`, `item.rating/5`, `item.reviewText`, `new Date(item.createdAt).toLocaleDateString('en-GB', 
            day: 'numeric', month: 'short', year: 'numeric',
          )`.

**User Interactions:**
- Supports navigation to: `EditReview`.

**Relevant Static Content Labels:**
- · Edited, No written review., Edit, Delete, ⭐...

---

### OrderConfirmationScreen

**Purpose:**
This screen serves as the OrderConfirmation interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Displays dynamic data such as: `order.orderNumber`, `LKR order.totalAmount.toLocaleString()`, `order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit / Debit Card'`.

**User Interactions:**
- Supports navigation to: `OrderDetail`, `Home`.

**Relevant Static Content Labels:**
- 🎉, Order Confirmed!, Thank you for your purchase., Order Number, Total Amount...

---

### OrderDetailScreen

**Purpose:**
This screen serves as the OrderDetail interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `order.orderNumber`, `Placed on new Date(order.createdAt).toLocaleDateString()`, `order.status.toUpperCase()`, `Reason: order.cancellationReason`, `Courier: order.courierName`, `Tracking #: order.trackingNumber`, `item.productName`, `Size: item.size | Color: item.color`, `Qty: item.quantity`, `LKR item.itemTotal.toLocaleString()`, `shippingAddress.label`, `shippingAddress.addressLine1`, `shippingAddress.addressLine2`, `shippingAddress.city, shippingAddress.province shippingAddress.postalCode`, `LKR order.subtotal.toLocaleString()`, `LKR order.deliveryFee`, `LKR order.totalAmount.toLocaleString()`, `order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'`, `Status: order.paymentStatus.toUpperCase()`, `item.size · item.color`, `statusItem?.productReviewed ? '✓ Product' : 'Rate Product'`, `statusItem?.sellerReviewed ? '✓ Seller' : 'Rate Seller'`.

**User Interactions:**
- Supports navigation to: `ReviewSubmit`.

**Relevant Static Content Labels:**
- 📦, Your order is on the way!, Once you receive your package, tap "Confirm Receipt" below., Tracking Information, Items...

---

### ProductBrowseScreen

**Purpose:**
This screen serves as the ProductBrowse interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `RefreshControl`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth`, `useCart`, `useState`, `useCallback`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `item.name`, `LKR item.price?.toLocaleString()`, `⭐ item.averageRating.toFixed(1)`, `item.seller.shopName`, `Hello, user?.fullName?.split(' ')[0] 👋`, `item`, `cartItems.length`.

**User Interactions:**
- Supports navigation to: `ProductDetail`, `SearchFilter`, `Cart`, `Profile`.

**Relevant Static Content Labels:**
- 🛍️, Out of Stock, Discover authentic Sri Lankan boutique fashion, 🔍, ⚙️...

---

### ProductDetailScreen

**Purpose:**
This screen serves as the ProductDetail interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useCart`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `product.category`, `product.name`, `LKR product.price?.toLocaleString()`, `'★'.repeat(Math.round(product.averageRating))
                '☆'.repeat(5 - Math.round(product.averageRating))`, `product.averageRating.toFixed(1)`, `(product.totalReviews reviews) →`, `size`, `color.name`, `In Stock (variantStock available)`, `product.description`, `product.seller.shopName`, `⭐ product.seller.averageRating?.toFixed(1) · product.seller.totalReviews reviews`.

**User Interactions:**
- Supports navigation to: `ProductReviews`, `SellerShopProfile`, `Cart`.

**Relevant Static Content Labels:**
- Product not found., 🛍️, OUT OF STOCK, No reviews yet, Select Size...

---

### ProductReviewsScreen

**Purpose:**
This screen serves as the ProductReviews interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StarDisplay`, `RatingBar`, `ReviewCard`, `ListHeader`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useCallback`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `'★'.repeat(filled)'☆'.repeat(5 - filled)`, `star★`, `count`, `review.reviewerName?.charAt(0).toUpperCase() || 'C'`, `review.reviewerName`, `review.reviewText`, `👍 Helpful (review.helpfulCount)`, `averageRating`, `total total === 1 ? 'review' : 'reviews'`, `opt.label`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- · Edited, ⭐, No reviews yet, Be the first to review this product!

---

### ProfileScreen

**Purpose:**
This screen serves as the Profile interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `ProfileRow`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth` for state management and functional logic.
- Displays dynamic data such as: `label`, `value || '—'`, `user?.fullName?.charAt(0).toUpperCase() || 'U'`, `user?.fullName`.

**User Interactions:**
- Supports navigation to: `DeactivateConfirm`, `MyOrders`, `MyReviews`, `EditProfile`, `ChangePassword`, `Addresses`.

**Relevant Static Content Labels:**
- Customer Account, 📦  My Orders, ›, ⭐  My Reviews, ✏️  Edit Profile...

---

### RegisterScreen

**Purpose:**
This screen serves as the Register interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `InputField`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth`, `useState` for state management and functional logic.

**User Interactions:**
- Supports navigation to: `Login`.

**Relevant Static Content Labels:**
- Create Account, Join Ceylon Boutique today, Login

---

### ReviewSubmitScreen

**Purpose:**
This screen serves as the ReviewSubmit interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StarSelector`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState` for state management and functional logic.
- Displays dynamic data such as: `= star && styles.starFilled]>
          rating >= star ? '★' : '☆'`, `orderItem.productName`, `orderItem.size · orderItem.color · Qty orderItem.quantity`, `RATING_LABELS[rating]`, `reviewText.length/1000`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- 🛍️, What are you reviewing?, 🛍️ Product, 🏪 Seller, Your Rating *...

---

### SearchFilterScreen

**Purpose:**
This screen serves as the SearchFilter interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `Switch`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState` for state management and functional logic.
- Displays dynamic data such as: `opt.label`, `cat`, `size`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- 🔍 Search, 📊 Sort By, 📁 Category, 💰 Price Range (LKR), —...

---

### SellerDashboardScreen

**Purpose:**
This screen serves as the SellerDashboard interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StatusBar`, `RefreshControl`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth`, `useState`, `useCallback`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `Hello, user?.fullName?.split(' ')[0] 👋`, `dashboard?.shopName || user?.shopName || 'My Shop'`, `stat.icon`, `stat.value`, `stat.label`, `item.icon`, `item.title`, `item.placeholder ? `Coming soon ($item.placeholder)` : item.desc`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Logout, ✅ Verified Seller, Quick Actions, →

---

### SellerLoginScreen

**Purpose:**
This screen serves as the SellerLogin interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StatusBar`, `InputField`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth`, `useState` for state management and functional logic.

**User Interactions:**
- Supports navigation to: `SellerRegister`.

**Relevant Static Content Labels:**
- CB, Seller Login, Access your shop dashboard, Register as Seller, ← Back to Welcome

---

### SellerOrderDetailScreen

**Purpose:**
This screen serves as the SellerOrderDetail interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: None detected.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `order.orderNumber`, `Placed on new Date(order.createdAt).toLocaleDateString()`, `order.status.toUpperCase()`, `Name: customer?.fullName`, `Email: customer?.email`, `Phone: customer?.phone`, `item.productName`, `Size: item.size | Color: item.color`, `Qty: item.quantity`, `LKR item.itemTotal.toLocaleString()`, `shippingAddress.label`, `shippingAddress.addressLine1`, `shippingAddress.addressLine2`, `shippingAddress.city, shippingAddress.province shippingAddress.postalCode`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Customer Information, Items to Fulfill, Shipping Address, Shipping Details (Optional), Confirm Order...

---

### SellerOrdersScreen

**Purpose:**
This screen serves as the SellerOrders interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `RefreshControl`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `item.orderNumber`, `item.status.toUpperCase()`, `Customer: item.customer?.fullName || 'Unknown'`, `Date: new Date(item.createdAt).toLocaleDateString()`, `item.items.length item.items.length === 1 ? 'item' : 'items' • LKR item.totalAmount.toLocaleString()`.

**User Interactions:**
- Supports navigation to: `SellerOrderDetail`.

**Relevant Static Content Labels:**
- 📋, No Orders Yet, You don't have any incoming orders.

---

### SellerPendingScreen

**Purpose:**
This screen serves as the SellerPending interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StatusBar`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth`, `useState` for state management and functional logic.
- Displays dynamic data such as: `Hi user?.fullName?.split(' ')[0], your seller application for`, `"user?.shopName || 'your shop'"`, `• Our admin team reviews your business documents'\n'
            • This usually takes 3-5 business days'\n'
            • You'll be notified once a decision is made'\n'
            • Once approved, you can start listing products`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- ⏳, Under Review, is currently being reviewed by our team., 📋 What happens next?, Current Status...

---

### SellerProductReviewsScreen

**Purpose:**
This screen serves as the SellerProductReviews interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StarDisplay`, `RatingBar`, `ReviewCard`, `ListHeader`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useCallback`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `'★'.repeat(filled)'☆'.repeat(5 - filled)`, `star★`, `count`, `review.productName`, `review.reviewerName?.charAt(0).toUpperCase() || 'C'`, `review.reviewerName`, `review.reviewText`, `👍 Helpful (review.helpfulCount)`, `Product Reviews for shopName`, `averageRating`, `total total === 1 ? 'review' : 'reviews'`, `opt.label`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- 📦, · Edited, ⭐, No reviews yet, Your products haven't received any reviews yet.

---

### SellerRegisterScreen

**Purpose:**
This screen serves as the SellerRegister interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `InputField`, `StatusBar`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useAuth`, `useState` for state management and functional logic.
- Displays dynamic data such as: `p`, `step/totalSteps`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- Step 1: Personal Details, Your login credentials for the seller account, Step 2: Shop Details, Tell customers about your boutique, Step 3: Business Documents...

---

### SellerReviewsScreen

**Purpose:**
This screen serves as the SellerReviews interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StarDisplay`, `RatingBar`, `ReviewCard`, `ListHeader`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useCallback`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `'★'.repeat(filled)'☆'.repeat(5 - filled)`, `star★`, `count`, `review.reviewerName?.charAt(0).toUpperCase() || 'C'`, `review.reviewerName`, `review.reviewText`, `👍 Helpful (review.helpfulCount)`, `shopName`, `averageRating`, `total total === 1 ? 'review' : 'reviews'`, `opt.label`.

**User Interactions:**
- Handles standard user input flows, but no explicit static navigations detected.

**Relevant Static Content Labels:**
- · Edited, 🏪, No reviews yet, This seller hasn't received any reviews yet.

---

### SellerShopProfileScreen

**Purpose:**
This screen serves as the SellerShopProfile interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `LoadingSpinner`, `StatusBar`, `RefreshControl`, `InfoRow`, `Button`.

**Features & Data Flow:**
- Utilizes hooks/contexts: `useState`, `useEffect` for state management and functional logic.
- Displays dynamic data such as: `label`, `value || '—'`, `seller?.shopName`, `seller?.categoryFocus || 'General Clothing'`, `seller?.verificationStatus?.toUpperCase()`, `seller?.productCount ?? 0`, `seller?.averageRating?.toFixed(1) ?? '0.0'`, `seller?.totalReviews ?? 0`.

**User Interactions:**
- Supports navigation to: `SellerReviews`, `EditShop`.

**Relevant Static Content Labels:**
- 🏪, Shop Information, Products, Rating ›, Reviews ›...

---

### WelcomeScreen

**Purpose:**
This screen serves as the Welcome interface within the app.

**UI Components:**
- Standard Elements: Uses core React Native layout and interactive components.
- Custom Components: Employs `StatusBar`, `Button`.

**Features & Data Flow:**

**User Interactions:**
- Supports navigation to: `Login`, `Register`, `SellerLogin`.

**Relevant Static Content Labels:**
- CB, Ceylon Boutique, Sri Lanka's Authentic Clothing Marketplace, Want to sell? Register as a Seller →

---

