# Daily Attendance Tracking Feature

## Overview
This feature tracks daily student attendance based on absence notifications sent by receptionists and responded to by teachers. It provides real-time visibility into how many students have left (absent) vs. how many remain (present) for each class.

## How It Works

### Workflow
1. **Receptionist sends absence request**: Creates a notification with status "pending"
2. **Teacher responds to request**:
   - If `approved: true` → Student status becomes "**absent**" (student approved to leave/go)
   - If `approved: false` → Student status becomes "present" (student stays in class)
3. **System tracks absences**: Counts notifications with status "absent" per class
4. **Manager views statistics**: Sees attendance breakdown for all classes

### Data Source
- **Model**: `Notification` collection
- **Filter Criteria**:
  - `requestDate`: Today's date (or specified date)
  - `status`: "absent" (confirmed absences)
  - `type`: "response" (only counted after teacher responds)

## API Endpoint

### GET `/api/statistics/daily-attendance`

**Access**: Manager role only (requires authentication)

**Query Parameters**:
- `date` (optional): ISO date string (YYYY-MM-DD). Defaults to today.

**Example Requests**:
```bash
# Get today's attendance
GET /api/statistics/daily-attendance
Authorization: Bearer <manager-token>

# Get attendance for specific date
GET /api/statistics/daily-attendance?date=2024-01-15
Authorization: Bearer <manager-token>
```

**Response Format**:
```json
{
  "status": "success",
  "data": {
    "date": "2024-01-15",
    "overall": {
      "totalClasses": 56,
      "total": 1566,
      "present": 1450,
      "gone": 116,
      "percentage": 92.59
    },
    "classes": [
      {
        "classId": "65abc123...",
        "className": "KG1-A",
        "teacher": {
          "id": "65def456...",
          "name": "John Teacher",
          "email": "john@school.com"
        },
        "total": 28,
        "present": 25,
        "gone": 3,
        "percentage": 89.29,
        "goneStudents": [
          {
            "id": "65ghi789...",
            "studentCode": "2024001",
            "name": "Ahmed Ali"
          },
          {
            "id": "65jkl012...",
            "studentCode": "2024002",
            "name": "Sara Mohammed"
          },
          {
            "id": "65mno345...",
            "studentCode": "2024003",
            "name": "Fatima Hassan"
          }
        ]
      }
      // ... more classes
    ]
  }
}
```

## Response Fields

### Overall Statistics
- `totalClasses`: Total number of active classes
- `total`: Total students across all classes
- `present`: Students who remain in school (not marked gone)
- `gone`: Students who got approval to leave (accepted requests)
- `percentage`: Attendance rate - percentage of present students (0-100)

### Per-Class Statistics
- `classId`: Unique class identifier
- `className`: Class name (e.g., "KG1-A", "G10-B")
- `teacher`: Teacher assigned to the class (null if unassigned)
- `total`: Total students enrolled in class
- `present`: Students remaining (total - gone)
- `gone`: Students approved to leave today
- `percentage`: Attendance rate for this class (0-100)
- `goneStudents`: Array of students who left (got approval)

## Use Cases

### 1. Manager Dashboard
Display real-time attendance overview for all classes:
```javascript
// Fetch today's attendance
const response = await fetch('/api/statistics/daily-attendance', {
  headers: {
    'Authorization': `Bearer ${managerToken}`
  }
});
const { data } = await response.json();

// Show overall stats
console.log(`Today's attendance: ${data.overall.percentage}%`);
console.log(`${data.overall.present} present, ${data.overall.gone} gone`);

// Show per-class breakdown
data.classes.forEach(cls => {
  console.log(`${cls.className}: ${cls.present}/${cls.total} present (${cls.gone} gone)`);
});
```

### 2. Attendance Report
Generate daily attendance report:
```javascript
// Get yesterday's attendance
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const dateStr = yesterday.toISOString().split('T')[0];

const response = await fetch(`/api/statistics/daily-attendance?date=${dateStr}`, {
  headers: {
    'Authorization': `Bearer ${managerToken}`
  }
});
```

### 3. Track Low Attendance Classes
Identify classes with attendance issues:
```javascript
const { data } = await response.json();
const lowAttendance = data.classes.filter(cls => cls.percentage < 80);

console.log('Classes with attendance below 80%:');
lowAttendance.forEach(cls => {
  console.log(`${cls.className}: ${cls.percentage}% (${cls.gone} gone)`);
});
```

## Implementation Details

### Calculation Logic
```javascript
// For each class:
present = total - gone
percentage = (present / total) × 100

// Where:
// - total = class.students.length (enrolled students)
// - gone = notifications with status "absent" for today (accepted requests)
```

### Date Filtering
- Uses midnight-to-midnight for the specified date
- Timezone-aware (uses server timezone)
- Default to current date if not specified

### Performance Considerations
- Indexes on `Notification.requestDate` and `Notification.status`
- Populates only necessary fields (student code, name)
- Efficient aggregation using MongoDB lean queries

## Testing

### Test Scenarios

**1. No absences**:
```bash
# All students present
# Expected: percentage = 100%, gone = 0
```

**2. Some absences**:
```bash
# 3 out of 28 students gone
# Expected: percentage = 89.29%, gone = 3
```

**3. Different dates**:
```bash
# Query yesterday vs today
# Expected: Different absence counts
```

**4. Unassigned teacher**:
```bash
# Class has no teacher
# Expected: teacher = null, stats still calculated
```

## Database Requirements

### Required Models
- `Notification`: Tracks absence requests and responses
- `Class`: Contains student lists
- `Student`: Student information

### Required Indexes
```javascript
// Notification model
notificationSchema.index({ requestDate: 1, status: 1 });
notificationSchema.index({ class: 1, requestDate: 1 });
```

## Frontend Integration

### React Example
```jsx
import { useState, useEffect } from 'react';

function AttendanceDashboard() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/statistics/daily-attendance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const { data } = await response.json();
      setAttendance(data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Daily Attendance - {attendance.date}</h1>
      
      <div className="overall-stats">
        <h2>Overall Statistics</h2>
        <p>Attendance Rate: {attendance.overall.percentage}%</p>
        <p>Present: {attendance.overall.present} / {attendance.overall.total}</p>
        <p>Gone: {attendance.overall.gone}</p>
      </div>

      <div className="class-list">
        <h2>By Class</h2>
        {attendance.classes.map(cls => (
          <div key={cls.classId} className="class-card">
            <h3>{cls.className}</h3>
            <p>Teacher: {cls.teacher?.name || 'Unassigned'}</p>
            <p>Total: {cls.total}</p>
            <p>Present: {cls.present}</p>
            <p>Gone: {cls.gone}</p>
            <p>Percentage: {cls.percentage}%</p>
            
            {cls.goneStudents.length > 0 && (
              <details>
                <summary>Students Who Left</summary>
                <ul>
                  {cls.goneStudents.map(student => (
                    <li key={student.id}>
                      {student.name} ({student.studentCode})
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Notes

- **Real-time Updates**: Consider integrating with Socket.IO to push updates when teachers respond to absence notifications
- **Historical Data**: Store daily snapshots for trend analysis
- **Permissions**: Only managers can access this endpoint
- **Performance**: Efficient for daily queries; consider caching for historical reports
- **Accuracy**: Depends on teachers responding to absence notifications promptly

## Related Endpoints

- `POST /api/notifications` - Receptionist sends absence request
- `POST /api/notifications/:id/respond` - Teacher responds with `approved: true/false`
- `GET /api/statistics/overview` - Overall manager statistics
- `GET /api/statistics/classes` - Per-class statistics with utilization

## Troubleshooting

**Issue**: Attendance rate shows 100% but students should be gone
- **Cause**: Teachers haven't responded to absence notifications yet
- **Solution**: Check notifications with status "pending"

**Issue**: gone count doesn't match expectations
- **Cause**: Filtering by wrong date or timezone issues
- **Solution**: Verify date parameter format and server timezone

**Issue**: Some classes missing from response
- **Cause**: Classes marked as inactive
- **Solution**: Only active classes are included; check `isActive` field
