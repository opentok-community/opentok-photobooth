<template>
  <v-app>
    <v-content>
      <v-row>
        <v-col cols="2">
          <v-navigation-drawer permanent>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title">
                  Options
                  <v-switch v-model="manual" :label="`${manual_label}`"></v-switch>
                  <v-switch v-model="filters" :label="`With filters?`"></v-switch>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title">
                  <v-btn @click="nexmo_dialog=true">Send Snap to Number</v-btn>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="title">
                  Your pics
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-for="image in images" :key="image.id">
              <v-list-item-content>
                <v-tooltip top>
                  <template v-slot:activator="{ on }">
                    <img style="width:185px; height:auto;" :id="'snap_' + image.id" :src="image.dataurl" v-on="on" @click="forceFileDownload(image.id)"/>
                  </template>
                  <span>Download picture</span>
                </v-tooltip>
              </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="filters">
              <v-list-item-content>
                <v-list-item-title class="title">
                  With Filters
                </v-list-item-title>
                <v-list-item v-for="filteredImage in filteredImages" :key="filteredImage.id">
                  <v-list-item-content>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <img style="width:185px; height:auto;" :id="'filtered_' + filteredImage.id" :src="filteredImage.dataurl" v-on="on" @click="forceFileDownload(filteredImage.id,'filtered')"/>
                      </template>
                      <span>Download picture</span>
                    </v-tooltip>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="title">
                      <v-btn @click="downloadImages()">Download Images</v-btn>
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list-item-content>
            </v-list-item>
          </v-navigation-drawer>
        </v-col>
        <v-col cols="10">
          <v-container>
            <v-card
              class="mx-auto"
              max-width="500"
              outlined
            >
              <v-list-item three-line>
                <v-list-item-content>
                  <v-list-item-title class="headline mb-1">Camera</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-card-text>
                <div id="videos" align="center" justify="center">
                  <div id="subscriber"></div>
                  <div id="publisher">
                    <v-overlay
                      :absolute="true"
                      :value="counter != 10"
                    >
                      <div style="font-size:150px;">{{ counter }}</div>
                    </v-overlay>
                    <!--<div v-if="counter != 10" style="position:absolute;top:0px;font-size:150px;z-index:1000;">{{ counter }}</div>-->
                  </div>
                </div>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="analyze()" v-if="manual==true" color="orange" text>Snap</v-btn>
              </v-card-actions>
            </v-card>

            <v-dialog v-model="dialog" persistent max-width="400">
              <v-card>
                <v-card-title class="headline">Do you like it?</v-card-title>
                <v-card-text>
                  <p>A smile was detected. Select the image you like, when select the auto mode is going to disable to allow you work on the image.</p>
                  <p>If you select No. This window is going to close and auto mode start again</p>
                  <img class="smile-images" v-for="image in images" :key="'snap_key_'+image.id" style="cursor:pointer;width:185px; height:auto;" :id="'snap_preview_' + image.id" :src="image.dataurl" @click="chooseImage(image.id)"/>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="green darken-1" text @click="dialog = false; manual = false; ">I dont like any</v-btn>
                  <!--<v-btn color="green darken-1" text @click="dialog = false; manual = true; ">Yes</v-btn>-->
                </v-card-actions>
              </v-card>
            </v-dialog>

            <v-dialog v-model="nexmo_dialog" persistent max-width="400">
              <v-card>
                <v-card-title class="headline">Send snapshot to your phone</v-card-title>
                <v-card-text>
                  <v-text-field
                    v-model="phone"
                    label="Enter your phone"
                    required
                  ></v-text-field>
                  <p>Select one of the next images</p>
                  <img
                    v-for="image in images" 
                    :key="'snap_key_'+image.id" 
                    style="cursor:pointer;width:100px; height:auto;" 
                    :id="'snap_preview_' + image.id" 
                    :src="image.dataurl"
                    :class="'image-selection'+((('snap_preview_' + image.id) == self2nextAlias)?' choosenone':'')"
                    @click="selected2Nexmo(image.id); self2nextAlias='snap_preview_' + image.id;"
                  />
                  <img  
                    v-for="filteredImage in filteredImages" 
                    :key="'snap_filtered_key_'+filteredImage.id" 
                    style="cursor:pointer;width:100px; height:auto;" 
                    :id="'snapfiltered_preview_' + filteredImage.id" 
                    :src="filteredImage.dataurl" 
                    :class="'image-selection'+((('snapfiltered_preview_' + filteredImage.id) == self2nextAlias)?' choosenone':'')"
                    @click="selected2Nexmo(filteredImage.id, 'filtered'); self2nextAlias='snapfiltered_preview_' + filteredImage.id;"
                  />
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="green darken-1" text @click="nexmo_dialog=false">Cancel</v-btn>
                  <v-btn color="green darken-1" text @click="sendMMS()">Send</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

          </v-container>
        </v-col>
          <!--<video id="_webcam" ref="_webcam" style="display: none;" playsinline></video>
          <canvas id="_imageData" ref="_imageData"></canvas>-->
      </v-row>
    </v-content>
    <v-snackbar
      v-model="snackbar"
    >
      {{ snackbar_message }}
      <v-btn
        color="pink"
        text
        @click="snackbar = false"
      >
        Close
      </v-btn>
    </v-snackbar>
  </v-app>
</template>

<script>
//const OT = require('@opentok/client')

import OT from '@opentok/client'
import { ENV } from './config'
//import axios from "axios"
//const Nexmo = require("nexmo")
import Nexmo from 'nexmo'

function handleError(error) {
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
    azure_face_api_subscription_key: (ENV.AZURE_FACE_API_SUBSCRIPTION_KEY)?ENV.AZURE_FACE_API_SUBSCRIPTION_KEY:'',
    azure_face_api_endpoint: (ENV.AZURE_FACE_API_ENDPOINT)?ENV.AZURE_FACE_API_ENDPOINT:'',
    nexmo_api_key: (ENV.NEXMO_API_KEY)?ENV.NEXMO_API_KEY:'',
    nexmo_api_secret: (ENV.NEXMO_API_SECRET)?ENV.NEXMO_API_SECRET:'',
    nexmo_application_id: (ENV.NEXMO_APPLICATION_ID)?ENV.NEXMO_APPLICATION_ID:'',
    nexmo_privatekey_path: (ENV.NEXMO_PRIVATEKEY_PATH)?ENV.NEXMO_PRIVATEKEY_PATH:'',
    streams: [],
    images:[],
    publisher: null,
    counter: 10,
    timerId: 0,
    manual: true,
    manual_label: 'Manual',
    snackbar: false,
    snackbar_message: '',
    filters: false,
    filteredImages: [],
    dialog: false,
    //This is a flag for auto mode. Execute the next response when the previous has been processed 
    waitForResponse: false,
    nexmo_dialog: false,
    phone:'',
    sel2next: null,
    self2nextAlias: ''
  }),

  mounted(){
    this.initializeSession()
  },

  methods: {
    add_snapshot(){
      alert("Hi")
    },
    async initializeSession() {
      var session = OT.initSession(this.opentok_api_key, this.opentok_session_id)

      // Subscribe to a newly created streams and add
      // them to our collection of active streams.
      session.on("streamCreated", (event) => {
        console.log("Hi")
        this.streams.push(event.stream);
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
        this.streams = this.streams.filter(f => f.id !== event.stream.id);
      });

      // Create a publisher
      this.publisher = OT.initPublisher(
        "publisher",
        {
          insertMode: "append",
          width: 400,
          height: 300
        },
        handleError
      );

      // Connect to the session
      session.connect(this.opentok_token, (error)=>{
        // If the connection is successful, initialize a publisher and publish to the session
        if (error) {
          handleError(error);
        } else {
          session.publish(this.publisher, handleError);
        }
      });
    },
    dataURItoBlob(dataURI) {
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

    },
    analyze(){
      //console.log(this.publisher.getImgData())
      //this.imagen = 'data:image/png;base64,'+ this.publisher.getImgData()
      //console.log(this.dataURItoBlob(this.imagen))
      this.timerId = setInterval(() => this.counter -= 1, 1000);
      setTimeout(() => { 
        clearInterval(this.timerId); 
        this.counter = 10

        
        //this.images.push({id:this.images.length+1, dataurl: 'data:image/png;base64,'+ this.publisher.getImgData()})
        let imageData = this.publisher.getImgData()
        let blob = this.dataURItoBlob('data:image/png;base64,'+ imageData)

        //Evaluates image emotion in azure cognitive face service
        const xhr = new XMLHttpRequest()
        xhr.open('POST',`${this.azure_face_api_endpoint}face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=emotion`)
        xhr.onreadystatechange = () => {
          let image = imageData
          if (xhr.readyState === 4) {
            //Response from azure
            console.log(xhr.response)
            let response = xhr.response[0]
            if(response !==null && response !== undefined){
              //Evalutes the face emotion happiness
              if(response.faceId !== null && response.faceId !== undefined){
                console.log(response.faceId)
                if(response.faceAttributes !== null && response.faceAttributes !== undefined){
                  if(response.faceAttributes.emotion !== null && response.faceAttributes.emotion !== undefined){
                    //Emotion is present, so we evaluate happiness factor (between 0 and 1) if happiness is > 0.5 we take the snap
                    if(response.faceAttributes.emotion.happiness !== null && response.faceAttributes.emotion.happiness !== undefined){
                      if(response.faceAttributes.emotion.happiness >= 0.5){
                        //take the snap and put it in image array
                        this.images.push({id:this.images.length+1, dataurl: 'data:image/png;base64,'+ image})
                      } else {
                        this.snackbar = true
                        this.snackbar_message = 'Smiling is a requirement. Smile and we take your photo'
                      }
                    }
                  }
                }
              }
            }else{
              this.snackbar_message = 'Connection error'
            }
          }
        }
        xhr.responseType = 'json';
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader("Ocp-Apim-Subscription-Key", this.azure_face_api_subscription_key);
        xhr.send(blob);
        

      }, 10000);
    },
    analyzeAuto(){
      //Each second an image is sent to azure to analyze if smile is present
      this.timerId = setInterval(() => {
        console.log("Intent")
        let imageData = this.publisher.getImgData()
        let blob = this.dataURItoBlob('data:image/png;base64,'+ imageData)
        //Evaluates image emotion in azure cognitive face service
        const xhr = new XMLHttpRequest()
        xhr.open('POST',`${this.azure_face_api_endpoint}face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=emotion`)
        xhr.onreadystatechange = () => {
          let image = imageData
          if (xhr.readyState === 4) {
            //Response from azure
            console.log(xhr.response)
            let response = xhr.response[0]
            if(response !==null && response !== undefined){
              //Evalutes the face emotion happiness
              if(response.faceId !== null && response.faceId !== undefined){
                console.log(response.faceId)
                if(response.faceAttributes !== null && response.faceAttributes !== undefined){
                  if(response.faceAttributes.emotion !== null && response.faceAttributes.emotion !== undefined){
                    //Emotion is present, so we evaluate happiness factor (between 0 and 1) if happiness is > 0.5 we take the snap
                    if(response.faceAttributes.emotion.happiness !== null && response.faceAttributes.emotion.happiness !== undefined){
                      if(response.faceAttributes.emotion.happiness >= 0.5){
                        //take the snap and put it in image array
                        this.images.push({id:this.images.length+1, dataurl: 'data:image/png;base64,'+ image})
                        this.dialog = true
                        this.manual = true
                      }
                    }
                  }
                }
              }
            }else{
              this.snackbar_message = 'Connection error'
            }
          }
        }
        xhr.responseType = 'json'
        xhr.setRequestHeader('Content-Type', 'application/octet-stream')
        xhr.setRequestHeader("Ocp-Apim-Subscription-Key", this.azure_face_api_subscription_key)
        xhr.send(blob)

      }, 1000);
    },
    chooseImage(imgid){
      this.manual = true
      let image = this.images[imgid-1]
      this.images = []
      this.images.push({id:this.images.length+1, dataurl: 'data:image/png;base64,'+ image.dataurl})
      this.dialog = false
      
    },
    selected2Nexmo(imgid, filtered){
      if(filtered == undefined)
        this.sel2next = this.images[imgid-1].dataurl
      else
        this.sel2next = this.filteredImages[imgid-1].dataurl
    },
    sendMMS(){
      if(this.phone == '' || this.self2nextAlias == ''){
        this.snackbar_message = "Fields required. Please ensure to fill the phone and select an image."
        this.snackbar = true
      } else {
        //Send MMS
        const nexmo = new Nexmo({
          apiKey: this.nexmo_api_key,
          apiSecret: this.nexmo_api_secret,
          applicationId: this.nexmo_application_id,
          privateKey: this.nexmo_privatekey_path
        })
        nexmo.channel.send(
          { "type": "mms", "number": this.phone },
          { "type": "mms", "number": "Nexmo" },
          {
            "content": {
              "type": "image",
              "image": { "url":  this.sel2next }
            }
          },
          (err, data) => { 
            this.nexmo_dialog = false
            if(err){
              console.log(err)
              this.snackbar_message = err.body.title
              this.snackbar = true
            } else {
              console.log(data)
            }
            /*console.log(data.message_uuid);*/ 
          }
        )
      }
    },
    handleError(error) {
      if (error) {
        console.log(error.message);
      }
    },
    forceFileDownload(index, place){
      let imgs = null;
      if(place == undefined)
        imgs = this.images
      else
        imgs = this.filteredImages
      let image_file = this.dataURItoBlob(imgs[index-1].dataurl)
      const url = window.URL.createObjectURL(image_file)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'snap_'+index+'.png') //or any other extension
      link.click()
    },
    downloadImages(){
      for(let i=0; i<this.images.length;i++){
        this.forceFileDownload(this.images[i].id)
      }
      for(let f=0; f<this.filteredImages.length;f++){
        this.forceFileDownload(this.filteredImages[f].id,'filtered')
      }
    },
    imgwfilter(img, filter, density){
      //console.log(img)
      
      let r = (filter.r * density + 255 * (100 - density)) / 25500
      let g = (filter.g * density + 255 * (100 - density)) / 25500
      let b = (filter.b * density + 255 * (100 - density)) / 25500

      var canvas = document.createElement("canvas")
      //canvas.width = img.width;
      //canvas.height = img.height;
      canvas.width = 640
      canvas.height = 480
      var ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0)

      //Change pixel color tone
      var imageData = ctx.getImageData(0, 0, 640, 480)
      var data = imageData.data
      for (var i = 0; i < data.length; i += 4) {
        var luma = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
        data[i] = Math.round(r * luma)
        data[i+1] = Math.round(g * luma)
        data[i+2] = Math.round(b * luma)
      }

      //Rewrite data in canvas
      ctx.putImageData(imageData, 0, 0)

      //Add filtered images to document
      this.filteredImages.push({id:this.filteredImages.length+1, dataurl: canvas.toDataURL()})

    }
  },
  watch: {
    filters(val){
      if(val){
        console.log(this.images.length)
        //If filters are enabled, generate 4 images with effects
        this.filteredImages = []
        if(this.images.length > 0){
          //Grayscale
          this.imgwfilter(document.getElementById("snap_1"), {r: 0xFF, g: 0xFF, b: 0xFF}, 50)
          //Sepia
          this.imgwfilter(document.getElementById("snap_1"), {r: 0xAC, g: 0x7A, b: 0x33}, 30)
          //Green
          this.imgwfilter(document.getElementById("snap_1"), {r: 0x19, g: 0xC9, b: 0x19}, 30)
          //Blue
          this.imgwfilter(document.getElementById("snap_1"), {r: 0x1D, g: 0x35, b: 0xEA}, 30)
        }
      }
    },
    manual(val){
      if(val){
        this.manual_label = 'Manual'
        //If Manual is selected stop the analyzeAuto function
        clearInterval(this.timerId)
      } else {
        this.manual_label = 'Auto'
        this.analyzeAuto()
      }
    }
  }

};
</script>
<style>
img.smile-images{
  box-shadow: 5px 10px 18px silver;
}
img.image-selection{
  margin-right:10px;
}
img.choosenone{
  box-shadow: 5px 10px 18px silver;
  border:2px solid red;
}
</style>