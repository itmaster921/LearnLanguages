import React, { Component } from 'react';
import {
    Platform,
    AsyncStorage
} from 'react-native';
import {currentLocaleTwoLetters} from './i18n';

export const FAV_ICON = "https://facebook.github.io/react-native/docs/assets/favicon.png";
export const TARGET_LANG = 'es';
export const NATIVE_LANG = 'en';
export const APP_NAME = 'Scene by Scene - Spanish';
export const FREE_USE_TIME = 5 * 60 * 1000;
export const ITEM_SKU = Platform.select({
    ios: 'com.scenebyscene.spanish.monthly.payment',
    android: 'monthly.payment'
});
export const AD_UNIT_ID = Platform.select({
    ios: 'ca-app-pub-9420106611131539/6661877395',
    android: 'ca-app-pub-9420106611131539/9211308675'
});
export const PRIVACY_POLICY_URL = "https://www.freeprivacypolicy.com/privacy/view/49009ffebb8f813a5fc29a1bb04f1bc0"
export const TERMS_OF_SERVICE_URL = "https://sbslanguage.com/tos"
export const LANGUAGES = [
    {
        text: 'Español',
        code: 'es'
    },
    {
        text: 'Français',
        code: 'fr'
    },
    {
        text: 'हिन्दी',
        code: 'hi'
    },
    {
        text: 'العربية',
        code: 'ar'
    },
]
async function getItem(key){
    const valueStr = await AsyncStorage.getItem(key)
    try {
        return JSON.parse(valueStr)        
    } catch (error) {
        return valueStr
    }
}

async function setItem(key, value){
    await AsyncStorage.setItem(key, JSON.stringify(value))            
}

async function getHistoryVideos(){
    let historyVideos = await getItem('history');
    return historyVideos || [];
}

async function addHistoryVideo(videoItem){
    let historyVideos = await getHistoryVideos();
    let existingIndex = historyVideos.findIndex((item)=>item.id==videoItem.id);
    if(existingIndex >= 0){
        historyVideos.splice(existingIndex, 1);        
    }
    historyVideos = [videoItem, ...historyVideos];
    await setItem('history', historyVideos);
}

async function getCurrentTimeForHistoryVideo(videoId){
    let historyVideos = await getHistoryVideos();
    let videoItem = historyVideos.find((item)=>item.id==videoId);
    if(videoItem){
        return videoItem.currentTime;
    }else{
        return 0;
    }
}

async function setCurrentTimeForHistoryVideo(videoId, currentTime){
    let historyVideos = await getHistoryVideos();
    let videoItem = historyVideos.find((item)=>item.id==videoId);
    if(videoItem){
        videoItem.currentTime = currentTime;
    }
    await setItem('history', historyVideos);
}

async function getWatchedCount(videoId){
    return await getItem(`watched-count-${videoId}`) || 0;
}

async function increaseWatchedCount(videoId){
    let watchedCount = await getWatchedCount(videoId);
    await setItem(`watched-count-${videoId}`, watchedCount + 1);
}

async function getFlaggedScenes(videoId, trackKey){
    let key = `flagged-scenes-${videoId}-${trackKey}`;
    let flaggedScenes = await getItem(key);
    return flaggedScenes || [];
}

async function setFlaggedScenes(videoId, trackKey, flaggedScenes){
    let key = `flagged-scenes-${videoId}-${trackKey}`;
    await setItem(key, flaggedScenes);
}

async function getSelectedTracks(videoId){
    let key = `selected-tracks-${videoId}`;
    let selectedTracks = await getItem(key);
    return selectedTracks || {};
}

async function setSelectedTracks(videoId, target, native){
    let key = `selected-tracks-${videoId}`;
    await setItem(key, {target, native});
}

async function getNativeLang(){
    if(TARGET_LANG == 'en'){
        if(LANGUAGES.find(lang=>lang.code==currentLocaleTwoLetters)){
            return currentLocaleTwoLetters;
        }else{
            let nativeLang = await getItem('NATIVE_LANG');
            return nativeLang;    
        }
    }else{
        return NATIVE_LANG;
    }
}

async function setNativeLang(lang){
    await setItem('NATIVE_LANG', lang);
}

async function setShownTooltips(tooltips){
    let key = `tooltips`;
    await setItem(key, tooltips);
}

async function getShownTooltips(){
    let key = `tooltips`;
    return await getItem(key) || [];
}

async function increaseTotalUsedTime(timeInSec){
    let key = `total-used-time`;
    let totalUsedTime = await getTotalUsedTime();
    await setItem(key, totalUsedTime + timeInSec);
}

async function getTotalUsedTime(){
    let key = `total-used-time`;
    return Math.floor(await getItem(key));
}

export default {
    getItem, 
    setItem, 
    getHistoryVideos,
    addHistoryVideo,
    getCurrentTimeForHistoryVideo,
    setCurrentTimeForHistoryVideo,
    getFlaggedScenes,
    setFlaggedScenes,
    getSelectedTracks,
    setSelectedTracks,
    getNativeLang,
    setNativeLang,

    setShownTooltips,
    getShownTooltips,

    getWatchedCount,
    increaseWatchedCount,

    getTotalUsedTime,
    increaseTotalUsedTime
}