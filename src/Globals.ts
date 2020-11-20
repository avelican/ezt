class Globals{
	// tslint:disable-next-line:variable-name
	public static Zoom = 4; // screen pixels per image pixel
	public static readonly $CANVAS = document.getElementById('cv') as HTMLCanvasElement;
	public static readonly CONTEXT = Globals.$CANVAS.getContext('2d') as CanvasRenderingContext2D;
	public static readonly $UI = document.getElementById('ui') as HTMLCanvasElement;
	public static readonly UI_CONTEXT = Globals.$UI.getContext('2d') as CanvasRenderingContext2D;
	public static readonly DOM : any = {};
}

Globals.$CANVAS.width = 128;
Globals.$CANVAS.height = Globals.$CANVAS.width;
Globals.$UI.width = Globals.$UI.height = Globals.$CANVAS.width;
Globals.DOM.gifOutput = document.getElementById('gifOutput') as HTMLDivElement;
Globals.DOM.coords = document.getElementById('coords') as HTMLSpanElement;
Globals.DOM.zoomlevel = document.getElementById('zoomlevel') as HTMLSpanElement;

export default Globals;