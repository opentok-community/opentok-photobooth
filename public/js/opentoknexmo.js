var opentok_api_key = OPENTOK_API_KEY;
var opentok_session_id = OPENTOK_SESSION_ID;
var opentok_token = OPENTOK_TOKEN;
var streams = [];
var publisher;

function handleError(error) {
    if (error) {
        console.log(error.message);
    }
}

function initializeSession() {

    var session = OT.initSession(opentok_api_key, opentok_session_id)

    // Subscribe to a newly created streams and add
    // them to our collection of active streams.
    session.on("streamCreated", (event) => {
      console.log("Hi")
      streams.push(event.stream);
      session.subscribe(
        event.stream,
        "subscriber",
        {
          insertMode: "append"
        },
        handleError
      );
    });

    // Remove streams from our array when they are destroyed.
    session.on("streamDestroyed", function (event) {
      streams = streams.filter(f => f.id !== event.stream.id);
    });

    // Create a publisher
    publisher = OT.initPublisher(
      "publisher",
      {
        insertMode: "append"
      },
      handleError
    );

    // Connect to the session
    session.connect(opentok_token, (error)=>{
      // If the connection is successful, initialize a publisher and publish to the session
      if (error) {
        handleError(error);
      } else {
        session.publish(publisher, handleError);
      }
    });
  }

  function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(",")[0].indexOf("base64") >= 0)
      byteString = atob(dataURI.split(",")[1]);
    else byteString = unescape(dataURI.split(",")[1]);

    // separate out the mime component
    var mimeString = dataURI
      .split(",")[0]
      .split(":")[1]
      .split(";")[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], { type: mimeString });

  }

  function analize(){
    var video = document.getElementsByTagName("video")[0]
    var canvas = document.createElement("canvas")
    canvas.width = video.width
    canvas.height = video.height
    console.log(canvas.width)
    console.log(canvas.height)
    var ctx = canvas.getContext("2d")
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  }


  window.onload = function(){
    initializeSession();
  }