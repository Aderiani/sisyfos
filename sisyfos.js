
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


const mountain = {
    x: 100,
    y: 500,
    width: 600,
    height: 400,
    points: []
};

function resizeCanvas() {
    const deviceWidth = window.innerWidth;
    const deviceHeight = window.innerHeight;
    const deviceAspectRatio = deviceHeight /deviceWidth;

    // Define your base aspect ratio (e.g., 4:3)
    const baseMobileAspectRatio = 3 / 2;
    const baselaptopAspectRation = 3 / 4;
    const MobileAspectRatio = 15 / 9;
    const laptopAspectRatio = 11 / 16;


    if (deviceAspectRatio < laptopAspectRatio) {
        // Device is wider than the base aspect ratio
        canvas.height = deviceHeight * 0.8;  // Use 80% of device height
        canvas.width = canvas.height / baselaptopAspectRation; // Adjust width to match aspect ratio
    } else if (deviceAspectRatio > MobileAspectRatio) {
        // Device is taller than the base aspect ratio
        canvas.height = deviceHeight * 0.8;  // Use 80% of device height
        canvas.width = canvas.height / baseMobileAspectRatio; // Adjust width to match aspect ratio
    } else {
        // Device is taller or matches the base aspect ratio
        canvas.height = deviceHeight * 0.8;  // Use 80% of device height
        canvas.width = canvas.height; // Adjust width to match aspect ratio
    }


    // Adjust the mountain dimensions based on the new canvas size
    mountain.width = canvas.width - (0.3 * canvas.width);
    mountain.height = canvas.height - (0.2 * canvas.height );

    // Regenerate mountain points based on the new dimensions
    mountain.points = [];  // Clear previous points
    generateMountainPoints();
    
    // Redraw the entire scene after resizing
    // Optionally, you can also reposition and resize other elements
}

// Call resizeCanvas when the window is resized
window.addEventListener('resize', resizeCanvas);

// Initial canvas setup
resizeCanvas();


function generateMountainPoints() {
    const numPoints = 20;  // Number of points per side (left and right)
    const peakX = mountain.x + mountain.width / 2; // X coordinate of the peak
    const peakY = mountain.y - mountain.height;    // Y coordinate of the peak

    // Generate points for the left side
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints; // Normalized position along the slope (0 to 1)
        const x = mountain.x + t * (peakX - mountain.x);
        const y = mountain.y - t * mountain.height;

        // Add some randomness for curvatures
        const randomness = Math.random() * (mountain.height / 10) - mountain.height / 50;
        mountain.points.push({ x, y: y + randomness });
    }

    // Generate points for the right side
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints; // Normalized position along the slope (0 to 1)
        const x = peakX + t * (mountain.x + mountain.width - peakX);
        const y = peakY + t * mountain.height;

        // Add some randomness for curvatures
        const randomness = Math.random() * (mountain.height / 20) - mountain.height / 40;
        mountain.points.push({ x, y: y + randomness });
    }
}

function drawMountain() {
    if (mountain.points.length === 0) {
        generateMountainPoints();
    }

    ctx.beginPath();
    ctx.moveTo(mountain.points[0].x, mountain.points[0].y);

    for (let i = 1; i < mountain.points.length; i++) {
        ctx.lineTo(mountain.points[i].x, mountain.points[i].y);
    }

    ctx.lineTo(mountain.x + mountain.width, canvas.height);
    ctx.lineTo(mountain.x, canvas.height);
    ctx.closePath();
    ctx.fillStyle = '#8B4513'; // Brown color for mountain
    ctx.fill();
}

const character = {
    x: mountain.x,
    y: mountain.y,
    width: 10,
    height: 30, // Height of the man
    speed: 2,
    isPushingUp: false,
    isMovingLeft: false,
    isMovingRight: false
};

const stone = {
    radius: 20,
    rotation: 0,
    points: [],
    isRollingDown: false
};

stone.x = character.x + stone.radius * 2 + character.width / 2; // Place the stone next to the character
stone.y = getMountainY(stone.x) - 4 * stone.radius;  // Place the stone on the mountain's surface

// Generate random points for the stone
function generateRandomPoints(radius) {
    const points = [];
    const numPoints = 8 + Math.floor(Math.random() * 5); // Random number of points (8-12)

    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI; // Evenly spaced angles
        const radiusVariation = radius * 0.3 * Math.random(); // Random variation in radius
        const pointRadius = radius + radiusVariation;
        const x = pointRadius * Math.cos(angle);
        const y = pointRadius * Math.sin(angle);
        points.push({ x, y });
    }

    return points;
}

// Initialize stone points
stone.points = generateRandomPoints(stone.radius);

function drawCharacter() {
    // Draw the body
    ctx.fillStyle = '#FF0000'; // Red color for character
    ctx.fillRect(character.x, character.y - character.height, character.width, character.height);

    // Draw the head
    ctx.beginPath();
    ctx.arc(character.x + character.width / 2, character.y - character.height - 10, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
}

function drawStone() {
    // Draw the rotating semi-circular stone on the mountain
    ctx.save();
    ctx.translate(stone.x, stone.y);
    ctx.rotate(stone.rotation);
    ctx.beginPath();
    const firstPoint = stone.points[0];
    ctx.moveTo(firstPoint.x, firstPoint.y);

    // Create the stone shape using bezier curves
    for (let i = 1; i < stone.points.length; i++) {
        const currentPoint = stone.points[i];
        const nextPoint = stone.points[(i + 1) % stone.points.length];
        const controlX = (currentPoint.x + nextPoint.x) / 2;
        const controlY = (currentPoint.y + nextPoint.y) / 2;
        ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
    }
    ctx.closePath();

    // Fill and stroke the shape
    ctx.fillStyle = 'gray';
    ctx.fill();
    ctx.strokeStyle = 'gray';
    ctx.stroke();

    // Restore the canvas state
    ctx.restore();
}

function getMountainY(x) {
    for (let i = 0; i < mountain.points.length - 1; i++) {
        const p1 = mountain.points[i];
        const p2 = mountain.points[i + 1];
        if (x >= p1.x && x <= p2.x) {
            const slope = (p2.y - p1.y) / (p2.x - p1.x);
            return p1.y + slope * (x - p1.x);
        }
    }
    return mountain.y;
}

function updateCharacter() {
    if (character.isPushingUp) {
        character.y -= character.speed;
        character.x += character.speed / 2;
        if (character.y <= mountain.y - mountain.height) {
            character.isPushingUp = false;
        }
    } else {
        character.y += character.speed;
        if (character.x > mountain.x + mountain.width / 2) {
            character.x += character.speed / 2;
        } else {
            character.x -= character.speed / 2;
        }
        if (character.y >= mountain.y) {
            character.y = mountain.y;
        }
    }

    if (character.isMovingLeft) {
        character.x -= character.speed;
    }

    if (character.isMovingRight) {
        character.x += character.speed;
    }

    // Ensure the character does not pass the mountain lines
    if (character.x < mountain.x) {
        character.x = mountain.x;
    }
    if (character.x + character.width > mountain.x + mountain.width) {
        character.x = mountain.x + mountain.width - character.width;
    }

    // Ensure the character stays on the mountain line
    character.y = getMountainY(character.x + character.width / 2);
}

function updateStone() {
    // Stone should only move when character is pushing it
    const mountainSurfaceY = getMountainY(stone.x) - stone.radius;
    if (stone.y < mountainSurfaceY) {
        stone.y = mountainSurfaceY;
    }

    if (!stone.isRollingDown && character.isPushingUp && stone.x - character.x < stone.radius + character.width  && stone.x > character.x ) {
        // const newY = stone.y - character.speed;
        stone.rotation += 0.1;
        stone.x = character.x + stone.radius + character.width ;
        stone.y = getMountainY(stone.x) - stone.radius; // Place the stone on the mountain's surface
        if (stone.x > mountain.x + mountain.width / 2) {
            stone.isRollingDown = true; // Start rolling down when reaching the peak
        }
    }

    // If the stone starts rolling down automatically
    if (stone.isRollingDown) {
        stone.x += character.speed;
        stone.rotation += 0.1;
        // Prevent the stone from going inside the mountain
        if (stone.y < mountainSurfaceY) {
            stone.y = mountainSurfaceY;
        } {
            stone.y += character.speed; // Stone rolls down
        }

        if (stone.x >= mountain.x + mountain.width) {
            // Reset the stone to the starting position
            stone.isRollingDown = false; // Stop rolling
            stone.x = mountain.x + stone.radius *2; // Place the stone next to the character
            stone.y = getMountainY(stone.x) - stone.radius; // Ensure it rests on the mountain surface
        }
    }

    // Rotate the stone

}

function handleKeyDown(event) {
    switch (event.key) {
        case 'ArrowUp':
            character.isPushingUp = true;
            break;
        case 'ArrowLeft':
            character.isMovingLeft = true;
            break;
        case 'ArrowRight':
            character.isMovingRight = true;
            if (character.x <= mountain.x + mountain.width / 2) {
                character.isPushingUp = true;
            }
            break;
    }
}

function handleKeyUp(event) {
    switch (event.key) {
        case 'ArrowUp':
            character.isPushingUp = false;
            break;
        case 'ArrowLeft':
            character.isMovingLeft = false;
            break;
        case 'ArrowRight':
            character.isMovingRight = false;
            character.isPushingUp = false;
            break;
    }
}



function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMountain();
    updateCharacter();
    drawCharacter();
    drawStone();
    updateStone();

    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

// On-Screen Controls for Mobile
const upButton = document.getElementById('upButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

upButton.addEventListener('touchstart', () => handleKeyDown({ key: 'ArrowUp' }));
leftButton.addEventListener('touchstart', () => handleKeyDown({ key: 'ArrowLeft' }));
rightButton.addEventListener('touchstart', () => handleKeyDown({ key: 'ArrowRight' }));

upButton.addEventListener('touchend', () => handleKeyUp({ key: 'ArrowUp' }));
leftButton.addEventListener('touchend', () => handleKeyUp({ key: 'ArrowLeft' }));
rightButton.addEventListener('touchend', () => handleKeyUp({ key: 'ArrowRight' }));

gameLoop();
