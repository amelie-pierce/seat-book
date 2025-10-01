import { Box, Chip } from '@mui/material';
import Table from './Table';
import { SeatingConfig } from '../config/seatingConfig';

interface SeatingLayoutProps {
  onSeatClick?: (seatId: string) => void;
  availableSeats?: string[];
  selectedSeat?: string;
  seatingConfig: SeatingConfig;
  selectedDate?: string;
  onDateClick?: (date: string) => void;
}

export default function SeatingLayout({ onSeatClick, availableSeats, selectedSeat, seatingConfig, selectedDate, onDateClick }: SeatingLayoutProps) {
  // Generate table rows dynamically based on configuration
  const generateTableRows = () => {
    const rows = [];
    const totalRows = Math.ceil(seatingConfig.numberOfTables / seatingConfig.tablesPerRow);
    
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const startTableIndex = rowIndex * seatingConfig.tablesPerRow;
      const endTableIndex = Math.min(startTableIndex + seatingConfig.tablesPerRow, seatingConfig.numberOfTables);
      
      const tablesInRow = [];
      const lettersInRow = [];
      
      for (let tableIndex = startTableIndex; tableIndex < endTableIndex; tableIndex++) {
        tablesInRow.push(`table-${rowIndex}-${tableIndex % seatingConfig.tablesPerRow}`);
        lettersInRow.push(seatingConfig.tableLetters[tableIndex]);
      }
      
      rows.push({
        id: `row${rowIndex + 1}`,
        tables: tablesInRow,
        letters: lettersInRow
      });
    }
    
    return rows;
  };


  // Generate date chips (same logic as ReservationForm)
  const getDateChips = () => {
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
    return dates;
  };
  const dateChips = getDateChips();
  const tableRows = generateTableRows();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 0,
      alignItems: 'center',
      p: 2
    }}>
      {/* Date header chips - horizontally scrollable and spaced above layout */}
      <Box
        sx={{
          width: '100%',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          display: 'block',
          mb: 4, // more margin below header
          pb: 1,
          pt: 1,
          background: '#fff',
          borderRadius: 2,
          boxShadow: 1,
          position: 'relative',
          zIndex: 2,
          maxWidth: 900,
        }}
      >
        <Box sx={{ display: 'inline-flex', gap: 1, px: 2 }}>
          {dateChips.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            return (
              <Chip
                key={dateStr}
                label={date.toLocaleDateString()}
                color={selectedDate === dateStr ? 'secondary' : 'default'}
                variant={selectedDate === dateStr ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: selectedDate === dateStr ? 'bold' : 'normal',
                  minWidth: 90,
                  cursor: 'pointer',
                  border: selectedDate === dateStr ? '2px solid #1976d2' : undefined,
                  boxShadow: selectedDate === dateStr ? 2 : 0,
                  mx: 0.5,
                }}
                onClick={onDateClick ? () => onDateClick(dateStr) : undefined}
              />
            );
          })}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, mt: 1 }}>
        {tableRows.map((row) => (
          <Box key={row.id} sx={{ display: 'flex', gap: 4, mb: 8 }}>
            {row.tables.map((tableId, index) => (
              <Table
                key={tableId}
                tableLetter={row.letters[index]}
                onSeatClick={onSeatClick}
                availableSeats={availableSeats}
                selectedSeat={selectedSeat}
                width={240}
                height={80}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
