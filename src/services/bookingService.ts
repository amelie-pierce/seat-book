// Booking service for managing CSV-based booking data
// This simulates an external database using CSV files stored in localStorage
// In production, this would use actual file system or database operations

import { 
  BookingRecord, 
  createCsvContent, 
  parseCsvContent, 
  generateBookingId,
  hasUserBookingForDate,
  getUserBookingForDate,
  getReservedSeatsForDate,
  getTodayDate
} from '../utils/bookingStorage';

const STORAGE_KEY = 'seat_booking_csv_database';

export class BookingService {
  private cachedBookings: BookingRecord[] = [];
  private isInitialized = false;

  // Initialize database connection and load all data
  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('📊 Initializing booking database...');
      this.cachedBookings = await this.loadAllBookingsFromCsv();
      this.isInitialized = true;
      console.log(`📊 Database initialized with ${this.cachedBookings.length} records`);
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      this.cachedBookings = [];
      this.isInitialized = true;
    }
  }

  // Load all bookings from CSV file (simulates database read)
  private async loadAllBookingsFromCsv(): Promise<BookingRecord[]> {
    try {
      const csvData = localStorage.getItem(STORAGE_KEY);
      if (!csvData) {
        console.log('📄 No existing CSV database found, creating new one');
        return [];
      }
      
      const bookings = parseCsvContent(csvData);
      console.log(`📄 Loaded ${bookings.length} records from CSV database`);
      return bookings;
    } catch (error) {
      console.error('❌ Error loading CSV database:', error);
      return [];
    }
  }

  // Save all bookings to CSV file (simulates database write)
  private async saveToCsvDatabase(bookings: BookingRecord[]): Promise<void> {
    try {
      const csvData = createCsvContent(bookings);
      localStorage.setItem(STORAGE_KEY, csvData);
      console.log(`💾 Auto-saved ${bookings.length} records to CSV database`);
    } catch (error) {
      console.error('❌ Error auto-saving to CSV database:', error);
      throw new Error('Database auto-save failed');
    }
  }

  // Load user-specific data on app open
  async loadUserData(userId: string): Promise<{
    userBookings: BookingRecord[];
    todayBooking: BookingRecord | null;
    totalBookings: number;
  }> {
    await this.initializeDatabase();
    
    const userBookings = this.cachedBookings.filter(b => b.userId === userId);
    const todayBooking = getUserBookingForDate(this.cachedBookings, userId, getTodayDate());
    
    console.log(`👤 Loaded user data for ${userId}: ${userBookings.length} bookings`);
    
    return {
      userBookings,
      todayBooking,
      totalBookings: userBookings.length
    };
  }

  // Create a new booking and immediately save to CSV
  async createBooking(
    userId: string, 
    seatId: string, 
    timeSlot: 'AM' | 'PM' | 'FULL_DAY',
    date?: string
  ): Promise<{ success: boolean; booking?: BookingRecord; error?: string }> {
    await this.initializeDatabase();
    
    try {
      const bookingDate = date || getTodayDate();

      // Check if user already has a booking for this date
      if (hasUserBookingForDate(this.cachedBookings, userId, bookingDate)) {
        return {
          success: false,
          error: 'You already have a booking for this date. Only one booking per day is allowed.'
        };
      }

      // Check if seat is already booked for this date and time
      const existingBooking = this.cachedBookings.find((b: BookingRecord) => 
        b.seatId === seatId && 
        b.date === bookingDate && 
        b.status === 'ACTIVE' &&
        (b.timeSlot === timeSlot || b.timeSlot === 'FULL_DAY' || timeSlot === 'FULL_DAY')
      );

      if (existingBooking) {
        return {
          success: false,
          error: 'This seat is already booked for the selected time slot.'
        };
      }

      // Create new booking record
      const newBooking: BookingRecord = {
        id: generateBookingId(),
        userId,
        seatId,
        date: bookingDate,
        timeSlot,
        bookingTimestamp: new Date().toISOString(),
        status: 'ACTIVE',
        tableNumber: seatId.charAt(0), // Extract table letter
      };

      // Add to cache and immediately save to CSV database (auto-save)
      this.cachedBookings.push(newBooking);
      await this.saveToCsvDatabase(this.cachedBookings);

      console.log(`✅ New booking created and auto-saved: ${userId} -> ${seatId} (${timeSlot}) on ${bookingDate}`);
      return { success: true, booking: newBooking };
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      return { success: false, error: 'Failed to create booking' };
    }
  }

  // Cancel a booking and immediately save to CSV
  async cancelBooking(bookingId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    await this.initializeDatabase();
    
    try {
      const bookingIndex = this.cachedBookings.findIndex((b: BookingRecord) => 
        b.id === bookingId && b.userId === userId
      );

      if (bookingIndex === -1) {
        return { success: false, error: 'Booking not found' };
      }

      // Update booking status in cache
      this.cachedBookings[bookingIndex].status = 'CANCELLED';
      this.cachedBookings[bookingIndex].modifiedTimestamp = new Date().toISOString();
      this.cachedBookings[bookingIndex].modifiedBy = userId;

      // Immediately save to CSV database (auto-save)
      await this.saveToCsvDatabase(this.cachedBookings);

      console.log(`❌ Booking cancelled and auto-saved: ${bookingId} by ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      return { success: false, error: 'Failed to cancel booking' };
    }
  }

  // Get user's current booking for today (from cache)
  async getUserTodayBooking(userId: string): Promise<BookingRecord | null> {
    await this.initializeDatabase();
    return getUserBookingForDate(this.cachedBookings, userId, getTodayDate());
  }

  // Get reserved seats for a specific date (from cache)
  async getReservedSeats(date?: string): Promise<string[]> {
    await this.initializeDatabase();
    const targetDate = date || getTodayDate();
    return getReservedSeatsForDate(this.cachedBookings, targetDate);
  }

  // Get all bookings for a user (from cache)
  async getUserBookings(userId: string): Promise<BookingRecord[]> {
    await this.initializeDatabase();
    return this.cachedBookings.filter((b: BookingRecord) => b.userId === userId);
  }

  // Import bookings from CSV content and merge with existing database
  async importBookingsFromCsv(csvContent: string): Promise<{ success: boolean; error?: string; imported?: number }> {
    await this.initializeDatabase();
    
    try {
      const importedBookings = parseCsvContent(csvContent);
      
      // Add imported bookings (avoid duplicates by ID)
      const existingIds = new Set(this.cachedBookings.map((b: BookingRecord) => b.id));
      const newBookings = importedBookings.filter((b: BookingRecord) => !existingIds.has(b.id));
      
      // Add new bookings to cache
      this.cachedBookings.push(...newBookings);
      
      // Save updated database to CSV
      await this.saveToCsvDatabase(this.cachedBookings);
      
      console.log(`📥 Imported ${newBookings.length} new bookings from CSV`);
      return { success: true, imported: newBookings.length };
    } catch (error) {
      console.error('❌ Error importing bookings:', error);
      return { success: false, error: 'Failed to import bookings' };
    }
  }

  // Get booking statistics (from cache)
  async getBookingStats(): Promise<{
    totalBookings: number;
    activeBookings: number;
    todayBookings: number;
    cancelledBookings: number;
  }> {
    await this.initializeDatabase();
    const today = getTodayDate();
    
    return {
      totalBookings: this.cachedBookings.length,
      activeBookings: this.cachedBookings.filter((b: BookingRecord) => b.status === 'ACTIVE').length,
      todayBookings: this.cachedBookings.filter((b: BookingRecord) => b.date === today && b.status === 'ACTIVE').length,
      cancelledBookings: this.cachedBookings.filter((b: BookingRecord) => b.status === 'CANCELLED').length,
    };
  }

  // Force refresh cache from CSV database
  async refreshFromDatabase(): Promise<void> {
    console.log('🔄 Refreshing cache from CSV database...');
    this.cachedBookings = await this.loadAllBookingsFromCsv();
    console.log(`🔄 Cache refreshed with ${this.cachedBookings.length} records`);
  }

  // Get current cache status (for debugging)
  getCacheInfo(): { isInitialized: boolean; recordCount: number } {
    return {
      isInitialized: this.isInitialized,
      recordCount: this.cachedBookings.length
    };
  }
}

// Singleton instance
export const bookingService = new BookingService();
