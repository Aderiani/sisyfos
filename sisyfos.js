const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreDisplay = document.getElementById('scoreDisplay');
const statusDisplay = document.getElementById('statusDisplay');

const mountain = {
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    points: []
};

const character = {
    x: 0,
    y: 0,
    width: 12,
    height: 30,
    speed: 3,
    stepPhase: 0,
    isPushingUp: false,
    isMovingLeft: false,
    isMovingRight: false
};

const stone = {
    radius: 20,
    x: 0,
    y: 0,
    rotation: 0,
    points: [],
    isRollingDown: false
};

const gameState = {
    score: 0,
    reachedPeak: false
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function generateMountainPoints() {
    mountain.points = [];
    const numPoints = 20;
    const peakX = mountain.x + mountain.width / 2;
    const peakY = mountain.y - mountain.height;

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = mountain.x + t * (peakX - mountain.x);
        const y = mountain.y - t * mountain.height;
        const randomness = Math.random() * (mountain.height / 10) - mountain.height / 50;
        mountain.points.push({ x, y: y + randomness });
    }

    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const x = peakX + t * (mountain.x + mountain.width - peakX);
        const y = peakY + t * mountain.height;
        const randomness = Math.random() * (mountain.height / 20) - mountain.height / 40;
        mountain.points.push({ x, y: y + randomness });
    }
}

function getMountainY(x) {
    const clampedX = clamp(x, mountain.x, mountain.x + mountain.width);

    for (let i = 0; i < mountain.points.length - 1; i++) {
        const p1 = mountain.points[i];
        const p2 = mountain.points[i + 1];
        if (clampedX >= p1.x && clampedX <= p2.x) {
            const slope = (p2.y - p1.y) / (p2.x - p1.x);
            return p1.y + slope * (clampedX - p1.x);
        }
    }

    return mountain.y;
}

function generateRandomPoints(radius) {
    const points = [];
    const numPoints = 8 + Math.floor(Math.random() * 5);

    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const radiusVariation = radius * 0.3 * Math.random();
        const pointRadius = radius + radiusVariation;
        points.push({
            x: pointRadius * Math.cos(angle),
            y: pointRadius * Math.sin(angle)
        });
    }

    return points;
}

function updateHud() {
    scoreDisplay.textContent = `Score: ${gameState.score}`;
    if (stone.isRollingDown) {
        statusDisplay.textContent = 'The stone is rolling down...';
    } else if (gameState.reachedPeak) {
        statusDisplay.textContent = 'You reached the peak. Start again.';
    } else {
        statusDisplay.textContent = 'Push the stone uphill';
    }
}

function resetRound() {
    character.x = mountain.x + mountain.width * 0.08;
    character.y = getMountainY(character.x + character.width / 2);
    character.stepPhase = 0;

    stone.x = character.x + stone.radius + character.width;
    stone.y = getMountainY(stone.x) - stone.radius;
    stone.rotation = 0;
    stone.isRollingDown = false;
    gameState.reachedPeak = false;

    updateHud();
}

function resizeCanvas() {
    const oldWidth = canvas.width || 1;
    const oldCharacterRatio = character.x / oldWidth;
    const oldStoneRatio = stone.x / oldWidth;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetHeight = Math.floor(viewportHeight * 0.8);

    let targetWidth;
    const deviceAspectRatio = viewportHeight / viewportWidth;
    const mobileAspectRatio = 15 / 9;
    const laptopAspectRatio = 11 / 16;

    if (deviceAspectRatio < laptopAspectRatio) {
        targetWidth = Math.floor(targetHeight / (3 / 4));
    } else if (deviceAspectRatio > mobileAspectRatio) {
        targetWidth = Math.floor(targetHeight / (3 / 2));
    } else {
        targetWidth = targetHeight;
    }

    targetWidth = Math.min(targetWidth, Math.floor(viewportWidth * 0.96));

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    mountain.x = 0;
    mountain.y = canvas.height;
    mountain.width = canvas.width;
    mountain.height = canvas.height * 0.75;
    generateMountainPoints();

    if (stone.points.length === 0) {
        stone.points = generateRandomPoints(stone.radius);
        resetRound();
        return;
    }

    character.x = clamp(oldCharacterRatio * canvas.width, mountain.x, mountain.x + mountain.width - character.width);
    character.y = getMountainY(character.x + character.width / 2);

    stone.x = clamp(oldStoneRatio * canvas.width, mountain.x + stone.radius, mountain.x + mountain.width - stone.radius);
    stone.y = getMountainY(stone.x) - stone.radius;
}

function drawMountain() {
    ctx.beginPath();
    ctx.moveTo(mountain.points[0].x, mountain.points[0].y);

    for (let i = 1; i < mountain.points.length; i++) {
        ctx.lineTo(mountain.points[i].x, mountain.points[i].y);
    }

    ctx.lineTo(mountain.x + mountain.width, canvas.height);
    ctx.lineTo(mountain.x, canvas.height);
    ctx.closePath();
    ctx.fillStyle = '#8b4513';
    ctx.fill();
}

function drawCharacter() {
    const centerX = character.x + character.width / 2;
    const footY = character.y;
    const hipY = footY - 16;
    const shoulderY = hipY - 16;
    const lean = character.isPushingUp ? 5 : 2;
    const torsoTopX = centerX + lean;
    const isActive = character.isPushingUp || character.isMovingLeft || character.isMovingRight;
    const swing = Math.sin(character.stepPhase) * (character.isPushingUp ? 4 : 3);
    const armSwing = isActive ? swing : 0;
    const leftFootX = centerX - 3 + armSwing * 0.55;
    const rightFootX = centerX + 3 - armSwing * 0.55;
    const leftHandX = centerX + 8 - armSwing;
    const rightHandX = centerX + 12 + armSwing;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Legs
    ctx.strokeStyle = '#2f3c4d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftFootX, footY);
    ctx.lineTo(centerX - 2, hipY);
    ctx.moveTo(rightFootX, footY);
    ctx.lineTo(centerX + 2, hipY);
    ctx.stroke();

    // Torso (tunic)
    ctx.fillStyle = '#9b2c2c';
    ctx.beginPath();
    ctx.moveTo(centerX - 6, hipY);
    ctx.lineTo(torsoTopX - 7, shoulderY);
    ctx.lineTo(torsoTopX + 6, shoulderY);
    ctx.lineTo(centerX + 6, hipY);
    ctx.closePath();
    ctx.fill();

    // Arms
    ctx.strokeStyle = '#f1c27d';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(torsoTopX - 5, shoulderY + 2);
    ctx.lineTo(leftHandX, shoulderY + 6);
    ctx.moveTo(torsoTopX + 5, shoulderY + 2);
    ctx.lineTo(rightHandX, shoulderY + 10);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#f1c27d';
    ctx.beginPath();
    ctx.arc(torsoTopX, shoulderY - 9, 6.8, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.arc(torsoTopX - 1, shoulderY - 11, 4.3, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawStone() {
    ctx.save();
    ctx.translate(stone.x, stone.y);
    ctx.rotate(stone.rotation);

    ctx.beginPath();
    const firstPoint = stone.points[0];
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < stone.points.length; i++) {
        const current = stone.points[i];
        const next = stone.points[(i + 1) % stone.points.length];
        const controlX = (current.x + next.x) / 2;
        const controlY = (current.y + next.y) / 2;
        ctx.quadraticCurveTo(current.x, current.y, controlX, controlY);
    }

    ctx.closePath();
    ctx.fillStyle = 'gray';
    ctx.fill();
    ctx.strokeStyle = 'gray';
    ctx.stroke();

    ctx.restore();
}

function updateCharacter() {
    const centerX = mountain.x + mountain.width / 2;
    const isActive = character.isPushingUp || character.isMovingLeft || character.isMovingRight;

    if (isActive) {
        character.stepPhase += 0.24;
    }

    if (character.isPushingUp) {
        character.x += character.speed * 0.5;
    } else {
        character.x += character.x > centerX ? character.speed * 0.5 : -character.speed * 0.5;
    }

    if (character.isMovingLeft) {
        character.x -= character.speed;
    }

    if (character.isMovingRight) {
        character.x += character.speed;
    }

    character.x = clamp(character.x, mountain.x, mountain.x + mountain.width - character.width);
    character.y = getMountainY(character.x + character.width / 2);
}

function updateStone() {
    const canPushStone = !stone.isRollingDown && character.isPushingUp;
    const touchDistance = stone.radius + character.width;
    const isTouchingStone = stone.x > character.x && stone.x - character.x < touchDistance;

    if (canPushStone && isTouchingStone) {
        stone.rotation += 0.1;
        stone.x = character.x + stone.radius + character.width;
        stone.x = clamp(stone.x, mountain.x + stone.radius, mountain.x + mountain.width - stone.radius);
        stone.y = getMountainY(stone.x) - stone.radius;

        if (stone.x >= mountain.x + mountain.width / 2) {
            stone.isRollingDown = true;
            gameState.reachedPeak = true;
            updateHud();
        }
    }

    if (stone.isRollingDown) {
        stone.x += character.speed;
        stone.x = clamp(stone.x, mountain.x + stone.radius, mountain.x + mountain.width - stone.radius);
        stone.y = getMountainY(stone.x) - stone.radius;
        stone.rotation += 0.1;

        if (stone.x >= mountain.x + mountain.width - stone.radius) {
            gameState.score += 1;
            resetRound();
        }
    }
}

function handleKeyDown(event) {
    if (event.key === 'ArrowUp') {
        character.isPushingUp = true;
    }
    if (event.key === 'ArrowLeft') {
        character.isMovingLeft = true;
    }
    if (event.key === 'ArrowRight') {
        character.isMovingRight = true;
        if (character.x <= mountain.x + mountain.width / 2) {
            character.isPushingUp = true;
        }
    }
}

function handleKeyUp(event) {
    if (event.key === 'ArrowUp') {
        character.isPushingUp = false;
    }
    if (event.key === 'ArrowLeft') {
        character.isMovingLeft = false;
    }
    if (event.key === 'ArrowRight') {
        character.isMovingRight = false;
        character.isPushingUp = false;
    }
}

function bindPressControl(button, key) {
    const start = (event) => {
        event.preventDefault();
        handleKeyDown({ key });
    };
    const end = (event) => {
        event.preventDefault();
        handleKeyUp({ key });
    };

    button.addEventListener('touchstart', start, { passive: false });
    button.addEventListener('touchend', end, { passive: false });
    button.addEventListener('touchcancel', end, { passive: false });

    button.addEventListener('mousedown', start);
    button.addEventListener('mouseup', end);
    button.addEventListener('mouseleave', end);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMountain();
    updateCharacter();
    updateStone();
    drawCharacter();
    drawStone();

    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('resize', resizeCanvas);

const upButton = document.getElementById('upButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const restartButton = document.getElementById('restartButton');

bindPressControl(upButton, 'ArrowUp');
bindPressControl(leftButton, 'ArrowLeft');
bindPressControl(rightButton, 'ArrowRight');
restartButton.addEventListener('click', () => resetRound());

stone.points = generateRandomPoints(stone.radius);
resizeCanvas();
updateHud();
gameLoop();
