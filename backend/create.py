import json
import requests
from config import Config
import xmltodict
import urlparse
import utils

amara_headers = {
    'X-api-key': Config.AMARA_API_KEY,
    'X-api-username': Config.AMARA_API_USER_NAME
}

def get_team_list(next = None):
    url = next if next is not None else 'https://amara.org/api/teams/'
    print('teams url', url)
    req = requests.get(url, headers = amara_headers)
    res = req.json()
    return res

def get_videos_of_team(team, next = None):
    url = next if next is not None else 'https://amara.org/api/videos/?team={}'.format(team)
    print('videos url', url)
    req = requests.get(url, headers = amara_headers)
    res = req.json()
    return res

def get_subs_from_youtube(video_id):
    url = 'https://www.youtube.com/api/timedtext?type=list&v={}'.format(video_id)
    print('youtube subs url', url)
    req = requests.get(url)
    tracks = []

    if req.status_code == requests.codes.ok:
        xml_res = req.text
        res = xmltodict.parse(xml_res)
        transcript_list = res['transcript_list']
        _tracks = transcript_list.get('track', [])
        tracks = _tracks if isinstance(_tracks, list) else [_tracks]
    return tracks

if __name__ == '__main__':
    print('================started======================')
    teams_next = None
    while True:
        teams_res = get_team_list(teams_next)
        teams_next = teams_res['meta']['next']
        teams = teams_res['objects']
        for team in teams:
            team_slug = team['slug']
            print('started team ' + team_slug)
            videos_next = None
            while True:
                videos_res = get_videos_of_team(team_slug, videos_next)
                videos_next = videos_res['meta']['next']
                videos = videos_res['objects']
                for video in videos:
                    print('started video ' + video['title'].encode("utf-8"))                    

                    video_languages = list(filter(lambda x: x['published'] == True, video['languages']))
                    if len(video_languages) == 0:
                        print('ignore: No availalbe subs\n')
                        continue

                    all_urls = video['all_urls']
                    youtube_url = next((url for url in all_urls if 'youtube.com' in url or 'youtube.be' in url), None)
                    if youtube_url is None:
                        print('ignore: No youtube url\n')
                        continue

                    print('youtube video url ' + youtube_url)

                    primary_audio_language_code = video['primary_audio_language_code']
                    if primary_audio_language_code is None: 
                        print('ignore: No primary_audio_language_code\n')
                        continue

                    print('primary_audio_language_code ' + primary_audio_language_code)

                    languages = list(map(lambda x: x['code'], video_languages))
                    parsed = urlparse.urlparse(youtube_url)
                    video_id = urlparse.parse_qs(parsed.query)['v'][0]
                    subs_from_youtube = get_subs_from_youtube(video_id)
                    y_languages = list(map(lambda x: x['@lang_code'], subs_from_youtube))
                    languages.extend(y_languages)
                    languages = list(set(languages)) #remove duplicate
                    print(languages)
                    if primary_audio_language_code not in languages: 
                        print('ignore: No subs for primary_audio_language_code\n')
                        continue

                    if primary_audio_language_code in y_languages:
                        print('saving video for only target lang ' + primary_audio_language_code)
                        res = utils.save_new_video(primary_audio_language_code, '', video_id, False)
                        print('only targetLang', res)
                    for lang in languages:
                        if lang == primary_audio_language_code: continue
                        print('saving video with native lang ' + lang)
                        res = utils.save_new_video(primary_audio_language_code, lang, video_id, False)
                        print('with nativeLang', res)
                    print('ended the video \n')
                if videos_next is None: break
            print('ended team ' + team_slug + '\n')
        if teams_next is None: break
    print('ended')
