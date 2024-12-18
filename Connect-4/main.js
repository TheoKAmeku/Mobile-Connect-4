let socket;
const url = 'https://uni-connect-4-server.glitch.me/';
const onlineData = { isconnected: false, inPool: false, inRoom: false, roomId: null, isUsersTurn: null };


function openConnection() {
    if (!onlineData.isconnected) {
        socket = new WebSocket(url)

        socket.onopen = () => {
            onlineData.isconnected = true;

            openConnectionButton.style.display = "none"
            enterMatchMakingButton.style.display = "inline-block"
            closeConnectionButton.style.display = "inline-block"
            networkingText.innerHTML = "Connected to server"
        };

        socket.onmessage = (message) => {
            handleMessage(JSON.parse(message.data))
        };

        socket.onclose = () => {
            //socket.send(JSON.stringify({ inRoom: onlineData.inRoom, inPool: onlineData.inPool, roomId: onlineData.roomId }))
            onlineData.isconnected = false;
            openConnectionButton.style.display = "inline-block"
            enterMatchMakingButton.style.display = "none"
            closeConnectionButton.style.display = "none"
            networkingText.innerHTML = "Disconnected from server"
        };
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
    socket.send(JSON.stringify(data));
}

function enterMatchMaking() {
    if (!onlineData.inPool) {
        const data = { type: "matchmaking", command: "enter" }
        sendMessageToServer(data);

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
        sendMessageToServer(data);

        onlineData.inPool = false

        enterMatchMakingButton.style.display = "inline-block"
        exitMatchMakingButton.style.display = "none"
        closeConnectionButton.style.display = "inline-block"
        networkingText.innerHTML = "Exited Match Making"
    }
}

function handleOnlineMatch(data) {
    onlineData.inPool = false
    onlineData.roomId = data.roomId
    onlineData.inRoom = true
    onlineData.isUsersTurn = data.isUsersTurn
    //restartGame();

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
    const clickedCell = { target: { classList: [...e.target.classList] } };
    const data = { type: "game", command: "makeMove", data: { roomId: onlineData.roomId, move: clickedCell } };

    sendMessageToServer(data);
}

function exitOnlineMatch() {
    const data = { type: "game", command: "exit", data: { roomId: onlineData.roomId } }
    sendMessageToServer(data)

    exitOnlineRoom()
}

const openNetworkMenuButton = document.getElementById("open-network-menu");
const closeNetworkMenuButton = document.getElementById("close-network-menu")
const openConnectionButton = document.getElementById("open-connection");
const closeConnectionButton = document.getElementById("close-connection");
const enterMatchMakingButton = document.getElementById("enter-matchmaking");
const exitMatchMakingButton = document.getElementById("exit-matchmaking");
const exitOnlineMatchButton = document.getElementById("exit-online-match");
const networkingText = document.getElementById("networking-text");

const handleOpenMenu = () => {
    const networkOverlay = document.getElementById("network-overlay")
    networkOverlay.style.display = "inline-block"

    openNetworkMenuButton.style.display = "none"
}

const handleCloseMenu = () => {
    const networkOverlay = document.getElementById("network-overlay")
    networkOverlay.style.display = "none"

    openNetworkMenuButton.style.display = "block"
}


openNetworkMenuButton.addEventListener("click", handleOpenMenu);
closeNetworkMenuButton.addEventListener("click", handleCloseMenu);
openConnectionButton.addEventListener('click', openConnection);
closeConnectionButton.addEventListener('click', closeConnection);
enterMatchMakingButton.addEventListener('click', enterMatchMaking);
exitMatchMakingButton.addEventListener('click', exitMatchMaking);
exitOnlineMatchButton.addEventListener('click', exitOnlineMatch);