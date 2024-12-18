// Elements
const allCells = document.querySelectorAll('.cell:not(.row-top)')
const topCells = document.querySelectorAll('.cell.row-top')
const resetButton = document.querySelector('.reset')
const gameStatusText = document.querySelector('.status')
const openNetworkMenuButton = document.getElementById("open-network-menu")
const openConnectionButton = document.getElementById("open-connection")
const closeConnectionButton = document.getElementById("close-connection")
const enterMatchMakingButton = document.getElementById("enter-matchmaking")
const exitMatchMakingButton = document.getElementById("exit-matchmaking")
const exitOnlineMatchButton = document.getElementById("exit-online-match")
const networkingText = document.getElementById("networking-text")
const closeNetworkMenuButton = document.getElementById("close-network-menu")

// Variables
const columns = []
const topRow = []
const rows = []
let isPlaying = true
let isYellowColor = true
let socket
const url = 'https://uni-connect-4-server.glitch.me/'
const onlineData = { isconnected: false, inPool: false, inRoom: false, roomId: null, isUsersTurn: null }

// Setup Values

// Columns
for (let i = 0; i < allCells.length ; i++) {
  const column = [
    allCells[35 + i],
    allCells[28 + i],
    allCells[21 + i],
    allCells[14 + i],
    allCells[7 + i],
    allCells[i],
    topCells[i]
  ]

  columns.push(column)
}

// Rows
for (let i = 0; i < topCells.length ; i++) {
  topRow.push(topCells[i])
}

for (let i = 0 ; i < allCells.length ; i = i + 7) {
  const row = []
  for (let j = 0 ; j < 7 ; j++) {
    const oneCell = allCells[i + j]
    row.push(oneCell)
  }

  rows.push(row)
}

// Functions
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/.test(navigator.userAgent);
}

function openConnection() {
  if (!onlineData.isconnected) {
    socket = new WebSocket(url)

    socket.onopen = () => {
      onlineData.isconnected = true;
      
      openConnectionButton.style.display = "none"
      enterMatchMakingButton.style.display = "inline-block"
      closeConnectionButton.style.display = "inline-block"
      networkingText.innerHTML = "Connected to server"
    }

    socket.onmessage = (message) => {
      handleMessage(JSON.parse(message.data))
    }

    socket.onclose = () => {
      //socket.send(JSON.stringify({ inRoom: onlineData.inRoom, inPool: onlineData.inPool, roomId: onlineData.roomId }))
      onlineData.isconnected = false;
      openConnectionButton.style.display = "inline-block"
      enterMatchMakingButton.style.display = "none"
      closeConnectionButton.style.display = "none"
      networkingText.innerHTML = "Disconnected from server"
    }
  }
}

function closeConnection() {
  if (onlineData.isconnected) {
    socket.close()
  }
}

function handleMessage(message) {
  if (message.type === "game") {
    if (message.command === "makeMove") {
      handleCellClick(message.data, false)
    }
    else if (message.command === "restart") {
      restartGame()
    }
    else if (message.command === "exit") {
      exitOnlineMatch()
    }
  }
  else if (message.type === "matchmaking") {
    if (message.command === "matched") {
      handleOnlineMatch(message.data)
    }
  }
}

function sendMessageToServer(data) {
  socket.send(JSON.stringify(data))
}

function enterMatchMaking() {
  if (!onlineData.inPool) {
    const data = { type: "matchmaking", command: "enter" }
    sendMessageToServer(data)

    onlineData.inPool = true

    enterMatchMakingButton.style.display = "none"
    closeConnectionButton.style.display = "none"
    exitMatchMakingButton.style.display = "inline-block"
    
    networkingText.innerHTML = "Entered Match Making"
  }
}

function exitMatchMaking() {
  if (onlineData.inPool) {
    const data = { type: "matchmaking", command: "exit" }
    sendMessageToServer(data)

    onlineData.inPool = false

    enterMatchMakingButton.style.display = "inline-block"
    exitMatchMakingButton.style.display = "none"
    closeConnectionButton.style.display= "inline-block"
    networkingText.innerHTML = "Exited Match Making"
  }
}

function handleOnlineMatch(data) {
  onlineData.inPool = false
  onlineData.roomId = data.roomId
  onlineData.inRoom = true
  onlineData.isUsersTurn = data.isUsersTurn
  restartGame()

  exitMatchMakingButton.style.display = "none"
  exitOnlineMatchButton.style.display = "inline-block"
  networkingText.innerHTML = `Match Found, Room ID: ${data.roomId}`
}

function exitOnlineRoom() {
  if (onlineData.inRoom) {
    onlineData.inRoom = false
    onlineData.roomId = null

    exitOnlineMatchButton.style.display = "none"
    enterMatchMakingButton.style.display = "inline-block"
    closeConnectionButton.style.display = "inline-block"
    networkingText.innerHTML = "Left Online Match"
  }
}

function sendMoveDataOnline(e) {
  const clickedCell = { target: { classList: [...e.target.classList] } }
  const data = { type: "game", command: "makeMove", data: { roomId: onlineData.roomId, move: clickedCell } }

  sendMessageToServer(data)
}

function exitOnlineMatch() {
  const data = { type: "game", command: "exit", data: { roomId: onlineData.roomId } }
  sendMessageToServer(data)

  exitOnlineRoom()
}

function getCellClassListAsArray(cell) {
  const classList = cell.classList;
  return [...classList]
}

function locateCell(cell) {
  const classList = getCellClassListAsArray(cell)

  const rowClass = classList.find(className => className.includes('row'))
  const colClass = classList.find(className => className.includes('col'))
  const rowIndex = rowClass[4]
  const colIndex = colClass[4]
  const rowNumber = parseInt(rowIndex, 10)
  const colNumber = parseInt(colIndex, 10)

  return [rowNumber, colNumber]
}

function findOpenCellByColumn(colIndex) {
  const column = columns[colIndex]
  const columnWithoutTop = column.slice(0, 6)

  for (const cell of columnWithoutTop) {
    const classList = getCellClassListAsArray(cell)

    if (!classList.includes('yellow') && !classList.includes('red')) {
      return cell
    }
  }

  return null
}

function clearTopCellColor (colIndex) {
  const topCell = topCells[colIndex]

  topCell.classList.remove('yellow')
  topCell.classList.remove('red')
}

function getCellColor(cell) {
  const classList = getCellClassListAsArray(cell)
  if (classList.includes('yellow')) {
    return 'yellow'
  } 
  else if (classList.includes('red')) {
    return 'red'
  }

  return null
}

function checkWinningCells(cells) {
  if (cells.length < 4) {
    return false
  }

  isPlaying = false
  for (const cell of cells) {
    cell.classList.add('win')
  }
  gameStatusText.textContent = `${isYellowColor ? 'Yellow' : 'Red'} has won!`
  return true
}

function hasPlayerWon(cell) {
  const color = getCellColor(cell)
  if (!color) {
    return;
  }

  const location = locateCell(cell)
  const rowIndex = location[0]
  const colIndex = location[1]

  if (checkHorizontalWin(rowIndex, colIndex, color)) {
    return;
  }

  if (checkVerticalWin(rowIndex, colIndex, color)) {
    return;
  }

  if (checkDiagonalWin(rowIndex, colIndex, color)) {
    return;
  }

  if (checkTieGame()) {
    isPlaying = false
    gameStatusText.textContent = "Game is a tie!"
  }
}

function checkHorizontalWin(rowIndex, colIndex, color) {
  const winningCells = [rows[rowIndex][colIndex]]

  checkDirection(rowIndex, colIndex, color, 0, -1, winningCells) // Left
  checkDirection(rowIndex, colIndex, color, 0, 1, winningCells) // Right

  return checkWinningCells(winningCells)
}

function checkVerticalWin(rowIndex, colIndex, color) {
  const winningCells = [rows[rowIndex][colIndex]]

  checkDirection(rowIndex, colIndex, color, -1, 0, winningCells) // Up
  checkDirection(rowIndex, colIndex, color, 1, 0, winningCells) // Down

  return checkWinningCells(winningCells)
}

function checkDiagonalWin(rowIndex, colIndex, color) {
  let winningCells = []

  // Check diagonal /
  winningCells = [rows[rowIndex][colIndex]]
  checkDirection(rowIndex, colIndex, color, 1, -1, winningCells) // Down-Left
  checkDirection(rowIndex, colIndex, color, -1, 1, winningCells) // Up-Right
  if (checkWinningCells(winningCells)) {
    return true
  }

  // Check diagonal \
  winningCells = [rows[rowIndex][colIndex]]
  checkDirection(rowIndex, colIndex, color, -1, -1, winningCells) // Up-Left
  checkDirection(rowIndex, colIndex, color, 1, 1, winningCells) // Down-Right
  return checkWinningCells(winningCells)
}

function checkDirection(rowIndex, colIndex, color, rowDirection, yDirection, winningCells) {
  let currentRow = rowIndex + rowDirection
  let currentCol = colIndex + yDirection

  while (currentRow >= 0 && currentRow < rows.length && currentCol >= 0 && currentCol < rows[0].length) {
    const cellToCheck = rows[currentRow][currentCol]

    if (getCellColor(cellToCheck) === color) {
      winningCells.push(cellToCheck)
      currentRow += rowDirection
      currentCol += yDirection
    }
    else {
      break
    }
  }
}

function checkTieGame() {
  for (let rowIndex = 0 ; rowIndex < rows.length - 1 ; rowIndex++) { // Exclude top row
    for (let colIndex = 0 ; colIndex < rows[rowIndex].length ; colIndex++) {
      const cell = rows[rowIndex][colIndex]
      const classList = getCellClassListAsArray(cell);
      if (classList.indexOf('yellow') === -1 && classList.indexOf('red') === -1) {
        return false
      }
    }
  }
  return true
}

function restartGame() {
  for (const row of rows) {
    for (const cell of row) {
      cell.classList.remove('red')
      cell.classList.remove('yellow')
      cell.classList.remove('win')
    }
  }

  isPlaying = true
  if (onlineData.isconnected && onlineData.inRoom) {
    isYellowColor = (onlineData.isUsersTurn) ? true : false
  }
  else {
    isYellowColor = true
  }
  
  gameStatusText.textContent = ''
}

function addToTopCell(colIndex) {
  const topCell = topCells[colIndex]

  if (isYellowColor) {
    topCell.classList.add("yellow")
  }
  else {
    topCell.classList.add("red")
  }
}

// Event Handlers
function handleRestartButton() {
  if (onlineData.isconnected && onlineData.inRoom) {
    const data = { type: "game", command: "restart", data: { roomId: onlineData.roomId} }
    sendMessageToServer(data)
  }
  
  restartGame()
}

function handleCellMouseOver(event) {
  if (!isPlaying || isMobile()) {
    return;
  }
  const cell = event.target
  const [rowIndex, colIndex] = locateCell(cell)

  addToTopCell(colIndex)
}

function handleCellMouseOut(event) {
  const cell = event.target
  const [rowIndex, colIndex] = locateCell(cell)

  clearTopCellColor(colIndex)
}

function handleClick(event) {
  if (onlineData.isconnected && onlineData.inRoom) {
    if (onlineData.isUsersTurn) {
      handleCellClick(event, true)
    }
  }
  else {
    handleCellClick(event, false)
  }
}

function handleCellClick(event, sendOnline) {
  if (!isPlaying) {
    return;
  }

  if (sendOnline) {
    sendMoveDataOnline(event)
  }

  const cell = event.target
  const [rowIndex, colIndex] = locateCell(cell, sendOnline)

  const openCell = findOpenCellByColumn(colIndex)

  if (!openCell) {
    return;
  }

  if (isYellowColor) {
    openCell.classList.add('yellow')
  }
  else {
    openCell.classList.add('red')
  }
  hasPlayerWon(openCell)

  isYellowColor = !isYellowColor
  clearTopCellColor(colIndex)

  if (onlineData.isconnected) {
    if (onlineData.isUsersTurn) {
      addToTopCell(colIndex)
    }
    onlineData.isUsersTurn = !onlineData.isUsersTurn;
  }
  else if (isPlaying) {
    addToTopCell(colIndex)
  }
}

function handleOpenMenu() {
  const networkOverlay = document.getElementById("network-overlay")
  networkOverlay.style.display = "block"

  openNetworkMenuButton.style.display = "none"
}

function handleCloseMenu() {
  const networkOverlay = document.getElementById("network-overlay")
  networkOverlay.style.display = "none"

  openNetworkMenuButton.style.display = "block"
}

// Adding Event Listeners
for (const row of rows) {
  for (const cell of row) {
    cell.addEventListener('mouseover', handleCellMouseOver)
    cell.addEventListener('mouseout', handleCellMouseOut)
    cell.addEventListener('click', handleClick)
  }
}

resetButton.addEventListener('click', handleRestartButton)
openNetworkMenuButton.addEventListener("click", handleOpenMenu)
closeNetworkMenuButton.addEventListener("click", handleCloseMenu)
openConnectionButton.addEventListener('click', openConnection)
closeConnectionButton.addEventListener('click', closeConnection)
enterMatchMakingButton.addEventListener('click', enterMatchMaking)
exitMatchMakingButton.addEventListener('click', exitMatchMaking)
exitOnlineMatchButton.addEventListener('click', exitOnlineMatch)