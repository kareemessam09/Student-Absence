# Push Notifications - Integration Guide

## 🚀 Backend Setup Complete

The backend now supports Firebase Cloud Messaging (FCM) push notifications!

## 📱 For Mobile Developers

### 1. Register Device Token

After user login, register the FCM device token:

**Endpoint:** `POST /api/users/device-token`

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "deviceToken": "fXxXxXxXx..."
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Device token registered successfully"
}
```

### 2. Flutter/Mobile Implementation Example

```dart
// After successful login
Future<void> registerDeviceToken() async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  
  if (fcmToken != null) {
    final response = await http.post(
      Uri.parse('$baseUrl/api/users/device-token'),
      headers: {
        'Authorization': 'Bearer $authToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'deviceToken': fcmToken,
      }),
    );
    
    if (response.statusCode == 200) {
      print('Device token registered');
    }
  }
}

// Call this after login:
await registerDeviceToken();

// Also refresh token periodically:
FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
  registerDeviceToken();
});
```

## 📬 Notification Types

### 1. Absence Request (Receptionist → Teacher)

**Trigger:** When receptionist sends an absence request

**Notification:**
- **Title:** `📝 New Absence Request`
- **Body:** `{Student Name} - {Class Name}`

**Data Payload:**
```json
{
  "type": "request",
  "notificationId": "64f7a8b9c1234567890abcde",
  "studentId": "64f7a8b9c1234567890abcdf",
  "studentName": "Ahmed Ali",
  "className": "G2-A",
  "clickAction": "FLUTTER_NOTIFICATION_CLICK"
}
```

### 2. Teacher Message (Teacher → Receptionist)

**Trigger:** When teacher sends a message to receptionist

**Notification:**
- **Title:** `📩 New Message from Teacher`
- **Body:** `{Student Name} - {Message}`

**Data Payload:**
```json
{
  "type": "message",
  "notificationId": "64f7a8b9c1234567890abcde",
  "studentId": "64f7a8b9c1234567890abcdf",
  "studentName": "Ahmed Ali",
  "className": "G2-A",
  "clickAction": "FLUTTER_NOTIFICATION_CLICK"
}
```

## 🔧 Testing Push Notifications

### Test Endpoint (Manager Only)

**Endpoint:** `POST /api/notifications/test-push/:userId`

**Headers:**
```
Authorization: Bearer {manager_jwt_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Test Notification",
  "body": "This is a test message"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "projects/student-absence/messages/1234567890"
}
```

Or if failed:
```json
{
  "success": false,
  "reason": "no-device-token"
}
```

### Test from Postman

1. Login as manager to get JWT token
2. Get a user ID who has registered device token
3. Send POST request to `/api/notifications/test-push/{userId}`
4. Check mobile device for notification

## 🛠️ Firebase Setup Requirements

### Android Configuration

**android/app/src/main/AndroidManifest.xml:**
```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="student_notifier_channel" />
```

**Create notification channel in MainActivity:**
```dart
void _createNotificationChannel() async {
  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'student_notifier_channel',
    'Student Notifications',
    description: 'Notifications for student absence requests',
    importance: Importance.high,
  );

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);
}
```

### iOS Configuration

**ios/Runner/Info.plist:**
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

## 🔍 Troubleshooting

### Device Token Not Registering

**Check:**
1. User is logged in with valid JWT
2. FCM token is obtained successfully
3. Device has internet connection
4. API endpoint returns 200 status

### Notifications Not Appearing

**Check:**
1. Device token is registered in backend
2. Notification permissions granted on device
3. Firebase credentials configured in Vercel
4. Check Vercel logs for FCM errors

### Testing Locally

```bash
# Check if device token is saved
curl -X GET "https://your-api.vercel.app/api/users/profile/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should see deviceToken in response if saved
```

## 📊 Backend Logs

When notifications are sent, you'll see logs:

**Success:**
```
Push notification sent { user: '64f7a...', messageId: 'projects/...' }
```

**No Device Token:**
```
No device token for user, skipping push: 64f7a...
```

**Invalid Token:**
```
Failed to send push notification: [error details]
Failed to remove invalid device token for user 64f7a...
```

## 🔒 Security Notes

1. **Device tokens are stored securely** - Not returned in user profile by default
2. **Invalid tokens are auto-removed** - If FCM reports invalid token, backend removes it
3. **Best-effort delivery** - Push failures won't break notification creation
4. **Manager-only testing** - Test endpoint restricted to manager role

## 📝 API Integration Checklist

For mobile developers:

- [ ] Implement FCM token generation
- [ ] Call device token registration after login
- [ ] Handle token refresh
- [ ] Create notification channels (Android)
- [ ] Set up notification handlers
- [ ] Test with test endpoint
- [ ] Test real notification flows
- [ ] Handle notification click actions
- [ ] Add error handling for token registration

## 🎯 Expected Flow

1. User logs in → App gets JWT token
2. App gets FCM device token
3. App registers device token with backend
4. User receives real-time notifications
5. App handles notification clicks
6. Opens relevant screen (notification detail, student info, etc.)

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check mobile app Firebase console
3. Test with the test endpoint first
4. Verify Firebase credentials in Vercel environment variables

**Environment Variables Required in Vercel:**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_ANDROID_CHANNEL_ID` (optional, defaults to `student_notifier_channel`)
