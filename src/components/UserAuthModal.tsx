import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField, 
  Button, 
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

interface UserAuthModalProps {
  open: boolean;
  onClose: () => void;
  onUserConfirmed: (userId: string) => void;
  selectedSeat?: string;
}

export default function UserAuthModal({ 
  open, 
  onClose, 
  onUserConfirmed, 
  selectedSeat 
}: UserAuthModalProps) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      setError('User ID is required');
      return;
    }

    if (trimmedUserId.length < 3) {
      setError('User ID must be at least 3 characters long');
      return;
    }

    // Store user ID in localStorage
    localStorage.setItem('seatBookingUserId', trimmedUserId);
    
    onUserConfirmed(trimmedUserId);
    handleClose();
  };

  const handleClose = () => {
    setUserId('');
    setError('');
    onClose();
  };

  const handleUserIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(event.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <Dialog 
      open={open} 
      onClose={selectedSeat ? handleClose : undefined} // Only allow close if there's a selected seat
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!selectedSeat} // Disable ESC key if no selected seat
      PaperProps={{
        sx: { borderRadius: 2, p: 1 }
      }}
    >
      <DialogTitle sx={{ pb: 1, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6" component="span">
            User Identification Required
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        {selectedSeat ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            You&apos;re about to reserve seat: <strong>{selectedSeat}</strong>
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            Welcome! Please authenticate to start booking seats.
          </Alert>
        )}
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Please enter your User ID to continue with the seat reservation system. This will be stored securely for your booking session.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            label="User ID"
            type="text"
            fullWidth
            value={userId}
            onChange={handleUserIdChange}
            error={!!error}
            helperText={error || 'Enter a unique identifier (minimum 3 characters)'}
            placeholder="e.g., john.doe, user123, etc."
            sx={{ mb: 2 }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          Your User ID will be saved locally and used for future reservations during this session.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {selectedSeat && (
          <Button 
            onClick={handleClose} 
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={!userId.trim() || userId.trim().length < 3}
        >
          {selectedSeat ? 'Continue to Booking' : 'Get Started'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
