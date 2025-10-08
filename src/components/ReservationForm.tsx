import { useState } from "react";
import { bookingService } from "../services/bookingService";
import {
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Snackbar,
  Chip,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

interface ReservationFormProps {
  selectedSeat?: string;
  onSubmit?: (date: string) => void;
  currentUser?: string;
  isAuthenticated?: boolean;
  onDateClick?: (date: string) => void;
  selectedDate?: string;
  userBookings?: { date: string; seatId: string }[];
  onBookingChange?: () => void;
  onClear?: () => void;
}

export default function ReservationForm({
  selectedSeat,
  onSubmit,
  currentUser,
  isAuthenticated = false,
  onDateClick,
  selectedDate,
  userBookings = [],
  onBookingChange,
  onClear
}: ReservationFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  // Convert seat ID to readable format
  const formatSeatDisplay = (seatId: string) => {
    if (seatId.length >= 2) {
      const tableLetter = seatId.charAt(0);
      const seatNumber = seatId.slice(1);
      return `Table ${tableLetter}, Seat ${seatNumber}`;
    }
    return seatId;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmit && selectedDate) {
      onSubmit(selectedDate);
    }
    setShowSuccess(true);
  };

    const isFormValid = isAuthenticated && selectedSeat;

    return (
      <>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 400,
            borderRadius: 2,
          }}
        >
          <Typography variant="h5" component="h2" mb={3} textAlign="center">
            Reserve Your Seat
          </Typography>

          {selectedSeat && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Selected Seat: {selectedSeat}
            </Alert>
          )}

          {currentUser && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Booking as: {currentUser}
            </Alert>
          )}

          {/* Date, Seat, and Delete Button Row */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            {/* Loop through dates from today to next week's Friday (excluding Sat/Sun) */}
            {(() => {
              const today = new Date();
              const dates: Date[] = [];
              // Find next week's Friday
              const currentDay = today.getDay();
              let daysUntilFriday = (5 - currentDay + 7) % 7;
              if (daysUntilFriday === 0) daysUntilFriday = 7;
              daysUntilFriday += 7;
              const nextWeekFriday = new Date(today);
              nextWeekFriday.setDate(today.getDate() + daysUntilFriday);
              const loopDate = new Date(today);
              while (loopDate <= nextWeekFriday) {
                const dayOfWeek = loopDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                  dates.push(new Date(loopDate));
                }
                loopDate.setDate(loopDate.getDate() + 1);
              }
              return dates.map((date, idx) => {
                const dateStr = date.toISOString().split("T")[0];
                const isSelected = selectedDate === dateStr;
                const booking = userBookings.find(b => b.date === dateStr);
                let seatLabel;
                if (isSelected) {
                  if (booking) {
                    seatLabel = formatSeatDisplay(booking.seatId);
                  } else if (selectedSeat) {
                    seatLabel = formatSeatDisplay(selectedSeat);
                  } else {
                    seatLabel = "not booked yet";
                  }
                } else if (booking) {
                  seatLabel = formatSeatDisplay(booking.seatId);
                } else {
                  seatLabel = "not booked yet";
                }
                return (
                  <Box
                    key={idx}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Chip
                      label={date.toLocaleDateString()}
                      color="primary"
                      variant="outlined"
                      sx={{
                        fontSize: "0.875rem",
                        flex: 1,
                        fontWeight: isSelected ? "bold" : "normal",
                        boxShadow: isSelected ? 2 : 0,
                      }}
                      onClick={
                        onDateClick
                          ? () => onDateClick(dateStr)
                          : undefined
                      }
                    />
                    <Chip
                      label={seatLabel}
                      color={booking ? "secondary" : "default"}
                      variant={booking ? "filled" : "outlined"}
                      sx={{ fontSize: "0.875rem" }}
                    />
                    <IconButton
                      color="error"
                      size="small"
                      title="Remove this date"
                      onClick={async () => {
                        if (!currentUser) return;
                        if (!booking) return;
                        try {
                          console.log('12321 ')
                          const allUserBookings = await bookingService.getUserBookings(currentUser);
                          const fullBooking = allUserBookings.find(b => b.date === dateStr && b.seatId === booking.seatId && b.status === 'ACTIVE');
                          if (!fullBooking) return;
                          await bookingService.cancelBooking(fullBooking.id, currentUser);
                          if (onBookingChange) await onBookingChange();
                        } catch (err) {
                          console.error('Failed to cancel booking:', err);
                        }
                      }}
                      disabled={!booking}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                );
              });
            })()}
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
              disabled={!isFormValid}
            >
              {!isAuthenticated
                ? "Please Authenticate First"
                : !selectedSeat
                ? "Select a Seat"
                : "Reserve Seat"}
            </Button>
          </Box>
        </Paper>

        <Snackbar
          open={showSuccess}
          autoHideDuration={4000}
          onClose={() => setShowSuccess(false)}
        >
          <Alert severity="success" onClose={() => setShowSuccess(false)}>
            Reservation submitted successfully!
          </Alert>

        </Snackbar>
      </>
    );
}

