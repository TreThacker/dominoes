/*
App Title: Dominoes
Credits: Tre Thacker
Year Created: 2026
Version: 1.00
Dedication: None
*/

/* <------------------------------------------------
      CHANGELOG

      Version 1.00 - Initial game creation.
   -------------------------------------------------> */

/* <------------------------------------------------
      APP CONSTANTS
   -------------------------------------------------> */
const APP_TITLE = "Dominoes";
const APP_CREDITS = "Tre Thacker";
const APP_YEAR = "2026";
const APP_VERSION = "1.00";
const APP_DEDICATION = "None";

const DATABASE_NAME = "DominoesGameDatabase";
const DATABASE_VERSION = 1;
const GAME_STORE_NAME = "gameState";
const GAME_STATE_KEY = "currentGameState";

const DEFAULT_GAME_STATE = {
	playerName: "Player 1",
	playerCount: 2,
	winningScore: 500,
	theme: "classic",
	sandboxMode: {
		enabled: false,
		disableAITurns: false,
		keepHumanTurn: false,
		fullTestHand: false
	},
	coins: 20,
	achievementsUnlocked: false,
	collectiblesUnlocked: false,
	gameStarted: false,
	roundOver: false,
	currentPlayerIndex: 0,
	players: [],
	boneyard: [],
	board: [],
	boardChain: [],
	staringDominoID: null,
	leftOpen: null,
	rightOpen: null,
	spinnerDominoId: null,
	spinnerActive: false,
	spinnerLeftFilled: false,
	spinnerRightFilled: false,
	spinnerTopOpen: null,
	spinnerBottomOpen: null,
	spinnerTopChain: [],
	spinnerBottomChain: [],
	boardSegmentOffsets: createDefaultBoardSegmentOffsets(),
	gameLog: []
};

let db = null;
let draggedDominoId = null;
let selectedBoardEnd = null;
let optionsModalContent = "";
let gameState = structuredClone(DEFAULT_GAME_STATE);

/* <------------------------------------------------
      DOM ELEMENTS
   -------------------------------------------------> */
const appTitle = document.getElementById("appTitle");
const optionsButton = document.getElementById("optionsButton");
const scoreList = document.getElementById("scoreList");
const boneCountList = document.getElementById("boneCountList");
const boardTrack = document.getElementById("boardTrack");
const chainScoreText = document.getElementById("chainScoreText");
const drawButton = document.getElementById("drawButton");
const passButton = document.getElementById("passButton");
const humanPlayerName = document.getElementById("humanPlayerName");
const playerHand = document.getElementById("playerHand");
const boneyardCount = document.getElementById("boneyardCount");
const gameLog = document.getElementById("gameLog");
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalButton = document.getElementById("closeModalButton");

/* <------------------------------------------------
      INDEXEDDB SAVE SYSTEM
   -------------------------------------------------> */
function openDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

		request.onerror = () => {
			reject(request.error);
		};

		request.onupgradeneeded = event => {
			const database = event.target.result;

			if (!database.objectStoreNames.contains(GAME_STORE_NAME)) {
				database.createObjectStore(GAME_STORE_NAME);
			}
		};

		request.onsuccess = () => {
			db = request.result;
			resolve(db);
		};
	});
}

function saveGameState() {
	if (!db) {
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(GAME_STORE_NAME, "readwrite");
		const store = transaction.objectStore(GAME_STORE_NAME);
		const request = store.put(gameState, GAME_STATE_KEY);

		request.onerror = () => {
			reject(request.error);
		};

		request.onsuccess = () => {
			resolve();
		};
	});
}

function loadGameState() {
	if (!db) {
		return Promise.resolve(null);
	}

	return new Promise((resolve, reject) => {
		const transaction = db.transaction(GAME_STORE_NAME, "readonly");
		const store = transaction.objectStore(GAME_STORE_NAME);
		const request = store.get(GAME_STATE_KEY);

		request.onerror = () => {
			reject(request.error);
		};

		request.onsuccess = () => {
			resolve(request.result || null);
		};
	});
}

/* <------------------------------------------------
      STARTER GAME STATE
   -------------------------------------------------> */
function createDominoSet() {
	const dominoes = [];

	for (let leftValue = 0; leftValue <= 6; leftValue += 1) {
		for (let rightValue = leftValue; rightValue <= 6; rightValue += 1) {
			dominoes.push({
				id: `${leftValue}-${rightValue}`,
				left: leftValue,
				right: rightValue,
				played: false
			});
		}
	}

	return dominoes;
}

function shuffleDominoes(dominoes) {
	const shuffledDominoes = [...dominoes];

	for (let index = shuffledDominoes.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[shuffledDominoes[index], shuffledDominoes[randomIndex]] = [shuffledDominoes[randomIndex], shuffledDominoes[index]];
	}

	return shuffledDominoes;
}

function createPlayers(playerCount, playerName) {
	const players = [];
	const aiNames = [
		"Milo",
		"Owen",
		"Jack",
		"Luca",
		"Levi",
		"Nora",
		"Ruby",
		"Zoey",
		"Emma",
		"Maya"
	];

	for (let index = 0; index < playerCount; index += 1) {
		players.push({
			id: index,
			name: index === 0 ? playerName : aiNames[index - 1],
			isHuman: index === 0,
			score: 0,
			hand: []
		});
	}

	return players;
}

function dealDominoes(players, dominoes) {
	const startingHandSize = players.length <= 2 ? 7 : 5;
	const boneyard = [...dominoes];

	players.forEach(player => {
		player.hand = boneyard.splice(0, startingHandSize);
	});

	return boneyard;
}

function createNewGameState() {
	const currentPlayerNameInput = document.getElementById("playerNameInput");
	const currentPlayerCountSelect = document.getElementById("playerCountSelect");
	const currentWinningScoreSelect = document.getElementById("winningScoreSelect");
	const currentThemeSelect = document.getElementById("themeSelect");

	const playerName = currentPlayerNameInput ? currentPlayerNameInput.value.trim() || "Player 1" : gameState.playerName || "Player 1";
	const playerCount = currentPlayerCountSelect ? Number(currentPlayerCountSelect.value) : gameState.playerCount;
	const winningScore = currentWinningScoreSelect ? Number(currentWinningScoreSelect.value) : gameState.winningScore;
	const theme = currentThemeSelect ? currentThemeSelect.value : gameState.theme;
	const sandboxMode = structuredClone(gameState.sandboxMode || DEFAULT_GAME_STATE.sandboxMode);
	const isSandboxActive =
		sandboxMode.disableAITurns ||
		sandboxMode.keepHumanTurn ||
		sandboxMode.fullTestHand;
	const dominoes = shuffleDominoes(createDominoSet());
	const players = createPlayers(playerCount, playerName);
	const boneyard = dealDominoes(players, dominoes);
	const openingMove = getOpeningMove(players);
	const openingPlayer = players[openingMove.playerIndex];
	const openingDomino = removeDominoFromPlayerHand(
		openingPlayer,
		openingMove.domino.id
	);
	const nextPlayerIndex = getNextPlayerIndex(openingMove.playerIndex, players.length);
	const spinnerActive = isDouble(openingDomino);
	if (sandboxMode.enabled && sandboxMode.fullTestHand) {
		players[0].hand = createDominoSet()
			.filter(domino => domino.id !== openingDomino.id);
	}	

	return {
		...structuredClone(DEFAULT_GAME_STATE),
		playerName,
		playerCount,
		winningScore,
		theme,
		sandboxMode,
		gameStarted: true,
		currentPlayerIndex: sandboxMode.enabled ? 0 : nextPlayerIndex,
		players,
		boneyard,
		board: [openingDomino],
		boardChain: [openingDomino],
		startingDominoId: openingDomino.id,
		leftOpen: openingDomino.left,
		rightOpen: openingDomino.right,
		spinnerDominoId: spinnerActive ? openingDomino.id : null,
		spinnerActive,
		spinnerLeftFilled: false,
		spinnerRightFilled: false,
		spinnerTopOpen: spinnerActive ? openingDomino.left : null,
		spinnerBottomOpen: spinnerActive ? openingDomino.right : null,
		spinnerTopChain: [],
		spinnerBottomChain: [],
		gameLog: [
			`New ${playerCount}-player game started.`,
			`First player to ${winningScore} points wins.`,
			...(isSandboxActive ? [".>SANDBOX MODE<."] : []),
			...(sandboxMode.disableAITurns ? ["--AI Turns Disabled--"] : []),
			...(sandboxMode.keepHumanTurn ? ["--Human Keeps Turn--"] : []),
			...(sandboxMode.fullTestHand ? ["--Full Test Hand Enabled--"] : []),						
			`${playerName} is ready.`,
			`${players[openingMove.playerIndex].name} starts with ${openingMove.domino.left}-${openingMove.domino.right}.`,
			...(spinnerActive ? [`${openingDomino.left}-${openingDomino.right} is the spinner.`] : []),
			`${players[nextPlayerIndex].name}'s turn.`
		]
	};
}

/* <------------------------------------------------
      DISPLAY UPDATES
   -------------------------------------------------> */
function renderAppInfo() {
	appTitle.textContent = APP_TITLE;
}

function applyTheme() {
	document.body.classList.remove(
		"theme-midnight",
		"theme-sunset",
		"theme-forest"
	);

	if (gameState.theme === "midnight") {
		document.body.classList.add("theme-midnight");
	}

	if (gameState.theme === "sunset") {
		document.body.classList.add("theme-sunset");
	}

	if (gameState.theme === "forest") {
		document.body.classList.add("theme-forest");
	}
}

function renderSetupControls() {
	const currentPlayerNameInput = document.getElementById("playerNameInput");
	const currentPlayerCountSelect = document.getElementById("playerCountSelect");
	const currentPlayerCountDisplay = document.getElementById("playerCountDisplay");
	const currentWinningScoreSelect = document.getElementById("winningScoreSelect");
	const currentThemeSelect = document.getElementById("themeSelect");

	if (
		currentPlayerNameInput &&
		currentPlayerCountSelect &&
		currentPlayerCountDisplay &&
		currentWinningScoreSelect &&
		currentThemeSelect
	) {
		currentPlayerNameInput.value = gameState.playerName;
		currentPlayerCountSelect.value = String(gameState.playerCount);
		currentPlayerCountDisplay.textContent = String(gameState.playerCount);
		currentWinningScoreSelect.value = String(gameState.winningScore);
		currentThemeSelect.value = gameState.theme;
	}

	humanPlayerName.textContent = gameState.playerName;
}

function renderScores() {
	scoreList.innerHTML = "";

	if (gameState.players.length === 0) {
		scoreList.innerHTML = "<p>No game started.</p>";
		return;
	}

	gameState.players.forEach(player => {
		const scoreRow = document.createElement("div");
		scoreRow.className = "score-row";
		scoreRow.innerHTML = `<span>${player.name}</span><strong>${player.score}</strong>`;
		scoreList.appendChild(scoreRow);
	});
}

function renderBoneCount() {
	boneCountList.innerHTML = "";

	if (gameState.players.length === 0) {
		boneCountList.innerHTML = "<p>No game started.</p>";
		return;
	}

	gameState.players
		.filter(player => !player.isHuman)
		.forEach(player => {
			const boneCountRow = document.createElement("div");
			boneCountRow.className = "bone-count-row";
			boneCountRow.innerHTML = `<span>${player.name}</span><strong>${player.hand.length}</strong>`;
			boneCountList.appendChild(boneCountRow);
		});
}

function renderBoard() {
	boardTrack.innerHTML = "";

	if (gameState.board.length === 0) {
		return;
	}

	if (gameState.spinnerActive) {
		renderSpinnerBoard();
		return;
	}

	renderLinearBoard();
}

function renderLinearBoard() {
	const linearLayout = document.createElement("div");
	const leftBranch = document.createElement("div");
	const centerCell = document.createElement("div");
	const rightBranch = document.createElement("div");
	const startingDominoIndex = gameState.boardChain.findIndex(domino => domino.id === gameState.startingDominoId);
	const safeStartingIndex = startingDominoIndex === -1 ? 0 : startingDominoIndex;
	const startingDomino = gameState.boardChain[safeStartingIndex];
	const leftDominoes = gameState.boardChain.slice(0, safeStartingIndex);
	const rightDominoes = gameState.boardChain.slice(safeStartingIndex + 1);

	linearLayout.className = "spinner-board-layout";
leftBranch.className = "spinner-left-branch linear-left-branch";
centerCell.className = "spinner-center-cell";
rightBranch.className = "spinner-right-branch linear-right-branch";

leftBranch.appendChild(
	createBranchSegmentGroup(
		"left",
		"linear-board-segment",
		leftDominoes,
		0
	)
);

	if (startingDomino) {
		centerCell.appendChild(createDominoElement(startingDomino, false, "horizontal"));
	}

rightBranch.appendChild(
	createBranchSegmentGroup(
		"right",
		"linear-board-segment",
		rightDominoes,
		rightDominoes.length - 1
	)
);

	linearLayout.appendChild(leftBranch);
	linearLayout.appendChild(centerCell);
	linearLayout.appendChild(rightBranch);
	boardTrack.appendChild(linearLayout);
}

function renderSpinnerBoard() {
	const spinnerLayout = document.createElement("div");
	const topBranch = document.createElement("div");
	const leftBranch = document.createElement("div");
	const spinnerCell = document.createElement("div");
	const rightBranch = document.createElement("div");
	const bottomBranch = document.createElement("div");
	const spinnerDomino = gameState.boardChain.find(domino => domino.id === gameState.spinnerDominoId);
	const leftBranchDominoes = getLeftSpinnerBranchDominoes();
	const rightBranchDominoes = getRightSpinnerBranchDominoes();

	spinnerLayout.className = "spinner-board-layout";
	topBranch.className = "spinner-top-branch";
	leftBranch.className = "spinner-left-branch";
	spinnerCell.className = "spinner-center-cell";
	rightBranch.className = "spinner-right-branch";
	bottomBranch.className = "spinner-bottom-branch";

leftBranch.appendChild(
	createBranchSegmentGroup(
		"left",
		"linear-board-segment",
		leftBranchDominoes,
		0
	)
);

topBranch.appendChild(
	createBranchSegmentGroup(
		"top",
		"spinner-vertical-segment",
		gameState.spinnerTopChain,
		gameState.spinnerTopChain.length - 1
	)
);

	if (spinnerDomino) {
		spinnerCell.appendChild(createDominoElement(spinnerDomino, false, "vertical"));
	}

rightBranch.appendChild(
	createBranchSegmentGroup(
		"right",
		"linear-board-segment",
		rightBranchDominoes,
		rightBranchDominoes.length - 1
	)
);

bottomBranch.appendChild(
	createBranchSegmentGroup(
		"bottom",
		"spinner-vertical-segment",
		gameState.spinnerBottomChain,
		gameState.spinnerBottomChain.length - 1
	)
);

	spinnerLayout.appendChild(topBranch);
	spinnerLayout.appendChild(leftBranch);
	spinnerLayout.appendChild(spinnerCell);
	spinnerLayout.appendChild(rightBranch);
	spinnerLayout.appendChild(bottomBranch);
	boardTrack.appendChild(spinnerLayout);
}

function getSpinnerIndex() {
	return gameState.boardChain.findIndex(domino => domino.id === gameState.spinnerDominoId);
}

function getLeftSpinnerBranchDominoes() {
	const spinnerIndex = getSpinnerIndex();

	if (spinnerIndex === -1) {
		return [];
	}

	return gameState.boardChain.slice(0, spinnerIndex);
}

function getRightSpinnerBranchDominoes() {
	const spinnerIndex = getSpinnerIndex();

	if (spinnerIndex === -1) {
		return [];
	}

	return gameState.boardChain.slice(spinnerIndex + 1);
}

function renderPlayerHand() {
	playerHand.innerHTML = "";

	if (!gameState.gameStarted || gameState.roundOver || gameState.players.length === 0) {
		playerHand.innerHTML = "";
		return;
	}

	const humanPlayer = gameState.players[0];

	humanPlayer.hand.forEach(domino => {
		playerHand.appendChild(createDominoElement(domino, true));
	});
}

function renderBoneyard() {
	boneyardCount.textContent = gameState.boneyard.length;
}

function renderChainScore(previewScore = null) {
	const chainScore = previewScore === null ? getBoardEndTotal() : previewScore;

	chainScoreText.textContent = `Table Score: ${chainScore}`;
}

function renderTurnControls() {
	if (!gameState.gameStarted || gameState.roundOver || gameState.players.length === 0) {
		drawButton.disabled = true;
		passButton.disabled = true;
		return;
	}

	const currentPlayer = gameState.players[gameState.currentPlayerIndex];
	const hasPlayableDomino = getPlayableDominoes(currentPlayer).length > 0;

	drawButton.disabled = !currentPlayer.isHuman || hasPlayableDomino || gameState.boneyard.length === 0;
	passButton.disabled = !currentPlayer.isHuman || hasPlayableDomino || gameState.boneyard.length > 0;
}

function renderGameLog() {
	gameLog.innerHTML = "";

	gameState.gameLog.forEach(entry => {
		const logEntry = document.createElement("div");
		logEntry.className = "log-entry";
		logEntry.textContent = entry;
		gameLog.appendChild(logEntry);
	});

	gameLog.scrollTop = gameLog.scrollHeight;
}

function createPipLayout(value) {
	const pipPositions = {
		0: [],
		1: [5],
		2: [1, 9],
		3: [1, 5, 9],
		4: [1, 3, 7, 9],
		5: [1, 3, 5, 7, 9],
		6: [1, 3, 4, 6, 7, 9]
	};

	return pipPositions[value]
		.map(position => `<span class="domino-pip domino-pip-${position}"></span>`)
		.join("");
}

function createDominoElement(domino, isDraggable = false, displayDirection = "vertical", extraClasses = "") {
	const dominoElement = document.createElement("button");
	dominoElement.className = `domino domino-${displayDirection} ${extraClasses}`.trim();
	dominoElement.type = "button";
	dominoElement.dataset.dominoId = domino.id;
	dominoElement.draggable = isDraggable;
	dominoElement.setAttribute("aria-label", `Domino ${domino.left} ${domino.right}`);

	dominoElement.innerHTML = `
		<span class="domino-half">${createPipLayout(domino.left)}</span>
		<span class="domino-half">${createPipLayout(domino.right)}</span>
	`;

	if (isDraggable) {
		dominoElement.addEventListener("dragstart", event => {
			const transparentDragImage = document.createElement("canvas");

			transparentDragImage.width = 1;
			transparentDragImage.height = 1;

			event.dataTransfer.setDragImage(transparentDragImage, 0, 0);

			draggedDominoId = domino.id;
			selectedBoardEnd = null;
			highlightValidBoardEnds(domino);
		});

		dominoElement.addEventListener("dragend", () => {
			draggedDominoId = null;
			selectedBoardEnd = null;
			clearBoardEndHighlights();
			renderChainScore();
		});
	}

	return dominoElement;
}

/* <------------------------------------------------
      SEGMENT LAYOUT MAP
   -------------------------------------------------> */
	 
function createDefaultBoardSegmentOffsets() {
	return {
		left: {
			x: 0,
			y: 0
		},
		right: {
			x: 0,
			y: 0
		},
		top: {
			x: 0,
			y: 0
		},
		bottom: {
			x: 0,
			y: 0
		}
	};
}	 

function normalizeBoardSegmentOffsets() {
	const defaultOffsets = createDefaultBoardSegmentOffsets();

	if (!gameState.boardSegmentOffsets) {
		gameState.boardSegmentOffsets = defaultOffsets;
		return;
	}

	Object.keys(defaultOffsets).forEach(boardEnd => {
		if (!gameState.boardSegmentOffsets[boardEnd]) {
			gameState.boardSegmentOffsets[boardEnd] = defaultOffsets[boardEnd];
			return;
		}

		gameState.boardSegmentOffsets[boardEnd].x = Number(gameState.boardSegmentOffsets[boardEnd].x) || 0;
		gameState.boardSegmentOffsets[boardEnd].y = Number(gameState.boardSegmentOffsets[boardEnd].y) || 0;
	});
}
	 
const BOARD_SEGMENT_LAYOUT_MAP = {
	left: {
		branchDirection: "left",
		baseSegmentDirection: "horizontal",
		firstTurnDirection: "down",
		secondTurnDirection: "right",
		firstTurnThreshold: 5,
		secondTurnThreshold: 7,
		segmentOwner: "boardChain"
	},
	right: {
		branchDirection: "right",
		baseSegmentDirection: "horizontal",
		firstTurnDirection: "down",
		secondTurnDirection: "left",
		firstTurnThreshold: 5,
		secondTurnThreshold: 7,
		segmentOwner: "boardChain"
	},
	top: {
		branchDirection: "top",
		baseSegmentDirection: "vertical",
		firstTurnDirection: "left",
		secondTurnDirection: "down",
		firstTurnThreshold: 2,
		secondTurnThreshold: 7,
		segmentOwner: "spinnerTopChain"
	},
	bottom: {
		branchDirection: "bottom",
		baseSegmentDirection: "vertical",
		firstTurnDirection: "right",
		secondTurnDirection: "up",
		firstTurnThreshold: 2,
		secondTurnThreshold: 7,
		segmentOwner: "spinnerBottomChain"
	}
};

function getSegmentLayoutMap(boardEnd) {
	return BOARD_SEGMENT_LAYOUT_MAP[boardEnd] || null;
}

function getSegmentOwnerChain(boardEnd) {
	const segmentLayout = getSegmentLayoutMap(boardEnd);

	if (!segmentLayout) {
		return [];
	}

	return gameState[segmentLayout.segmentOwner] || [];
}

function getBranchSegmentGroups(boardEnd, dominoes) {
	const segmentLayout = getSegmentLayoutMap(boardEnd);

	if (!segmentLayout) {
		return {
			baseSegment: dominoes,
			firstTurnSegment: [],
			secondTurnSegment: []
		};
	}

	return {
		baseSegment: dominoes.slice(0, segmentLayout.firstTurnThreshold),
		firstTurnSegment: dominoes.slice(
			segmentLayout.firstTurnThreshold,
			segmentLayout.secondTurnThreshold
		),
		secondTurnSegment: dominoes.slice(segmentLayout.secondTurnThreshold)
	};
}

/* <------------------------------------------------
      SEGMENT METADATA BUILDER
   -------------------------------------------------> */
function buildSegmentMetadata(boardEnd, dominoes) {
	const segmentLayout = getSegmentLayoutMap(boardEnd);
	const segmentGroups = getBranchSegmentGroups(boardEnd, dominoes);

	return {
		boardEnd,
		branchDirection: segmentLayout.branchDirection,
		baseSegmentDirection: segmentLayout.baseSegmentDirection,
		firstTurnDirection: segmentLayout.firstTurnDirection,
		secondTurnDirection: segmentLayout.secondTurnDirection,
		firstTurnThreshold: segmentLayout.firstTurnThreshold,
		secondTurnThreshold: segmentLayout.secondTurnThreshold,
		offsets: gameState.boardSegmentOffsets[boardEnd],
		baseSegment: segmentGroups.baseSegment,
		firstTurnSegment: segmentGroups.firstTurnSegment,
		secondTurnSegment: segmentGroups.secondTurnSegment
	};
}

function buildBoardSegmentMetadataSnapshot() {
	return {
		left: buildSegmentMetadata("left", getLeftSpinnerBranchDominoes()),
		right: buildSegmentMetadata("right", getRightSpinnerBranchDominoes()),
		top: buildSegmentMetadata("top", gameState.spinnerTopChain),
		bottom: buildSegmentMetadata("bottom", gameState.spinnerBottomChain)
	};
}

/* <------------------------------------------------
      BRANCH SEGMENT RENDERER
   -------------------------------------------------> */
function createBranchSegment(
	className,
	dominoes,
	chainDirection,
	openEndIndexes = []
) {
	const segment = document.createElement("div");
	const normalizedOpenEndIndexes = Array.isArray(openEndIndexes)
		? openEndIndexes
		: [openEndIndexes];

	segment.className = className;

	dominoes.forEach((domino, index) => {
		const isOpenEnd = normalizedOpenEndIndexes.includes(index);

		segment.appendChild(
			createDominoElement(
				domino,
				false,
				getBranchDominoDisplayDirection(
					domino,
					chainDirection,
					isOpenEnd
				),
				isOpenEnd ? "branch-open-end-domino" : ""
			)
		);
	});

	return segment;
}

function createBranchSegmentGroup(
	boardEnd,
	className,
	dominoes,
	openEndIndexes = []
) {
	const shouldRenderFromCenterOut = boardEnd === "left";
	const orderedDominoes = shouldRenderFromCenterOut ? [...dominoes].reverse() : dominoes;
	const segmentMetadata = buildSegmentMetadata(boardEnd, orderedDominoes);
	const branchSegmentGroup = document.createElement("div");
	const normalizedOpenEndIndexes = Array.isArray(openEndIndexes)
		? openEndIndexes
		: [openEndIndexes];

	const orderedOpenEndIndexes = normalizedOpenEndIndexes.map(openEndIndex => {
		if (!shouldRenderFromCenterOut) {
			return openEndIndex;
		}

		return dominoes.length - 1 - openEndIndex;
	});

	branchSegmentGroup.className = `${className}-group board-segment-group-${boardEnd}`;
	branchSegmentGroup.dataset.boardEnd = boardEnd;
	branchSegmentGroup.style.transform = `translate(${segmentMetadata.offsets.x}px, ${segmentMetadata.offsets.y}px)`;

	branchSegmentGroup.appendChild(
		createNamedBranchSegment(
			className,
			"base",
			boardEnd === "top"
				? [...segmentMetadata.baseSegment].reverse()
				: segmentMetadata.baseSegment,
			segmentMetadata.baseSegmentDirection,
			getTopBaseOpenEndIndexes(
				boardEnd,
				getSegmentLocalOpenEndIndexes(
					orderedOpenEndIndexes,
					0,
					segmentMetadata.baseSegment.length
				),
				segmentMetadata.baseSegment.length
			)
		)
	);

	branchSegmentGroup.appendChild(
		createNamedBranchSegment(
			className,
			"first-turn",
			boardEnd === "left" || boardEnd === "right"
				? segmentMetadata.firstTurnSegment.map(domino => ({
					...domino,
					left: domino.right,
					right: domino.left
				}))
				: segmentMetadata.firstTurnSegment,
			getChainDirectionFromTurnDirection(segmentMetadata.firstTurnDirection),
			getSegmentLocalOpenEndIndexes(
				orderedOpenEndIndexes,
				segmentMetadata.firstTurnThreshold,
				segmentMetadata.firstTurnSegment.length
			)
		)
	);

	branchSegmentGroup.appendChild(
		createNamedBranchSegment(
			className,
			"second-turn",
			boardEnd === "left" || boardEnd === "right" || boardEnd === "top" || boardEnd === "bottom"
				? segmentMetadata.secondTurnSegment.map(domino => ({
					...domino,
					left: domino.right,
					right: domino.left,
					forcedDisplayDirection:
						(boardEnd === "top" || boardEnd === "bottom" ) && isDouble(domino)
							? "vertical"
							: null
				}))
				: segmentMetadata.secondTurnSegment,
			segmentMetadata.baseSegmentDirection,
			getSegmentLocalOpenEndIndexes(
				orderedOpenEndIndexes,
				segmentMetadata.secondTurnThreshold,
				segmentMetadata.secondTurnSegment.length
			)
		)
	);

	return branchSegmentGroup;
}

function getChainDirectionFromTurnDirection(turnDirection) {
	if (turnDirection === "up" || turnDirection === "down") {
		return "vertical";
	}

	return "horizontal";
}

function createNamedBranchSegment(
	className,
	segmentName,
	dominoes,
	chainDirection,
	openEndIndexes = []
) {
	const segment = createBranchSegment(
		className,
		dominoes,
		chainDirection,
		openEndIndexes
	);

	segment.classList.add(`branch-segment-${segmentName}`);

	return segment;
}

function getTopBaseOpenEndIndexes(boardEnd, openEndIndexes, segmentLength) {
	if (boardEnd !== "top") {
		return openEndIndexes;
	}

	return openEndIndexes.map(openEndIndex => segmentLength - 1 - openEndIndex);
}

function getSegmentLocalOpenEndIndexes(openEndIndexes, segmentStartIndex, segmentLength) {
	return openEndIndexes
		.filter(openEndIndex => (
			openEndIndex >= segmentStartIndex &&
			openEndIndex < segmentStartIndex + segmentLength
		))
		.map(openEndIndex => openEndIndex - segmentStartIndex);
}

function renderAll() {
	normalizeBoardSegmentOffsets();
	applyTheme();
	renderSetupControls();
	renderScores();
	renderBoneCount();
	renderBoard();
	renderPlayerHand();
	renderBoneyard();
	renderChainScore();
	renderTurnControls();
	renderGameLog();
}

/* <------------------------------------------------
      DOMINOES BOARD STATE ENGINE
   -------------------------------------------------> */
function isDouble(domino) {
	return domino.left === domino.right;
}

function getDominoPipTotal(domino) {
	return domino.left + domino.right;
}

function getDominoDisplayDirection(domino, chainDirection) {
	if (chainDirection === "horizontal") {
		return isDouble(domino) ? "vertical" : "horizontal";
	}

	return isDouble(domino) ? "horizontal" : "vertical";
}

function getBranchDominoDisplayDirection(domino, chainDirection, isOpenEnd) {
	if (domino.id === gameState.spinnerDominoId) {
		return "vertical";
	}

	if (domino.forcedDisplayDirection) {
		return domino.forcedDisplayDirection;
	}	

	if (isDouble(domino) && !isOpenEnd) {
		return chainDirection;
	}

	return getDominoDisplayDirection(domino, chainDirection);
}

function getHighestDoubleFromPlayers(players) {
	let highestDouble = null;
	let highestPlayerIndex = -1;

	players.forEach((player, playerIndex) => {
		player.hand.forEach(domino => {
			if (isDouble(domino) && (!highestDouble || domino.left > highestDouble.left)) {
				highestDouble = domino;
				highestPlayerIndex = playerIndex;
			}
		});
	});

	return {
		domino: highestDouble,
		playerIndex: highestPlayerIndex
	};
}

function getHighestDominoFromPlayers(players) {
	let highestDomino = null;
	let highestPlayerIndex = -1;

	players.forEach((player, playerIndex) => {
		player.hand.forEach(domino => {
			if (
				!highestDomino ||
				getDominoPipTotal(domino) > getDominoPipTotal(highestDomino)
			) {
				highestDomino = domino;
				highestPlayerIndex = playerIndex;
			}
		});
	});

	return {
		domino: highestDomino,
		playerIndex: highestPlayerIndex
	};
}

function getOpeningMove(players) {
	const highestDouble = getHighestDoubleFromPlayers(players);

	if (highestDouble.domino) {
		return highestDouble;
	}

	return getHighestDominoFromPlayers(players);
}

function removeDominoFromPlayerHand(player, dominoId) {
	const dominoIndex = player.hand.findIndex(domino => domino.id === dominoId);

	if (dominoIndex === -1) {
		return null;
	}

	return player.hand.splice(dominoIndex, 1)[0];
}

function getNextPlayerIndex(currentPlayerIndex, playerCount) {
	return (currentPlayerIndex + 1) % playerCount;
}

function canDominoPlayOnLeft(domino) {
	return domino.left === gameState.leftOpen || domino.right === gameState.leftOpen;
}

function canDominoPlayOnRight(domino) {
	return domino.left === gameState.rightOpen || domino.right === gameState.rightOpen;
}

function canDominoPlayOnBoard(domino) {
	return getValidPlacementSides(domino).length > 0;
}

function getPlayableDominoes(player) {
	return player.hand.filter(domino => canDominoPlayOnBoard(domino));
}

function hasPlayerWonRound(player) {
	return player.hand.length === 0;
}

function getRemainingHandPipTotal(excludedPlayer) {
	return gameState.players
		.filter(player => player.id !== excludedPlayer.id)
		.reduce((total, player) => {
			const playerHandTotal = player.hand.reduce((handTotal, domino) => {
				return handTotal + domino.left + domino.right;
			}, 0);

			return total + playerHandTotal;
		}, 0);
}

function areAllPlayersBlocked() {
	if (gameState.boneyard.length > 0) {
		return false;
	}

	return gameState.players.every(player => getPlayableDominoes(player).length === 0);
}

function isSpinnerCrossUnlocked() {
	return (
		gameState.spinnerActive &&
		gameState.spinnerLeftFilled &&
		gameState.spinnerRightFilled
	);
}

function getSpinnerTopEndTotal() {
	if (gameState.spinnerTopChain.length === 0) {
		return 0;
	}

	const topEndDomino = gameState.spinnerTopChain[gameState.spinnerTopChain.length - 1];

	return isDouble(topEndDomino)
		? topEndDomino.left + topEndDomino.right
		: gameState.spinnerTopOpen;
}

function getSpinnerBottomEndTotal() {
	if (gameState.spinnerBottomChain.length === 0) {
		return 0;
	}

	const bottomEndDomino = gameState.spinnerBottomChain[gameState.spinnerBottomChain.length - 1];

	return isDouble(bottomEndDomino)
		? bottomEndDomino.left + bottomEndDomino.right
		: gameState.spinnerBottomOpen;
}

function getBoardEndTotal() {
	if (gameState.boardChain.length === 0) {
		return 0;
	}

	if (gameState.boardChain.length === 1) {
		const onlyDomino = gameState.boardChain[0];

		return isDouble(onlyDomino)
			? onlyDomino.left + onlyDomino.right
			: gameState.leftOpen + gameState.rightOpen;
	}

	const leftEndDomino = gameState.boardChain[0];
	const rightEndDomino = gameState.boardChain[gameState.boardChain.length - 1];

	const leftEndTotal = isDouble(leftEndDomino)
		? leftEndDomino.left + leftEndDomino.right
		: gameState.leftOpen;

	const rightEndTotal = isDouble(rightEndDomino)
		? rightEndDomino.left + rightEndDomino.right
		: gameState.rightOpen;

	const spinnerTopTotal = isSpinnerCrossUnlocked()
		? getSpinnerTopEndTotal()
		: 0;

	const spinnerBottomTotal = isSpinnerCrossUnlocked()
		? getSpinnerBottomEndTotal()
		: 0;

	return leftEndTotal + rightEndTotal + spinnerTopTotal + spinnerBottomTotal;
}

function updateSpinnerStatusLog() {
	if (!isSpinnerCrossUnlocked()) {
		return;
	}

	const alreadyLogged = gameState.gameLog.some(entry =>
		entry === "Spinner cross is now open."
	);

	if (!alreadyLogged) {
		addLogEntry("Spinner cross is now open.");
	}
}

function scoreAllFivesIfNeeded(player) {
	const boardEndTotal = getBoardEndTotal();

	if (boardEndTotal > 0 && boardEndTotal % 5 === 0) {
		player.score += boardEndTotal;
		addLogEntry(`${player.name} scores ${boardEndTotal} points.`);
	}
}

function isBlockedByAdjacentDoublet(domino, boardEnd) {
	if (!isDouble(domino)) {
		return false;
	}

	if (boardEnd === "left") {
		return isDouble(gameState.boardChain[0]);
	}

	if (boardEnd === "right") {
		return isDouble(gameState.boardChain[gameState.boardChain.length - 1]);
	}

	if (boardEnd === "top") {
		return gameState.spinnerTopChain.length === 0
			? true
			: isDouble(gameState.spinnerTopChain[gameState.spinnerTopChain.length - 1]);
	}

	if (boardEnd === "bottom") {
		return gameState.spinnerBottomChain.length === 0
			? true
			: isDouble(gameState.spinnerBottomChain[gameState.spinnerBottomChain.length - 1]);
	}

	return false;
}

function getValidPlacementSides(domino) {
	const validSides = [];

	if (gameState.boardChain.length === 0) {
		return ["opening"];
	}

	if (canDominoPlayOnLeft(domino) && !isBlockedByAdjacentDoublet(domino, "left")) {
		validSides.push("left");
	}

	if (canDominoPlayOnRight(domino) && !isBlockedByAdjacentDoublet(domino, "right")) {
		validSides.push("right");
	}

	if (
		isSpinnerCrossUnlocked() &&
		gameState.spinnerTopOpen !== null &&
		(domino.left === gameState.spinnerTopOpen || domino.right === gameState.spinnerTopOpen) &&
		!isBlockedByAdjacentDoublet(domino, "top")
	) {
		validSides.push("top");
	}

	if (
		isSpinnerCrossUnlocked() &&
		gameState.spinnerBottomOpen !== null &&
		(domino.left === gameState.spinnerBottomOpen || domino.right === gameState.spinnerBottomOpen) &&
		!isBlockedByAdjacentDoublet(domino, "bottom")
	) {
		validSides.push("bottom");
	}

		return validSides;
	}

	function getLegalDominoPlacement(domino, preferredSide = null) {
	if (gameState.boardChain.length === 0) {
		return {
			side: "opening",
			domino,
			leftOpen: domino.left,
			rightOpen: domino.right
		};
	}

	const validSides = getValidPlacementSides(domino);
	const placementSide = preferredSide && validSides.includes(preferredSide)
		? preferredSide
		: validSides[0];

	if (placementSide === "left") {
		const orientedDomino = domino.right === gameState.leftOpen
			? domino
			: {
				...domino,
				left: domino.right,
				right: domino.left
			};

		return {
			side: "left",
			domino: orientedDomino,
			leftOpen: orientedDomino.left,
			rightOpen: gameState.rightOpen
		};
	}

	if (placementSide === "right") {
		const orientedDomino = domino.left === gameState.rightOpen
			? domino
			: {
				...domino,
				left: domino.right,
				right: domino.left
			};

		return {
			side: "right",
			domino: orientedDomino,
			leftOpen: gameState.leftOpen,
			rightOpen: orientedDomino.right
		};
	}

	if (placementSide === "top") {
		const orientedDomino = domino.right === gameState.spinnerTopOpen
			? domino
			: {
				...domino,
				left: domino.right,
				right: domino.left
			};

		return {
			side: "top",
			domino: orientedDomino,
			leftOpen: gameState.leftOpen,
			rightOpen: gameState.rightOpen,
			spinnerTopOpen: orientedDomino.left
		};
	}

	if (placementSide === "bottom") {
		const orientedDomino = domino.left === gameState.spinnerBottomOpen
			? domino
			: {
				...domino,
				left: domino.right,
				right: domino.left
			};

		return {
			side: "bottom",
			domino: orientedDomino,
			leftOpen: gameState.leftOpen,
			rightOpen: gameState.rightOpen,
			spinnerBottomOpen: orientedDomino.right
		};
	}

	return null;
}

function getBoardEndTargetElement(boardEnd) {
	const spinnerElement = boardTrack.querySelector(".spinner-center-cell .domino");

	if (boardEnd === "left") {
		return boardTrack.querySelector(".spinner-left-branch .branch-open-end-domino")
			|| spinnerElement
			|| boardTrack.querySelector(".domino");
	}

	if (boardEnd === "right") {
		return boardTrack.querySelector(".spinner-right-branch .branch-open-end-domino")
			|| spinnerElement
			|| [...boardTrack.querySelectorAll(".domino")].at(-1);
	}

	if (boardEnd === "top") {
		return boardTrack.querySelector(".spinner-top-branch .branch-open-end-domino")
			|| spinnerElement;
	}

	if (boardEnd === "bottom") {
		return boardTrack.querySelector(".spinner-bottom-branch .branch-open-end-domino")
			|| spinnerElement;
	}

	return null;
}

function isSpinnerSideChoiceTarget(targetElement) {
	const boardEnds = targetElement.dataset.boardEnds
		? targetElement.dataset.boardEnds.split(",")
		: [];

	return (
		targetElement.dataset.dominoId === gameState.spinnerDominoId &&
		boardEnds.length > 1
	);
}

function getSelectedBoardEndFromTarget(targetElement, event) {
	const boardEnds = targetElement.dataset.boardEnds.split(",");

	if (boardEnds.length === 1) {
		return boardEnds[0];
	}

	const targetBox = targetElement.getBoundingClientRect();
	const xOffset = event.clientX - (targetBox.left + targetBox.width / 2);
	const yOffset = event.clientY - (targetBox.top + targetBox.height / 2);

	if (Math.abs(xOffset) >= Math.abs(yOffset)) {
		const horizontalSide = xOffset < 0 ? "left" : "right";

		if (boardEnds.includes(horizontalSide)) {
			return horizontalSide;
		}
	}

	const verticalSide = yOffset < 0 ? "top" : "bottom";

	if (boardEnds.includes(verticalSide)) {
		return verticalSide;
	}

	return boardEnds[0];
}

function selectBoardTarget(event) {
	event.preventDefault();
	event.stopPropagation();

	const targetElement = event.currentTarget;

	if (!targetElement.classList.contains("valid-target-domino")) {
		return;
	}

	const currentPlayer = gameState.players[gameState.currentPlayerIndex];
	const draggedDomino = currentPlayer.hand.find(domino => domino.id === draggedDominoId);

	selectedBoardEnd = getSelectedBoardEndFromTarget(targetElement, event);
	clearSelectedBoardEnd();

	if (isSpinnerSideChoiceTarget(targetElement)) {
		targetElement.classList.add(
			"selected-spinner-side-target",
			`selected-spinner-side-${selectedBoardEnd}`
		);
	} else {
		targetElement.classList.add("selected-target-domino");
	}

	if (draggedDomino) {
		renderChainScore(getPreviewBoardEndTotal(draggedDomino, selectedBoardEnd));
	}
}

function highlightValidBoardEnds(domino) {
	clearBoardEndHighlights();

	getValidPlacementSides(domino).forEach(boardEnd => {
		const targetElement = getBoardEndTargetElement(boardEnd);

		if (!targetElement) {
			return;
		}

		const existingBoardEnds = targetElement.dataset.boardEnds
			? targetElement.dataset.boardEnds.split(",")
			: [];

		if (!existingBoardEnds.includes(boardEnd)) {
			existingBoardEnds.push(boardEnd);
		}

		targetElement.dataset.boardEnds = existingBoardEnds.join(",");
		targetElement.classList.add("valid-target-domino");

		targetElement.addEventListener("dragenter", selectBoardTarget);
		targetElement.addEventListener("dragover", selectBoardTarget);

targetElement.addEventListener("dragleave", event => {
	event.preventDefault();
	event.stopPropagation();

	if (targetElement.contains(event.relatedTarget)) {
		return;
	}

	targetElement.classList.remove("selected-target-domino");
	selectedBoardEnd = null;
	renderChainScore();
});

		targetElement.addEventListener("drop", event => {
			event.preventDefault();
			event.stopPropagation();

			boardTrack.parentElement.classList.remove("drag-over");

			if (draggedDominoId && targetElement.classList.contains("valid-target-domino")) {
				placeDominoOnBoard(draggedDominoId, selectedBoardEnd);
			}

			draggedDominoId = null;
			selectedBoardEnd = null;
			clearBoardEndHighlights();
			renderChainScore();
		});
	});
}

function clearSelectedBoardEnd() {
	boardTrack.querySelectorAll(".selected-target-domino").forEach(targetDomino => {
		targetDomino.classList.remove("selected-target-domino");
	});

	boardTrack.querySelectorAll(".selected-spinner-side-target").forEach(targetDomino => {
		targetDomino.classList.remove(
			"selected-spinner-side-target",
			"selected-spinner-side-left",
			"selected-spinner-side-right",
			"selected-spinner-side-top",
			"selected-spinner-side-bottom"
		);
	});
}
function getPreviewBoardEndTotal(domino, preferredSide) {
	const legalPlacement = getLegalDominoPlacement(domino, preferredSide);

	if (!legalPlacement) {
		return getBoardEndTotal();
	}

	const existingTopTotal = getSpinnerTopEndTotal();
	const existingBottomTotal = getSpinnerBottomEndTotal();

	if (legalPlacement.side === "top") {
		const previewTopTotal = isDouble(legalPlacement.domino)
			? legalPlacement.domino.left + legalPlacement.domino.right
			: legalPlacement.spinnerTopOpen;

		return getHorizontalPreviewEndTotal(null) + previewTopTotal + existingBottomTotal;
	}

	if (legalPlacement.side === "bottom") {
		const previewBottomTotal = isDouble(legalPlacement.domino)
			? legalPlacement.domino.left + legalPlacement.domino.right
			: legalPlacement.spinnerBottomOpen;

		return getHorizontalPreviewEndTotal(null) + existingTopTotal + previewBottomTotal;
	}

	if (legalPlacement.side === "left") {
		return getHorizontalPreviewEndTotal(legalPlacement) + existingTopTotal + existingBottomTotal;
	}

	if (legalPlacement.side === "right") {
		return getHorizontalPreviewEndTotal(legalPlacement) + existingTopTotal + existingBottomTotal;
	}

	return getBoardEndTotal();
}

function getHorizontalPreviewEndTotal(legalPlacement) {
	const leftEndDomino = legalPlacement && legalPlacement.side === "left"
		? legalPlacement.domino
		: gameState.boardChain[0];

	const rightEndDomino = legalPlacement && legalPlacement.side === "right"
		? legalPlacement.domino
		: gameState.boardChain[gameState.boardChain.length - 1];

	const leftOpen = legalPlacement && legalPlacement.side === "left"
		? legalPlacement.leftOpen
		: gameState.leftOpen;

	const rightOpen = legalPlacement && legalPlacement.side === "right"
		? legalPlacement.rightOpen
		: gameState.rightOpen;

	const leftEndTotal = isDouble(leftEndDomino)
		? leftEndDomino.left + leftEndDomino.right
		: leftOpen;

	const rightEndTotal = isDouble(rightEndDomino)
		? rightEndDomino.left + rightEndDomino.right
		: rightOpen;

	return leftEndTotal + rightEndTotal;
}

function clearBoardEndHighlights() {
	boardTrack.querySelectorAll(".valid-target-domino, .selected-target-domino").forEach(targetDomino => {
		targetDomino.classList.remove(
			"valid-target-domino",
			"selected-target-domino",
			"selected-spinner-side-target",
			"selected-spinner-side-left",
			"selected-spinner-side-right",
			"selected-spinner-side-top",
			"selected-spinner-side-bottom"
		);
		targetDomino.removeAttribute("data-board-ends");
	});
}

function advanceTurn() {
	gameState.currentPlayerIndex = getNextPlayerIndex(gameState.currentPlayerIndex, gameState.players.length);
}

function addCurrentTurnLogEntry() {
	if (!gameState.gameStarted || gameState.players.length === 0) {
		return;
	}

	addLogEntry(`${gameState.players[gameState.currentPlayerIndex].name}'s turn.`);
}

function getScoreSummaryMarkup() {
	return gameState.players
		.map(player => `<div class="reward-row"><span>${player.name}</span><strong>${player.score}</strong></div>`)
		.join("");
}

function showRoundOverWindow() {
	openModal(
		"Round Over",
		`
			${getScoreSummaryMarkup()}
			<button class="primary-button" id="nextRoundButton" type="button">Next Round</button>
		`,
		true
	);

	document.getElementById("nextRoundButton").addEventListener("click", startNextRound);
}

function showGameOverWindow(winningPlayer) {
	openModal(
		"Game Over",
		`
			<p>${winningPlayer.name} wins the game!</p>
			${getScoreSummaryMarkup()}
			<button class="primary-button" id="gameOverNewGameButton" type="button">New Game</button>
		`,
		true
	);

	document.getElementById("gameOverNewGameButton").addEventListener("click", startNewGame);
}

function endRound(winningPlayer) {
	if (gameState.roundOver || !gameState.gameStarted) {
		return;
	}

	const roundPoints = getRemainingHandPipTotal(winningPlayer);

	winningPlayer.score += roundPoints;
	gameState.roundOver = true;

	addLogEntry(`${winningPlayer.name} wins the round!`);
	addLogEntry(`${winningPlayer.name} scores ${roundPoints} points.`);

	if (winningPlayer.score >= gameState.winningScore) {
		addLogEntry(`${winningPlayer.name} wins the game!`);
		gameState.gameStarted = false;
		renderAll();
		saveGameState();
		showGameOverWindow(winningPlayer);
		return;
	}

	renderAll();
	saveGameState();
	showRoundOverWindow();
}

function endBlockedRound() {
	if (gameState.roundOver || !gameState.gameStarted) {
		return;
	}

	const lowestPlayer = gameState.players.reduce((currentLowest, player) => {
		const currentLowestTotal = getPlayerHandPipTotal(currentLowest);
		const playerTotal = getPlayerHandPipTotal(player);

		return playerTotal < currentLowestTotal ? player : currentLowest;
	});

	const roundPoints = gameState.players
		.filter(player => player.id !== lowestPlayer.id)
		.reduce((total, player) => total + getPlayerHandPipTotal(player), 0);

	lowestPlayer.score += roundPoints;
	gameState.roundOver = true;

	addLogEntry("The round is blocked.");
	addLogEntry(`${lowestPlayer.name} has the lowest hand and scores ${roundPoints} points.`);

	if (lowestPlayer.score >= gameState.winningScore) {
		addLogEntry(`${lowestPlayer.name} wins the game!`);
		gameState.gameStarted = false;
		renderAll();
		saveGameState();
		showGameOverWindow(lowestPlayer);
		return;
	}

	renderAll();
	saveGameState();
	showRoundOverWindow();
}

function getPlayerHandPipTotal(player) {
	return player.hand.reduce((total, domino) => {
		return total + domino.left + domino.right;
	}, 0);
}

function processAITurns() {
	if (gameState.sandboxMode?.enabled && gameState.sandboxMode.disableAITurns) {
		renderAll();
		saveGameState();
		return;
	}	
	let safetyCounter = 0;
	let aiTurnWasProcessed = false;

	while (
		gameState.gameStarted &&
		gameState.players.length > 0 &&
		!gameState.players[gameState.currentPlayerIndex].isHuman &&
		safetyCounter < gameState.players.length
	) {
		aiTurnWasProcessed = true;

		const currentPlayer = gameState.players[gameState.currentPlayerIndex];
		const playableDominoes = getPlayableDominoes(currentPlayer);

		if (playableDominoes.length === 0) {
			while (getPlayableDominoes(currentPlayer).length === 0 && gameState.boneyard.length > 0) {
				const drawnDomino = gameState.boneyard.shift();
				currentPlayer.hand.push(drawnDomino);
				addLogEntry(`${currentPlayer.name} dug into the boneyard.`);
			}

			if (getPlayableDominoes(currentPlayer).length === 0) {
				addLogEntry(`${currentPlayer.name} has no playable bones.`);
				advanceTurn();
				safetyCounter += 1;
				continue;
			}
		}

		const selectedDomino = getPlayableDominoes(currentPlayer)[0];
		const playResult = playDominoForPlayer(currentPlayer, selectedDomino.id);

		if (playResult === "ROUND_WON") {
			return;
		}

		advanceTurn();
		safetyCounter += 1;
	}

	if (gameState.gameStarted && areAllPlayersBlocked()) {
		endBlockedRound();
		return;
	}

	if (aiTurnWasProcessed) {
		addCurrentTurnLogEntry();
	}

	renderAll();
	saveGameState();
}	

function playDominoForPlayer(player, dominoId, preferredSide = null) {
	const dominoIndex = player.hand.findIndex(domino => domino.id === dominoId);

	if (dominoIndex === -1) {
		return false;
	}

	const selectedDomino = player.hand[dominoIndex];
	const legalPlacement = getLegalDominoPlacement(selectedDomino, preferredSide);

	if (!legalPlacement) {
		return false;
	}

	const playedDomino = player.hand.splice(dominoIndex, 1)[0];
	const orientedDomino = {
		...playedDomino,
		left: legalPlacement.domino.left,
		right: legalPlacement.domino.right
	};

	if (legalPlacement.side === "left") {
		gameState.boardChain.unshift(orientedDomino);

		if (
			gameState.spinnerActive &&
			gameState.boardChain.length > 1
		) {
			gameState.spinnerLeftFilled = true;
		}
	} else if (legalPlacement.side === "right") {
		gameState.boardChain.push(orientedDomino);

		if (
			gameState.spinnerActive &&
			gameState.boardChain.length > 1
		) {
			gameState.spinnerRightFilled = true;
		}
	} else if (legalPlacement.side === "top") {
		gameState.spinnerTopChain.push(orientedDomino);
		gameState.spinnerTopOpen = legalPlacement.spinnerTopOpen;
	} else if (legalPlacement.side === "bottom") {
		gameState.spinnerBottomChain.push(orientedDomino);
		gameState.spinnerBottomOpen = legalPlacement.spinnerBottomOpen;
	}

	gameState.board = [
		...gameState.spinnerTopChain,
		...gameState.boardChain,
		...gameState.spinnerBottomChain
	];
	gameState.leftOpen = legalPlacement.leftOpen;
	gameState.rightOpen = legalPlacement.rightOpen;

	addLogEntry(`${player.name} played ${orientedDomino.left}-${orientedDomino.right}.`);

	updateSpinnerStatusLog();
	scoreAllFivesIfNeeded(player);

	if (hasPlayerWonRound(player)) {
		endRound(player);
		return "ROUND_WON";
	}

	return true;
}

/* <------------------------------------------------
      DOMINO PLACEMENT
   -------------------------------------------------> */
function placeDominoOnBoard(dominoId, preferredSide = null) {
	if (!gameState.gameStarted || gameState.players.length === 0) {
		return;
	}

	const currentPlayer = gameState.players[gameState.currentPlayerIndex];

	if (!currentPlayer.isHuman) {
		addLogEntry(`It is ${currentPlayer.name}'s turn.`);
		return;
	}

	const selectedDomino = currentPlayer.hand.find(domino => domino.id === dominoId);

	if (!selectedDomino) {
		return;
	}

	if (getValidPlacementSides(selectedDomino).length === 0) {
		addLogEntry(`${currentPlayer.name} can't play ${selectedDomino.left}-${selectedDomino.right}.`);
		return;
	}

	const playResult = playDominoForPlayer(currentPlayer, dominoId, preferredSide);

	if (!playResult) {
		return;
	}

	if (playResult === "ROUND_WON") {
		return;
	}

	if (!(gameState.sandboxMode?.enabled && gameState.sandboxMode.keepHumanTurn)) {
		advanceTurn();
	}

	if (gameState.players[gameState.currentPlayerIndex].isHuman) {
		addCurrentTurnLogEntry();
		renderAll();
		saveGameState();
		return;
	}

	processAITurns();
}

/* <------------------------------------------------
      GAME ACTIONS
   -------------------------------------------------> */
function addLogEntry(entry) {
	gameState.gameLog.push(entry);
	renderGameLog();
	saveGameState();
}

function startNewGame() {
	modalOverlay.dataset.locked = "false";
	closeModalButton.style.display = "";
	modalOverlay.classList.add("hidden");

	gameState = createNewGameState();
	renderAll();
	saveGameState();
	processAITurns();
}

function startNextRound() {
	modalOverlay.dataset.locked = "false";
	closeModalButton.style.display = "";
	modalOverlay.classList.add("hidden");

	const savedScores = gameState.players.map(player => ({
		id: player.id,
		score: player.score
	}));

	const nextRoundState = createNewGameState();

	nextRoundState.players.forEach(player => {
		const savedPlayerScore = savedScores.find(savedScore => savedScore.id === player.id);

		if (savedPlayerScore) {
			player.score = savedPlayerScore.score;
		}
	});

	gameState = {
		...nextRoundState,
		roundOver: false
	};

	closeModal();
	renderAll();
	saveGameState();
	processAITurns();
}

function drawDomino() {
	if (!gameState.gameStarted || gameState.roundOver || gameState.players.length === 0) {
		return;
	}

	const currentPlayer = gameState.players[gameState.currentPlayerIndex];

	if (!currentPlayer.isHuman) {
		addLogEntry(`It is ${currentPlayer.name}'s turn.`);
		return;
	}

	if (getPlayableDominoes(currentPlayer).length > 0) {
		addLogEntry(`${currentPlayer.name} has a playable bone and can't draw.`);
		return;
	}

	if (gameState.boneyard.length === 0) {
		addLogEntry("No bones left.");
		renderAll();
		saveGameState();
		return;
	}

	const drawnDomino = gameState.boneyard.shift();
	currentPlayer.hand.push(drawnDomino);

	addLogEntry(`${currentPlayer.name} dug into the boneyard.`);
	renderAll();
	saveGameState();
}

function passTurn() {
	if (!gameState.gameStarted || gameState.roundOver || gameState.players.length === 0) {
		return;
	}

	const currentPlayer = gameState.players[gameState.currentPlayerIndex];

	if (!currentPlayer.isHuman) {
		addLogEntry(`It is ${currentPlayer.name}'s turn.`);
		return;
	}

	if (getPlayableDominoes(currentPlayer).length > 0) {
		addLogEntry(`${currentPlayer.name} has a playable domino and can't pass.`);
		return;
	}

	if (gameState.boneyard.length > 0) {
		addLogEntry(`${currentPlayer.name} must draw before passing.`);
		return;
	}

	addLogEntry(`${currentPlayer.name} passed.`);
	advanceTurn();

	if (areAllPlayersBlocked()) {
		endBlockedRound();
		return;
	}

	processAITurns();
	
}	

/* <------------------------------------------------
      BACKUP SYSTEM
   -------------------------------------------------> */
function exportBackup() {
	const backupData = {
		appTitle: APP_TITLE,
		version: APP_VERSION,
		exportedAt: new Date().toISOString(),
		gameState
	};

	const backupBlob = new Blob([JSON.stringify(backupData, null, 2)], {
		type: "application/json"
	});

	const backupUrl = URL.createObjectURL(backupBlob);
	const downloadLink = document.createElement("a");

	downloadLink.href = backupUrl;
	downloadLink.download = "dominoes-backup.json";
	downloadLink.click();

	URL.revokeObjectURL(backupUrl);
	addLogEntry("Backup exported.");
}

function importBackup(file) {
	const reader = new FileReader();

	reader.onload = event => {
		try {
			const backupData = JSON.parse(event.target.result);

			if (!backupData.gameState) {
				throw new Error("Backup file does not contain game state data.");
			}

			gameState = backupData.gameState;
			renderAll();
			saveGameState();
			addLogEntry("Backup imported successfully.");
		} catch (error) {
			openModal("Import Error", `<p>${error.message}</p>`);
		}
	};

	reader.readAsText(file);
}

async function shareBackup() {
	const backupData = {
		appTitle: APP_TITLE,
		version: APP_VERSION,
		exportedAt: new Date().toISOString(),
		gameState
	};

	const backupText = JSON.stringify(backupData, null, 2);

	if (navigator.share) {
		try {
			await navigator.share({
				title: "Dominoes Backup",
				text: backupText
			});

			addLogEntry("Backup shared.");
		} catch (error) {
			addLogEntry("Backup share was canceled.");
		}

		return;
	}

	await navigator.clipboard.writeText(backupText);
	addLogEntry("Backup copied to clipboard because sharing is not available in this browser.");
}

/* <------------------------------------------------
      MODAL WINDOWS
   -------------------------------------------------> */
function openModal(title, content, isLocked = false) {
	removeHelpVersionButton();
	
	modalOverlay
		.querySelector(".modal-window")
		.classList.remove("help-modal-window");	

	modalOverlay.dataset.locked = isLocked ? "true" : "false";
	closeModalButton.style.display = isLocked ? "none" : "";

	modalTitle.textContent = title;
	modalBody.innerHTML = content;
	modalOverlay.classList.remove("hidden");
}

function resetModalWindowPosition() {
	const modalWindow = modalOverlay.querySelector(".modal-window");

	modalOverlay.classList.remove("alignment-modal-overlay");
	modalWindow.classList.remove("alignment-modal-window");
	modalWindow.style.left = "";
	modalWindow.style.top = "";
	modalWindow.style.transform = "";
}

function closeModal() {
	if (modalOverlay.dataset.locked === "true") {
		return;
	}

	resetModalWindowPosition();
	modalOverlay.classList.add("hidden");
	modalTitle.textContent = "Window";
}

function showOptionsWindow() {
	removeHelpVersionButton();

	modalOverlay
		.querySelector(".modal-window")
		.classList.remove("help-modal-window");

	modalTitle.textContent = "Options";
	modalBody.innerHTML = optionsModalContent;
	modalOverlay.classList.remove("hidden");

	attachOptionsModalEventListeners();
	renderSetupControls();
}

function showRewardsWindow() {
	openModal(
		"Rewards",
		`
			<div class="reward-row">
				<span>Coins</span>
				<strong>${gameState.coins}</strong>
			</div>
			<div class="reward-row">
				<span>Achievements</span>
				<strong>${gameState.achievementsUnlocked ? "Unlocked" : "Locked"}</strong>
			</div>
			<div class="reward-row">
				<span>Collectibles</span>
				<strong>${gameState.collectiblesUnlocked ? "Unlocked" : "Locked"}</strong>
			</div>
		`
	);
}



function showAdminWindow() {
	resetModalWindowPosition();
	openModal(
		"Admin",
		`
			<div class="admin-window-content">
				<p>Use these tools to manage backups and board alignment.</p>

				<div class="admin-button-row">
					<button class="small-button" id="modalExportBackupButton" type="button">Export</button>
					<button class="small-button" id="modalImportBackupButton" type="button">Import</button>
					<button class="small-button" id="modalShareBackupButton" type="button">Share</button>
				</div>

				<div class="admin-test-tools-divider"></div>
				<p class="admin-test-tools-title">TEST TOOLS</p>

				<div class="admin-button-row">
					<button class="small-button" id="modalAlignmentToolButton" type="button">Align</button>
					<button class="small-button" id="modalSandboxButton" type="button">Sandbox</button>
				</div>

				<input class="hidden-file-input" id="modalBackupFileInput" type="file" accept="application/json">
			</div>
		`
	);

	const modalBackupFileInput = document.getElementById("modalBackupFileInput");

	document.getElementById("modalExportBackupButton").addEventListener("click", exportBackup);
	document.getElementById("modalImportBackupButton").addEventListener("click", () => modalBackupFileInput.click());
	document.getElementById("modalShareBackupButton").addEventListener("click", shareBackup);
	document.getElementById("modalAlignmentToolButton").addEventListener("click", showAlignmentToolWindow);
	document.getElementById("modalSandboxButton").addEventListener("click", showSandboxWindow);

	modalBackupFileInput.addEventListener("change", event => {
		const file = event.target.files[0];

		if (file) {
			importBackup(file);
		}

		modalBackupFileInput.value = "";
	});
}

function showSandboxWindow() {
	const sandboxMode = gameState.sandboxMode || DEFAULT_GAME_STATE.sandboxMode;

	openModal(
		"Sandbox",
		`
			<div class="sandbox-window-content">
				<label class="sandbox-toggle">
					<input id="sandboxDisableAITurns" type="checkbox" ${sandboxMode.disableAITurns ? "checked" : ""}>
					Disable AI Turns
				</label>

				<label class="sandbox-toggle">
					<input id="sandboxKeepHumanTurn" type="checkbox" ${sandboxMode.keepHumanTurn ? "checked" : ""}>
					Keep Human Turn
				</label>

				<label class="sandbox-toggle">
					<input id="sandboxFullTestHand" type="checkbox" ${sandboxMode.fullTestHand ? "checked" : ""}>
					Full Test Hand
				</label>

				<button class="primary-button" id="applySandboxButton" type="button">Apply</button>
			</div>
		`
	);

	document.getElementById("applySandboxButton").addEventListener("click", () => {
		gameState.sandboxMode = {
			enabled: true,
			disableAITurns: document.getElementById("sandboxDisableAITurns").checked,
			keepHumanTurn: document.getElementById("sandboxKeepHumanTurn").checked,
			fullTestHand: document.getElementById("sandboxFullTestHand").checked
		};

		startNewGame();
	});
}

/* <------------------------------------------------
      SEGMENT ALIGNMENT TOOL
   -------------------------------------------------> */
function showAlignmentToolWindow() {
	normalizeBoardSegmentOffsets();

	openModal(
		"Segment Alignment",
		`
			<div class="alignment-tool-content">
				${getAlignmentToolMarkup()}
				<button class="primary-button" id="resetSegmentAlignmentButton" type="button">Reset Alignment</button>
				<button class="primary-button" id="backToAdminButton" type="button">Back to Admin</button>
			</div>
		`
	);

	modalOverlay.classList.add("alignment-modal-overlay");
	modalOverlay.querySelector(".modal-window").classList.add("alignment-modal-window");
	attachAlignmentToolEventListeners();
	attachAlignmentWindowDragListeners();
}

function getAlignmentToolMarkup() {
	return ["left", "right", "top", "bottom"]
		.map(boardEnd => `
			<div class="alignment-row">
				<strong>${boardEnd}</strong>

				<div class="alignment-control-group">
					<button class="small-button" data-board-end="${boardEnd}" data-axis="x" data-amount="-10" type="button">-10</button>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="x" data-amount="-5" type="button">-5</button>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="x" data-amount="-1" type="button">-1</button>
					<span>X: ${gameState.boardSegmentOffsets[boardEnd].x}</span>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="x" data-amount="1" type="button">+1</button>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="x" data-amount="5" type="button">+5</button>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="x" data-amount="10" type="button">+10</button>
				</div>

				<div class="alignment-divider"></div>

				<div class="alignment-control-group">
					<button class="small-button" data-board-end="${boardEnd}" data-axis="y" data-amount="-10" type="button">-10</button>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="y" data-amount="-5" type="button">-5</button>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="y" data-amount="-1" type="button">-1</button>
					<span>Y: ${gameState.boardSegmentOffsets[boardEnd].y}</span>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="y" data-amount="1" type="button">+1</button>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="y" data-amount="5" type="button">+5</button>
					<button class="small-button" data-board-end="${boardEnd}" data-axis="y" data-amount="10" type="button">+10</button>
				</div>

				<button class="small-button" data-reset-board-end="${boardEnd}" type="button">Reset</button>
			</div>
		`)
		.join("");
}

function attachAlignmentWindowDragListeners() {
	const alignmentWindow = modalOverlay.querySelector(".alignment-modal-window");
	const alignmentHeader = alignmentWindow.querySelector(".modal-header");

	let isDraggingAlignmentWindow = false;
	let dragOffsetX = 0;
	let dragOffsetY = 0;

	alignmentHeader.addEventListener("mousedown", event => {
		const windowBox = alignmentWindow.getBoundingClientRect();

		isDraggingAlignmentWindow = true;
		dragOffsetX = event.clientX - windowBox.left;
		dragOffsetY = event.clientY - windowBox.top;

		alignmentWindow.style.left = `${windowBox.left}px`;
		alignmentWindow.style.top = `${windowBox.top}px`;
		alignmentWindow.style.transform = "none";
	});

	document.addEventListener("mousemove", event => {
		if (!isDraggingAlignmentWindow) {
			return;
		}

		alignmentWindow.style.left = `${event.clientX - dragOffsetX}px`;
		alignmentWindow.style.top = `${event.clientY - dragOffsetY}px`;
	});

	document.addEventListener("mouseup", () => {
		isDraggingAlignmentWindow = false;
	});
}

function attachAlignmentToolEventListeners() {
	modalBody.querySelectorAll("[data-board-end][data-axis][data-amount]").forEach(button => {
		button.addEventListener("click", () => {
			const boardEnd = button.dataset.boardEnd;
			const axis = button.dataset.axis;
			const amount = Number(button.dataset.amount);

			gameState.boardSegmentOffsets[boardEnd][axis] += amount;
			renderAll();
			saveGameState();
			showAlignmentToolWindow();
		});
	});

	modalBody.querySelectorAll("[data-reset-board-end]").forEach(button => {
		button.addEventListener("click", () => {
			const boardEnd = button.dataset.resetBoardEnd;

			gameState.boardSegmentOffsets[boardEnd] = {
				x: 0,
				y: 0
			};

			renderAll();
			saveGameState();
			showAlignmentToolWindow();
		});
	});

	document.getElementById("resetSegmentAlignmentButton").addEventListener("click", () => {
		gameState.boardSegmentOffsets = createDefaultBoardSegmentOffsets();
		renderAll();
		saveGameState();
		showAlignmentToolWindow();
	});

	document.getElementById("backToAdminButton").addEventListener("click", showAdminWindow);
}

function showHelpWindow() {
	openModal(
		"Help",
		`
			<div class="help-accordion">

				<div class="help-section">
					<button class="help-section-header" type="button">
						What is Dominoes?
					</button>

					<div class="help-section-content hidden">
						<p>Dominoes is a tile-based table game played with rectangular tiles called dominoes or bones. Each bone has two numbered ends, and players take turns matching one end of a bone from their hand to an open end on the board.</p>

						<p>The goal is to score points and be the first player to reach the selected winning score. In this version, the game uses Base (Block) Game rules combined with Cross Dominoes and All Fives scoring.</p>

						<p>A round ends when one player plays their final bone. This is called Domino, Going Out, or Chipping Out. In real table play, the player usually announces “Domino!” when playing their final bone.</p>

						<p>If no player can make a legal move and the boneyard is empty, the round is blocked. The player with the lowest remaining pip total wins the round.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						Current Game Rules
					</button>

					<div class="help-section-content hidden">
						<p>This game currently combines Base (Block) Game rules, Cross Dominoes, and All Fives scoring.</p>

						<p>Each player is dealt bones at the start of the round. The highest doublet starts the round. If no doublet is available, the highest-value bone starts instead.</p>

						<p>Players take turns placing a matching bone on an open end of the board. If a player has a legal move, they must play. If they do not have a legal move and the boneyard has bones left, they must draw.</p>

						<p>When the spinner is active, left and right branches must be filled before the top and bottom branches unlock. Once the cross is open, players may place bones on any valid open branch.</p>

						<p>A round ends when a player Dominoes by playing their final bone, or when the game becomes blocked and no player can make a legal move.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						Scoring
					</button>

					<div class="help-section-content hidden">
						<p>This game uses All Fives scoring. After a bone is played, the open ends of the board are added together.</p>

						<p>If the chain score is a multiple of 5, the player immediately scores that many points.</p>

						<p>Doublets on open ends count both sides of the doublet. For example, an open 6-6 doublet counts as 12 toward the chain score.</p>

						<p>When a player Dominoes, the other players' remaining pips are counted and awarded to the winner according to the game scoring rules.</p>

						<p>The match ends when a player reaches the selected winning score: 250, 500, or 1000 points.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						Controls
					</button>

					<div class="help-section-content hidden">
						<p>Drag a bone from your hand onto a highlighted board target to play it.</p>

						<p>When the spinner has more than one valid open side, hover over the side of the spinner you want. The selected side highlights red so you can choose the correct branch.</p>

						<p>Use Draw when you have no playable bone and the boneyard still has bones available.</p>

						<p>Use Pass only when you have no playable bone and the boneyard is empty.</p>

						<p>The gear button opens Options, where you can start a new game, change setup choices, open Help, view Rewards, and access Admin tools.</p>
					</div>
				</div>

				<div class="help-variation-divider">Admin</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						Backup
					</button>

					<div class="help-section-content hidden">
						<p>The Backup tools are found in the Admin window and are used to save, restore, or share your current game data.</p>

						<p><strong>Export:</strong> Downloads a backup file containing the current game state. Use this before testing, changing devices, clearing browser data, or making major changes.</p>

						<p><strong>Import:</strong> Restores a previously exported backup file. Importing replaces the current saved game state with the data from the selected backup file.</p>

						<p><strong>Share:</strong> Uses your browser or device sharing tools when available. If sharing is not supported, the backup data is copied to the clipboard instead.</p>

						<p>Backups are useful because this game stores progress locally in your browser. Browser data cleanup, private browsing, or changing devices may affect saved progress.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						Testing
					</button>

					<div class="help-section-content hidden">
						<p>The Testing tools are found in the Admin window. They are development tools used to test board layout, branch alignment, and special gameplay situations.</p>

						<p><strong>Align:</strong> Opens the Segment Alignment tool. This lets the board branch groups be nudged left, right, up, or down for testing and visual adjustment.</p>

						<p><strong>Reset Alignment:</strong> Resets all branch alignment offsets back to zero.</p>

						<p><strong>Sandbox Mode:</strong> Sandbox Mode is a development and testing tool. It is not a cheat system and is not intended for normal gameplay.</p>

						<p><strong>Disable AI Turns:</strong> Stops AI players from taking turns so board branches and layouts can be tested without the AI changing the board.</p>

						<p><strong>Keep Human Turn:</strong> Keeps the human player active after each move so several test bones can be placed in a row.</p>

						<p><strong>Full Test Hand:</strong> Gives the human player a full set of available bones, except for the starting bone, so specific branch and alignment situations are easier to test.</p>

						<p>When one or more Sandbox toggles are turned on, the game log marks the round with sandbox status messages so it is clear that normal gameplay rules have been changed for testing.</p>
					</div>
				</div>

				<div class="help-variation-divider">Variations</div>

					<div class="help-section">
					<button class="help-section-header" type="button">
						Base (Block) Game
					</button>

					<div class="help-section-content hidden">
						<p>The Base (Block) Game is the foundation of Dominoes. Players take turns matching bones to open ends of the chain.</p>

						<p>A bone may only be placed if one of its ends matches an open end on the board. The matching numbers must touch.</p>

						<p>If a player cannot play, traditional Block rules have the player knock or pass. In draw-style games, the player draws from the boneyard if bones are available.</p>

						<p>The round ends when one player Dominoes by playing their final bone, or when the game is blocked and no player can continue.</p>

						<p>If the game is blocked, the winner is determined by the lowest remaining pip total.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						Cross Dominoes
					</button>

					<div class="help-section-content hidden">
						<p>Cross Dominoes expands the game beyond a single chain by introducing a spinner and additional branches.</p>

						<p>When the spinner is played, the left and right branches become available first. After both branches contain at least one bone, the top and bottom branches unlock.</p>

						<p>Once all four branches are available, players may play on any legal open branch.</p>

						<p>As branches grow longer, they may turn to remain within the board area. Matching rules remain the same regardless of branch direction.</p>

						<p>The spinner remains part of the chain score calculation throughout the entire round.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						All Fives
					</button>

					<div class="help-section-content hidden">
						<p>All Fives is a scoring variation where points are earned during play.</p>

						<p>After every legal play, the open ends of the chain are totaled.</p>

						<p>If the total is divisible by 5, the player immediately scores that many points.</p>

						<p>Examples:</p>

						<p>10 open pips = 10 points</p>

						<p>15 open pips = 15 points</p>

						<p>20 open pips = 20 points</p>

						<p>Doublets on open ends count both sides of the doublet when calculating chain score.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						All Fives & Threes (COMING SOON)
					</button>

					<div class="help-section-content hidden">
						<p><strong>STATUS: COMING SOON</strong></p>

						<p>This variation expands All Fives scoring by allowing players to score from multiples of both 3 and 5.</p>

						<p>Open-end totals that are divisible by 3 score points.</p>

						<p>Open-end totals that are divisible by 5 score points.</p>

						<p>Totals divisible by both 3 and 5 may score under both rules.</p>

						<p>This variation generally produces faster scoring and higher point totals than standard All Fives.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						Double Nine Cross (COMING SOON)
					</button>

					<div class="help-section-content hidden">
						<p><strong>STATUS: COMING SOON</strong></p>

						<p>This variation uses a Double-Nine domino set instead of a Double-Six set.</p>

						<p>The larger set increases the number of available bones and generally produces longer rounds.</p>

						<p>Additional branch growth and scoring opportunities become possible due to the larger number range.</p>

						<p>Player hand sizes and setup rules may differ from the standard game.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						Double Twelve (COMING SOON)
					</button>

					<div class="help-section-content hidden">
						<p><strong>STATUS: COMING SOON</strong></p>

						<p>This variation uses a Double-Twelve domino set.</p>

						<p>The larger set supports longer games, larger hands, and additional scoring opportunities.</p>

						<p>Rounds typically last longer than Double-Six and Double-Nine games.</p>

						<p>Specific setup and scoring rules will be added when this variation is implemented.</p>
					</div>
				</div>

				<div class="help-section">
					<button class="help-section-header" type="button">
						More Bones (COMING SOON)
					</button>

					<div class="help-section-content hidden">
						<p><strong>STATUS: COMING SOON</strong></p>

						<p>More Bones uses two complete Double-Six domino sets in a single game.</p>

						<p>Each bone exists twice, creating duplicate copies of every domino.</p>

						<p>Players receive larger starting hands and the boneyard contains more bones.</p>

						<p>This variation is intended primarily for longer rounds, larger branch layouts, and expanded gameplay.</p>

						<p>Duplicate dominoes become a normal part of strategy and chain development.</p>
					</div>
				</div>
			</div>
		`
	);

	modalOverlay
		.querySelector(".modal-window")
		.classList.add("help-modal-window");

	addHelpVersionButton();
	attachHelpAccordionListeners();
}

/* <------------------------------------------------
      HELP WINDOW ACCORDION
   -------------------------------------------------> */
function addHelpVersionButton() {
	const modalHeader = modalOverlay.querySelector(".modal-header");
	const existingVersionButton = modalHeader.querySelector(".help-version-button");

	if (existingVersionButton) {
		return;
	}

	const versionButton = document.createElement("button");
	versionButton.className = "help-version-button";
	versionButton.type = "button";
	versionButton.textContent = `Version ${APP_VERSION}`;
	versionButton.addEventListener("click", showAboutWindow);

	modalHeader.insertBefore(versionButton, closeModalButton);
}

function removeHelpVersionButton() {
	const existingVersionButton = modalOverlay.querySelector(".help-version-button");

	if (existingVersionButton) {
		existingVersionButton.remove();
	}
}

function showAboutWindow() {
	openModal(
		"About",
		`
			<div class="about-window-content">
				<img class="about-window-image" src="image/icon/icon-512.webp" alt="${APP_TITLE} icon">
				<p><strong>${APP_TITLE}</strong></p>
				<p>Version ${APP_VERSION}</p>
				<p>${APP_CREDITS} ~ ${APP_YEAR}</p>
			</div>
		`
	);
}
	 
function attachHelpAccordionListeners() {
	document
		.querySelectorAll(".help-section-header")
		.forEach(button => {
			button.addEventListener("click", () => {
				const content =
					button.nextElementSibling;

				content.classList.toggle("hidden");
			});
		});
}

/* <------------------------------------------------
      EVENT LISTENERS
   -------------------------------------------------> */
function attachOptionsModalEventListeners() {
	document.getElementById("startGameButton").addEventListener("click", startNewGame);
	document.getElementById("rewardsButton").addEventListener("click", showRewardsWindow);
	document.getElementById("optionsHelpButton").addEventListener("click", showHelpWindow);
	document.getElementById("adminButton").addEventListener("click", showAdminWindow);

	document.getElementById("playerCountSelect").addEventListener("input", event => {
		document.getElementById("playerCountDisplay").textContent = event.target.value;
	});
	
	document.getElementById("playerNameInput").addEventListener("input", event => {
		gameState.playerName = event.target.value.trim() || "Player 1";
		humanPlayerName.textContent = gameState.playerName;
		saveGameState();
	});

	document.getElementById("themeSelect").addEventListener("change", event => {
		gameState.theme = event.target.value;
		applyTheme();
		saveGameState();
	});
}

function attachEventListeners() {
	attachOptionsModalEventListeners();

	drawButton.addEventListener("click", drawDomino);
	passButton.addEventListener("click", passTurn);
	optionsButton.addEventListener("click", showOptionsWindow);
	closeModalButton.addEventListener("click", closeModal);

	boardTrack.addEventListener("dragover", event => {
		event.preventDefault();
		boardTrack.parentElement.classList.add("drag-over");
	});

	boardTrack.addEventListener("dragleave", () => {
		boardTrack.parentElement.classList.remove("drag-over");
	});

	boardTrack.addEventListener("drop", event => {
		event.preventDefault();
		boardTrack.parentElement.classList.remove("drag-over");

		if (draggedDominoId && selectedBoardEnd) {
			placeDominoOnBoard(draggedDominoId, selectedBoardEnd);
		}

		draggedDominoId = null;
		selectedBoardEnd = null;
		clearBoardEndHighlights();
	});

	modalOverlay.addEventListener("click", event => {
		if (event.target === modalOverlay) {
			closeModal();
		}
	});
}

/* <------------------------------------------------
      REFRESH BROWSER AT ROUND/GAME END SCREEN FALLBACK
   -------------------------------------------------> */
function restoreEndWindowIfNeeded() {
	if (!gameState.roundOver || gameState.players.length === 0) {
		return;
	}

	const winningPlayer = gameState.players.find(player => player.score >= gameState.winningScore);

	if (winningPlayer) {
		showGameOverWindow(winningPlayer);
		return;
	}

	showRoundOverWindow();
}

/* <------------------------------------------------
      SERVICE WORKER REGISTRATION
   -------------------------------------------------> */
function registerServiceWorker() {
	if (!("serviceWorker" in navigator)) {
		return;
	}

	window.addEventListener("load", () => {
		navigator.serviceWorker.register("./service-worker.js");
	});
}

/* <------------------------------------------------
      APP INITIALIZATION
   -------------------------------------------------> */
async function initializeApp() {
	optionsModalContent = modalBody.innerHTML;
	renderAppInfo();
	registerServiceWorker();

	try {
		await openDatabase();

		const savedGameState = await loadGameState();

		if (savedGameState) {
			gameState = savedGameState;
		}

		attachEventListeners();
		renderAll();
		restoreEndWindowIfNeeded();
	} catch (error) {
		attachEventListeners();
		renderAll();
		openModal("Database Error", `<p>The game could not access IndexedDB. Save and restore may not work until this is fixed.</p><p>${error.message}</p>`);
	}
}

initializeApp();
