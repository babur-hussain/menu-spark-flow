# Database Setup Guide

## 🚀 Quick Setup

To fix the loading issues on the admin pages, you need to set up the database tables and sample data.

### Option 1: Automatic Setup (Recommended)

1. **Login as Super Admin**:
   - Go to `http://localhost:8082/admin/login`
   - Use the default credentials:
     - Email: `admin@restaurant.com`
     - Password: `admin123`

2. **Run Database Setup**:
   - In the Super Admin Dashboard, click the **"Setup Database"** button
   - This will create all necessary tables and sample data

3. **Verify Setup**:
   - Check that all admin pages now load properly:
     - Menu Management: `http://localhost:8082/admin/menu`
     - QR Codes: `http://localhost:8082/admin/qr-codes`
     - Orders: `http://localhost:8082/admin/orders`
     - Analytics: `http://localhost:8082/admin/analytics`
     - Reviews: `http://localhost:8082/admin/reviews`

### Option 2: Manual Database Migration

If the automatic setup doesn't work, you can run the migration manually:

1. **Open Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration**:
   - Copy and paste the contents of `supabase/migrations/20250727204443-ad13c368-b12f-4a8c-9ef1-6705d8548d15.sql`
   - Execute the SQL script

3. **Verify Tables Created**:
   - Check that these tables exist:
     - `restaurants`
     - `menu_categories`
     - `menu_items`
     - `orders`
     - `order_items`
     - `qr_codes`
     - `reviews`
     - `user_profiles`

## 🔧 What This Fixes

### ✅ **Loading Issues Resolved**
- **Menu Management**: Now loads menu items from database
- **QR Codes**: Displays QR codes with scan statistics
- **Orders**: Shows order history and management
- **Analytics**: Displays real analytics data
- **Reviews**: Shows customer reviews and ratings

### ✅ **Database Schema**
- **Restaurants**: Restaurant information and settings
- **Menu Categories**: Organized menu structure
- **Menu Items**: Individual menu items with details
- **Orders**: Customer orders and order items
- **QR Codes**: QR code management and tracking
- **Reviews**: Customer feedback and ratings
- **User Profiles**: User authentication and roles

### ✅ **Sample Data**
- **Restaurants**: Sample restaurant entries
- **Menu Items**: Popular dishes with descriptions
- **QR Codes**: Table and takeaway QR codes
- **Reviews**: Customer testimonials
- **Categories**: Menu categories (Appetizers, Main Course, etc.)

## 🎯 Features Now Working

### **Menu Management**
- ✅ Add/Edit/Delete menu items
- ✅ Category management
- ✅ Dietary information tracking
- ✅ Availability toggling
- ✅ Search and filtering

### **QR Code Management**
- ✅ Generate QR codes for tables
- ✅ Takeaway and delivery QR codes
- ✅ Scan tracking and statistics
- ✅ QR code activation/deactivation

### **Order Management**
- ✅ View order history
- ✅ Order status tracking
- ✅ Order details and items
- ✅ Customer information

### **Analytics Dashboard**
- ✅ Real-time statistics
- ✅ Revenue tracking
- ✅ Order analytics
- ✅ Performance metrics

### **Review Management**
- ✅ Customer reviews display
- ✅ Rating system
- ✅ Review approval workflow
- ✅ Feedback management

## 🚨 Troubleshooting

### **If pages still show loading:**
1. Check browser console for errors
2. Verify Supabase connection in `.env`
3. Ensure user has proper authentication
4. Try logging out and back in

### **If database setup fails:**
1. Check Supabase project settings
2. Verify RLS policies are enabled
3. Ensure user has proper permissions
4. Check network connectivity

### **If sample data doesn't appear:**
1. Refresh the page after setup
2. Check if user has restaurant_id assigned
3. Verify database tables were created
4. Check browser console for errors

## 📞 Support

If you continue to experience issues:
1. Check the browser console for error messages
2. Verify your Supabase project configuration
3. Ensure all environment variables are set correctly
4. Try the manual database migration option

---

**🎉 Once setup is complete, all admin pages should load with real data and full functionality!** 