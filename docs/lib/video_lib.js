/* pixels
 * A pixel is an array with three numbers ranging from 0 to 255, representing 
 * RGB values
 */

/* no constructor: we simply use literal arrays to construct pixels,
 * as for example in 
 * VD._SRCIMG[i][j] = [0,0,0];
 * VD._DESTIMG[i][j] = [0,0,0];
 * VD._TEMP[i][j] = [0,0,0];
 */

/**
 * Returns the red component of a given Pixel <CODE>px</CODE>
 * @param {Pixel} px - given Pixel
 * @returns {Number} the red component as a number from 0 to 255
 */
function red_of(px) { // returns the red value of px respectively
    return px[0];
}

/**
 * Returns the green component of a given Pixel <CODE>px</CODE>
 * @param {Pixel} px - given Pixel
 * @returns {Number} the green component as a number from 0 to 255
 */
function green_of(px) { // returns the green value of px respectively
    return px[1];
}

/**
 * Returns the blue component of a given Pixel <CODE>px</CODE>
 * @param {Pixel} px - given Pixel
 * @returns {Number} the blue component as a number from 0 to 255
 */
function blue_of(px) { // returns the blue value of px respectively
    return px[2];
}

/**
 * Returns the alpha component of a given Pixel <CODE>px</CODE>
 * @param {Pixel} px - given Pixel
 * @returns {Number} the alpha component as a number from 0 to 255
 */
function alpha_of(px) { // returns the blue value of px respectively
    return px[3];
}

/**
 * Assigns the red, green, blue and alpha components of a Pixel 
 * <CODE>px</CODE> to given values
 * @param {Pixel} px - given Pixel
 * @param {Number} r - the red component as a number from 0 to 255
 * @param {Number} g - the green component as a number from 0 to 255
 * @param {Number} b - the blue component as a number from 0 to 255
 * @param {Number} a - the alpha component as a number from 0 to 255
 * @returns {undefined} 
 */
function set_rgba(px,r,g,b,a) { // assigns the r,g,b,a values to this px
    px[0] = r;
    px[1] = g;
    px[2] = b;
    px[3] = a;
}

/**
 * Filter that copies all Pixels faithfully from the
 * source Image <CODE>src</CODE> to the destination Image <CODE>dst</CODE>
 * @param {Image} src - source Image
 * @param {Image} dst - destination Image
 * @returns {undefined} 
 */
function copy_image(src, dest) {
    for (let i=0; i<_WIDTH; i = i+1) {
	for (let j=0; j<_HEIGHT; j = j+1) {
	    copy_pixel(src[i][j], dest[i][j]);
	}
    }
}

// returns a new filter that will have the effect of applying filter1 first and then filter2
function compose_filter(filter1, filter2) {
    return (src, dest) => {
	filter1(src, dest);
	copy_image(dest, src);
	filter2(src, dest);
    };
}

// returns true if the absolute difference in red( and green and blue) value of px1 and px2 
//     is smaller than the threshold value
function pixel_similar(p1, p2, threshold) {
    return math_abs(p1[0] - p2[0]) < threshold && 
	math_abs(p1[1] - p2[1]) < threshold && 
	math_abs(p1[2] - p2[2]) < threshold;
}

var _WIDTH = 400;
var _HEIGHT = 300;

/**
 * Returns the current height of the output video display in
 * pixels, i.e. the number of pixels in vertical direction
 * @returns {Number} height of output display (in pixels)
 */
function video_height() {
    return _HEIGHT;
}

/**
 * Returns the current width of the output video display in
 * pixels, i.e. the number of pixels in horizontal direction
 * @returns {Number} width of output display (in pixels)
 */
function video_width() {
    return _WIDTH;
}

// changes the current filter to my_filter
// default filter is copy_image
/**
 * Installs a given Filter to be used to transform
 * the Images that the camera captures into Images
 * displayed on the screen. A Filter is a function
 * that is applied to two Images (2-D arrays
 * of Pixels): the source Image and the destination
 * Image.
 * @param {Filter} f - the Filter to be installed
 * @returns {undefined} 
 */
function install_filter(f) { 
    VD._student_filter = f;
    if (!VD._video_playing) {
        VD.handleStart( () => {
	    VD._draw_once();
            VD._noLoop();
	})
    }
}

/**
 * Resets the installed Filter back to the default Filter
 * @returns {undefined} 
 */
function reset_filter() {
    apply_filter(copy_image);
}

VD = {};
VD._SRCIMG = [];
VD._DESTIMG = [];
VD._TEMP = [];
VD._timeInCurrentFrame = 0;
VD._student_filter = copy_image;
VD._requestID = null;
VD._pixelData = null;
VD._video_playing = false;
VD._video = null;
VD._canvas = null;
VD._context = null;

VD._setup = function() {
    //create the two image arrays that will be used throughout 
    for (let i=0; i<_WIDTH; i = i+1) {
	VD._SRCIMG[i] = [];
	VD._DESTIMG[i] = [];
	VD._TEMP[i] = [];
	for (let j=0; j<_HEIGHT; j = j+1) {
	    VD._SRCIMG[i][j] = [0,0,0];
	    VD._DESTIMG[i][j] = [0,0,0];
	    VD._TEMP[i][j] = [0,0,0];
	}
    }	
}

//load the data from the 1D array into the 2D array VD._SRCIMG
VD._make_image_abstraction = function(arr) {
    for (let i=0; i<_WIDTH; i++) {
	for (let j=0; j<_HEIGHT; j++) {
	    let pix = VD._SRCIMG[i][j];
	    let red = (j * _WIDTH + i)*4;
	    pix[0] = arr[red];
	    pix[1] = arr[red + 1];
	    pix[2] = arr[red + 2];
	}
    }
}

//load the data from the 2D array VD._DESTIMG into the 1D pixel array pixelData
VD._make_pixelData = function(pixelData) {
    for (let i=0; i<_WIDTH; i++) {
	for (let j=0; j<_HEIGHT; j++) {
	    let pix = VD._DESTIMG[i][j];
	    let red = (j * _WIDTH + i)*4;
	    pixelData.data[red] = pix[0];
	    pixelData.data[red+1] = pix[1];
	    pixelData.data[red+2] = pix[2];
	    pixelData.data[red+3] = 255;
	}
    }
}

/*
 * draw one frame only
 */
VD._draw_once = function() {
    VD._timeInCurrentFrame = Date.now();

    VD._context.drawImage(VD._video, 0, 0, _WIDTH, _HEIGHT);
    VD._pixelData = VD._context.getImageData(0, 0, _WIDTH, _HEIGHT);
    
    VD._make_image_abstraction(VD._pixelData.data);//from 1D to 2D
    VD._student_filter(VD._SRCIMG, VD._DESTIMG);//process the image
    VD._make_pixelData(VD._pixelData); //from 2D to 1D
    VD._context.putImageData(VD._pixelData, 0, 0);
}

/*
 * The main loop
 */
VD._draw = function() {	
    VD._requestID = window.requestAnimationFrame(VD._draw);

    VD._draw_once();
    
    // for debugging purposes
    // _frameNo++;	
    // let timeSpent = Date.now() - VD._timeInCurrentFrame;
    // _sumTime += timeSpent;
    // console.log("Average: " + (_sumTime/_frameNo).toFixed(2) + "    Current frame: " + timeSpent);
};
// let _frameNo = 0;
// let _sumTime = 0;

//stops the looping
VD._noLoop = function() {
    if (VD._video_playing) {
	VD._video_playing = false;
	window.cancelAnimationFrame(VD._requestID);
    }

}

//starts the main loop
VD._loop = function() {
    if (!VD._video_playing) {
	VD._video_playing = true;
	VD._requestID = window.requestAnimationFrame(VD._draw);
    }
}

VD.init = function($video, $canvas) { 
    VD._video = $video;
    VD._canvas = $canvas;
    VD._context = VD._canvas.getContext('2d');
    VD._setup();
    VD.handleStartVideo();
}

VD.deinit = function() { 
    VD._noLoop();
    VD._closeWebcam();
    VD._video = null;
    VD._canvas = null;
    VD._context = null;
}

VD._closeWebcam = function() {
    let stream = VD._video.srcObject;
    if (stream !== null) {
	let tracks = stream.getTracks();
	tracks.forEach((track) => {
	    track.stop();
	});
	VD._video.srcObject = null;
    }
}

VD.handleCloseVideo = function() {
    VD._noLoop();
    VD._closeWebcam();
    VD._requestID = window.requestAnimationFrame(() => {
	VD._context.clearRect(0, 0, VD._canvas.width, VD._canvas.height);
    });
}

VD.handleStartVideo = function() {
    VD.handleStart( () => VD._loop() );
}

VD.handleSnapPicture = function() {
    VD.handleStart( () => {
	VD._draw_once();
	VD._noLoop();
    });
}

VD.handleStart = function(cont) {
    if (!VD._video.srcObject) {
	if (navigator.mediaDevices.getUserMedia) {
	    navigator.mediaDevices.getUserMedia({ video: true })
		.then( stream => {
		    VD._video.srcObject = stream;
            const afterVideoLoad = function(){
                VD._video.removeEventListener('loadeddata', afterVideoLoad);
                cont();
            }
            VD._video.addEventListener('loadeddata', afterVideoLoad);
		})
		.catch(function (err) {
		    console.log(err); /* handle the error */
		    if (err.name == "NotFoundError" ||
			err.name == "DevicesNotFoundError") {
			console.log("Devices not found: Check your camera");
		    } else if (err.name == "NotReadableError" ||
			       err.name == "TrackStartError") {
			console.log("webcam already in use");
		    } else if (err.name == "OverconstrainedError" ||
			       err.name == "ConstraintNotSatisfiedError") {
			console.log("constraints cannot be satisfied " +
				    "by available devices");
		    } else if (err.name == "NotAllowedError" ||
			       err.name == "PermissionDeniedError") {
			console.log("permission denied in browser");
		    } else if (err.name == "TypeError" || err.name == "TypeError") {
			console.log("empty constraints object");
		    } else {
		    }		    
		});
	} else {
	    console.log('The browser you are using does not support getUserMedia');
	}
    } else {
	cont();
    }
}

VD.handleUpdateDimensions = function(w, h) {
    if (w === _WIDTH && h === _HEIGHT) { return; }
    _WIDTH = w;
    _HEIGHT = h;
    VD._video.width = w;
    VD._video.height = h;
    VD._canvas.width = w;
    VD._canvas.height = h;
    
    VD._setup();
    if (VD._video_playing) {
	VD._loop();
    } else {
	setTimeout(() => VD.handleSnapPicture(), 50);	
    }
}

/* run this in playground for testing


// upside-down


function upside_down(src, dest) {
    const WIDTH = get_video_width();
    const HEIGHT = get_video_height();
    for (let x=0; x<WIDTH; x = x + 1) {
        for (let y=0; y<HEIGHT; y = y + 1) {
            copy_pixel(
                src[x][HEIGHT - 1 - y], 
                dest[x][y]
            );
        }
    }
}

apply_filter(upside_down);

// sine distortion
            
function sine_distortion(src, dest) {
    const wave_length = 5 * (2 * math_PI);
    const distortion = 10;

    const WIDTH = get_video_width();
    const HEIGHT = get_video_height();

    const mid_x = WIDTH/2;
    const mid_y = HEIGHT/2;
    for (let x=0; x<WIDTH; x = x + 1){
        for (let y=0; y<HEIGHT; y = y + 1){
            const d_x = math_abs(mid_x - x);
            const d_y = math_abs(mid_y - y);
            const d = d_x + d_y; 
            const s = math_round(distortion * math_sin( d / wave_length));
            const x_raw =  x + s;
            const y_raw = y +  s;
            const x_src = math_max(0,math_min(WIDTH - 1, x_raw));
            const y_src = math_max(0,math_min(HEIGHT - 1, y_raw));
            copy_pixel(src[x_src][y_src], dest[x][y]);
        }
    }
}

apply_filter(sine_distortion);


// inversion filter

function invert(src, dest) {
    const WIDTH = get_video_width();
    const HEIGHT = get_video_height();
            
    for (let x=0; x<WIDTH; x = x + 1){
        for (let y=0; y<HEIGHT; y = y + 1){
            dest[x][y] = [255 - red_of(src[x][y]),
                          255 - green_of(src[x][y]),
                          255 - blue_of(src[x][y])
                          ];
        }
    }
}

apply_filter(invert);

*/
