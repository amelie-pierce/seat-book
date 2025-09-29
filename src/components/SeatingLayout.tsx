import { Box } from '@mui/material';
import Table from './Table';
import { SeatingConfig } from '../config/seatingConfig';

interface SeatingLayoutProps {
  onSeatClick?: (seatId: string) => void;
  availableSeats?: string[];
  selectedSeat?: string;
  seatingConfig: SeatingConfig;
}

export default function SeatingLayout({ onSeatClick, availableSeats, selectedSeat, seatingConfig }: SeatingLayoutProps) {
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

  const tableRows = generateTableRows();

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 0,
      alignItems: 'center',
      p: 2
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
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
