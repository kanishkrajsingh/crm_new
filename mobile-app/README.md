# Kanchan Delivery Mobile App

A React Native mobile application for delivery personnel to update daily customer status in real-time.

## Features

- 🔍 **Customer Search**: Search customers by name or phone number
- 📱 **Real-time Updates**: Update delivery and collection status instantly
- 🔄 **Auto Sync**: Data syncs automatically with the main system
- 📊 **Status Tracking**: View current holding status for each customer
- 📝 **Notes**: Add optional notes for each delivery
- 🎨 **Modern UI**: Clean, intuitive interface with Material Design

## Setup Instructions

### Prerequisites

1. **Node.js** (v16 or higher)
2. **React Native CLI**: `npm install -g react-native-cli`
3. **Android Studio** (for Android development)
4. **Java Development Kit (JDK 11)**

### Installation

1. **Clone and setup the mobile app:**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Configure your network IP:**
   - Open `src/services/api.ts`
   - Replace `192.168.1.100` with your computer's actual IP address
   - To find your IP:
     - **Windows**: Open Command Prompt → `ipconfig` → Look for "IPv4 Address"
     - **Mac/Linux**: Open Terminal → `ifconfig` → Look for "inet" under your network interface

3. **Setup Android development environment:**
   - Install Android Studio
   - Setup Android SDK
   - Create an Android Virtual Device (AVD) or connect a physical device

### Running the App

1. **Start the Metro bundler:**
   ```bash
   npm start
   ```

2. **Run on Android:**
   ```bash
   npm run android
   ```

### Network Configuration

#### For Local Network Access:

1. **Find your computer's IP address:**
   - Windows: `ipconfig` → IPv4 Address
   - Mac: `ifconfig en0` → inet
   - Linux: `ifconfig` → inet

2. **Update the backend server to accept connections:**
   - Your main server should already be configured to accept connections from `0.0.0.0`
   - Make sure your firewall allows connections on port 5000

3. **Update mobile app configuration:**
   - Edit `mobile-app/src/services/api.ts`
   - Change `BASE_URL` to `http://YOUR_IP_ADDRESS:5000`

4. **Test the connection:**
   - Make sure both devices are on the same WiFi network
   - Test API endpoint: `http://YOUR_IP_ADDRESS:5000/api/customers`

## Usage

### For Delivery Personnel:

1. **Search Customers:**
   - Use the search bar to find customers by name or phone
   - Tap on a customer to update their status

2. **Update Daily Status:**
   - Enter delivered quantity
   - Enter collected quantity (cans returned)
   - Add optional notes
   - Tap "Save Update"

3. **View Status:**
   - See current holding status
   - View previous delivery data
   - Track pending collections

## Troubleshooting

### Common Issues:

1. **Network Connection Error:**
   - Verify both devices are on the same WiFi
   - Check if the server is running on your computer
   - Confirm the IP address in `api.ts` is correct

2. **App Won't Start:**
   - Run `npm install` again
   - Clear Metro cache: `npx react-native start --reset-cache`
   - Rebuild: `cd android && ./gradlew clean && cd .. && npm run android`

3. **API Errors:**
   - Check server logs for errors
   - Verify API endpoints are working in browser
   - Ensure CORS is properly configured

### Testing API Connection:

```bash
# Test from your phone's browser or a network tool
curl http://YOUR_IP_ADDRESS:5000/api/customers
```

## Development

### Project Structure:
```
mobile-app/
├── src/
│   ├── screens/          # App screens
│   ├── services/         # API services
│   ├── theme/           # App theme
│   └── components/      # Reusable components
├── android/             # Android-specific files
└── ios/                # iOS-specific files (if needed)
```

### Adding New Features:

1. Create new screens in `src/screens/`
2. Add API calls in `src/services/api.ts`
3. Update navigation in `App.tsx`
4. Test on both Android device and emulator

## Security Notes

- The app uses HTTP for local network communication
- For production, implement HTTPS and authentication
- Consider adding user login for delivery personnel
- Implement data validation and error handling

## Support

For issues or questions:
1. Check the troubleshooting section
2. Verify network configuration
3. Test API endpoints manually
4. Check device logs for errors