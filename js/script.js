const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
let score = 0;
let nextId = 1;
const objects = [];
let draggedObject = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let player = new Image();
player.src = 'assets/player-sprite.png';


canvas.style.touchAction = 'none';

function drawPolygon(centerX, centerY, sides, radius, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	for (let i = 0; i < sides; i += 1) {
		const angle = (i * Math.PI * 2) / sides - Math.PI / 2;
		const px = centerX + radius * Math.cos(angle);
		const py = centerY + radius * Math.sin(angle);
		if (i === 0) {
			ctx.moveTo(px, py);
		} else {
			ctx.lineTo(px, py);
		}
	}
	ctx.closePath();
	ctx.fill();
}

function drawStar(centerX, centerY, spikes, outerRadius, innerRadius, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	let angle = -Math.PI / 2;
	const step = Math.PI / spikes;

	for (let i = 0; i < spikes * 2; i += 1) {
		const radius = i % 2 === 0 ? outerRadius : innerRadius;
		const px = centerX + Math.cos(angle) * radius;
		const py = centerY + Math.sin(angle) * radius;
		if (i === 0) {
			ctx.moveTo(px, py);
		} else {
			ctx.lineTo(px, py);
		}
		angle += step;
	}

	ctx.closePath();
	ctx.fill();
}

function drawCircle(centerX, centerY, radius, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
	ctx.fill();
}

function renderObject(object) {
	const centerX = object.x + object.width / 2;
	const centerY = object.y + object.height / 2;

	switch (object.type) {
		case 'Player':
            object.width = 64;
            object.height = 64;
			ctx.drawImage(player, 0, 0, 64, 64, object.x, object.y, object.width, object.height);
			break;
		case 'Enemy':
			drawPolygon(centerX, centerY, 6, Math.min(object.width, object.height) / 2, object.color);
			break;
		case 'Coin':
			drawCircle(centerX, centerY, Math.min(object.width, object.height) / 2, object.color);
			break;
		case 'Power-up':
			drawStar(
				centerX,
				centerY,
				5,
				Math.min(object.width, object.height) / 2,
				Math.min(object.width, object.height) / 4.5,
				object.color,
			);
			break;
		case 'Obstacle':
			ctx.fillStyle = object.color;
			ctx.fillRect(object.x, object.y, object.width, object.height);
			break;
	}
}

// Function to render the entire scene
function renderScene() {
    scoreElement.textContent = String(score);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	objects.forEach(renderObject);
}

// Function to get the object at a specific position
function getObjectAtPosition(x, y) {
	for (let i = objects.length - 1; i >= 0; i -= 1) {
		const object = objects[i];
		if (
			x >= object.x &&
			x <= object.x + object.width &&
			y >= object.y &&
			y <= object.y + object.height
		) {
			return object;
		}
	}

	return null;
}

// Function to check for collisions between the player and other objects
function checkCollisions() {
    const player = objects.find((obj) => obj.type === 'Player');
    if (!player) {
        return;
    }
    objects.forEach((object) => {
        if (object.id === player.id) {
            return;
        }
        if (
            player.x < object.x + object.width &&
            player.x + player.width > object.x &&
            player.y < object.y + object.height &&
            player.y + player.height > object.y
        ) {
            if (object.type === 'Coin') {
                score += 10;
                scoreElement.textContent = String(score);
                objects.splice(objects.indexOf(object), 1);
            } else if (object.type === 'Power-up') {
                // For power-up we can just increase the score for now
                score += 20;
                scoreElement.textContent = String(score);
                objects.splice(objects.indexOf(object), 1);
            } else if (object.type === 'Obstacle') {
                // if obstacle he cant move just can't move in the direction of the obstacle
                player.x -= 10; // Move player back
                scoreElement.textContent = String(score);
            } else if (object.type === 'Enemy') {
                alert('Game Over! Final Score: ' + score);
                objects.length = 0;
                score = 0;
                scoreElement.textContent = String(score);
            }
        }
    });
}

// Function to add a new object to the scene
function addObject(type, x, y) {
	let width = 30;
	let height = 30;
	let color = '#000000';

	switch (type) {
		case 'Player':
			color = '#4CAF50';
			break;
		case 'Enemy':
			width = 40;
			height = 40;
			color = '#f44336';
			break;
		case 'Coin':
			color = '#ffeb3b';
			break;
		case 'Power-up':
			width = 40;
			height = 40;
			color = '#2196F3';
			break;
		case 'Obstacle':
			width = 90;
			height = 50;
			color = '#9e9e9e';
			break;
		default:
			return null;
	}

	const object = {
		id: nextId,
		type,
		x: x - width / 2,
		y: y - height / 2,
		width,
		height,
		color,
	};

	nextId += 1;
	objects.push(object);
	return object;
}

// Function to move the player using keyboard controls
function movePlayer(dx, dy) {
    const player = objects.find((obj) => obj.type === 'Player');
    if (!player) {
        return;
    }

    // Test the new position obstacles
    const newX = player.x + dx;
    const newY = player.y + dy;

    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        if (object.type === 'Obstacle' && object.id !== player.id) {
            if (
                newX < object.x + object.width &&
                newX + player.width > object.x &&
                newY < object.y + object.height &&
                newY + player.height > object.y
            ) {
                // Collision detected, don't move
                return;
            }
        }
    }

    player.x = newX;
    player.y = newY;
}

// Adding keyboard controls for player movement
document.addEventListener('keydown', (e) => {
	const step = 10;
	switch (e.key) {
		case 'ArrowUp':
			movePlayer(0, -step);
			break;
		case 'ArrowDown':
			movePlayer(0, step);
			break;
		case 'ArrowLeft':
			movePlayer(-step, 0);
			break;
		case 'ArrowRight':
			movePlayer(step, 0);
			break;
	}
	checkCollisions();
	renderScene();
});



const tools = document.querySelectorAll('.tools');
tools.forEach((tool) => {
	tool.addEventListener('dragstart', (e) => {
		e.dataTransfer.setData('text/plain', tool.id);
	});
});

canvas.addEventListener('dragover', (e) => {
	e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
	e.preventDefault();
	const toolId = e.dataTransfer.getData('text/plain');
	const x = e.offsetX;
	const y = e.offsetY;

	const object = addObject(toolId, x, y);
	if (object && object.type === 'Coin') {
		scoreElement.textContent = String(score);
	}

	renderScene();
});

canvas.addEventListener('pointerdown', (e) => {
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	draggedObject = getObjectAtPosition(x, y);

	if (!draggedObject) {
		return;
	}

	dragOffsetX = x - draggedObject.x;
	dragOffsetY = y - draggedObject.y;
	canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
	if (!draggedObject) {
		return;
	}

	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const y = e.clientY - rect.top;
	const newX = x - dragOffsetX;
	const newY = y - dragOffsetY;

	// If dragging the player check for obstacle collision
	if (draggedObject.type === 'Player') {
		let canMove = true;
		for (let i = 0; i < objects.length; i++) {
			const object = objects[i];
			if (object.type === 'Obstacle' && object.id !== draggedObject.id) {
				if (
					newX < object.x + object.width &&
					newX + draggedObject.width > object.x &&
					newY < object.y + object.height &&
					newY + draggedObject.height > object.y
				) {
					canMove = false;
					break;
				}
			}
		}
		if (!canMove) {
			return;
		}
	}

	draggedObject.x = newX;
	draggedObject.y = newY;
	checkCollisions();
	renderScene();
});

function stopDragging(e) {
	if (!draggedObject) {
		return;
	}

	draggedObject = null;
	if (canvas.hasPointerCapture(e.pointerId)) {
		canvas.releasePointerCapture(e.pointerId);
	}
	checkCollisions();
	renderScene();
}

canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);
