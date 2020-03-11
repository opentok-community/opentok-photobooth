var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var fs = require('fs')
var cors = require('cors')

app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))
app.use(bodyParser.json({ limit: '10mb', extended: true }))
app.use(cors())

const config = require('./src/config')['ENV']

const Nexmo = require('nexmo')
const nexmo = new Nexmo({
  apiKey: config.NEXMO_API_KEY,
  apiSecret: config.NEXMO_API_SECRET,
  applicationId: config.NEXMO_APPLICATION_ID,
  privateKey: config.NEXMO_PRIVATEKEY_PATH
})

app.use(express.static(__dirname + '/dist'))
app.use(express.static(__dirname + '/snaps'))

app.post('/send-mms', function(req, res) {
  let phone = req.body['phone']
  let image = req.body['image']
  //Cleaning image
  image = image.replace(/^data:image\/png;base64,/, '')
  var time = new Date()
  let filename_prefix =
    time.getFullYear() +
    '-' +
    (time.getMonth() + 1) +
    '-' +
    time.getDate() +
    '-' +
    time.getHours() +
    ':' +
    time.getMinutes() +
    ':' +
    time.getSeconds()
  let filename = phone + '_' + filename_prefix + '.png'
  console.log(filename)
  fs.writeFileSync('./snaps/snaps/' + filename, image, 'base64')
  nexmo.channel.send(
    { type: 'mms', number: phone },
    { type: 'mms', number: '19899846354' },
    {
      content: {
        type: 'image',
        image: { url: config.SITE_URL + '/snaps/' + filename }
      }
    },
    (err, data) => {
      this.nexmo_dialog = false
      if (err) {
        console.log(err)
        if (err.body.title !== null && err.body.title !== undefined)
          res.json({ status: 'error', message: err.body.title })
        else res.json({ status: 'error', message: err.message })
      } else {
        console.log(data)
        res.json({ status: 'success', message: 'All OK' })
      }
      /*console.log(data.message_uuid);*/
    }
  )
})

app.listen(80, function() {
  console.log('Listening in port 80')
})
