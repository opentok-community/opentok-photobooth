import { brfv5 } from "./brfv5/brfv5__init.js";
import { loadBRFv5Model } from "./brfv5/brfv5__init.js";
import { configureCameraInput } from "./brfv5/brfv5__configure.js";
import { configureFaceTracking } from "./brfv5/brfv5__configure.js";
import { configureNumFacesToTrack } from "./brfv5/brfv5__configure.js";
import { drawInputMirrored } from "./brfv5/utils__canvas.js";
import { drawCircles } from "./brfv5/utils__canvas.js";
import { startCamera } from "./brfv5/utils__camera.js";
import { detectOpenMouth } from "./brfv5/utils__mouth_open_detection.js";
import { detectBlink } from "./brfv5/utils__blink_detection.js";

const _appId = "brfv5.browser.minimal.modules"; // (mandatory): 8 to 64 characters, a-z . 0-9 allowed

const _webcam = document.getElementById("_webcam");
const _imageData = document.getElementById("_imageData");

const token = "3249e0b8904df8058ed23f6db903e8af131eea04";

// Those variables will be retrieved from the stream and the library.
let _brfv5Manager = null;
let _brfv5Config = null;
let _width = 0;
let _height = 0;

let _leftEyeBlinked = false;
let _rightEyeBlinked = false;

let _leftEyeTimeOut = -1;
let _rightEyeTimeOut = -1;

const _leftEyeLidDistances = [];
const _rightEyeLidDistances = [];

// loadBRFv5Model and openCamera are being done simultaneously thanks to Promises. Both call
// configureTracking which only gets executed once both Promises were successful. Once configured
// trackFaces will do the tracking work and draw the results.

startCamera(_webcam, {
  width: 640,
  height: 480,
  frameRate: 30,
  facingMode: "user"
})
  .then(({ video }) => {
    console.log(
      "openCamera: done: " + video.videoWidth + "x" + video.videoHeight
    );

    _width = video.videoWidth;
    _height = video.videoHeight;

    _imageData.width = _width;
    _imageData.height = _height;

    configureTracking();
  })
  .catch(e => {
    if (e) {
      console.error("Camera failed: ", e);
    }
  });

loadBRFv5Model("68l", 8, "./js/brfv5/models/", _appId, progress => {})
  .then(({ brfv5Manager, brfv5Config }) => {
    _brfv5Manager = brfv5Manager;
    _brfv5Config = brfv5Config;

    configureTracking();
  })
  .catch(e => {
    console.error("BRFv5 failed: ", e);
  });

const configureTracking = () => {
  if (_brfv5Config !== null && _width > 0) {
    configureCameraInput(_brfv5Config, _width, _height);
    configureNumFacesToTrack(_brfv5Config, 1);
    configureFaceTracking(_brfv5Config, 3, true);

    _brfv5Manager.configure(_brfv5Config);

    trackFaces();
  }
};

const trackFaces = () => {
  if (!_brfv5Manager || !_brfv5Config || !_imageData) {
    return;
  }

  const ctx = _imageData.getContext("2d");

  drawInputMirrored(ctx, _width, _height, _webcam);

  _brfv5Manager.update(ctx.getImageData(0, 0, _width, _height));

  let doDrawFaceDetection = !_brfv5Config.enableFaceTracking;

  if (_brfv5Config.enableFaceTracking) {
    const sizeFactor = Math.min(_width, _height) / 480.0;
    const faces = _brfv5Manager.getFaces();

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];

      if (face.state === brfv5.BRFv5State.FACE_TRACKING) {
        //drawCircles(ctx, face.landmarks, "#00a0ff", 2.0 * sizeFactor);

        const lm = face.landmarks;
        const leftEyeLandmarks = [
          lm[36],
          lm[39],
          lm[37],
          lm[38],
          lm[41],
          lm[40]
        ];
        const rightEyeLandmarks = [
          lm[45],
          lm[42],
          lm[44],
          lm[43],
          lm[46],
          lm[47]
        ];

        detectBlinkLeft(leftEyeLandmarks, _leftEyeLidDistances);
        detectBlinkRight(rightEyeLandmarks, _rightEyeLidDistances);

        /*drawCircles(
          ctx,
          leftEyeLandmarks,
          _leftEyeBlinked ? "#ffffff" : "#00a0ff",
          2.0 * sizeFactor
        );*/
        /*drawCircles(
          ctx,
          rightEyeLandmarks,
          _rightEyeBlinked ? "#ffffff" : "#00a0ff",
          2.0 * sizeFactor
        );*/

        const mouthOpenFactor = detectOpenMouth(face.vertices);
        //>7 significa que la boca esta posiblemente abierta
        //console.log(mouthOpenFactor);

        if(_leftEyeBlinked == false && _rightEyeBlinked == false){
          if(mouthOpenFactor>9)
            add_snapshot();
        }

        /*if (mouthOpenFactor > 2) {
          const yawnLandmarks = [
            lm[48],
            lm[49],
            lm[50],
            lm[51],
            lm[52],
            lm[53],
            lm[54],
            lm[55],
            lm[56],
            lm[57],
            lm[58],
            lm[59],
            lm[60],
            lm[61],
            lm[62],
            lm[63],
            lm[64],
            lm[65],
            lm[66],
            lm[67]
          ];
          drawCircles(ctx, yawnLandmarks, "#ffffff", 2.0 * sizeFactor);
        }*/
      } else {
        _leftEyeLidDistances.length = 0;
        _rightEyeLidDistances.length = 0;
      }
    }
  }

  requestAnimationFrame(trackFaces);
};

const detectBlinkLeft = (lm, distances) => {
  const blinked = detectBlink(
    lm[0],
    lm[1],
    lm[2],
    lm[3],
    lm[4],
    lm[5],
    distances
  );

  // Keep a blink status for 0.150 seconds, then reset:
  if (blinked) {
    // Set blinked! Reset after 150ms.

    _leftEyeBlinked = true;

    if (_leftEyeTimeOut > -1) {
      clearTimeout(_leftEyeTimeOut);
    }

    _leftEyeTimeOut = setTimeout(() => {
      _leftEyeBlinked = false;
    }, 150);
    return true;
  }
  return false;
};

const detectBlinkRight = (lm, distances) => {
  const blinked = detectBlink(
    lm[0],
    lm[1],
    lm[2],
    lm[3],
    lm[4],
    lm[5],
    distances
  );

  if (blinked) {
    // Set blinked! Reset after 150ms.
    _rightEyeBlinked = true;

    if (_rightEyeTimeOut > -1) {
      clearTimeout(_rightEyeTimeOut);
    }

    _rightEyeTimeOut = setTimeout(() => {
      _rightEyeBlinked = false;
    }, 150);
    return true;
  }
  return false;
};
