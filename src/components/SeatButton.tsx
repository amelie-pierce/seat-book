import { IconButton, Typography } from '@mui/material';

interface SeatButtonProps {
  position: 'top' | 'bottom';
  leftPosition: string;
  onClick?: () => void;
  isAvailable?: boolean;
  seatNumber?: number;
  selected?: boolean;
}

export default function SeatButton({ 
  position, 
  leftPosition, 
  onClick, 
  isAvailable = true, 
  seatNumber,
  selected = false
}: SeatButtonProps) {
  return (
    <IconButton 
      onClick={onClick}
      sx={{ 
        position: 'absolute', 
        [position]: -25, 
        left: leftPosition, 
        transform: 'translateX(-50%)',
        backgroundColor: selected ? '#1976d2' : 'white',
        border: `2px solid ${selected ? '#1976d2' : '#ccc'}`,
        width: 36,
        height: 36,
        '&:hover': { backgroundColor: selected ? '#1565c0' : '#f0f0f0' },
        '&:disabled': { 
          backgroundColor: '#f5f5f5',
          border: '2px solid #ddd'
        }
      }}
      disabled={!isAvailable}
    >
      <Typography 
        variant="body2" 
        sx={{ 
          color: selected ? 'white' : (isAvailable ? '#4caf50' : '#ccc'), 
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}
      >
        {seatNumber}
      </Typography>
    </IconButton>
  );
}
