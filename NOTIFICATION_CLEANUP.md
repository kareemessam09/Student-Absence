# Automatic Notification Cleanup Feature

## Overview
This feature automatically deletes all notifications every 24 hours at midnight. This keeps the database clean and ensures that daily absence requests don't accumulate over time.

## How It Works

### Automatic Cleanup
- **Schedule**: Runs every day at **00:00 (midnight)**
- **Action**: Deletes ALL notifications from the database
- **Logging**: Records the number of deleted notifications in the logs
- **Status**: Starts automatically when the server starts

### Cron Schedule
```
0 0 * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday=0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)

Translation: Every day at midnight (00:00)
```

## Manual Cleanup

### Endpoint
**DELETE `/api/notifications/cleanup`**

**Access**: Manager role only

**Description**: Allows managers to manually trigger notification cleanup at any time, without waiting for the scheduled midnight cleanup.

**Example Request**:
```bash
DELETE /api/notifications/cleanup
Authorization: Bearer <manager-token>
```

**Response**:
```json
{
  "status": "success",
  "message": "Successfully deleted 45 notifications",
  "data": {
    "deletedCount": 45
  }
}
```

## Use Cases

### 1. Daily Reset
At midnight every day, all absence requests and responses are automatically cleared:
- Receptionists start fresh each day
- Teachers see only new requests
- Manager statistics are calculated from clean data

### 2. Manual Cleanup (Testing/Emergency)
Managers can manually trigger cleanup:
```javascript
const response = await fetch('/api/notifications/cleanup', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${managerToken}`
  }
});

const data = await response.json();
console.log(`Deleted ${data.data.deletedCount} notifications`);
```

### 3. Server Startup
When the server starts, the scheduler is automatically initialized:
```
📅 Notification cleanup scheduler initialized (runs daily at midnight)
```

## Implementation Details

### Files Created/Modified

**New Files:**
1. `src/services/schedulerService.js` - Cron job scheduler
2. `src/controllers/cleanupController.js` - Manual cleanup endpoint controller

**Modified Files:**
1. `src/app.js` - Initialize scheduler on startup
2. `src/routes/notificationRoutes.js` - Add manual cleanup route
3. `package.json` - Added `node-cron` dependency

### Scheduler Service
```javascript
// src/services/schedulerService.js
const scheduleNotificationCleanup = () => {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    const result = await Notification.deleteMany({});
    logger.info(`Deleted ${result.deletedCount} notifications`);
  });
};
```

### Server Integration
```javascript
// src/app.js
const startServer = async () => {
  await connectDB();
  
  // Initialize scheduled tasks
  scheduleNotificationCleanup();
  
  // ... rest of server setup
};
```

## Logging

### Automatic Cleanup Logs
```
[2025-10-24 00:00:00] Starting scheduled notification cleanup...
[2025-10-24 00:00:00] ✅ Notification cleanup completed. Deleted 123 notifications.
```

### Manual Cleanup Logs
```
[2025-10-24 14:30:00] Manual notification cleanup triggered...
[2025-10-24 14:30:00] ✅ Manual cleanup completed. Deleted 45 notifications.
[2025-10-24 14:30:00] Manager John Doe triggered manual notification cleanup
```

### Error Logs
```
[2025-10-24 00:00:00] ❌ Error during notification cleanup: Connection timeout
```

## Configuration

### Change Cleanup Schedule
Edit `src/services/schedulerService.js`:

```javascript
// Current: Every day at midnight
cron.schedule('0 0 * * *', async () => { ... });

// Examples of other schedules:

// Every 12 hours (midnight and noon)
cron.schedule('0 0,12 * * *', async () => { ... });

// Every 6 hours
cron.schedule('0 */6 * * *', async () => { ... });

// Every hour
cron.schedule('0 * * * *', async () => { ... });

// Every Monday at 3 AM
cron.schedule('0 3 * * 1', async () => { ... });

// Every day at 2:30 AM
cron.schedule('30 2 * * *', async () => { ... });
```

### Disable Automatic Cleanup
Comment out the scheduler initialization in `src/app.js`:

```javascript
const startServer = async () => {
  await connectDB();
  
  // Initialize scheduled tasks
  // scheduleNotificationCleanup(); // DISABLED
  
  // ... rest of server setup
};
```

Note: Manual cleanup endpoint will still work even if automatic cleanup is disabled.

## Testing

### Test Automatic Cleanup
1. Create some notifications
2. Wait until midnight (or change schedule to next minute for testing)
3. Check logs for cleanup message
4. Verify notifications are deleted

### Test Manual Cleanup
```bash
# Create a notification first
POST /api/notifications/request
{
  "studentId": "...",
  "message": "Student needs to leave"
}

# Trigger manual cleanup
DELETE /api/notifications/cleanup
Authorization: Bearer <manager-token>

# Verify response
{
  "status": "success",
  "message": "Successfully deleted 1 notifications",
  "data": {
    "deletedCount": 1
  }
}
```

### Test Schedule (Quick Test)
Temporarily change to run every minute for testing:

```javascript
// src/services/schedulerService.js
cron.schedule('* * * * *', async () => { // Every minute
  logger.info('TEST: Running cleanup every minute');
  const result = await Notification.deleteMany({});
  logger.info(`TEST: Deleted ${result.deletedCount} notifications`);
});
```

**Don't forget to change it back to midnight schedule!**

## Impact on Other Features

### Daily Attendance Tracking
- ✅ Attendance statistics (`GET /api/statistics/daily-attendance`) calculate from notifications **before** cleanup
- ⚠️ After midnight cleanup, previous day's statistics will show 0 absences
- 💡 Consider: If you need historical data, store daily statistics snapshots before cleanup

### Notification History
- ❌ All notification history is lost after cleanup
- ❌ Cannot view past absence requests after cleanup
- 💡 Consider: If you need history, create a separate archive table before deletion

## Best Practices

1. **Backup Before Cleanup**: If historical data is important, export/archive notifications before deletion
2. **Monitor Logs**: Check logs daily to ensure cleanup is running successfully
3. **Manager Training**: Ensure managers know they can manually trigger cleanup
4. **Timezone Awareness**: Cleanup runs at midnight in server timezone
5. **Database Backups**: Regular database backups in case cleanup runs unexpectedly

## Dependencies

### node-cron
**Version**: Latest
**Purpose**: Schedule recurring tasks (cron jobs)
**Installation**: `npm install node-cron`

## Future Enhancements

### Possible Improvements:
1. **Archive Instead of Delete**: Move old notifications to archive table
2. **Configurable Retention**: Keep last N days of notifications
3. **Selective Cleanup**: Delete only certain types of notifications
4. **Statistics Snapshot**: Auto-save daily stats before cleanup
5. **Cleanup Reports**: Email managers with cleanup summary
6. **Timezone Configuration**: Make cleanup time configurable per timezone

## Troubleshooting

**Issue**: Cleanup not running at midnight
- **Check**: Server timezone matches expected timezone
- **Solution**: Use `date` command to check server time
- **Alternative**: Use explicit timezone in cron schedule

**Issue**: Cleanup deletes notifications immediately
- **Check**: Cron schedule syntax in `schedulerService.js`
- **Solution**: Verify `'0 0 * * *'` pattern is correct

**Issue**: Manual cleanup returns 0 deleted
- **Cause**: No notifications in database
- **Solution**: Normal behavior if database is empty

**Issue**: Too many notifications accumulating
- **Cause**: Server might have been down during midnight
- **Solution**: Use manual cleanup endpoint to clear backlog
