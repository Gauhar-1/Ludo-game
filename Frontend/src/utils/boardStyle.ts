export const BOARD_SIZE = 15;

export const getTileType = (row: number, col: number): string => {

  //  Base stops
  if (row == 6 && col ===1 ) return 'red-base-stop';
  if (row == 1 && col ===8 ) return 'green-base-stop';
  if (row == 8 && col ===13 ) return 'yellow-base-stop';
  if (row == 13 && col ===6 ) return 'blue-base-stop';

  //  star stops
  if (row == 8 && col ===2 ) return 'star-red-stop';
  if (row == 2 && col ===6 ) return 'star-green-stop';
  if (row == 6 && col ===12 ) return 'star-yellow-stop';
  if (row == 12 && col ===8 ) return 'star-blue-stop';
  
  //   Red Base
  if (row == 1 && col ===1 ) return 'base';
  if (row == 1 && col ===4 ) return 'base';
  if (row == 4 && col ===1 ) return 'base';
  if (row == 4 && col ===4 ) return 'base';

  //   Green Base
  if (row == 1 && col ===13 ) return 'base';
  if (row == 1 && col ===10 ) return 'base';
  if (row == 4 && col ===13 ) return 'base';
  if (row == 4 && col ===10 ) return 'base';

  //   Yellow Base
  if (row == 13 && col ===13 ) return 'base';
  if (row == 10 && col ===10 ) return 'base';
  if (row == 10 && col ===13 ) return 'base';
  if (row == 13 && col ===10 ) return 'base';

  //   blue Base
  if (row == 10 && col ===1 ) return 'base';
  if (row == 13 && col ===4 ) return 'base';
  if (row == 13 && col ===1 ) return 'base';
  if (row == 10 && col ===4 ) return 'base';

  // Corners
  if (row < 6 && col < 6) return 'home-red';
  if (row < 6 && col > 8) return 'home-green';
  if (row > 8 && col < 6) return 'home-blue';
  if (row > 8 && col > 8) return 'home-yellow';

  // Center triangles sides
  if (row === 6 && col === 6) return 'center-red';
  if (row === 6 && col === 8) return 'center-green';
  if (row === 8 && col === 6) return 'center-blue';
  if (row === 8 && col === 8) return 'center-yellow';

  // Center triangles center
  if (row === 7 && col === 6) return 'Center-left';
  if (row === 6 && col === 7) return 'Center-top';
  if (row === 8 && col === 7) return 'Center-right';
  if (row === 7 && col === 8) return 'Center-bottom';
  if (row === 7 && col === 7) return 'Center';

  // Home paths (you can expand this more accurately later)
  if (row === 7 && col < 6 && col >0) return 'home-path-red';
  if (col === 7 && row > 0 && row <6 ) return 'home-path-green';
  if (col === 7 && row < 14 && row >8) return 'home-path-blue';
  if (row === 7 && col > 8 && col < 14) return 'home-path-yellow';

  // Default path
  return 'path';
};

export const getTileClass = (type: string) => {
  const map: Record<string, string> = {
    'home-red': 'bg-red-500',
    'home-green': 'bg-green-400',
    'home-blue': 'bg-blue-500',
    'home-yellow': 'bg-yellow-300',
    // Flags for special JSX rendering
    'center-red': 'center-special',
    'center-green': 'center-special',
    'center-blue': 'center-special',
    'center-yellow': 'center-special',
    // Flags for special JSX rendering
    'star-red-stop': 'center-special',
    'star-green-stop': 'center-special',
    'star-yellow-stop': 'center-special',
    'star-blue-stop': 'center-special',
    'Center-left': 'bg-red-600',
    'Center-top': 'bg-green-600',
    'Center-right': 'bg-blue-600',
    'Center-bottom': 'bg-yellow-400',
    'Center': 'bg-gray-300 border',

    'home-path-red': 'bg-red-600 border',
    'home-path-green': 'bg-green-600 border',
    'home-path-blue': 'bg-blue-600 border',
    'home-path-yellow': 'bg-yellow-400 border',
    'path': 'bg-white border border-gray-400',
    'base' : 'bg-white border-3 shadow-md',
    'red-base-stop' : 'bg-red-600 border',
    'green-base-stop' : 'bg-green-600 border',
    'yellow-base-stop' : 'bg-yellow-400 border',
    'blue-base-stop' : 'bg-blue-600 border'
  };
  return `w-full h-full ${map[type] || 'bg-black'}`;
};

export const grid = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => getTileType(row, col))
  );