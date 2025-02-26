# Aerogen Website Analytics

This document explains the analytics implementation for the Aerogen website, which uses Netlify Functions and MongoDB to track anonymous user activity.

## Overview

The analytics system tracks user activity while maintaining privacy through:
- Anonymous, hashed user identifiers
- Session-based tracking for coherent user journeys
- Event-based data collection
- MongoDB for robust, scalable data storage

## Data Collection

### User Data
- Device information (browser, OS, screen size)
- Entry/exit pages
- Referrer data
- Session duration 
- Visit frequency

### Interaction Data
- Page navigation
- Feature usage (e.g., fun_mode toggles)
- Click coordinates and targets
- Form interactions

## Implementation Details

### Directory Structure
```
netlify/
├── functions/
│   ├── constructUserDocument.js - Creates user and session records
│   └── updateUserDocument.js - Updates session with events and metrics
src/
└── lib/
    └── utils/
        └── analytics.ts - Client-side utility for data collection
```

### Technologies Used
- MongoDB Atlas (aerogen-consulting-cluster)
- Netlify Functions (serverless)
- Browser APIs (navigator.sendBeacon, etc.)

## Data Model

### Users Collection
Stores unique visitor information:
```javascript
{
  userId: "hashed-identifier",
  firstVisit: ISODate("2023-04-15T..."),
  lastVisit: ISODate("2023-04-15T..."),
  visitCount: 5,
  device: { browser, os, screenSize, mobile }
}
```

### Sessions Collection
Stores information about each visit:
```javascript
{
  sessionId: "unique-session-id",
  userId: "hashed-identifier",
  startTime: ISODate("2023-04-15T..."),
  endTime: ISODate("2023-04-15T..."),
  referrer: "google.com",
  entryPage: "/home",
  exitPage: "/contact",
  lingerTime: 243, // seconds
  interactionCount: 25,
  funModeEnabled: true,
  funModeToggleCount: 2
}
```

### Events Collection
Stores detailed user interactions:
```javascript
{
  sessionId: "unique-session-id",
  userId: "hashed-identifier",
  type: "click", // click, navigation, setting_change, etc.
  timestamp: ISODate("2023-04-15T..."),
  page: "/about",
  data: { coordinates: [235, 782], element: "button.contact" }
}
```

## Configuration

### Required Environment Variables
Set these in Netlify's dashboard:
- `MONGODB_URI` - MongoDB connection string 
- `IP_HASH_SALT` - Secret salt for hashing IP addresses

## Privacy Considerations

- IP addresses are hashed with a salt and never stored directly
- No personally identifiable information is collected
- Data is used only for improving user experience
- Complies with basic GDPR principles of data minimization

## Usage Example

The analytics system is initialized automatically on page load. Additional events can be tracked with:

```javascript
import { trackEvent, trackClick } from "$lib/utils/analytics";

// Track a custom event
trackEvent('download', { filename: 'brochure.pdf' });

// Use in click handlers
<button on:click={(e) => trackClick(e, 'download_button')}>Download</button>
```

## Future Enhancements

- Dashboard for visualizing analytics data
- Heat maps for click tracking
- Funnel analysis for form completions
- A/B testing capabilities 