import { Box, Paper, Typography } from '@mui/material';
import SeatButton from './SeatButton';

interface TableProps {
  width?: number;
  height?: number;
  onSeatClick?: (seatId: string) => void;
  tableLetter: string;
  availableSeats?: string[];
  selectedSeat?: string;
}

export default function Table({ 
  width = 240, 
  height = 80, 
  onSeatClick, 
  tableLetter,
  availableSeats = [],
  selectedSeat
}: TableProps) {
  const seatPositions = ['20%', '50%', '80%'];
  
  const handleSeatClick = (seatNumber: number) => {
    const seatId = `${tableLetter}${seatNumber}`;
    if (onSeatClick) {
      onSeatClick(seatId);
    }
  };

  const isSeatAvailable = (seatNumber: number) => {
    const seatId = `${tableLetter}${seatNumber}`;
    return availableSeats.length === 0 || availableSeats.includes(seatId);
  };

  const isSeatSelected = (seatNumber: number) => {
    const seatId = `${tableLetter}${seatNumber}`;
    return selectedSeat === seatId;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Paper 
        sx={{ 
          width, 
          height, 
          backgroundColor: '#c0c0c0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 0,
          border: '1px solid #999'
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#333',
            fontSize: '1.2rem'
          }}
        >
          {tableLetter}
        </Typography>
      </Paper>
      
      {/* Top seats */}
      {seatPositions.map((position, index) => {
        const seatNumber = index + 1;
        return (
          <SeatButton
            key={`top-${index}`}
            position="top"
            leftPosition={position}
            onClick={() => handleSeatClick(seatNumber)}
            isAvailable={isSeatAvailable(seatNumber)}
            selected={isSeatSelected(seatNumber)}
            seatNumber={seatNumber}
          />
        );
      })}
      
      {/* Bottom seats */}
      {seatPositions.map((position, index) => {
        const seatNumber = index + 4;
        return (
          <SeatButton
            key={`bottom-${index}`}
            position="bottom"
            leftPosition={position}
            onClick={() => handleSeatClick(seatNumber)}
            isAvailable={isSeatAvailable(seatNumber)}
            selected={isSeatSelected(seatNumber)}
            seatNumber={seatNumber}
          />
        );
      })}
    </Box>
  );
}
