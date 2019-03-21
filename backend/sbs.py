from flask import Flask, abort, request, jsonify, url_for
import json
import requests
from config import Config
import utils

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/channel')
def get_channel():
    targetLang = request.args.get('targetLang', '')
    nativeLang = request.args.get('nativeLang', '')
    channel = utils.get_channel(targetLang, nativeLang)
    return jsonify(channel)

@app.route('/saveNewVideo', methods=['POST'])
def save_new_video():
    targetLang = request.args.get('targetLang', '')
    nativeLang = request.args.get('nativeLang', '')
    community = request.args.get('community', 'true') == 'true'
    videoId = request.json.get('videoId', '')
    print(community)
    res = utils.save_new_video(targetLang, nativeLang, videoId, community)
    if res is not None:
        return jsonify(res)
    else:
        return jsonify({'error': 'An error happens'})
