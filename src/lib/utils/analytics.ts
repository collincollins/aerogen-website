// Analytics utility for client-side data collection
import { browser } from '$app/environment';
import { fun_mode } from '../stores/navigation';
import { writable, derived, get } from 'svelte/store';

// Store session information
export const sessionData = writable<{
  sessionId: string | null;
  userId: string | null;
}>({
  sessionId: null,
  userId: null
});

// Store for buffering events before sending to server
export const eventBuffer = writable<any[]>([]);

// Track if we're in development mode
const isDev = browser ? window.location.hostname === 'localhost' : false;

// Helper to get browser and device information
function getDeviceInfo() {
  if (!browser) return {};
  
  const ua = navigator.userAgent;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  return {
    browser: getBrowserInfo(ua),
    os: getOSInfo(ua),
    screenSize: `${screenWidth}x${screenHeight}`,
    mobile: /Mobi|Android/i.test(ua) || screenWidth < 768
  };
}

// Extract browser information from user agent
function getBrowserInfo(ua: string) {
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Other';
}

// Extract OS information from user agent
function getOSInfo(ua: string) {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
}

// Initialize analytics and create user document
export async function initAnalytics() {
  if (!browser) {
    console.log('Analytics: Not initializing - not in browser environment');
    return;
  }
  
  if (isDev) {
    console.log('Analytics: Not initializing - in development mode');
    return;
  }

  try {
    console.log('Analytics: Initializing...');
    
    // Get current page path
    const entryPage = window.location.pathname;
    
    // Get referrer if available
    const referrer = document.referrer;
    
    // Collect device info
    const deviceInfo = getDeviceInfo();
    
    // Construct payload
    const payload = {
      entryPage,
      referrer,
      ...deviceInfo
    };
    
    console.log('Analytics: Sending initial payload', payload);
    
    // Send to Netlify function
    const response = await fetch('/.netlify/functions/constructUserDocument', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analytics: Server responded with error', response.status, errorText);
      throw new Error(`Error initializing analytics: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Analytics: Received response', data);
    
    // Store session data for future updates
    sessionData.set({
      sessionId: data.sessionId,
      userId: data.userId || null
    });
    
    // Set up periodic flush of event buffer
    setInterval(flushEvents, 30000);
    
    // Set up flush on page unload
    if (browser) {
      window.addEventListener('beforeunload', handlePageUnload);
    }
    
    // Set up fun_mode tracking
    trackFunMode();
    
    console.log('Analytics: Initialization complete');
    
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

// Track fun_mode changes
function trackFunMode() {
  let prevFunMode = false;
  
  fun_mode.subscribe(value => {
    // Skip initial subscription
    if (prevFunMode !== value && get(sessionData).sessionId) {
      trackEvent('setting_change', {
        setting: 'fun_mode',
        value: value,
        toggled: true
      });
      
      // Update fun mode in session
      updateSession({
        funModeEnabled: value,
        funModeToggled: true
      });
    }
    
    prevFunMode = value;
  });
}

// Add event to buffer
export function trackEvent(eventType: string, eventData: any = {}) {
  if (!browser || isDev || !get(sessionData).sessionId) return;
  
  eventBuffer.update(buffer => {
    buffer.push({
      type: eventType,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      data: eventData
    });
    
    // If buffer gets too large, flush immediately
    if (buffer.length >= 20) {
      setTimeout(flushEvents, 0);
    }
    
    return buffer;
  });
}

// Track a mouse click with coordinates
export function trackClick(event: MouseEvent, elementName?: string) {
  if (!browser || isDev || !get(sessionData).sessionId) return;
  
  const target = event.target as HTMLElement;
  
  trackEvent('click', {
    coordinates: [event.clientX, event.clientY],
    element: elementName || target.tagName.toLowerCase(),
    id: target.id || undefined,
    className: target.className || undefined
  });
}

// Update session data
export async function updateSession(sessionUpdates: any) {
  if (!browser || isDev) return;
  
  const session = get(sessionData);
  
  if (!session.sessionId) return;
  
  try {
    const payload = {
      sessionId: session.sessionId,
      userId: session.userId,
      ...sessionUpdates
    };
    
    const response = await fetch('/.netlify/functions/updateUserDocument', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analytics: Error updating session', response.status, errorText);
    }
  } catch (error) {
    console.error('Failed to update session:', error);
  }
}

// Flush events from buffer to server
export async function flushEvents() {
  if (!browser || isDev) return;
  
  const session = get(sessionData);
  const events = get(eventBuffer);
  
  if (!session.sessionId || events.length === 0) return;
  
  try {
    // Clear buffer first to prevent duplicate sends
    eventBuffer.set([]);
    
    const payload = {
      sessionId: session.sessionId,
      userId: session.userId,
      events
    };
    
    const response = await fetch('/.netlify/functions/updateUserDocument', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analytics: Error flushing events', response.status, errorText);
      // Put events back in buffer if send fails
      eventBuffer.update(buffer => [...buffer, ...events]);
    }
  } catch (error) {
    console.error('Failed to flush events:', error);
    
    // Put events back in buffer if send fails
    eventBuffer.update(buffer => [...buffer, ...events]);
  }
}

// Handle page unload - final flush of events
function handlePageUnload() {
  const session = get(sessionData);
  const events = get(eventBuffer);
  
  if (!session.sessionId || events.length === 0) return;
  
  // Use navigator.sendBeacon for more reliable delivery during page unload
  if (navigator.sendBeacon) {
    const payload = {
      sessionId: session.sessionId,
      userId: session.userId,
      events,
      endTime: new Date().toISOString(),
      exitPage: window.location.pathname
    };
    
    navigator.sendBeacon(
      '/.netlify/functions/updateUserDocument',
      JSON.stringify(payload)
    );
  } else {
    // Fallback to synchronous XHR
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/.netlify/functions/updateUserDocument', false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    const payload = {
      sessionId: session.sessionId,
      userId: session.userId,
      events,
      endTime: new Date().toISOString(),
      exitPage: window.location.pathname
    };
    
    xhr.send(JSON.stringify(payload));
  }
} 