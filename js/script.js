const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
let score = 0;
let nextId = 1;
const objects = [];
let draggedObject = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

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
			ctx.fillStyle = object.color;
			ctx.fillRect(object.x, object.y, object.width, object.height);
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

function renderScene() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	objects.forEach(renderObject);
}

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
		score += 1;
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
	draggedObject.x = x - dragOffsetX;
	draggedObject.y = y - dragOffsetY;
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
}

canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);
