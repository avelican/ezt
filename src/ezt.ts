'use strict';

import Anim from "./Anim";
import Globals from "./Globals";

// function toggleHelp() {
// 	var help = document.getElementById('help') as HTMLDivElement;
// 	var toggle = document.getElementById("helpToggle") as HTMLSpanElement;
// 	if (help.style.display == "none") {
// 		help.style.display = "";
// 		toggle.innerHTML = "[hide help]";

// 	} else {
// 		help.style.display = "none";
// 		toggle.innerHTML = "[show help]";

// 	}
// }

class Canvas {
	static X = -1;
	static Y = -1;
	static lastX = -1;
	static lastY = -1;
}

class Input {

	// mouseX: 0,
	// mouseY: 0,

	static pressedLeft = false;
	static pressedRight = false;

	static mouseDown(e: MouseEvent) {
		if (e.button === 0) {	Input.pressedLeft = true; }
		if (e.button === 2) { Input.pressedRight = true; }
		startDraw(e);
	}

	static mouseUp(ev: MouseEvent) {
		Anim.writeCanvasToFrame();
		if (ev.button === 0) {
			Input.pressedLeft = false;
		} else if (ev.button === 2) {
			Input.pressedRight = false;
		}
	}

	static mouseMove(e: MouseEvent) {
		if(!Input.pressedLeft && !Input.pressedRight) return;
		continueDraw(e);
	}

	static handleKeyboard(event: KeyboardEvent) {
		console.log(event.code);
		switch (event.code) {
			// todo -- figure out what flash does when you press F5 lol
			case 'F5': event.preventDefault(); break;
			case 'F6': event.preventDefault(); Anim.dupeFrame(); break;
			case 'Comma': case 'ArrowLeft': Anim.prevFrame(); break;
			case 'Period': case 'ArrowRight': Anim.nextFrame(); break;
			case 'Delete': Anim.deleteFrame(); break;
			case 'KeyI': case 'Insert': Anim.insertFrame(); break;
			case 'KeyC': Anim.copyFrame(); break;
			case 'KeyV': Anim.pasteFrame(); break;
			case 'Equal': case 'ArrowUp': case 'NumpadAdd': zoomIn(); break;
			case 'Minus': case 'ArrowDown': case 'NumpadSubtract': zoomOut(); break;
			case 'Space': Anim.playStop(); break;

		}
	}

	static zoomEvent(e: WheelEvent) {
		if (!e.shiftKey) return;
		e.preventDefault(); // stop scrolling and zooming
		console.log(e);
		if (e.deltaY < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	}
}

function clearCanvas() {
	// Globals.CONTEXT.clearRect(0, 0, Globals.$CANVAS.width, Globals.$CANVAS.height);
	Globals.CONTEXT.fillStyle = 'rgba(255,255,255,1)';
	Globals.CONTEXT.fillRect(0, 0, Globals.$CANVAS.width, Globals.$CANVAS.height);
	Anim.writeCanvasToFrame();
	// cx.clearRect(0, 0, width * zoom, height * zoom);

}

function screenToImageX(mouseX: number){
	// todo if this is too slow, set a variable and update it when "scroll" event fires
	return Math.floor((mouseX - Globals.$CANVAS.getBoundingClientRect().left)/Globals.Zoom);
}

function screenToImageY(mouseY: number){
	// todo if this is too slow, set a variable and update it when "scroll" event fires
	return Math.floor((mouseY - Globals.$CANVAS.getBoundingClientRect().top)/Globals.Zoom);
}

// TODO I am a bit confused about canvas coords vs screen-canvas coords (zoomed)
function startDraw(e: MouseEvent) {

	// const rect = Globals.$CANVAS.getBoundingClientRect();
	Canvas.X = screenToImageX(e.clientX);
	Canvas.Y = screenToImageY(e.clientY);
	// console.log(Canvas.X, Canvas.Y);
	console.log('startDraw');

	if (Input.pressedLeft){
		setPixel(true);
	} else if (Input.pressedRight){
		setPixel(false);
	}

	Canvas.lastX = Canvas.X;
	Canvas.lastY = Canvas.Y;
}

function continueDraw(e: MouseEvent) {
	// console.log('continueDraw');
	// console.log(Input.pressedLeft);
	// console.log(Input.pressedRight);

	Canvas.X = screenToImageX(e.clientX);
	Canvas.Y = screenToImageY(e.clientY);


	if (Input.pressedLeft) {
		// setPixel(true);
		line(true, Canvas.lastX, Canvas.lastY, Canvas.X, Canvas.Y);
	} else if (Input.pressedRight) {
		// setPixel(false);
		line(false, Canvas.lastX, Canvas.lastY, Canvas.X, Canvas.Y);
	}

	Canvas.lastX = Canvas.X;
	Canvas.lastY = Canvas.Y;

}

function setPixel(isBlack: boolean) {
	// console.log('setpixel', isBlack);
	Globals.CONTEXT.fillStyle = (isBlack) ? 'black' : 'white';
	Globals.CONTEXT.fillRect(Canvas.X, Canvas.Y, 1, 1);
}

function zoomIn() {
	if (Globals.Zoom < 128) { Globals.Zoom = Globals.Zoom * 2; }
	updateZoom();
}

function zoomOut() {
	if (Globals.Zoom > 1) { Globals.Zoom = Globals.Zoom / 2; }
	updateZoom();
}

function updateZoom() {
	// cv.width = width * zoom; cv.height = height * zoom
	Globals.$CANVAS.style.width = String(Globals.$CANVAS.width * Globals.Zoom);
	Globals.$CANVAS.style.height = String(Globals.$CANVAS.height * Globals.Zoom);

	Globals.$UI.style.width = String(Globals.$UI.width * Globals.Zoom);
	Globals.$UI.style.height = String(Globals.$UI.height * Globals.Zoom);

	Globals.DOM.zoomlevel.innerHTML = String(Globals.Zoom);

	Anim.drawCurrentFrame();
}

// might be handy later:

// function UNUSED_savePNG() {
// 	Anim.drawCurrentFrame();
// 	var link = document.getElementById('link') as HTMLLinkElement; // todo better way to download file?
// 	link.setAttribute('download', 'MintyPaper.png');
// 	link.setAttribute('href', Globals.$CANVAS.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
// 	link.click();

// 	/*
// 		// here is the most important part because if you dont replace you will get a DOM 18 exception.
// 		var image = cv.toDataURL("image/png").replace("image/png", "image/octet-stream");
// 		console.log(image);
// 		window.location.href = image;
// 	*/
// }

function line(isBlack: boolean, x1: number, y1: number, x2: number, y2: number) {
	// console.log('line', x1, y1, x2, y2);
	let xf, yf;
	Canvas.X = xf = x1;
	Canvas.Y = yf = y1;
	setPixel(isBlack);
	// always draw 1st pixel

	const dx = x2 - x1;
	const dy = y2 - y1;

	const max = Math.max(Math.abs(dx), Math.abs(dy));

	const xStep = dx / max;
	const yStep = dy / max;

	for (let i = 0; i < max; i++) {
		// Frames[ptr][];
		// x = Math.floor(x1 + dx * i / max);
		// y = Math.floor(y1 + dy * i / max);

		xf += xStep;
		yf += yStep;
		Canvas.X = Math.floor(xf);
		Canvas.Y = Math.floor(yf);
		// console.log('filling in ' + x + ',' + y);
		setPixel(isBlack);
	}
}

///////////
Globals.$UI.addEventListener('Globals.CONTEXTmenu', (e) => e.preventDefault(), false);
Globals.$UI.addEventListener('mousedown', Input.mouseDown, false);
window.addEventListener('mouseup', Input.mouseUp, false);
window.addEventListener('mousemove', Input.mouseMove, false);

// fun fact: There is also a "scroll" event but that requires the window to actually scroll
Globals.$UI.addEventListener('wheel', Input.zoomEvent, false);
document.addEventListener('wheel', Input.zoomEvent, false);

window.addEventListener('keydown', Input.handleKeyboard, true);

Anim.newAnimation();
updateZoom();
Anim.setFramerate(12);
