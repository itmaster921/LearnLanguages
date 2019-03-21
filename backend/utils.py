import json
import requests
from config import Config
import time

with open('channels.json') as f:
    channels = json.load(f)

tokens = {}

def get_channel(targetLang, nativeLang):
    # channels = filter(lambda channel: channel['targetLang'] == targetLang and channel['nativeLang'] == nativeLang, channels)
    channel = next(
        (channel for channel in channels if channel['targetLang'] == targetLang and channel['nativeLang'] == nativeLang), 
        None
    )
    return channel

def get_access_token(refreshToken):
    token = tokens.get(refreshToken, None)
    if token is not None:
        access_token = token.get('access_token', None)
        expires_in = token.get('expires_in', 0)
        created = token.get('created', 0)
        if access_token is not None:
            if time.time() - created < expires_in:
                return access_token
        
    data = { 
        'client_id': Config.CLIENT_ID,
        'client_secret': Config.CLIENT_SECRET,
        'refresh_token': refreshToken,
        'grant_type': 'refresh_token' 
    } 
    req = requests.post('https://www.googleapis.com/oauth2/v4/token', data = data)
    res = req.json()
    access_token = res.get('access_token', None)
    expires_in = res.get('expires_in', 0)
    
    if access_token is not None:
        tokens[refreshToken] = {
            'access_token': access_token,
            'expires_in': expires_in,
            'created': time.time()
        }

    return access_token

def check_video_in_playlist(video_id, playlist_id):
    url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=id&playlistId={}&videoId={}&key={}'.format(playlist_id, video_id, Config.GOOGLE_API_KEY)
    print('check_video_in_playlist url', url)
    req = requests.get(url)
    res = req.json()
    return res is not None and 'items' in res and len(res['items']) > 0

def save_new_video(targetLang, nativeLang, videoId, community = False):
    channel = get_channel(targetLang, nativeLang)
    
    if channel is None:
        print('no channel for target {} and native {}'.format(targetLang, nativeLang))
        return None

    playlistId = channel['communityPlaylistId'] if community else channel['playlistId']

    if check_video_in_playlist(videoId, playlistId):
        print('the video is already existing in the playlist')
        return None

    refreshToken = channel['refreshToken']
    accessToken = get_access_token(refreshToken)
    if accessToken is None:
        print('no accessToken for refreshToken {}'.format(refreshToken))
        return None

    headers = {
        'content-type': 'application/json',
        'authorization': 'Bearer ' + accessToken
    }
    params = {'part': 'snippet', 'alt': 'json'}
    data = {
        'snippet': {
            'playlistId': playlistId,
            'resourceId': {
                'kind': 'youtube#video',
                'videoId': videoId
            }
        }
    }
    req = requests.post('https://www.googleapis.com/youtube/v3/playlistItems', headers = headers, params = params, data = json.dumps(data))
    res = req.json()
    return res

