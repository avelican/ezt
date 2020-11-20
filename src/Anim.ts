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

export default Anim;