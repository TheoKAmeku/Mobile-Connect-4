const WebSocket = require('ws');


const PORT = 3000;
const wss = new WebSocket.Server({ port: PORT });
const errorMessages = {
    0: "Room not found",
    1: "Opponent not found",
    2: "Not Users Turn"
}
let userPool = [];
let roomPool = [];
let roomIds = new Set();


wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.id = getRandomInt(1000);

    ws.on('message', (message) => {
        handleMessage(JSON.parse(message), ws)
    });

    ws.on('close', () => {
        removeUserFromPool(ws)
        handleGameDisconnect(ws.id)
        console.log('Client disconnected');
    });
});


function sendMessage(userWs, data) {
    userWs.send(JSON.stringify(data));
} 

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

function getRandomUser(users) {
    return users[getRandomInt(users.length)]
}

function handleGameCommand(message, user) {
    const room = findRoom(message.data.roomId)
    if (!room) {
        return [null, errorMessages[0]]
    }

    const [opponent, errReason] = findOpponent(room, user.id);
    if (opponent === null) {
        console.log(errReason)
        return;
    }

    if (message.command === "makeMove") {
        const [valid, errorreason] = validateTurn(message.data.roomId, user.id)
        if (!valid) {
            console.log(errorreason)
            return;
        }

        room.lastTurn = user.id

        const data = { type: "game", command: "makeMove", data: message.data.move }
        sendMessage(opponent, data)
    }
    else if (message.command === "restart") {
        const data = { type: "game", command: "restart" }
        sendMessage(opponent, data)
    }
    else if (message.command === "exit") {
        const data = { type: "game", command: "exit" }
        sendMessage(opponent, data)
        removeRoom(message.data.roomId)
    }
}

function handleMatchmakingCommand(message, user) {
    if (message.command === "enter") {
        addUserToPool(user)
    }
    else if (message.command === "exit") {
        removeUserFromPool(user)
    }
}

function handleMessage(message, user) {
    if (message.type === "game") {
        handleGameCommand(message, user)
    }
    else if (message.type === "matchmaking") {
        handleMatchmakingCommand(message, user)
    }
}

function findIfUsersTurn(room, userId) {
    return (room.lastTurn !== userId)
}


function validateTurn(roomId, userId) {
    const room = findRoom(roomId)

    if (!room) {
        return [false, errorMessages[0]]
    }

    return [findIfUsersTurn(roomId, userId), errorMessages[2]]
}

function handleGameDisconnect(disconnectedUserId, roomId = null) {
    const room = (roomId !== null) ? findRoom(roomId) : findUsersRoom(disconnectedUserId)

    if (room === null) {
        return;
    }

    const [opponent, errReason] = findOpponent(room, disconnectedUserId);

    if (opponent === null) {
        console.log(errReason)
        return;
    }
    
    const data = { type: "game", command: "exit" }

    sendMessage(opponent, data)
    removeRoom(room.id)
}

function removeRoom(roomId) {
    // Remove from pool
    const index = roomPool.indexOf(roomId);
    roomPool.splice(index, 1)

    // Remove from id list
    roomIds.delete(roomId)
}

function findUsersRoom(userId) {
    for (const room of roomPool) {
        const hasUser = room.users.some((user) => user.id === userId)

        if (hasUser) {
            return room
        }
    }

    return null
}

function findRoom(roomId) {
    return roomPool.find((room) => room.id === roomId)
}

function findOpponent(room, userId) {
    const opponent = room.users.find((user) => user.id !== userId)

    if (!opponent) {
        return [null, errorMessages[1]]
    }

    return [opponent, ""]
}


function addUserToPool(user) {
    userPool.push(user)
    console.log(`${userPool.length} user${userPool.length === 1 ? 's' : ''} in matchmaking`)
}
function removeUserFromPool(user) {
    const index = userPool.indexOf(user)
    userPool.splice(index, 1)
    console.log(`${userPool.length} user${userPool.length === 1 ? 's' : ''} in matchmaking`)
}

function setupMatch(matchedUsers) {
    // Creating room for server
    const room = { id: getRandomInt(1000), users: matchedUsers, lastTurn: getRandomUser(matchedUsers).id }

    
    while (roomIds.has(room.id)) {
        // Checking for Unique ID
        room.id = getRandomInt(1000)
    }

    // Send room data to users
    for (const userWs of room.users) {
        removeUserFromPool(userWs)
        const data = { type: "matchmaking", command: "matched", data: { roomId: room.id, isUsersTurn: findIfUsersTurn(room, userWs.id) } }
        sendMessage(userWs, data)
    }

    roomPool.push(room)
    roomIds.add(room.id)
}

function matchPeople() {
    for (let i = 0; i < userPool.length; i++) {
        const user = userPool[i]
        const randomIndex = getRandomInt(userPool.length)

        // Attempt to get randomly
        if (user !== randomIndex && randomIndex !== 0) {
            const differentUser = userPool[randomIndex]
            return [user, differentUser]
        }

        // Backup for random user
        for (let j = 0; j < userPool.length; j++) {
            const differentUser = userPool[j]

            if (i !== j) {
                return [user, differentUser]
            }
        }
    }

    return null
}

function matchMaking() {
    const matchedUsers = matchPeople()

    if (matchedUsers === null) {
        return;
    }
    setupMatch(matchedUsers)
}

setInterval(matchMaking, 2 * 1000)
console.log("Server Up")