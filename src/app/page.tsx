"use client";
import { useCallback, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
} from "@mui/icons-material";
import SeatingLayout from "../components/SeatingLayout";
import ReservationForm from "../components/ReservationForm";
import UserAuthModal from "../components/UserAuthModal";
import { useUserSession } from "../hooks/useUserSession";
import { SEATING_CONFIG, generateAllSeats } from "../config/seatingConfig";
import { bookingService } from "../services/bookingService";
import { BookingRecord } from "../utils/bookingStorage";
import { useEffect } from "react";

export default function Home() {
  const todayDate = new Date().toISOString().split("T")[0];

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [pendingSeatId, setPendingSeatId] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [userBookings, setUserBookings] = useState<BookingRecord[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayDate);
  const [availableSeatsForDate, setAvailableSeatsForDate] = useState<string[]>(
    []
  );
  const {
    currentUser,
    setUser,
    clearUserSession,
    isAuthenticated,
    isLoading,
    shouldShowAuthModal,
    setShouldShowAuthModal,
  } = useUserSession();

  // Initialize database and load user data when app opens
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoadingBookings(true);
        console.log("🚀 App starting - initializing booking system...");

        // Initialize the CSV database
        await bookingService.initializeDatabase();

        // Load reserved seats for today
        const reserved = await bookingService.getReservedSeats();
        setReservedSeats(reserved);

        console.log(`🎯 Loaded ${reserved.length} reserved seats for today`);
      } catch (error) {
        console.error("❌ Error initializing app:", error);
        
        // Check if this is a CSV loading error that should redirect to 404
        if (error instanceof Error && error.message.includes('Required CSV files could not be loaded')) {
          // The CSV service will handle the redirect
          return;
        }
        
        setBookingError("Failed to load booking data");
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
          
          // Refresh CSV data to get latest bookings
          await bookingService.refreshFromCsv();
          
          const userData = await bookingService.loadUserData(currentUser);
          setUserBookings(userData.userBookings);

          // Refresh reserved seats for current date
          if (selectedDate) {
            const reserved = await bookingService.getReservedSeats(selectedDate);
            setReservedSeats(reserved);
            
            // Update available seats for the current date
            const seats = generateAllSeats(SEATING_CONFIG).filter(
              (seat) => !reserved.includes(seat)
            );
            setAvailableSeatsForDate(seats);
          }

          console.log(
            `📊 User ${currentUser} has ${userData.totalBookings} total bookings`
          );
          if (userData.todayBooking) {
            console.log(
              `📅 Today's booking: ${userData.todayBooking.seatId} (${userData.todayBooking.timeSlot})`
            );
          }
        } catch (error) {
          console.error("❌ Error loading user data:", error);
        }
      } else {
        // Clear user-specific data when user logs out
        setUserBookings([]);
        setSelectedSeat(null);
      }
    };

    loadUserData();
  }, [currentUser, isAuthenticated, selectedDate]);

  useEffect(() => {
    // Only run if selectedDate is set
    if (selectedDate) {
      handleDateClick(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSeatClick = (seatId: string) => {
    // Use availableSeatsForDate which is properly updated for the selected date
    if (availableSeatsForDate.includes(seatId)) {
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

  const handleUserAuthenticated = async (userId: string) => {
    setUser(userId);

    // If there was a pending seat selection, complete it now
    if (pendingSeatId) {
      setSelectedSeat(pendingSeatId);
      setPendingSeatId(null);
    }

    // Refresh booking data to ensure new user sees updated seat availability
    try {
      await bookingService.refreshFromCsv();
      // Reload reserved seats for current date
      if (selectedDate) {
        const reserved = await bookingService.getReservedSeats(selectedDate);
        setReservedSeats(reserved);
        
        // Update available seats for the current date
        const seats = generateAllSeats(SEATING_CONFIG).filter(
          (seat) => !reserved.includes(seat)
        );
        setAvailableSeatsForDate(seats);
      }
    } catch (error) {
      console.error("Error refreshing data after login:", error);
    }
  };

  const handleAuthModalClose = () => {
    setShouldShowAuthModal(false);
    setPendingSeatId(null);
  };

  const handleLogout = async () => {
    clearUserSession();
    setSelectedSeat(null);
    setUserBookings([]);
    
    // Refresh booking data to ensure new user sees updated seat availability
    try {
      await bookingService.refreshFromCsv();
      // Reload reserved seats for current date
      if (selectedDate) {
        const reserved = await bookingService.getReservedSeats(selectedDate);
        setReservedSeats(reserved);
        
        // Update available seats for the current date
        const seats = generateAllSeats(SEATING_CONFIG).filter(
          (seat) => !reserved.includes(seat)
        );
        setAvailableSeatsForDate(seats);
      }
    } catch (error) {
      console.error("Error refreshing data after logout:", error);
    }
  };

  const handleReservation = async (date: string) => {
    if (selectedSeat && currentUser && date) {
      try {
        setBookingError(null);
        console.log(
          `🎫 Creating booking: ${currentUser} -> ${selectedSeat} on ${date}`
        );

        const result = await bookingService.createBooking(
          currentUser,
          selectedSeat,
          'FULL_DAY',
          date
        );

        if (result.success) {
          console.log("✅ Booking created successfully");

          // Reload reserved seats from database for the selected date
          const reserved = await bookingService.getReservedSeats(date);
          setReservedSeats(reserved);

          // Reload user bookings
          const userData = await bookingService.loadUserData(currentUser);
          setUserBookings(userData.userBookings);

          setSelectedSeat(null);

          // Rerun handleDateClick to update availableSeatsForDate and rerender SeatingLayout
          handleDateClick(date);
        } else {
          console.log("❌ Booking failed:", result.error);
          setBookingError(result.error || "Failed to create booking");
        }
      } catch (error) {
        console.error("❌ Error creating booking:", error);
        setBookingError("Failed to create booking. Please try again.");
      }
    }
  };

  const handleClearBooking = () => {
    setSelectedSeat(null);
  };

  const handleDateClick = useCallback(async (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedSeat(null); // Clear selected seat when changing date

    // Fetch reserved seats for the selected date
    try {
      const reserved = await bookingService.getReservedSeats(dateStr);
      // Generate available seats for that date
      const seats = generateAllSeats(SEATING_CONFIG).filter(
        (seat) => !reserved.includes(seat)
      );
      setAvailableSeatsForDate(seats);
    } catch (err) {
      console.error("Error loading seats for date:", err);
      setAvailableSeatsForDate([]);
      setBookingError("Failed to load seats for selected date");
    }
  }, []);

  // Show loading state while checking authentication or loading bookings
  if (isLoading || isLoadingBookings) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
    <Container maxWidth="xl" sx={{ height: "100vh", py: 2 }}>
      {/* User Session Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1" color="primary">
          Seat Booking
        </Typography>

        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
          display: "flex",
          height: "calc(100% - 80px)",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        {/* Left Section - Seating Layout */}
        <Box
          sx={{
            flex: { xs: 1, md: "0 0 60%" },
            backgroundColor: "#f8f9fa",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: { xs: "400px", md: "auto" },
            border: "1px solid #e0e0e0",
          }}
        >
          <SeatingLayout
            onSeatClick={handleSeatClick}
            availableSeats={availableSeatsForDate}
            selectedSeat={selectedSeat || undefined}
            seatingConfig={SEATING_CONFIG}
            selectedDate={selectedDate || undefined}
            onDateClick={handleDateClick}
          />
        </Box>

        {/* Right Section - Reservation Form */}
        <Box
          sx={{
            flex: { xs: 1, md: "0 0 40%" },
            p: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ReservationForm
            selectedDate={selectedDate || undefined}
            onDateClick={handleDateClick}
            selectedSeat={selectedSeat || undefined}
            onSubmit={handleReservation}
            onClear={handleClearBooking}
            currentUser={currentUser || undefined}
            isAuthenticated={isAuthenticated}
              userBookings={userBookings.filter(b => b.status === 'ACTIVE').map(b => ({ date: b.date, seatId: b.seatId }))}
            onBookingChange={async () => {
              if (currentUser) {
                // Refresh reserved seats for the selected date
                const reserved = await bookingService.getReservedSeats(selectedDate || todayDate);
                setReservedSeats(reserved);
                // Refresh user bookings
                const userData = await bookingService.loadUserData(currentUser);
                setUserBookings(userData.userBookings);
                // Refresh available seats for the selected date
                if (selectedDate) {
                  const seats = generateAllSeats(SEATING_CONFIG).filter(
                    (seat) => !reserved.includes(seat)
                  );
                  setAvailableSeatsForDate(seats);
                  // If the selected seat was just deleted, clear it
                  const stillBooked = userData.userBookings.find(
                    b => b.date === selectedDate && b.seatId === selectedSeat
                  );
                  if (!stillBooked) {
                    setSelectedSeat(null);
                  }
                }
              }
            }}
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
