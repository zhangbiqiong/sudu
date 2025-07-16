// 数独游戏工具函数

/**
 * 生成数独棋盘
 * @param {number} size - 棋盘大小 (4, 5, 6)
 * @returns {Array} 二维数组表示的棋盘
 */
export function generateSudoku(size) {
  const board = Array(size).fill().map(() => Array(size).fill(0))
  
  // 递归填充数字
  function solve(board) {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === 0) {
          const numbers = shuffleArray([...Array(size)].map((_, i) => i + 1))
          
          for (let num of numbers) {
            if (isValidMove(board, row, col, num, size)) {
              board[row][col] = num
              if (solve(board)) {
                return true
              }
              board[row][col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }
  
  solve(board)
  return board
}

/**
 * 创建数独谜题（从完整解答中移除一些数字）
 * @param {Array} solution - 完整的数独解答
 * @param {number} difficulty - 难度等级 (0.3-0.7)
 * @returns {Array} 包含空格的数独谜题
 */
export function createPuzzle(solution, difficulty = 0.5) {
  const puzzle = solution.map(row => [...row])
  const size = puzzle.length
  const totalCells = size * size
  const cellsToRemove = Math.floor(totalCells * difficulty)
  
  const cells = []
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      cells.push([i, j])
    }
  }
  
  const shuffledCells = shuffleArray(cells)
  
  for (let i = 0; i < cellsToRemove; i++) {
    const [row, col] = shuffledCells[i]
    puzzle[row][col] = 0
  }
  
  return puzzle
}

/**
 * 验证数独移动是否有效
 * @param {Array} board - 棋盘
 * @param {number} row - 行
 * @param {number} col - 列
 * @param {number} num - 要放置的数字
 * @param {number} size - 棋盘大小
 * @returns {boolean} 是否有效
 */
export function isValidMove(board, row, col, num, size) {
  // 检查行
  for (let x = 0; x < size; x++) {
    if (board[row][x] === num) {
      return false
    }
  }
  
  // 检查列
  for (let x = 0; x < size; x++) {
    if (board[x][col] === num) {
      return false
    }
  }
  
  // 检查子网格
  const subgridSize = Math.sqrt(size)
  const startRow = row - row % subgridSize
  const startCol = col - col % subgridSize
  
  for (let i = 0; i < subgridSize; i++) {
    for (let j = 0; j < subgridSize; j++) {
      if (board[i + startRow][j + startCol] === num) {
        return false
      }
    }
  }
  
  return true
}

/**
 * 检查数独是否完成
 * @param {Array} board - 棋盘
 * @returns {boolean} 是否完成
 */
export function isSudokuComplete(board) {
  const size = board.length
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        return false
      }
    }
  }
  
  return isSudokuValid(board)
}

/**
 * 验证数独是否有效（所有规则都满足）
 * @param {Array} board - 棋盘
 * @returns {boolean} 是否有效
 */
export function isSudokuValid(board) {
  const size = board.length
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const num = board[row][col]
      if (num !== 0) {
        // 临时清除当前单元格
        board[row][col] = 0
        if (!isValidMove(board, row, col, num, size)) {
          board[row][col] = num
          return false
        }
        board[row][col] = num
      }
    }
  }
  
  return true
}

/**
 * 获取数独提示
 * @param {Array} puzzle - 当前谜题状态
 * @param {Array} solution - 完整解答
 * @returns {Object|null} 提示位置和数字，如果没有可用提示返回null
 */
export function getHint(puzzle, solution) {
  const size = puzzle.length
  const emptyCells = []
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (puzzle[row][col] === 0) {
        emptyCells.push({ row, col, value: solution[row][col] })
      }
    }
  }
  
  if (emptyCells.length === 0) {
    return null
  }
  
  return emptyCells[Math.floor(Math.random() * emptyCells.length)]
}

/**
 * 洗牌算法
 * @param {Array} array - 要洗牌的数组
 * @returns {Array} 洗牌后的数组
 */
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 格式化时间显示
 * @param {number} seconds - 秒数
 * @returns {string} 格式化的时间字符串
 */
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * 深拷贝二维数组
 * @param {Array} array - 要拷贝的二维数组
 * @returns {Array} 拷贝的数组
 */
export function deepCopy(array) {
  return array.map(row => [...row])
}