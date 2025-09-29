// Booking data management with CSV storage
// This module handles reading/writing booking data to CSV files

export interface BookingRecord {
  id: string;                    // Unique booking ID
  userId: string;                // User identifier
  seatId: string;                // Seat identifier (e.g., "A1", "B3")
  date: string;                  // Booking date (YYYY-MM-DD format)
  timeSlot: 'AM' | 'PM' | 'FULL_DAY'; // Time slot
  bookingTimestamp: string;      // When the booking was made (ISO string)
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED'; // Booking status
  userEmail?: string;            // Optional: user email for notifications
  userName?: string;             // Optional: user display name
  specialRequests?: string;      // Optional: special requests or notes
  tableNumber?: string;          // Optional: derived table letter (e.g., "A", "B")
  contactPhone?: string;         // Optional: contact phone number
  modifiedTimestamp?: string;    // Optional: last modification timestamp
  modifiedBy?: string;           // Optional: who modified the booking
}

// CSV header structure - add new fields at the end for backward compatibility
export const CSV_HEADERS = [
  'id',
  'userId', 
  'seatId',
  'date',
  'timeSlot',
  'bookingTimestamp',
  'status',
  'userEmail',
  'userName',
  'specialRequests',
  'tableNumber',
  'contactPhone',
  'modifiedTimestamp',
  'modifiedBy'
] as const;

// Generate unique booking ID
export const generateBookingId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `BOOK_${timestamp}_${random}`.toUpperCase();
};

// Convert booking record to CSV row
export const bookingToCsvRow = (booking: BookingRecord): string => {
  const values = CSV_HEADERS.map(header => {
    const value = booking[header as keyof BookingRecord] || '';
    // Escape quotes and wrap in quotes if contains comma
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  });
  return values.join(',');
};

// Convert CSV row to booking record
export const csvRowToBooking = (csvRow: string): BookingRecord | null => {
  try {
    // Simple CSV parsing - in production, use a proper CSV parser
    const values = parseCsvRow(csvRow);
    if (values.length < CSV_HEADERS.length) {
      return null;
    }

    const booking: BookingRecord = {
      id: values[0] || '',
      userId: values[1] || '',
      seatId: values[2] || '',
      date: values[3] || '',
      timeSlot: (values[4] as 'AM' | 'PM' | 'FULL_DAY') || 'AM',
      bookingTimestamp: values[5] || '',
      status: (values[6] as 'ACTIVE' | 'CANCELLED' | 'COMPLETED') || 'ACTIVE',
      userEmail: values[7] || undefined,
      userName: values[8] || undefined,
      specialRequests: values[9] || undefined,
      tableNumber: values[10] || undefined,
      contactPhone: values[11] || undefined,
      modifiedTimestamp: values[12] || undefined,
      modifiedBy: values[13] || undefined,
    };

    return booking;
  } catch (error) {
    console.error('Error parsing CSV row:', error);
    return null;
  }
};

// Simple CSV row parser (handles quoted values)
const parseCsvRow = (row: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  return values;
};

// Create CSV content from booking records
export const createCsvContent = (bookings: BookingRecord[]): string => {
  const headerRow = CSV_HEADERS.join(',');
  const dataRows = bookings.map(bookingToCsvRow);
  return [headerRow, ...dataRows].join('\n');
};

// Parse CSV content to booking records
export const parseCsvContent = (csvContent: string): BookingRecord[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  // Skip header row
  const dataLines = lines.slice(1);
  return dataLines
    .map(csvRowToBooking)
    .filter((booking): booking is BookingRecord => booking !== null);
};

// Check if user already has a booking for the given date
export const hasUserBookingForDate = (bookings: BookingRecord[], userId: string, date: string): boolean => {
  return bookings.some(booking => 
    booking.userId === userId && 
    booking.date === date && 
    booking.status === 'ACTIVE'
  );
};

// Get user's booking for a specific date
export const getUserBookingForDate = (bookings: BookingRecord[], userId: string, date: string): BookingRecord | null => {
  return bookings.find(booking => 
    booking.userId === userId && 
    booking.date === date && 
    booking.status === 'ACTIVE'
  ) || null;
};

// Get all bookings for a specific date
export const getBookingsForDate = (bookings: BookingRecord[], date: string): BookingRecord[] => {
  return bookings.filter(booking => 
    booking.date === date && 
    booking.status === 'ACTIVE'
  );
};

// Get reserved seats for a specific date
export const getReservedSeatsForDate = (bookings: BookingRecord[], date: string): string[] => {
  return getBookingsForDate(bookings, date).map(booking => booking.seatId);
};

// Format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return formatDate(new Date());
};
