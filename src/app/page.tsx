'use client';
import { useState } from 'react';
import { Container, Box, Typography, Chip, Button, CircularProgress, Alert, Snackbar } from '@mui/material';
import { Person as PersonIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import SeatingLayout from '../components/SeatingLayout';
import ReservationForm from '../components/ReservationForm';
import UserAuthModal from '../components/UserAuthModal';
import { useUserSession } from '../hooks/useUserSession';
import { SEATING_CONFIG, generateAllSeats } from '../config/seatingConfig';
import { bookingService } from '../services/bookingService';
import { BookingRecord } from '../utils/bookingStorage';
import { useEffect } from 'react';

export default function Home() {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [pendingSeatId, setPendingSeatId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [userBookings, setUserBookings] = useState<BookingRecord[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  
  const { 
    currentUser, 
    setUser, 
    clearUserSession, 
    isAuthenticated, 
    isLoading,
    shouldShowAuthModal,
    setShouldShowAuthModal 
  } = useUserSession();

  // Initialize database and load user data when app opens
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoadingBookings(true);
        console.log('🚀 App starting - initializing booking system...');
        
        // Initialize the CSV database
        await bookingService.initializeDatabase();
        
        // Load reserved seats for today
        const reserved = await bookingService.getReservedSeats();
        setReservedSeats(reserved);
        
        console.log(`🎯 Loaded ${reserved.length} reserved seats for today`);
        
      } catch (error) {
        console.error('❌ Error initializing app:', error);
        setBookingError('Failed to load booking data');
      } finally {
        setIsLoadingBookings(false);
      }
    };

    initializeApp();
  }, []);

  // Load user-specific data when user logs in
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser && isAuthenticated) {
        try {
          console.log(`👤 Loading data for user: ${currentUser}`);
          const userData = await bookingService.loadUserData(currentUser);
          setUserBookings(userData.userBookings);
          
          console.log(`📊 User ${currentUser} has ${userData.totalBookings} total bookings`);
          if (userData.todayBooking) {
            console.log(`📅 Today's booking: ${userData.todayBooking.seatId} (${userData.todayBooking.timeSlot})`);
          }
        } catch (error) {
          console.error('❌ Error loading user data:', error);
        }
      } else {
        setUserBookings([]);
      }
    };

    loadUserData();
  }, [currentUser, isAuthenticated]);

  // Generate available seats based on configuration and reserved seats
  const availableSeats = generateAllSeats(SEATING_CONFIG).filter(seat => !reservedSeats.includes(seat));

  const handleSeatClick = (seatId: string) => {
    if (availableSeats.includes(seatId)) {
      // If user is not authenticated, show auth modal first
      if (!isAuthenticated) {
        setPendingSeatId(seatId);
        setShouldShowAuthModal(true);
        return;
      }
      
      // If authenticated, proceed with seat selection
      setSelectedSeat(seatId === selectedSeat ? null : seatId);
    }
  };

  const handleUserAuthenticated = (userId: string) => {
    setUser(userId);
    
    // If there was a pending seat selection, complete it now
    if (pendingSeatId) {
      setSelectedSeat(pendingSeatId);
      setPendingSeatId(null);
    }
  };

  const handleAuthModalClose = () => {
    setShouldShowAuthModal(false);
    setPendingSeatId(null);
  };

  const handleLogout = () => {
    clearUserSession();
    setSelectedSeat(null);
  };

  const handleReservation = async (data: { timeSlot: 'AM' | 'PM' | 'FULL_DAY' }) => {
    if (selectedSeat && currentUser) {
      try {
        setBookingError(null);
        console.log(`🎫 Creating booking: ${currentUser} -> ${selectedSeat} (${data.timeSlot})`);
        
        const result = await bookingService.createBooking(currentUser, selectedSeat, data.timeSlot);
        
        if (result.success) {
          console.log('✅ Booking created successfully');
          
          // Reload reserved seats from database
          const reserved = await bookingService.getReservedSeats();
          setReservedSeats(reserved);
          
          // Reload user bookings
          const userData = await bookingService.loadUserData(currentUser);
          setUserBookings(userData.userBookings);
          
          setSelectedSeat(null);
        } else {
          console.log('❌ Booking failed:', result.error);
          setBookingError(result.error || 'Failed to create booking');
        }
      } catch (error) {
        console.error('❌ Error creating booking:', error);
        setBookingError('Failed to create booking. Please try again.');
      }
    }
  };

  const handleClearBooking = () => {
    setSelectedSeat(null);
  };

  // Show loading state while checking authentication or loading bookings
  if (isLoading || isLoadingBookings) {
    return (
      <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box textAlign="center">
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', py: 2 }}>
      {/* User Session Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1" color="primary">
          Seat Booking
        </Typography>
        
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<PersonIcon />}
              label={`${currentUser} (${userBookings.length} bookings)`}
              color="primary"
              variant="outlined"
            />
            <Button
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              variant="outlined"
              size="small"
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Chip
            icon={<PersonIcon />}
            label="Not logged in - Select a seat to authenticate"
            color="default"
            variant="outlined"
          />
        )}
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          height: 'calc(100% - 80px)',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2
        }}
      >
        {/* Left Section - Seating Layout */}
        <Box 
          sx={{ 
            flex: { xs: 1, md: '0 0 60%' },
            backgroundColor: '#f8f9fa', 
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: { xs: '400px', md: 'auto' },
            border: '1px solid #e0e0e0'
          }}
        >
          
          <SeatingLayout 
            onSeatClick={handleSeatClick}
            availableSeats={availableSeats}
            selectedSeat={selectedSeat || undefined}
            seatingConfig={SEATING_CONFIG}
          />
        </Box>

        {/* Right Section - Reservation Form */}
        <Box 
          sx={{ 
            flex: { xs: 1, md: '0 0 40%' },
            p: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ReservationForm 
            selectedSeat={selectedSeat || undefined}
            onSubmit={handleReservation}
            onClear={handleClearBooking}
            currentUser={currentUser || undefined}
            isAuthenticated={isAuthenticated}
          />
        </Box>
      </Box>

      {/* User Authentication Modal */}
      <UserAuthModal
        open={shouldShowAuthModal}
        onClose={handleAuthModalClose}
        onUserConfirmed={handleUserAuthenticated}
        selectedSeat={pendingSeatId || undefined}
      />

      {/* Booking Error Snackbar */}
      <Snackbar
        open={!!bookingError}
        autoHideDuration={6000}
        onClose={() => setBookingError(null)}
      >
        <Alert severity="error" onClose={() => setBookingError(null)}>
          {bookingError}
        </Alert>
      </Snackbar>
    </Container>
  );
}
