# re module is for regular expression ops
import nexmo, re, base64
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from os import environ, makedirs
from os.path import join, dirname, abspath, exists
from datetime import datetime

app = Flask(__name__, static_url_path="", static_folder="dist")
CORS(app)

# 10mb size is allowed
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# Get env vars from file
envpath = join(dirname(__file__), "./.env")
load_dotenv(envpath)

# Needed for uploading files
basedir = abspath(dirname(__file__))

client = nexmo.Client(
    key=environ.get("NEXMO_API_KEY"), secret=environ.get("NEXMO_API_SECRET")
)

# Verify if snaps directory exists, if not then create it
if not exists("{}/dist/snaps".format(basedir)):
    makedirs("{}/dist/snaps".format(basedir))


@app.route("/", methods=["GET"])
def home():
    return send_from_directory("./dist/", "index.html")


@app.route("/send-mms", methods=["POST"])
def send_mms():
    params = request.get_json() or request.form or request.args
    if "phone" and "image" in params:
        # Get the base64 image
        image = re.sub(r"^data:image\/png;base64,", "", params["image"])
        image = bytes(image, "utf-8")
        phone = params["phone"]
        # Get the current timestamp
        filename_prefix = datetime.utcnow().isoformat()
        filename = "{phone}-{prefix}.png".format(phone=phone, prefix=filename_prefix)
        # Save image
        imagedir = "{}/dist/snaps".format(basedir)
        # Create the binary file in the snaps directory
        imagefile = open(
            "{imagedir}/{filename}".format(imagedir=imagedir, filename=filename), "wb"
        )
        # Write the bytes
        imagefile.write(base64.decodebytes(image))
        # Close file
        imagefile.close()
        # Send sms
        response = client.send_message(
            {
                "from": environ.get("NEXMO_NUMBER"),
                "to": phone,
                "text": "Opentok-Nexmo, Your snap is ready: {site_url}/snaps/{filename}".format(
                    site_url=environ.get("SITE_URL"), filename=filename
                ),
            }
        )
        if response["messages"][0]["status"] == "0":
            return jsonify({"status": "success", "message": "All OK"}), 200
        else:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Message failed with error: "
                        + response["messages"][0]["error-text"],
                    }
                ),
                200,
            )
    else:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Required params (phone, image) not provided",
                }
            ),
            200,
        )

