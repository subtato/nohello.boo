import { memo, useMemo, useState, useEffect } from 'react';
import i18n from '../i18n/config';
import yesGif from '../assets/yes.gif';
import noPng from '../assets/no.png';

interface ChatExampleProps {
  type: 'bad' | 'good';
}

type Platform = 'slack';

interface PlatformStyles {
  container: {
    background: string;
    borderRadius: string;
    padding: string;
  };
  userMessage: {
    background: string;
    color: string;
    borderRadius: string;
    marginLeft: string;
    marginRight: string;
    padding: string;
    boxShadow?: string;
  };
  otherMessage: {
    background: string;
    color: string;
    borderRadius: string;
    marginLeft: string;
    marginRight: string;
    padding: string;
    boxShadow?: string;
  };
  timePassage: {
    color: string;
    fontSize: string;
  };
}

const platformStyles: Record<Platform, PlatformStyles> = {
  slack: {
    container: {
      background: 'var(--color-bg-secondary)',
      borderRadius: '0px',
      padding: '16px 20px',
    },
    userMessage: {
      background: 'transparent',
      color: 'var(--color-text-primary)',
      borderRadius: '0px',
      marginLeft: '0',
      marginRight: '0',
      padding: '0px',
    },
    otherMessage: {
      background: 'transparent',
      color: 'var(--color-text-primary)',
      borderRadius: '0px',
      marginLeft: '0',
      marginRight: '0',
      padding: '0px',
    },
    timePassage: {
      color: 'var(--color-text-tertiary)',
      fontSize: '0.8125rem',
    },
  },
};

// Only Slack platform now

// Helper function to format dates for Slack
function formatDateForPlatform(date: Date, locale: string): string {
  // Check if date is today or yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = checkDate.getTime() === today.getTime();
  const isYesterday = checkDate.getTime() === yesterday.getTime();
  
  if (isToday) {
    // Use Intl.RelativeTimeFormat for "Today" in user's locale
    // Capitalize first letter to match Slack's format
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const formatted = rtf.format(0, 'day');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } else if (isYesterday) {
    // Use Intl.RelativeTimeFormat for "Yesterday" in user's locale
    // Capitalize first letter to match Slack's format
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const formatted = rtf.format(-1, 'day');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } else {
    // Format: "Weekday, Month Day" (e.g., "Monday, January 15th")
    // Use Intl.DateTimeFormat with weekday, month, and day
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    return formatter.format(date);
  }
}

// Generate dates spanning at least 3 days, extending if there's a weekend
// Ensures we have enough weekdays for supporter messages
function generateDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start from today and go back
  // We need at least 3 days, but if there's a weekend, we need to extend
  // to ensure we have enough weekdays for supporter messages
  let daysBack = 0;
  let weekdayCount = 0;
  const minDays = 3;
  
  // First, count how many days we need to go back to get at least 3 weekdays
  while (weekdayCount < minDays || daysBack < minDays) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - daysBack);
    const dayOfWeek = checkDate.getDay();
    
    // Count weekdays (Monday = 1, Friday = 5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdayCount++;
    }
    
    daysBack++;
    
    // Safety limit to prevent infinite loop
    if (daysBack > 14) break;
  }
  
  // Generate dates from daysBack days ago to today
  for (let i = daysBack; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  
  return dates;
}

// Check if a date is a weekend
function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}


// Business hours: 9AM - 5PM (Monday-Friday)
const BUSINESS_HOUR_START = 9; // 9 AM
const BUSINESS_HOUR_END = 17; // 5 PM

/**
 * Parses a time string (e.g., "9:07 AM", "2:00 PM") and returns the hour in 24-hour format
 */
function parseTimeToHour(timeString: string): number {
  const match = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return BUSINESS_HOUR_START; // Default to 9 AM if parsing fails
  
  let hour = parseInt(match[1], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }
  
  return hour;
}

/**
 * Checks if a time string is within business hours (9AM - 5PM)
 * Includes 5:00 PM as the last valid hour
 */
function isWithinBusinessHours(timeString: string): boolean {
  const hour = parseTimeToHour(timeString);
  return hour >= BUSINESS_HOUR_START && hour <= BUSINESS_HOUR_END;
}

/**
 * Gets the next business day (Monday-Friday) at 9AM from a given date
 * If the date is already a weekday, moves to the next day if needed
 */
function getNextBusinessDay(date: Date): Date {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);
  nextDate.setHours(BUSINESS_HOUR_START, 0, 0, 0);
  
  while (isWeekend(nextDate)) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

/**
 * Adjusts a date and time to ensure it's within business hours
 * If the time is outside business hours or on a weekend, moves to next business day at 9AM
 */
function adjustToBusinessHours(date: Date, timeString: string): { date: Date; time: string } {
  // First check if it's a weekend
  if (isWeekend(date)) {
    const nextBusinessDay = getNextBusinessDay(date);
    return { date: nextBusinessDay, time: '9:00 AM' };
  }
  
  // Check if time is within business hours
  if (!isWithinBusinessHours(timeString)) {
    const nextBusinessDay = getNextBusinessDay(date);
    return { date: nextBusinessDay, time: '9:00 AM' };
  }
  
  // Already within business hours on a weekday
  return { date, time: timeString };
}

// Message assignment interface
interface AssignedMessage {
  text: string;
  sender: 'you' | 'support';
  date: Date;
  timestamp: string;
  dateBreakIndex: number; // Index for date breaks
}

/**
 * Conversation script: Defines sender assignments for each conversation type
 * This is separate from translations - translations only contain message text
 */
const conversationScript: Record<'bad' | 'good', ('you' | 'support')[]> = {
  bad: ['you', 'support', 'you', 'support', 'you', 'support', 'you', 'support'],
  good: ['you', 'support'],
};

/**
 * Gets the sender for a message based on conversation type and index
 */
function getSenderForMessage(type: 'bad' | 'good', index: number): 'you' | 'support' {
  const script = conversationScript[type];
  // If script has assignment for this index, use it; otherwise alternate
  if (script && index < script.length) {
    return script[index];
  }
  // Default: alternate starting with "you"
  return index % 2 === 0 ? 'you' : 'support';
}

/**
 * Generates timestamps for messages based on date progression
 */
function generateTimestamps(messages: AssignedMessage[], availableDates: Date[]): AssignedMessage[] {
  // Group messages by date breaks (every 2 messages or when sender changes after support)
  const dateBreaks: number[] = [0]; // Always show date at start
  
  for (let i = 1; i < messages.length; i++) {
    const currentSender = messages[i].sender;
    const prevSender = messages[i - 1].sender;
    
    // Add date break when:
    // 1. Every 2 messages (roughly)
    // 2. When switching from support back to you (time has passed)
    if (i % 2 === 0 || (prevSender === 'support' && currentSender === 'you')) {
      dateBreaks.push(i);
    }
  }
  
  // Assign dates to messages
  const totalDateBreaks = dateBreaks.length;
  
  // Track time progression within each date to ensure chronological order
  // Maps date key to the last time index used on that date
  const lastTimeIndexByDate = new Map<string, number>();
  
  messages.forEach((msg, index) => {
    // Find which date break this message belongs to
    let dateBreakIndex = 0;
    for (let i = dateBreaks.length - 1; i >= 0; i--) {
      if (index >= dateBreaks[i]) {
        dateBreakIndex = i;
        break;
      }
    }
    
    // Map date break to available dates (working backwards from today)
    let mappedDateIndex = totalDateBreaks > 0
      ? Math.max(0, Math.min(
          availableDates.length - 1 - (totalDateBreaks - 1 - dateBreakIndex),
          availableDates.length - 1
        ))
      : availableDates.length - 1;
    
    // For support messages, ensure we never assign a weekend date
    // CRITICAL: Filter out weekends BEFORE assignment
    if (msg.sender === 'support') {
      // First, check if the initially mapped date is a weekend
      const initialDate = availableDates[mappedDateIndex];
      const initialDayOfWeek = initialDate?.getDay();
      
      // If the initial date is a weekend, we MUST find a weekday
      // Even if it means the support message is on a different date than the user message
      if (initialDayOfWeek === 0 || initialDayOfWeek === 6) {
        // Find the next weekday after the initial date
        let foundWeekday = false;
        for (let i = mappedDateIndex + 1; i < availableDates.length; i++) {
          const dayOfWeek = availableDates[i].getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            mappedDateIndex = i;
            foundWeekday = true;
            break;
          }
        }
        
        // If not found going forward, search backwards
        if (!foundWeekday) {
          for (let i = mappedDateIndex - 1; i >= 0; i--) {
            const dayOfWeek = availableDates[i].getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
              mappedDateIndex = i;
              foundWeekday = true;
              break;
            }
          }
        }
        // Note: generateDates() guarantees at least 3 weekdays exist,
        // so if forward and backward searches both fail, there's a logic error.
        // In that case, we'll use the last found weekday from the backward search.
      }
      // Note: If we're here, the date is already guaranteed to be a weekday
      // (either it was initially a weekday, or we found one in the checks above)
    }
    
    msg.date = availableDates[mappedDateIndex];
    msg.dateBreakIndex = dateBreakIndex;
    
    // Generate timestamp (time of day) with chronological ordering
    // Business hours only: 9AM - 5PM (exclude times after 5PM)
    const businessHoursTimes = ['9:07 AM', '11:19 AM', '2:00 PM', '4:07 PM'];
    const allTimes = ['9:07 AM', '11:19 AM', '2:00 PM', '4:07 PM', '5:26 PM', '6:31 PM', '7:15 PM'];
    
    // For support messages, only use business hours times
    // For user messages, can use any time
    const times = msg.sender === 'support' ? businessHoursTimes : allTimes;
    
    // Create a date key for tracking time progression within the same date
    const normalizeDate = (d: Date) => {
      const normalized = new Date(d);
      normalized.setHours(0, 0, 0, 0);
      return normalized.getTime();
    };
    const dateKey = normalizeDate(msg.date).toString();
    
    // Get the last time index used on this date
    const lastTimeIndex = lastTimeIndexByDate.get(dateKey);
    
    // Assign time ensuring chronological progression
    let timeIndex: number;
    if (lastTimeIndex === undefined) {
      // First message on this date - use a base time based on date break
      timeIndex = Math.min(dateBreakIndex, times.length - 1);
    } else {
      // Subsequent messages on same date - must be after the last time
      timeIndex = lastTimeIndex + 1;
      
      // If we've exceeded available times, we need to handle it
      // This can only happen for support messages (user messages are spread across dates)
      if (timeIndex >= times.length) {
        // Support messages can't wrap around - move to next business day
        // This will be handled by business hours adjustment below
        // For now, use the last available time and let the adjustment move it to next day
        timeIndex = times.length - 1;
      }
    }
    
    let assignedTime = times[timeIndex];
    
    // Update the last time index for this date
    lastTimeIndexByDate.set(dateKey, timeIndex);
    
    // For support messages, ensure the time is within business hours
    // Date is already guaranteed to be a weekday by the checks above
    if (msg.sender === 'support') {
      // Check if time is outside business hours and adjust if needed
      if (!isWithinBusinessHours(assignedTime)) {
        const adjusted = adjustToBusinessHours(msg.date, assignedTime);
        assignedTime = adjusted.time;
        
        // Find the adjusted date in available dates
        const normalizeDate = (d: Date) => {
          const normalized = new Date(d);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        };
        
        const normalizedAdjusted = normalizeDate(adjusted.date);
        let foundDate = false;
        
        // Try to find the adjusted date in available dates
        for (let i = 0; i < availableDates.length; i++) {
          const availableDate = availableDates[i];
          const normalizedAvailable = normalizeDate(availableDate);
          if (normalizedAvailable.getTime() === normalizedAdjusted.getTime() && !isWeekend(availableDate)) {
            msg.date = availableDate;
            foundDate = true;
            break;
          }
        }
        
        // If not found, find the next available weekday that's >= adjusted date
        if (!foundDate) {
          for (let i = 0; i < availableDates.length; i++) {
            const availableDate = availableDates[i];
            const normalizedAvailable = normalizeDate(availableDate);
            if (normalizedAvailable.getTime() >= normalizedAdjusted.getTime() && !isWeekend(availableDate)) {
              msg.date = availableDate;
              foundDate = true;
              break;
            }
          }
        }
        // Note: adjustToBusinessHours returns a future date, and generateDates generates dates going back from today.
        // If the adjusted date is beyond availableDates, we use the most recent available weekday from the search above.
        // Searching backwards for a past date doesn't make sense when adjusting to a future business day.
      }
    }
    
    msg.timestamp = assignedTime;
  });
  
  return messages;
}

/**
 * Processes messages and assigns them to "You" or "Support" with timestamps
 * Uses conversation script to determine sender assignments
 */
function assignMessagesToUsers(
  rawMessages: string[],
  availableDates: Date[],
  conversationType: 'bad' | 'good'
): AssignedMessage[] {
  const assignedMessages: AssignedMessage[] = [];
  
  // First pass: assign senders using conversation script
  rawMessages.forEach((text, index) => {
    const sender = getSenderForMessage(conversationType, index);
    
    assignedMessages.push({
      text,
      sender,
      date: new Date(), // Will be assigned in second pass
      timestamp: '', // Will be assigned in second pass
      dateBreakIndex: 0, // Will be assigned in second pass
    });
  });
  
  // Second pass: assign dates and timestamps
  return generateTimestamps(assignedMessages, availableDates);
}

export const ChatExample = memo(function ChatExample({ type }: ChatExampleProps) {
  // Only subscribe to language changes, not all i18n updates
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const currentPlatform: Platform = 'slack';
  
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);
  
  // Use i18n directly instead of hook to avoid unnecessary subscriptions
  const rawMessages = useMemo(() => 
    i18n.t(`problem.example.${type}.messages`, { returnObjects: true }) as string[],
    [type, currentLanguage] // Only re-compute when language actually changes
  );
  const title = useMemo(() => 
    i18n.t(`problem.example.${type}.title`),
    [type, currentLanguage] // Only re-compute when language actually changes
  );

  // Generate dates and assign messages to users with timestamps using conversation script
  const availableDates = useMemo(() => generateDates(), []);
  const assignedMessages = useMemo(() => 
    assignMessagesToUsers(rawMessages, availableDates, type),
    [rawMessages, availableDates, type]
  );

  // Track which date breaks we've shown to determine when to show date separators
  // For support messages, also check if the date changed from previous message
  const shownDateBreaks = useMemo(() => {
    const breaks = new Set<number>();
    assignedMessages.forEach((msg, index) => {
      // Show date at the first message of each date break
      const prevMsg = index > 0 ? assignedMessages[index - 1] : null;
      if (!prevMsg || prevMsg.dateBreakIndex !== msg.dateBreakIndex) {
        breaks.add(index);
      } else if (!prevMsg || prevMsg.sender !== msg.sender) {
        // Also show date if sender changed and dates are different
        // This ensures support messages on different dates get their own date header
        const normalizeDate = (d: Date) => {
          const normalized = new Date(d);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        };
        const prevDate = prevMsg ? normalizeDate(prevMsg.date) : null;
        const currDate = normalizeDate(msg.date);
        if (prevDate && prevDate.getTime() !== currDate.getTime()) {
          breaks.add(index);
        }
      }
    });
    return breaks;
  }, [assignedMessages]);

  const styles = platformStyles[currentPlatform];

  return (
    <div 
      className="shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border-2"
      style={{
        ...styles.container,
        borderColor: type === 'bad' ? 'var(--color-chat-bad-border)' : 'var(--color-chat-good-border)',
        transition: 'all 0.5s ease-in-out',
      }}
    >
      <h3 
        className="text-xl font-bold mb-6 flex items-center gap-2"
        style={{ color: type === 'bad' ? 'var(--color-chat-bad-text)' : 'var(--color-chat-good-text)' }}
      >
        <img 
          src={type === 'bad' ? noPng : yesGif}
          alt={type === 'bad' ? 'Bad example' : 'Good example'}
          className={type === 'bad' ? 'animate-pulse' : ''}
          style={{ width: '1.5rem', height: '1.5rem', objectFit: 'contain' }}
        />
        {title}
      </h3>
      <div 
        className="transition-all duration-500"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {assignedMessages.map((assignedMsg, index) => {
          const isUser = assignedMsg.sender === 'you';
          const showDate = shownDateBreaks.has(index);
          
          // Dates and timestamps are already validated by generateTimestamps
          // Support messages are guaranteed to be on weekdays and within business hours
          const dateForIndex = assignedMsg.date;
          const timestamp = assignedMsg.timestamp;
          
          // Generate avatar colors based on user - use consistent colors for same sender
          const avatarColors = isUser 
            ? ['#007A5A', '#4A154B', '#1264A3', '#2EB886', '#ECB22E']
            : ['#E01E5A', '#36C5F0', '#2EB67D', '#FF6B6B', '#4ECDC4'];
          // Use first color for each sender type to ensure consistency
          const avatarColor = avatarColors[0];
          const avatarInitial = isUser ? 'Y' : 'S'; // 'S' for Support
          
          // Format date for Slack using user's locale
          const slackDateText = formatDateForPlatform(dateForIndex, currentLanguage);
          
          return (
            <>
              {showDate && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: '1rem',
                  paddingTop: index === 0 ? '0' : '1rem',
                  paddingBottom: '1rem',
                }}>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    backgroundColor: 'var(--color-border)',
                  }}></div>
                  <span style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-tertiary)',
                    fontWeight: 500,
                    padding: '0 0.5rem',
                    whiteSpace: 'nowrap',
                  }}>
                    {slackDateText}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    backgroundColor: 'var(--color-border)',
                  }}></div>
                </div>
              )}
              <div
                key={index}
                className="transition-all duration-500"
                style={{
                  animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  paddingBottom: '4px',
                  paddingTop: '2px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: avatarColor,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {avatarInitial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                    }}>
                      {isUser ? 'You' : 'Them'}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-tertiary)',
                      fontWeight: 400,
                    }}>
                      {timestamp}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.9375rem',
                    lineHeight: '1.5rem',
                    color: 'var(--color-text-primary)',
                  }}>
                    {assignedMsg.text}
                  </div>
                </div>
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if type prop changes
  // Language changes are handled internally via state
  return prevProps.type === nextProps.type;
});

