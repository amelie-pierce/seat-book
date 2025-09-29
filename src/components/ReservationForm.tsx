import { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Button, 
  Box,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

interface ReservationFormData {
  timeSlot: 'AM' | 'PM' | 'FULL_DAY';
}

interface ReservationFormProps {
  selectedSeat?: string;
  onSubmit?: (data: ReservationFormData) => void;
  onClear?: () => void;
  currentUser?: string;
  isAuthenticated?: boolean;
}

export default function ReservationForm({ 
  selectedSeat, 
  onSubmit, 
  onClear,
  currentUser, 
  isAuthenticated = false 
}: ReservationFormProps) {
  const [formData, setFormData] = useState<ReservationFormData>({
    timeSlot: 'AM'
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Convert seat ID to readable format
  const formatSeatDisplay = (seatId: string) => {
    // Seat ID is already in format like "A1", "B2", etc.
    if (seatId.length >= 2) {
      const tableLetter = seatId.charAt(0);
      const seatNumber = seatId.slice(1);
      return `Table ${tableLetter}, Seat ${seatNumber}`;
    }
    return seatId;
  };

  const handleTimeSlotChange = (event: { target: { value: 'AM' | 'PM' | 'FULL_DAY' } }) => {
    setFormData(prev => ({
      ...prev,
      timeSlot: event.target.value
    }));
  };

  const handleClear = () => {
    setFormData({
      timeSlot: 'AM'
    });
    if (onClear) {
      onClear();
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    setShowSuccess(true);
    // Reset form
    setFormData({
      timeSlot: 'AM'
    });
  };

  const isFormValid = isAuthenticated && selectedSeat;

  return (
    <>
      <Paper 
        elevation={3}
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 400,
          borderRadius: 2
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
        
        {!isAuthenticated && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please select a seat and authenticate to continue
          </Alert>
        )}
        
        {/* Date, Seat, Time Slot, and Clear Button Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={new Date().toLocaleDateString()} 
            color="primary" 
            variant="outlined"
            sx={{ fontSize: '0.875rem' }}
          />
          {selectedSeat && (
            <Chip 
              label={formatSeatDisplay(selectedSeat)} 
              color="secondary" 
              variant="filled"
              sx={{ fontSize: '0.875rem' }}
            />
          )}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Time</InputLabel>
            <Select
              value={formData.timeSlot}
              label="Time"
              onChange={handleTimeSlotChange}
            >
              <MenuItem value="AM">AM</MenuItem>
              <MenuItem value="PM">PM</MenuItem>
              <MenuItem value="FULL_DAY">Full Day</MenuItem>
            </Select>
          </FormControl>
          <IconButton 
            onClick={handleClear}
            color="error"
            size="small"
            title="Clear booking data"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button 
            type="submit"
            variant="contained" 
            size="large"
            sx={{ mt: 2 }}
            disabled={!isFormValid}
          >
            {!isAuthenticated ? 'Please Authenticate First' : 
             !selectedSeat ? 'Select a Seat' : 
             'Reserve Seat'}
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
