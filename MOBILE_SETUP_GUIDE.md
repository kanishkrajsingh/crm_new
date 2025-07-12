# 📱 Mobile App Setup Guide

## Complete Setup Instructions for Android Delivery App

### 🚀 Quick Start

1. **Find Your Computer's IP Address**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux  
   ifconfig
   # Look for "inet" under your network interface
   ```

2. **Update Mobile App Configuration**
   - Open `mobile-app/src/services/api.ts`
   - Change line 6: `const BASE_URL = 'http://YOUR_IP_ADDRESS:5000';`
   - Replace `YOUR_IP_ADDRESS` with your actual IP

3. **Install Mobile App Dependencies**
   ```bash
   cd mobile-app
   npm install
   ```

4. **Start Your Main Server**
   ```bash
   # In your main project directory
   npm run start
   # This starts both frontend (port 5173) and backend (port 5000)
   ```

5. **Run Mobile App**
   ```bash
   # In mobile-app directory
   npm start
   # In another terminal
   npm run android
   ```

### 📋 Detailed Setup Steps

#### Step 1: Prerequisites

**Install Required Software:**
1. **Node.js** (v16+): https://nodejs.org/
2. **Android Studio**: https://developer.android.com/studio
3. **Java JDK 11**: https://adoptium.net/

**Setup Android Development:**
1. Open Android Studio
2. Go to SDK Manager → Install Android SDK (API 30+)
3. Create Virtual Device (AVD) or connect physical Android device
4. Enable USB Debugging on physical device (Settings → Developer Options)

#### Step 2: Network Configuration

**Configure Your Main Server:**
Your server is already configured to accept network connections. The `server.js` file has been updated with:
- CORS enabled for all origins
- Host set to `0.0.0.0` (accepts connections from any device)
- Request logging for debugging

**Find Your Network IP:**
```bash
# Windows Command Prompt
ipconfig
# Look for "Wireless LAN adapter Wi-Fi" → "IPv4 Address"

# Mac Terminal
ifconfig en0 | grep inet
# Look for the line starting with "inet" (not inet6)

# Linux Terminal  
hostname -I
# First IP address shown
```

**Example IP addresses:**
- `192.168.1.100` (most common)
- `192.168.0.100` 
- `10.0.0.100`

#### Step 3: Mobile App Configuration

**Update API Configuration:**
1. Open `mobile-app/src/services/api.ts`
2. Find line 6: `const BASE_URL = 'http://192.168.1.100:5000';`
3. Replace with your IP: `const BASE_URL = 'http://YOUR_ACTUAL_IP:5000';`

**Install Dependencies:**
```bash
cd mobile-app
npm install

# If you get permission errors on Mac/Linux:
sudo npm install
```

#### Step 4: Running the System

**Start Main Server (Computer):**
```bash
# In your main project directory
npm run start
# This starts:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5000
```

**Start Mobile App:**
```bash
# In mobile-app directory
npm start
# Keep this terminal open

# In a new terminal (mobile-app directory)
npm run android
```

### 🔧 Troubleshooting

#### Common Issues & Solutions:

**1. "Network Error" in Mobile App**
```bash
# Test if server is accessible from phone
# Open phone browser, go to: http://YOUR_IP:5000/api/customers
# Should show JSON data

# If not working:
# - Check both devices on same WiFi
# - Disable computer firewall temporarily
# - Restart your router
```

**2. "Metro bundler failed to start"**
```bash
cd mobile-app
npx react-native start --reset-cache
npm run android
```

**3. "Android build failed"**
```bash
cd mobile-app/android
./gradlew clean
cd ..
npm run android
```

**4. "Cannot connect to development server"**
```bash
# Make sure Metro is running
npm start

# Shake device → "Settings" → "Debug server host & port"
# Enter: YOUR_IP:8081
```

**5. "CORS Error"**
Your server is already configured for CORS. If you still get errors:
```bash
# Restart your main server
npm run start
```

#### Testing Network Connection:

**From Computer:**
```bash
# Test if server is running
curl http://localhost:5000/api/customers

# Test if accessible from network
curl http://YOUR_IP:5000/api/customers
```

**From Phone Browser:**
- Open browser on phone
- Go to: `http://YOUR_IP:5000/api/customers`
- Should see customer data in JSON format

### 📱 Using the Mobile App

#### For Delivery Personnel:

**1. Home Screen:**
- Shows today's overview
- Quick action buttons
- Instructions for use

**2. Search Customers:**
- Tap "Search Customers"
- Type customer name or phone number
- Tap on customer to update status

**3. Update Daily Status:**
- Enter delivered quantity
- Enter collected quantity (returned cans)
- Add optional notes
- Tap "Save Update"
- Data syncs immediately with main system

**4. Features:**
- ✅ Real-time data sync
- ✅ Offline-friendly (shows last loaded data)
- ✅ Automatic holding status calculation
- ✅ Input validation
- ✅ Error handling with user-friendly messages

### 🔒 Security & Production Notes

**For Local Network Use:**
- Uses HTTP (fine for local network)
- No authentication required
- Data syncs in real-time

**For Production Deployment:**
- Implement HTTPS
- Add user authentication
- Use secure API keys
- Implement role-based access

### 📊 App Features

**Customer Management:**
- Search by name or phone
- View customer details
- See customer type (Shop/Monthly/Order)
- View current holding status

**Daily Updates:**
- Update delivered quantities
- Track collected cans
- Calculate holding status automatically
- Add delivery notes
- Real-time sync with main system

**User Interface:**
- Material Design components
- Intuitive navigation
- Error handling with toast messages
- Loading states
- Responsive design

### 🆘 Getting Help

**If you encounter issues:**

1. **Check Network Connection:**
   - Both devices on same WiFi?
   - Can you access `http://YOUR_IP:5000/api/customers` from phone browser?

2. **Check Server Status:**
   - Is your main server running?
   - Any errors in server console?

3. **Check Mobile App Logs:**
   - Look at Metro bundler console
   - Check for error messages

4. **Common Fixes:**
   - Restart both server and mobile app
   - Clear Metro cache: `npx react-native start --reset-cache`
   - Rebuild Android app: `npm run android`

**Test Checklist:**
- [ ] Server running on computer
- [ ] Mobile app installed on phone/emulator
- [ ] Both on same WiFi network
- [ ] Correct IP address in mobile app config
- [ ] Can access API from phone browser
- [ ] Mobile app shows customer data

### 🎯 Success Indicators

**You'll know it's working when:**
- Mobile app loads customer list
- You can search and find customers
- Updates save successfully
- Changes appear in main web system immediately
- No network error messages

**Performance:**
- Customer search: < 2 seconds
- Status updates: < 3 seconds
- Data sync: Immediate
- App startup: < 5 seconds

This mobile app will transform your delivery operations by allowing real-time updates from the field! 🚀