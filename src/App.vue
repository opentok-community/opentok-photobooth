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
                  <v-switch v-model="manual" :label="`Manual?`"></v-switch>
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
                    <img :src="image.dataurl" v-on="on" @click="forceFileDownload(image.id)"/>
                  </template>
                  <span>Download picture</span>
                </v-tooltip>
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
                <div id="videos" style="position:relative">
                  <div id="subscriber"></div>
                  <div id="publisher" style="position:relative"><div v-if="counter != 10" style="position:absolute;top:0px;font-size:150px;z-index:1000;">{{ counter }}</div></div>
                  
                </div>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="analyze()" v-if="manual==true" color="orange" text>Analyze</v-btn>
              </v-card-actions>
            </v-card>
          </v-container>
        </v-col>
          <!--<video id="_webcam" ref="_webcam" style="display: none;" playsinline></video>
          <canvas id="_imageData" ref="_imageData"></canvas>-->
      </v-row>
    </v-content>
  </v-app>
</template>

<script>
//const OT = require('@opentok/client')

import OT from '@opentok/client'
import { ENV } from './config'

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
    streams: [],
    images:[],
    publisher: null,
    counter: 10,
    timerId: 0,
    manual: true
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
        this.images.push({id:this.images.length+1, dataurl: 'data:image/png;base64,'+ this.publisher.getImgData()})
      }, 10000);
    },
    handleError(error) {
      if (error) {
        console.log(error.message);
      }
    },
    forceFileDownload(index){
      let image_file = this.dataURItoBlob(this.images[index-1].dataurl)
      const url = window.URL.createObjectURL(image_file)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'file.png') //or any other extension
      link.click()
    }
  }

};
</script>
