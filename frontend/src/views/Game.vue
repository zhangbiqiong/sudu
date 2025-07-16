<template>
  <div class="game-container">
    <el-card class="game-card">
      <template #header>
        <div class="game-header">
          <h2 class="game-title">
            {{ $t('game.title') }} - {{ $t(`game.${currentMode}`) }}
          </h2>
          <div class="game-info">
            <span class="timer">{{ $t('game.time') }}: {{ formatTime(gameTime) }}</span>
            <el-button @click="showModeSelector = true" type="primary" size="small">
              {{ $t('game.mode') }}
            </el-button>
          </div>
        </div>
      </template>
      
      <!-- 游戏板 -->
      <div class="sudoku-board" :class="`mode-${currentMode}`">
        <div 
          v-for="(row, rowIndex) in currentBoard" 
          :key="rowIndex"
          class="sudoku-row"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            class="sudoku-cell"
            :class="{
              'given': isGivenCell(rowIndex, colIndex),
              'selected': selectedCell.row === rowIndex && selectedCell.col === colIndex,
              'error': hasError(rowIndex, colIndex),
              'hint': isHintCell(rowIndex, colIndex)
            }"
            @click="selectCell(rowIndex, colIndex)"
          >
            <input
              :value="cell === 0 ? '' : cell"
              @input="updateCell(rowIndex, colIndex, $event)"
              @keydown="handleKeyDown($event, rowIndex, colIndex)"
              class="cell-input"
              :readonly="isGivenCell(rowIndex, colIndex)"
              maxlength="1"
            />
          </div>
        </div>
      </div>
      
      <!-- 数字键盘 -->
      <div class="number-pad">
        <el-button
          v-for="num in getNumbers()"
          :key="num"
          @click="setNumber(num)"
          class="number-button"
          :type="selectedNumber === num ? 'primary' : 'default'"
        >
          {{ num }}
        </el-button>
        <el-button @click="clearCell" class="number-button">
          {{ $t('game.clear') }}
        </el-button>
      </div>
      
      <!-- 游戏控制按钮 -->
      <div class="game-controls">
        <el-button @click="newGame" type="success">
          {{ $t('game.newGame') }}
        </el-button>
        <el-button @click="getHintForUser" type="info" :disabled="hintsUsed >= maxHints">
          {{ $t('game.hint') }} ({{ hintsUsed }}/{{ maxHints }})
        </el-button>
        <el-button @click="undoMove" type="warning" :disabled="moveHistory.length === 0">
          {{ $t('game.undo') }}
        </el-button>
        <el-button @click="checkSolution" type="primary">
          {{ $t('game.checkAnswer') }}
        </el-button>
      </div>
    </el-card>
    
    <!-- 模式选择对话框 -->
    <el-dialog v-model="showModeSelector" :title="$t('game.mode')" width="400px">
      <div class="mode-selector">
        <el-button
          v-for="mode in ['4x4', '5x5', '6x6']"
          :key="mode"
          @click="changeMode(mode)"
          :type="currentMode === mode ? 'primary' : 'default'"
          class="mode-button"
        >
          {{ $t(`game.${mode}`) }}
        </el-button>
      </div>
    </el-dialog>
    
    <!-- 胜利对话框 -->
    <el-dialog v-model="showVictory" :title="$t('game.victory')" width="400px">
      <div class="victory-content">
        <p>{{ $t('message.gameCompleted') }}</p>
        <p>{{ $t('game.time') }}: {{ formatTime(finalTime) }}</p>
        <p v-if="isAuthenticated">您的成绩已保存到排行榜！</p>
      </div>
      <template #footer>
        <el-button @click="newGame" type="primary">{{ $t('game.newGame') }}</el-button>
        <el-button @click="$router.push('/leaderboard')">{{ $t('leaderboard.title') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { userStore } from '../stores/userStore'
import { gameAPI } from '../api'
import { 
  generateSudoku, 
  createPuzzle, 
  isValidMove, 
  isSudokuComplete,
  getHint,
  formatTime,
  deepCopy
} from '../utils/sudoku'

export default {
  name: 'Game',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { t } = useI18n()
    
    // 游戏状态
    const currentMode = ref(route.params.mode || '4x4')
    const currentBoard = ref([])
    const originalBoard = ref([])
    const solutionBoard = ref([])
    const gameTime = ref(0)
    const finalTime = ref(0)
    const gameTimer = ref(null)
    const gameId = ref(null)
    const isGameActive = ref(false)
    
    // UI状态
    const selectedCell = reactive({ row: -1, col: -1 })
    const selectedNumber = ref(null)
    const showModeSelector = ref(false)
    const showVictory = ref(false)
    const errorCells = ref(new Set())
    const hintCells = ref(new Set())
    
    // 游戏辅助
    const moveHistory = ref([])
    const hintsUsed = ref(0)
    const maxHints = ref(3)
    
    const isAuthenticated = computed(() => userStore.isAuthenticated)
    
    // 获取当前模式的数字范围
    const getNumbers = () => {
      const size = parseInt(currentMode.value.split('x')[0])
      return Array.from({ length: size }, (_, i) => i + 1)
    }
    
    // 检查是否是原始给定的单元格
    const isGivenCell = (row, col) => {
      return originalBoard.value[row] && originalBoard.value[row][col] !== 0
    }
    
    // 检查单元格是否有错误
    const hasError = (row, col) => {
      return errorCells.value.has(`${row}-${col}`)
    }
    
    // 检查是否是提示单元格
    const isHintCell = (row, col) => {
      return hintCells.value.has(`${row}-${col}`)
    }
    
    // 选择单元格
    const selectCell = (row, col) => {
      if (isGivenCell(row, col)) return
      selectedCell.row = row
      selectedCell.col = col
    }
    
    // 更新单元格值
    const updateCell = (row, col, event) => {
      if (isGivenCell(row, col)) return
      
      const value = event.target.value
      if (value === '' || (value >= 1 && value <= getNumbers().length)) {
        // 保存移动历史
        const oldValue = currentBoard.value[row][col]
        moveHistory.value.push({ row, col, oldValue, newValue: parseInt(value) || 0 })
        
        currentBoard.value[row][col] = parseInt(value) || 0
        
        // 检查是否完成
        if (isSudokuComplete(currentBoard.value)) {
          handleVictory()
        }
      } else {
        event.target.value = currentBoard.value[row][col] === 0 ? '' : currentBoard.value[row][col]
      }
    }
    
    // 键盘处理
    const handleKeyDown = (event, row, col) => {
      const key = event.key
      if (key >= '1' && key <= '9') {
        const num = parseInt(key)
        if (num <= getNumbers().length) {
          setNumberToCell(row, col, num)
        }
        event.preventDefault()
      } else if (key === 'Delete' || key === 'Backspace') {
        setNumberToCell(row, col, 0)
        event.preventDefault()
      } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
        handleArrowKey(key, row, col)
        event.preventDefault()
      }
    }
    
    // 箭头键导航
    const handleArrowKey = (key, row, col) => {
      const size = currentBoard.value.length
      let newRow = row, newCol = col
      
      switch (key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1)
          break
        case 'ArrowDown':
          newRow = Math.min(size - 1, row + 1)
          break
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1)
          break
        case 'ArrowRight':
          newCol = Math.min(size - 1, col + 1)
          break
      }
      
      selectCell(newRow, newCol)
    }
    
    // 设置数字
    const setNumber = (num) => {
      selectedNumber.value = num
      if (selectedCell.row >= 0 && selectedCell.col >= 0) {
        setNumberToCell(selectedCell.row, selectedCell.col, num)
      }
    }
    
    // 设置数字到单元格
    const setNumberToCell = (row, col, num) => {
      if (isGivenCell(row, col)) return
      
      const oldValue = currentBoard.value[row][col]
      moveHistory.value.push({ row, col, oldValue, newValue: num })
      
      currentBoard.value[row][col] = num
      
      if (isSudokuComplete(currentBoard.value)) {
        handleVictory()
      }
    }
    
    // 清空单元格
    const clearCell = () => {
      if (selectedCell.row >= 0 && selectedCell.col >= 0) {
        setNumberToCell(selectedCell.row, selectedCell.col, 0)
      }
    }
    
    // 撤销移动
    const undoMove = () => {
      if (moveHistory.value.length > 0) {
        const lastMove = moveHistory.value.pop()
        currentBoard.value[lastMove.row][lastMove.col] = lastMove.oldValue
      }
    }
    
    // 获取提示
    const getHintForUser = () => {
      if (hintsUsed.value >= maxHints.value) return
      
      const hint = getHint(currentBoard.value, solutionBoard.value)
      if (hint) {
        currentBoard.value[hint.row][hint.col] = hint.value
        hintCells.value.add(`${hint.row}-${hint.col}`)
        hintsUsed.value++
        
        moveHistory.value.push({ 
          row: hint.row, 
          col: hint.col, 
          oldValue: 0, 
          newValue: hint.value 
        })
        
        setTimeout(() => {
          hintCells.value.delete(`${hint.row}-${hint.col}`)
        }, 2000)
        
        if (isSudokuComplete(currentBoard.value)) {
          handleVictory()
        }
      }
    }
    
    // 检查解答
    const checkSolution = () => {
      const size = currentBoard.value.length
      errorCells.value.clear()
      let hasErrors = false
      
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const num = currentBoard.value[row][col]
          if (num !== 0) {
            currentBoard.value[row][col] = 0
            if (!isValidMove(currentBoard.value, row, col, num, size)) {
              errorCells.value.add(`${row}-${col}`)
              hasErrors = true
            }
            currentBoard.value[row][col] = num
          }
        }
      }
      
      if (hasErrors) {
        ElMessage.error('发现错误，请检查标红的单元格')
        setTimeout(() => {
          errorCells.value.clear()
        }, 3000)
      } else if (isSudokuComplete(currentBoard.value)) {
        handleVictory()
      } else {
        ElMessage.info('目前没有错误，继续加油！')
      }
    }
    
    // 新游戏
    const newGame = () => {
      const size = parseInt(currentMode.value.split('x')[0])
      const solution = generateSudoku(size)
      const puzzle = createPuzzle(solution, 0.5)
      
      solutionBoard.value = deepCopy(solution)
      originalBoard.value = deepCopy(puzzle)
      currentBoard.value = deepCopy(puzzle)
      
      // 重置状态
      gameTime.value = 0
      hintsUsed.value = 0
      moveHistory.value = []
      errorCells.value.clear()
      hintCells.value.clear()
      selectedCell.row = -1
      selectedCell.col = -1
      showVictory.value = false
      
      startTimer()
    }
    
    // 改变模式
    const changeMode = (mode) => {
      currentMode.value = mode
      showModeSelector.value = false
      router.push(`/game/${mode}`)
      newGame()
    }
    
    // 开始计时器
    const startTimer = () => {
      if (gameTimer.value) {
        clearInterval(gameTimer.value)
      }
      isGameActive.value = true
      gameTimer.value = setInterval(() => {
        gameTime.value++
      }, 1000)
    }
    
    // 停止计时器
    const stopTimer = () => {
      if (gameTimer.value) {
        clearInterval(gameTimer.value)
        gameTimer.value = null
      }
      isGameActive.value = false
    }
    
    // 处理胜利
    const handleVictory = async () => {
      stopTimer()
      finalTime.value = gameTime.value
      showVictory.value = true
      
      // 如果用户已登录，提交成绩
      if (isAuthenticated.value) {
        try {
          await gameAPI.submitGame(gameId.value, currentBoard.value, gameTime.value)
          ElMessage.success('成绩已保存到排行榜！')
        } catch (error) {
          console.error('Failed to submit game:', error)
        }
      }
    }
    
    // 监听路由变化
    watch(() => route.params.mode, (newMode) => {
      if (newMode && newMode !== currentMode.value) {
        currentMode.value = newMode
        newGame()
      }
    })
    
    // 组件挂载
    onMounted(() => {
      newGame()
    })
    
    // 组件卸载
    onUnmounted(() => {
      stopTimer()
    })
    
    return {
      currentMode,
      currentBoard,
      gameTime,
      finalTime,
      selectedCell,
      selectedNumber,
      showModeSelector,
      showVictory,
      moveHistory,
      hintsUsed,
      maxHints,
      isAuthenticated,
      getNumbers,
      isGivenCell,
      hasError,
      isHintCell,
      selectCell,
      updateCell,
      handleKeyDown,
      setNumber,
      clearCell,
      undoMove,
      getHintForUser,
      checkSolution,
      newGame,
      changeMode,
      formatTime
    }
  }
}
</script>

<style scoped>
.game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.game-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  overflow: hidden;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.game-title {
  color: #2c3e50;
  margin: 0;
  font-weight: 300;
  font-size: 1.5rem;
}

.game-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.timer {
  font-size: 1.2rem;
  font-weight: bold;
  color: #409EFF;
}

.sudoku-board {
  margin: 20px 0;
  display: grid;
  gap: 2px;
  background: #2c3e50;
  padding: 2px;
  border-radius: 8px;
  max-width: 600px;
  margin: 20px auto;
}

.mode-4x4 {
  grid-template-columns: repeat(4, 1fr);
}

.mode-5x5 {
  grid-template-columns: repeat(5, 1fr);
}

.mode-6x6 {
  grid-template-columns: repeat(6, 1fr);
}

.sudoku-cell {
  background: white;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.sudoku-cell.given {
  background: #f5f7fa;
}

.sudoku-cell.selected {
  background: #e6f7ff;
  box-shadow: 0 0 0 2px #409EFF;
}

.sudoku-cell.error {
  background: #fef0f0;
  box-shadow: 0 0 0 2px #F56C6C;
}

.sudoku-cell.hint {
  background: #f0f9ff;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  outline: none;
  cursor: pointer;
}

.cell-input:read-only {
  cursor: default;
  color: #2c3e50;
}

.number-pad {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.number-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
}

.game-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-button {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
}

.victory-content {
  text-align: center;
  padding: 20px 0;
}

.victory-content p {
  margin: 10px 0;
  font-size: 1.1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-container {
    padding: 10px;
  }
  
  .game-header {
    flex-direction: column;
    text-align: center;
  }
  
  .game-title {
    font-size: 1.2rem;
  }
  
  .sudoku-board {
    max-width: 100%;
  }
  
  .cell-input {
    font-size: 1rem;
  }
  
  .number-button {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .game-controls {
    gap: 5px;
  }
  
  .game-controls .el-button {
    font-size: 0.9rem;
    padding: 8px 12px;
  }
}

/* 高分辨率适配 */
@media (min-width: 2560px) {
  .game-title {
    font-size: 2rem;
  }
  
  .timer {
    font-size: 1.5rem;
  }
  
  .sudoku-board {
    max-width: 800px;
  }
  
  .cell-input {
    font-size: 1.5rem;
  }
  
  .number-button {
    width: 60px;
    height: 60px;
    font-size: 1.4rem;
  }
}

@media (min-width: 3840px) {
  .game-title {
    font-size: 2.5rem;
  }
  
  .timer {
    font-size: 2rem;
  }
  
  .sudoku-board {
    max-width: 1000px;
  }
  
  .cell-input {
    font-size: 2rem;
  }
  
  .number-button {
    width: 80px;
    height: 80px;
    font-size: 1.8rem;
  }
}
</style>