var opentok_api_key;
var opentok_session_id;
var opentok_token;

// See the config.js file.
if (OPENTOK_API_KEY && OPENTOK_SESSION_ID && OPENTOK_TOKEN) {
  opentok_api_key = OPENTOK_API_KEY;
  opentok_session_id = OPENTOK_SESSION_ID;
  opentok_token = OPENTOK_TOKEN;
  initializeSession();
} else {
  alert(
    "Failed to get configuration variables. Make sure you have updated the config.js file."
  );
}

// Handling all of our errors here by logging them to the console
function handleError(error) {
  if (error) {
    console.log(error.message);
  }
}

function initializeSession() {
  session = OT.initSession(opentok_api_key, opentok_session_id);

  let publisherData = document.getElementById("_imageData");

  // Create a publisher
  var publisher = OT.initPublisher({
    insertDefaultUI: false,
    videoSource: publisherData.captureStream(1).getVideoTracks()[0]
  });

  // Connect to the session
  session.connect(opentok_token, function(error) {
    // If the connection is successful, initialize a publisher and publish to the session
    if (error) {
      handleError(error);
    } else {
      session.publish(publisher, handleError);
      console.log(publisher.getImgData())
    }
  });
}

const getYourTrackOn = () => {
  var videos = document.getElementsByTagName("video");
  for (let v = 0; v < videos.length; v++) {
    startCamera(videos[v], {
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
  }
};

function add_snapshot() {
  var canvas = document.getElementById("_imageData")
  var img = document.createElement("img");
  img.setAttribute("src", canvas.toDataURL());
  document.getElementById("picture-container").appendChild(img);
}