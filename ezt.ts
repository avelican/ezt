'use strict';

// TODO where to store this?
// tslint:disable-next-line:variable-name
let GLOBAL_zoom = 4; // screen pixels per image pixel

const $CANVAS = document.getElementById('cv') as HTMLCanvasElement;
$CANVAS.width = 128;
$CANVAS.height = $CANVAS.width;
const CONTEXT = $CANVAS.getContext('2d') as CanvasRenderingContext2D;

const $UI = document.getElementById('ui') as HTMLCanvasElement;
$UI.width = $UI.height = $CANVAS.width;
const UI_CONTEXT = $UI.getContext('2d') as CanvasRenderingContext2D;

let DOM : any = {};
DOM.gifOutput = document.getElementById('gifOutput') as HTMLDivElement;
DOM.coords = document.getElementById('coords') as HTMLSpanElement;

DOM.zoomlevel = document.getElementById('zoomlevel') as HTMLSpanElement;

// var GLOBAL_x = 0;
// var GLOBAL_y = 0;

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

class Anim {

	static playing = false;
	static playTimeout: number;

	static fps: number;
	static frameInterval: number;

	static Frames: ImageData[] = [];

	static clipboard: ImageData;
	static ptr = 0;
	static savedPtr = 0;

	static setFramerate(framerate: number) {
		this.fps = framerate;
		this.frameInterval = 1000 / framerate;
	}

	static userFramerate() {
		const fr = Number(prompt('framerate is currently ' + this.fps + '\nset new rate?'));
		if (!fr) { return; }
		this.setFramerate(fr);
	}

	static showFrameNumber() {
		const frameNum = `${this.ptr + 1}/${this.Frames.length}`;
		(document.getElementById('frameNumber') as HTMLSpanElement).innerHTML = frameNum;
	}

	static async drawCurrentFrame() { // console.log(ptr)
		console.log('drawCurrentFrame' + this.ptr);
		CONTEXT.putImageData(this.Frames[this.ptr], 0, 0);

		// Ghost prev frame
		UI_CONTEXT.clearRect(0,0,$UI.width, $UI.height);
		if(this.ptr > 0){
			UI_CONTEXT.putImageData(this.Frames[this.ptr-1],0,0); // GHOSTING
		}
		// Ghost next frame
		if(this.ptr < this.Frames.length - 1){
			UI_CONTEXT.globalAlpha = 0.3;
			UI_CONTEXT.drawImage( await createImageBitmap( this.Frames[this.ptr+1] ),0,0);
			UI_CONTEXT.globalAlpha = 1;
		}
		this.showFrameNumber();
	}

	static dupeFrame() {
		if (this.ptr === this.Frames.length - 1) {
			this.copyFrame(); this.nextFrame(); this.pasteFrame();
		} else {
			this.copyFrame(); this.nextFrame(); this.insertFrame(); this.pasteFrame();
		}
	}

	static deleteFrame() {
		console.log('delete frame');
		if (this.Frames.length === 1) {
			console.log('deleting first frame');
			this.newAnimation();
			return;
		}
		let isLastFrame = false;

		console.log('ptr:' + this.ptr);
		if (this.ptr === this.Frames.length - 1 && this.ptr > 0) {
			isLastFrame = true;
			console.log('deleting last frame');
		}
		this.Frames.splice(this.ptr, 1);
		if (isLastFrame) { this.ptr--; }
		this.drawCurrentFrame();
	}

	static prevFrame() {
		console.log('previous frame');
		if (this.ptr === 0) { return; }
		this.writeCanvasToFrame();
		this.ptr--;
		this.drawCurrentFrame();
	}

	static nextFrame(){
		console.log('nextFrame');
		this.writeCanvasToFrame();
		this.ptr++;
		if (this.ptr === this.Frames.length) {
			// new frame
			clearCanvas(); this.writeCanvasToFrame();
		}
		this.drawCurrentFrame();
		this.showFrameNumber();
	}

	// static _nextFrame() {
	// 	console.log('nextFrame');
	// 	if (this.ptr == this.Frames.length - 1) { // last frame

	// 		if(this.Frames.length > 0){
	// 			this.writeCanvasToFrame();
	// 			clearCanvas();
	// 			this.ptr++;
	// 		}

	// 		this.writeCanvasToFrame();

	// 	}
	// 	this.ptr++;
	// 	this.drawCurrentFrame();
	// }

	static firstFrame() {
		this.ptr = 0;
		this.drawCurrentFrame();
	}

	static lastFrame() {
		this.ptr = this.Frames.length - 1;
		this.drawCurrentFrame();
	}

	static newAnimation() {
		// console.log("newAnimation()");
		this.ptr = 0;
		this.Frames = [];
		clearCanvas();
		this.writeCanvasToFrame();
		this.drawCurrentFrame();
		this.showFrameNumber();
	}

	static writeCanvasToFrame() {
		// console.log('writeCanvasToFrame() frame ' + this.ptr);
		this.Frames[this.ptr] = CONTEXT.getImageData(0, 0, $CANVAS.width, $CANVAS.height);
	}

	static insertFrame() {
		// console.log(insertFrame);
		const frame = CONTEXT.getImageData(0, 0, $CANVAS.width, $CANVAS.height);
		this.Frames.splice(this.ptr, 0, frame);
		clearCanvas(); this.writeCanvasToFrame();
		this.drawCurrentFrame();
	}

	static copyFrame() {
		// this.clipboard = CONTEXT.createImageData(this.Frames[this.ptr]);
		this.clipboard = CONTEXT.getImageData(0, 0, $CANVAS.width, $CANVAS.height);
	}

	static pasteFrame() {
		if (this.clipboard) {
			this.Frames[this.ptr] = this.clipboard;
		}
		this.drawCurrentFrame();
	}

	static play() {
		if (this.Frames.length === 1) { return; }
		this.savedPtr = this.ptr;
		this.playing = true;
		this.ptr = 0;
		// this.drawCurrentFrame();
		this.playNextFrame();
	}

	static playNextFrame() {
		// console.log('<!--');
		// console.log(`playNextFrame(frame ${this.ptr})`);
		// console.log(this);
		// console.log(this.Frames);
		// console.log('-->');
		if(this.ptr < this.Frames.length - 1) {
			this.ptr++;
			this.drawCurrentFrame();
		} else {
			this.ptr = 0;
			this.drawCurrentFrame();
		}

		if (this.playing) {
			this.playTimeout = window.setTimeout( () => { Anim.playNextFrame(); }, this.frameInterval);
			// requestAnimationFrame(playNextFrame);
		}
	}

	static stop() {
		if(!this.playing) return;
		this.playing = false;
		this.ptr = this.savedPtr;
		window.clearTimeout(this.playTimeout);
		this.drawCurrentFrame();
	}

	static playStop() {
		if (this.playing) {
			this.stop();
		} else {
			this.play();
		}
	}

	static exportGif() {
		// todo I guess the real solution will be to write my own GIF code in TypeScript haha
		// @ts-ignore // TODO better way to fix this? It's complaining it can't find GIF but we import it in the HTML
		const gif : any = new GIF({
			workers: 2,
			quality: 1,
			width: $CANVAS.width,
			height: $CANVAS.height
		});

		this.savedPtr = this.ptr;
		this.ptr = 0;

		while (this.ptr < this.Frames.length) {
			this.drawCurrentFrame();
			gif.addFrame(CONTEXT, { copy: true, delay: this.frameInterval });
			this.ptr++;
		}

		let blob;
		// ptr = savedPtr; drawNormal();

		gif.on('finished', (_blob: Blob) => {
			console.log(_blob);
			blob = _blob;

			const displayGif = (gifDataEncoded: string) : void => {
				DOM.gifOutput.innerHTML = '';
				const img = document.createElement('IMG') as HTMLImageElement;
				img.src = gifDataEncoded;
				DOM.gifOutput.appendChild(img);
			};

			this.blobEncoder(blob, displayGif);

		});

		gif.render();
		return blob;
	}

	// todo we don't have type information for the GIF library we use, hence "any"
	static blobEncoder(blob: Blob, callBack: (x:any)=>void ) {
		console.log(typeof callBack);
		const reader = new FileReader();
		reader.readAsDataURL(blob);
		reader.onloadend = () => {
			const base64data = reader.result;
			// console.log(base64data);
			callBack(base64data);
		};
	}

}

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
	// CONTEXT.clearRect(0, 0, $CANVAS.width, $CANVAS.height);
	CONTEXT.fillStyle = 'rgba(255,255,255,1)';
	CONTEXT.fillRect(0, 0, $CANVAS.width, $CANVAS.height);
	Anim.writeCanvasToFrame();
	// cx.clearRect(0, 0, width * zoom, height * zoom);

}

function screenToImageX(mouseX: number){
	// todo if this is too slow, set a variable and update it when "scroll" event fires
	return Math.floor((mouseX - $CANVAS.getBoundingClientRect().left)/GLOBAL_zoom);
}

function screenToImageY(mouseY: number){
	// todo if this is too slow, set a variable and update it when "scroll" event fires
	return Math.floor((mouseY - $CANVAS.getBoundingClientRect().top)/GLOBAL_zoom);
}

// TODO I am a bit confused about canvas coords vs screen-canvas coords (zoomed)
function startDraw(e: MouseEvent) {

	// const rect = $CANVAS.getBoundingClientRect();
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
	CONTEXT.fillStyle = (isBlack) ? 'black' : 'white';
	CONTEXT.fillRect(Canvas.X, Canvas.Y, 1, 1);
}

function zoomIn() {
	if (GLOBAL_zoom < 128) { GLOBAL_zoom = GLOBAL_zoom * 2; }
	updateZoom();
}

function zoomOut() {
	if (GLOBAL_zoom > 1) { GLOBAL_zoom = GLOBAL_zoom / 2; }
	updateZoom();
}

function updateZoom() {
	// cv.width = width * zoom; cv.height = height * zoom
	$CANVAS.style.width = String($CANVAS.width * GLOBAL_zoom);
	$CANVAS.style.height = String($CANVAS.height * GLOBAL_zoom);

	$UI.style.width = String($UI.width * GLOBAL_zoom);
	$UI.style.height = String($UI.height * GLOBAL_zoom);

	DOM.zoomlevel.innerHTML=String(GLOBAL_zoom);

	Anim.drawCurrentFrame();
}

// might be handy later:

// function UNUSED_savePNG() {
// 	Anim.drawCurrentFrame();
// 	var link = document.getElementById('link') as HTMLLinkElement; // todo better way to download file?
// 	link.setAttribute('download', 'MintyPaper.png');
// 	link.setAttribute('href', $CANVAS.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
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
$UI.addEventListener('contextmenu', (e) => e.preventDefault(), false);
$UI.addEventListener('mousedown', Input.mouseDown, false);
window.addEventListener('mouseup', Input.mouseUp, false);
window.addEventListener('mousemove', Input.mouseMove, false);

// fun fact: There is also a "scroll" event but that requires the window to actually scroll
$UI.addEventListener('wheel', Input.zoomEvent, false);
document.addEventListener('wheel', Input.zoomEvent, false);

window.addEventListener('keydown', Input.handleKeyboard, true);

Anim.newAnimation();
updateZoom();
Anim.setFramerate(12);
