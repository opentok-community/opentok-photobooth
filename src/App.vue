<template>
  <v-app>
    <v-content>
      <v-row>
        <v-col>
          <v-navigation-drawer permanent>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title">
                  Options
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-navigation-drawer>
        </v-col>
        <v-col>
          <v-navigation-drawer permanent>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title">
                  Your pics
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-navigation-drawer>
        </v-col>
        <v-col id="publisher">
          <video id="_webcam" ref="_webcam" style="display: none;" playsinline></video>
          <canvas id="_imageData" ref="_imageData"></canvas>
        </v-col>
      </v-row>
    </v-content>
  </v-app>
</template>

<script>
//const OT = require('@opentok/client')

import OT from '@opentok/client'
import { ENV } from './config'
import { brfv5 } from "./facedetection/brfv5/brfv5__init.js";
import { loadBRFv5Model } from "./facedetection/brfv5/brfv5__init.js";
import { configureCameraInput } from "./facedetection/brfv5/brfv5__configure.js";
import { configureFaceTracking } from "./facedetection/brfv5/brfv5__configure.js";
import { configureNumFacesToTrack } from "./facedetection/brfv5/brfv5__configure.js";
import { drawInputMirrored } from "./facedetection/brfv5/utils__canvas.js";
//import { drawCircles } from "./facedetection/brfv5/utils__canvas.js";
import { startCamera } from "./facedetection/brfv5/utils__camera.js";
import { detectOpenMouth } from "./facedetection/brfv5/utils__mouth_open_detection.js";
import { detectBlink } from "./facedetection/brfv5/utils__blink_detection.js";


//const _appId = "brfv5.browser.minimal.modules"; // (mandatory): 8 to 64 characters, a-z . 0-9 allowed

// Those variables will be retrieved from the stream and the library.
//let _brfv5Manager = null;
//let _brfv5Config = null;
//let _width = 0;
//let _height = 0;

let _leftEyeBlinked = false;
let _rightEyeBlinked = false;

let _leftEyeTimeOut = -1;
let _rightEyeTimeOut = -1;

const _leftEyeLidDistances = [];
const _rightEyeLidDistances = [];

var handleError = function (error) {
  if (error) {
    console.log(error.message);
  }
}

export default {
  name: 'App',

  components: {},

  data: () => ({
    //
    opentok_api_key: (ENV.OPENTOK_API_KEY)?ENV.OPENTOK_API_KEY:'',
    opentok_session_id: (ENV.OPENTOK_SESSION_ID)?ENV.OPENTOK_SESSION_ID:'',
    opentok_token: (ENV.OPENTOK_TOKEN)?ENV.OPENTOK_TOKEN:'',
    _brfv5Manager: null,
    _brfv5Config: null,
    _width: 0,
    _height: 0
  }),

  mounted(){

    console.log("starting load brfv")
    loadBRFv5Model("68l", 8, "./facedetection/brfv5/models/", "brfv5.browser.minimal.modules", progress => { progress })
    .then(({ brfv5Manager, brfv5Config }) => {

      this._brfv5Manager = brfv5Manager;
      this._brfv5Config = brfv5Config;

      this.configureTracking();

    })
    .catch(e => {
      console.error("BRFv5 failed: ", e);
    });

    startCamera(this.$refs['_webcam'], {
      width: 640,
      height: 480,
      frameRate: 30,
      facingMode: "user"
    })
    .then(({ video }) => {
      console.log(
        "openCamera: done: " + video.videoWidth + "x" + video.videoHeight
      );

      this._width = video.videoWidth;
      this._height = video.videoHeight;

      this.$refs['_imageData'].width = this._width;
      this.$refs['_imageData'].height = this._height;

      //Camara is ready then show image
      this.$refs['_webcam'].setAttribute("style","display:block")

      this.configureTracking();

    })
    .catch(e => {
      if (e) {
        console.error("Camera failed: ", e);
      }
    });

    this.initializeSession()

  },

  methods: {
    handleError(error) {
      if (error) {
        console.log(error.message);
      }
    },
    initializeSession() {

      let session = OT.initSession(this.opentok_api_key, this.opentok_session_id)

      let publisherData = this.$refs['_imageData']

      //console.log(publisherData)

      // Create a publisher
      var publisher = OT.initPublisher({
        insertDefaultUI: false,
        videoSource: publisherData.captureStream(1).getVideoTracks()[0]
      });

      // Connect to the session
      session.connect(this.opentok_token, function(error) {
        // If the connection is successful, initialize a publisher and publish to the session
        if (error) {
          this.handleError(error)
        } else {
          session.publish(publisher, handleError)
          //console.log(publisher.getImgData())
        }
      })
    },
    configureTracking(){
      if (this._brfv5Config !== null  && this._width > 0) {
        configureCameraInput(this._brfv5Config, this._width, this._height);
        configureNumFacesToTrack(this._brfv5Config, 1);
        configureFaceTracking(this._brfv5Config, 3, true);

        this._brfv5Manager.configure(this._brfv5Config);

        this.trackFaces();
      }
    },

    trackFaces(){
      console.log('Hellow world')
      if (!this._brfv5Manager || !this._brfv5Config || !this.$refs['_imageData']) {
        return;
      }

      const ctx = this.$refs['_imageData'].getContext("2d");

      drawInputMirrored(ctx, this._width, this._height, this._webcam);

      this._brfv5Manager.update(ctx.getImageData(0, 0, this._width, this._height));

      //let doDrawFaceDetection = !_brfv5Config.enableFaceTracking;

      if (this._brfv5Config.enableFaceTracking) {
        //const sizeFactor = Math.min(_width, _height) / 480.0;
        const faces = this._brfv5Manager.getFaces();

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

            this.detectBlinkLeft(leftEyeLandmarks, _leftEyeLidDistances);
            this.detectBlinkRight(rightEyeLandmarks, _rightEyeLidDistances);

            const mouthOpenFactor = detectOpenMouth(face.vertices);

            //>7 means that mouth is possible open
            //console.log(mouthOpenFactor);

            if(_leftEyeBlinked == false && _rightEyeBlinked == false){
              if(mouthOpenFactor>9)
                console.log("Hi")//add_snapshot();
            }
          } else {
            _leftEyeLidDistances.length = 0;
            _rightEyeLidDistances.length = 0;
          }
        }
      }

      window.requestAnimationFrame(this.trackFaces);

    },

    detectBlinkLeft(lm, distances){
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
    },

    detectBlinkRight(lm, distances){
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
    }

  }

};
</script>
