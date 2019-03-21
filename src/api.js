import {DOMParser} from 'xmldom';
import { xmlToJson, qsToJson } from './utils';
import _ from 'lodash';
import qs from 'qs';

export const GOOGLE_API_KEY = "AIzaSyC3AVn96xa-TX-o2rWseNvfcQ09UCPhy80";

// Endpoint to get the subtitle tracks
// https://www.youtube.com/api/timedtext?type=list&v=3wszM2SA12E

// Endpoint to get the subtitle for video id and support translate
// https://www.youtube.com/api/timedtext?lang=en&v=7068mw-6lmI&name=English&tlang=lv
// https://www.youtube.com/api/timedtext?lang=ko&v=7068mw-6lmI&name=Korean&tlang=lv

const API_PLAYLISTS_IN_CHANNEL = "https://www.googleapis.com/youtube/v3/playlists/";
const API_PLAYLISTITMES = "https://www.googleapis.com/youtube/v3/playlistItems";
const API_VIDEOS = "https://www.googleapis.com/youtube/v3/videos";
const API_GET_VIDEO_INFO = "http://www.youtube.com/get_video_info";
const API_DICTIONARY = "https://glosbe.com/gapi/translate";

const maxResults = 50;

function buildURL(url, parameters){
    let query = Object.keys(parameters).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(parameters[key]);
    }).join("&");
    let encodedUrl = url + "?" + query;
    return encodedUrl;
}

async function getJSON(url, headers={}){
    try {
        let response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });
        let json = await response.json();
        return json;
    } catch (error) {
        // console.error(error);
        return null;
    }
}

async function getText(url){
    try {
        let response = await fetch(url);
        let json = await response.text();
        return json;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function postJSON(url, json, headers) {
    try {
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(json),
        });
        let responseJson = await response.json();
        return responseJson;
    } catch (error) {
        console.error("post error", error);
    }
}

async function getSubtitles(subtitles_uri, from){
    if(from == 'youtube'){
        let xmlStr = await getText(subtitles_uri);
        if(xmlStr){
            let parser = new DOMParser();
            let xml = parser.parseFromString(xmlStr, "text/xml");
            let json = xmlToJson(xml);
            let _texts = json.transcript.text instanceof Array ? json.transcript.text : [json.transcript.text];
            let subtitles = _texts.map((text, index) => ({
                index,
                start: parseFloat(text["@attributes"].start),
                dur: parseFloat(text["@attributes"].dur),
                end: (parseFloat(text["@attributes"].start) * 1000 + parseFloat(text["@attributes"].dur) * 1000) / 1000,
                text: text['#text'],
            }));
            return subtitles;
        }
    }else{
        let res = await getJSON(subtitles_uri);
        if(res && res.subtitles){
            let subtitles = res.subtitles.map((subtitle, index)=>({
                ...subtitle,
                index,
                start: subtitle.start / 1000,
                end: subtitle.end / 1000,
                dur: (subtitle.end-subtitle.start) / 1000,
            }))
            return subtitles
        }
    }

    return null;
}

async function getSubtitleTracksFromYoutube(videoId){
    let tracks = [];
    let xmlStr = await getText(`https://www.youtube.com/api/timedtext?type=list&v=${videoId}`);
    if(xmlStr){
        let parser = new DOMParser();
        let xml = parser.parseFromString(xmlStr, "text/xml");
        let json = xmlToJson(xml);
        if(json && json.transcript_list && json.transcript_list.track){
            let _tracks = json.transcript_list.track instanceof Array ? json.transcript_list.track : [json.transcript_list.track]
            tracks = _tracks.map(track=>{
                track = track["@attributes"];
                let name = track.lang_translated;
                let label = `Youtube ${name}`;
                let key = `youtube.${track.lang_code}`;        
                return {
                    ...track, 
                    from: 'youtube',
                    name,
                    label,
                    key,
                    subtitles_uri: `https://www.youtube.com/api/timedtext?lang=${track.lang_code}&v=${videoId}&name=${track.name}`
                }
            })
        }
    }
    return tracks;
}

async function getSubtitlesFromYoutube(videoId, langCode, translated) {
    let tracks = await getSubtitleTracksFromYoutube(videoId);
    let subtitles_uri = null;
    if(tracks.length > 0){
        if(translated){
            let trackForLangCode = tracks[0];
            if(trackForLangCode) subtitles_uri = `${trackForLangCode.subtitles_uri}&tlang=${langCode}`;
        }else{
            let trackForLangCode = tracks.find(track=>track.lang_code.includes(langCode));
            if(trackForLangCode) subtitles_uri = trackForLangCode.subtitles_uri;
        }
    }
    if(subtitles_uri){
        let subtitles = await getSubtitles(subtitles_uri, 'youtube');
        return subtitles;
    }
    return null
}

async function getSubtitleTracksFromAmara(videoId){
    var apiUsername = "Yash5";
    var apiKey = "26c6a056419d24fb29306e3ad7f1bcfb23658f57";
    var baseUrl = "https://www.amara.org/api2/partners";
    var domainUrl = "https://www.amara.org";

    var headers = {
        "X-api-username" : apiUsername,
        "X-apikey" : apiKey
    };

    let url = `${baseUrl}/videos/?video_url=https://www.youtube.com/watch?v=${videoId}`;
    let res = await getJSON(url, headers);
    let tracks = [];
    if(res && res.objects){
        for (const object of res.objects) {
            tracks = [...tracks, ...object.languages];
            tracks = _.reject(tracks, {published: false})
        }
    }
    tracks = tracks.map(track=>{
        let label = `Amara ${track.name}`;
        let key = `amara.${track.code}`;
        let lang_code = track.code;
        return {
            ...track,
            from: 'amara',
            lang_code,
            label,
            key,
        }
    });
    return tracks;
}

async function getSubtitlesFromAmara(videoId, langCode){
    let tracks = await getSubtitleTracksFromAmara(videoId);
    let trackForLangCode = tracks.find(track=>track.code.startsWith(langCode));
    if(trackForLangCode){
        let subtitles = await getSubtitles(trackForLangCode.subtitles_uri, 'amara');
        return subtitles
    }
    return null
}

async function getSubtitleTracks(videoId){
    let youtubeSubtitleTracks = await getSubtitleTracksFromYoutube(videoId);

    let amaraSubtitleTracks = await getSubtitleTracksFromAmara(videoId);

    let tracks = [...youtubeSubtitleTracks, ...amaraSubtitleTracks];

    return tracks;
}

async function getSubtitlesFromTrack(track, tlang){
    let subtitles_uri = track.subtitles_uri;
    if(tlang) subtitles_uri = `${subtitles_uri}&tlang=${tlang}`;
    if(subtitles_uri){
        let subtitles = await getSubtitles(subtitles_uri, track.from);
        return subtitles;
    }
    return null
}

async function getChannelID(targetLang, nativeLang = ''){
    //https://s8b09z9b83.execute-api.us-east-1.amazonaws.com/default/GetChannel?targetLang=fr

    let url = `https://s8b09z9b83.execute-api.us-east-1.amazonaws.com/default/GetChannel?targetLang=${targetLang}&nativeLang=${nativeLang}`;
    let res = await getJSON(url);
    if(res){
        return res.channelId;
    }
    return null;
}

async function getPlaylistsInChannel(channelId, pageToken = ''){
    let part = 'snippet,contentDetails';
    let parameters = {
        channelId,
        part,
        maxResults,
        pageToken,
        key: GOOGLE_API_KEY,
    }
    let url = buildURL(API_PLAYLISTS_IN_CHANNEL, parameters);
    let res = await getJSON(url);
    return res;
}

async function getVideoItemsInPlaylist(playlistId, pageToken = ''){
    let part = 'snippet,contentDetails';
    let parameters = {
        playlistId,
        part,
        maxResults,
        pageToken,
        key: GOOGLE_API_KEY,
    }
    let url = buildURL(API_PLAYLISTITMES, parameters);
    let res = await getJSON(url);

    let videoIds = "";
    if(res && res.items){
        videoIds = res.items.map(item=>{
            return item.contentDetails.videoId
        }).join(',');
    }
    let videosRes = await getVideoItemsByIds(videoIds);
    videosRes.nextPageToken = res.nextPageToken;
    return videosRes;
}

async function getVideoItemsByIds(ids){
    let part = 'snippet,contentDetails';
    let parameters = {
        id: ids,
        part,
        maxResults,
        key: GOOGLE_API_KEY,
    }
    let url = buildURL(API_VIDEOS, parameters);
    let res = await getJSON(url);
    return res;
}

async function getYoutubeVideoInfo(video_id){
    let hl = 'en';
    let el = 'detailpage';
    let url = buildURL(API_GET_VIDEO_INFO, {video_id, el, hl});
    let res = await getText(url);

    let videoInfo = qs.parse(res);
    var tmp = videoInfo.url_encoded_fmt_stream_map;
    if (tmp) {
      tmp = tmp.split(',');
      for (i in tmp) {
        tmp[i] = qs.parse(tmp[i]);
      }
      videoInfo.url_encoded_fmt_stream_map = tmp;
    }
    videoInfo.adaptive_fmts = qs.parse(videoInfo.adaptive_fmts)
    videoInfo.player_response = JSON.parse(videoInfo.player_response);

    return videoInfo;
}

async function getYoutubeVideoDownloadUrl(video_id, videoInfo){
    let downloadUrl = "";
    if(!videoInfo){
        videoInfo = await getYoutubeVideoInfo(video_id);
    }
    let videos = videoInfo.url_encoded_fmt_stream_map;
    if(videos){
        let mp4 = videos.find(video=>video.itag==18);
        downloadUrl = mp4.url;
        if(mp4.s){
            let signature = await getDeciperSignature(videoInfo.video_id, mp4.s);
            downloadUrl = `${downloadUrl}&signature=${signature}`;
        }
    }
    return downloadUrl;
}

async function getDeciperSignature(videoId, signature) {
    var url = `https://www.youtube.com/embed/${videoId}?disable_polymer=true&hl=en`;
    let page = await getText(url);

    let configStr = /setConfig\(({'PLAYER_CONFIG':\s(.*?)})\);/.exec(page)[1];
    let configJson = eval(`(${configStr})`); //use eval instead of JSON.parse because JSON.parse not allow single quote(')
    let playerSourceUrl = `https://www.youtube.com${configJson.PLAYER_CONFIG.assets.js}`;

    let playerSource = await getText(playerSourceUrl);

    let decipherFuncArr = /function\(\w+\)\{.*split\(""\);(\w+)\..*join\(""\)\};/.exec(playerSource);
    let decipherFunc = decipherFuncArr[0];

    let functionsObjectName = decipherFuncArr[1];
    let functionsObjectRegex = `var\\s${functionsObjectName}=\\{(.|\n)*?\\}\\};`;
    let functionsObject = new RegExp(functionsObjectRegex).exec(playerSource)[0];

    eval(functionsObject);
    eval(`decipher=${decipherFunc}`);
    let result = decipher(signature);

    console.log({
        playerSourceUrl,
        signature,
        decipherFunc,
        functionsObject,
        result,
    });

    return result;
}

async function getDictionaryData(from, dest, phrase){
    let url = buildURL(API_DICTIONARY, {from, dest, phrase, format: 'json', pretty: true, tm: true});
    console.log('getDictionaryData url', url);
    let res = await getJSON(url);
    return res;
}

async function saveNewVideo(targetLang, nativeLang, videoId){
    //https://g6lolw9hdf.execute-api.us-east-1.amazonaws.com/default/saveVideo?targetLang=en&nativeLang=hi
    let url = `https://g6lolw9hdf.execute-api.us-east-1.amazonaws.com/default/saveVideo?community=true&targetLang=${targetLang}&nativeLang=${nativeLang}`;
    console.log('saveNewVideo', url);
    let headers = {
        'x-api-key': 'd1spBCmHTI18bvppZAXYqaf1nh1hMdqT17fGOin0'
    }
    let res = await postJSON(url, {videoId}, headers);
    return res;
}

export default {
    getJSON,
    postJSON,
    getText,

    getSubtitleTracksFromYoutube,
    getSubtitlesFromYoutube,
    getSubtitlesFromTrack,

    getSubtitleTracksFromAmara,
    getSubtitlesFromAmara,

    getSubtitleTracks,

    getChannelID,
    getPlaylistsInChannel,
    getVideoItemsInPlaylist,
    getVideoItemsByIds,

    getYoutubeVideoInfo,
    getYoutubeVideoDownloadUrl,
    getDeciperSignature,
    
    getDictionaryData,

    saveNewVideo,
}