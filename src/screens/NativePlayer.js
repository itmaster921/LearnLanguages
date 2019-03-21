/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {
  StyleSheet, 
  Text, 
  View, 
  Button, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  TextInput,
  Keyboard,
  Dimensions,
  FlatList,
  Image,
  AppState,
  Alert,
  Clipboard,
  Platform,
  StatusBar
} from 'react-native';
import api, {GOOGLE_API_KEY} from '../api';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/dist/FontAwesome5';
import { timeStringFromSeconds, strip } from '../utils';
import ParsedText from 'react-native-parsed-text';
import SlidingUpPanel from 'rn-sliding-up-panel'
import HTML from 'react-native-render-html';
import appdata, {TARGET_LANG, AD_UNIT_ID} from '../appdata';
import MySwitch from "../components/MySwitch";
import SelectSubModal from './SelectSubModal'
import Segment from 'react-native-segmented-control-tab'
import Tooltip from '../components/Tooltip'
import MyStatusBar from '../components/MyStatusBar'
import Slider from 'react-native-slider'
import { strings, isRTL } from '../i18n';
import { getStatusBarHeight, getBottomSpace } from 'react-native-iphone-x-helper'

import { 
  AdMobBanner, 
  AdMobInterstitial, 
  PublisherBanner,
  AdMobRewarded
} from 'react-native-admob'
import store from '../store';

const {width, height} = Dimensions.get('window')

let NATIVE_LANG = 'en';

const PANEL_HEADER_HEIGHT = 48;

const PANEL_BOTTOM = Platform.select({
  ios: PANEL_HEADER_HEIGHT + getBottomSpace(),
  android: PANEL_HEADER_HEIGHT + 22
})

const PANEL_HEIGHT = Platform.select({
  ios: height - getStatusBarHeight(true),
  android: height
})

var flagFill = require('../assets/flag-fill.png');
var flagEmpty = require('../assets/flag-empty.png');

export default class Player extends Component{

  constructor(props){
    super(props);

    this.startTime = new Date();

    let {state: {params: {videoId, human, auto, shared, currentTime}}} = this.props.navigation;
    this.currentTime = currentTime || 0;
    let currentTimeInSec = parseInt(this.currentTime);

    this.state = {
      human,
      auto,
      shared,
      videoId,
      videoTitle: "",
      videoUrl: "",
      videoInfo: null,
      error: "",
      status: "", //youtube player status
      subtitleTracks: null,
      targetTrack: null,
      nativeTrack: null,
      targetSubtitles: [], //video subtitle
      nativeSubtitles: [], //video subtitle
      currentTargetSubtitle: {}, //transcription
      currentNativeSubtitles: [], //translation
      showTranscription: false,
      showTranslation: false,
      play: true,
      isReady: true,
      duration: 0,
      videoSize: {width: width, height: width * ( 9 / 16)},
      currentTimeInSec,
      playAll: false,
      normalSpeed: true,
      showButtons: false,
      searchWord: '',
      dictionaryData: {},
      allowDragging: true,
      searchLang: TARGET_LANG,
      isLoaded: false,
      panelBottom: PANEL_BOTTOM,
      panelPosition: PANEL_BOTTOM,
      isDraggingPanel: false,
      isKeyboardOpen: false,
      reviewMode: false,
      flaggedScenes: [],
      currentReviewScene: -1,
      isDraggingSlide: false,
      appState: AppState.currentState,
      panelTop: PANEL_HEIGHT,
      modalVisible: false,
      moreSub: false,
      allowDragging: false,
      shownTooltips: []
    };
  }

  async componentDidMount() {
    NATIVE_LANG = await appdata.getNativeLang();
    let shownTooltips = await appdata.getShownTooltips();
    let videoInfo = await api.getYoutubeVideoInfo(this.state.videoId);
    let videoUrl = await api.getYoutubeVideoDownloadUrl(this.state.videoId, videoInfo);
    console.log('videoUrl', videoUrl);

    let subtitleTracks = await api.getSubtitleTracks(this.state.videoId);
    let targetTracks = subtitleTracks.filter(track=>track.lang_code.includes(TARGET_LANG));
    let nativeTracks = subtitleTracks.filter(track=>track.lang_code.includes(NATIVE_LANG));
    let moreSub = targetTracks.length > 1 || nativeTracks.length > 1;

    let selectedTracks = await appdata.getSelectedTracks(this.state.videoId);
    console.log("selectedTracks", selectedTracks);

    let targetTrack = targetTracks.find(track=>track.key==selectedTracks.target) ||
                      targetTracks.find(track=>track.from=='youtube') ||
                      targetTracks.find(track=>track.from=='amara');

    let nativeTrack = nativeTracks.find(track=>track.key==selectedTracks.native) ||
                      nativeTracks.find(track=>track.from=='youtube') ||
                      nativeTracks.find(track=>track.from=='amara');

    await this.selectSub(targetTrack, nativeTrack);

    this.setState({
      videoUrl,
      videoInfo,
      videoTitle: videoInfo.title,
      subtitleTracks,
      moreSub,
      shownTooltips
    });

    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
    AppState.addEventListener('change', this._handleAppStateChange);

    if(this.state.shared){
      this.saveNewVideo(targetTracks, nativeTracks, this.state.videoId)
    }
  }

  setCurrentTime(currentTime){
    this.currentTime = currentTime;
    let currentTimeInSec = parseInt(currentTime);
    if(currentTimeInSec != this.state.currentTimeInSec){
      this.setState({currentTimeInSec});
    }
  }

  componentWillUnmount() {
    let endTime = new Date();
    let usedTime = endTime - this.startTime;

    if(this.keyboardDidShowListener) this.keyboardDidShowListener.remove();
    if(this.keyboardDidHideListener) this.keyboardDidHideListener.remove();
    AppState.removeEventListener('change', this._handleAppStateChange);
    appdata.setCurrentTimeForHistoryVideo(this.state.videoId, this.currentTime);
    appdata.increaseTotalUsedTime(usedTime / 1000);
  }

  _keyboardDidShow = (e) => {
    this.setState({isKeyboardOpen: true, panelTop: PANEL_HEIGHT, panelPosition: PANEL_HEIGHT});
    if(this.slidingUpPanel){
      this.slidingUpPanel.transitionTo(PANEL_HEIGHT);
    }
  }

  _keyboardDidHide = (e) => {
    let panelTop = PANEL_HEIGHT - this.state.videoSize.height;
    this.slidingUpPanel.transitionTo(this.state.panelBottom);
    this.setState({isKeyboardOpen: false, panelTop, panelPosition: this.state.panelBottom});
  }

  _handleAppStateChange = (nextAppState) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!')
      this.setState({play: false});
    }else{
      console.log('App has come to the background!')
      this.setState({play: false});
    }
    this.setState({appState: nextAppState});
  }
 
  getNativeSubtitlesForTarget(targetSubtitle){
    let nativeSubtitles = [];
    if(targetSubtitle){
      let targetStart = targetSubtitle.start;
      let targetEnd = targetSubtitle.end;
      
      let first = this.state.nativeSubtitles.find(subtitle => (subtitle.end - targetStart) > 0.25);
      
      let reversedSubtitles = this.state.nativeSubtitles.slice().reverse();
      let last = reversedSubtitles.find(subtitle => (subtitle.start - targetEnd) < -0.25);

      if(first && last){
        for(let i = first.index; i <= last.index; i ++){
          nativeSubtitles.push(this.state.nativeSubtitles[i]);
        }
      }
    }
    return nativeSubtitles;
  }

  onProgress = (e)=>{
    var currentTime = e.currentTime;

    if(!this.state.isDraggingSlide){
      this.setCurrentTime(currentTime);
    }

    if(this.state.playAll){
      let currentTargetSubtitle = this.state.targetSubtitles.find(subtitle=>subtitle.end>=currentTime);
      let currentNativeSubtitles = this.getNativeSubtitlesForTarget(currentTargetSubtitle);
      
      if(currentTargetSubtitle != this.state.currentTargetSubtitle){
        this.setState({
          currentTargetSubtitle: currentTargetSubtitle || {},
          currentNativeSubtitles,
        });  
      }
    }else{
      if(currentTime >= this.state.currentTargetSubtitle.end){
        this.checkEnd();
        this.setState({play: false});
      }
    }
  }

  checkEnd = async () => {
    if(this.state.play == false) return;
    if(this.state.reviewMode){
      if(this.state.currentReviewScene == this.state.flaggedScenes.length - 1){
        await appdata.increaseWatchedCount(this.state.videoId);
        Alert.alert(
          strings("Ended"),
          strings("You have reached the last flagged scene, would you like to restart?"), [
            {
              text: strings('Cancel'), 
            },{
              text: strings('OK'), 
              onPress: ()=>{
                this.setCurrentTime(0);
                this.setState({currentReviewScene: 0});
                this.toSceneIndex(this.state.flaggedScenes[0]);
              }
            }
          ]
        )
      }
    }else{
      if(this.state.currentTargetSubtitle.index ==  this.state.targetSubtitles.length - 1){
        await appdata.increaseWatchedCount(this.state.videoId);
        Alert.alert(
          strings("Ended"), 
          strings("You have reached the last scene, would you like to restart?"), [
            {
              text: strings('Cancel'), 
            },{
              text: strings('OK'), 
              onPress: ()=>{
                this.setCurrentTime(0);
                this.toSceneIndex(0);
              }
            }
          ]
        )
      }
    }
  }

  onEnd = async () => {
    await appdata.increaseWatchedCount(this.state.videoId);
    Alert.alert(
      strings("Ended"), 
      strings("You have reached the end, would you like to restart?"), [
        {
          text: strings('Cancel'), onPress: ()=>{
          }
        },{
          text: strings('OK'), onPress: ()=>{
            this.setCurrentTime(0);
            if(this.state.playAll){
              this.player.seek(0);
            }
          }
        }
      ]
    )
  }

  onPressedShowTranscription = () => {
    this.setState({showTranscription: !this.state.showTranscription})
  }

  onPressedShowTranslation = () => {
    this.setState({showTranslation: !this.state.showTranslation})
  }

  toSceneIndex = (sceneIndex) => {
    if(sceneIndex < 0) return;

    let targetSubtitle = this.state.targetSubtitles[sceneIndex];
    let nativeSubtitles = this.getNativeSubtitlesForTarget(targetSubtitle);

    this.player.seek(targetSubtitle.start);
    this.setState({
      currentTargetSubtitle: targetSubtitle,
      currentNativeSubtitles: nativeSubtitles,
      play: true,
      showTranscription: false,
      showTranslation: false,
    });
  }

  toSceneTime = (time) => {
    let sceneIndex = this.state.targetSubtitles.findIndex(subtitle=>subtitle.end > time);
    this.toSceneIndex(sceneIndex);
  }

  onPrev = () => {
    if(this.state.reviewMode){
      if(this.state.currentReviewScene == 0) return;
      let reviewScene = this.state.currentReviewScene - 1;
      this.toSceneIndex(this.state.flaggedScenes[reviewScene]);
      this.setState({currentReviewScene: reviewScene})
    }else{
      if(this.state.currentTargetSubtitle.index == 0) return;
      this.toSceneIndex(this.state.currentTargetSubtitle.index - 1);
    }
  }

  onNext = () => {
    if(this.state.reviewMode){
      if(this.state.currentReviewScene == this.state.flaggedScenes.length - 1) return;
      let reviewScene = this.state.currentReviewScene + 1;
      this.toSceneIndex(this.state.flaggedScenes[reviewScene]);
      this.setState({currentReviewScene: reviewScene})
    }else{
      if(this.state.currentTargetSubtitle.index == this.state.targetSubtitles.length - 1) return;
      this.toSceneIndex(this.state.currentTargetSubtitle.index + 1);      
    }
    this.didShowNextSceneTooltip();
  }

  onReplay = () => {
    this.player.seek(this.state.currentTargetSubtitle.start);
    this.setState({play: true});
  }

  onPlay = () => {
    this.setState({play: true, showButtons: false});
  }

  onPause = () => {
    this.setState({play: false});
  }

  onLoad = (e) => {
    let {duration, naturalSize} = e;
    let videoHeight = naturalSize.height * (width / naturalSize.width)
    this.setState({isLoaded: true, duration, videoSize: {width, height: videoHeight}, panelTop: PANEL_HEIGHT - videoHeight});
    if(this.state.playAll == false){
      if(this.currentTime > 0) {
        this.toSceneTime(this.currentTime);
      }else{
        this.player.seek(this.state.currentTargetSubtitle.start);
      }
    }
  }

  onSlidingComplete = (value) => {
    if(this.state.playAll){
      this.player.seek(value);
    }else{
      this.toSceneTime(value);
    }
    this.setState({isDraggingSlide: false});
  }

  onSlideValueChange = (value) => {
    this.setState({isDraggingSlide: true});
    this.setCurrentTime(value);
  }

  onModeSwitchChanged = (value) => {
    this.setState({
      playAll: Boolean(value),
      showTranscription: true, 
      showTranslation: true,
    });
  }

  onSpeedSwitchChanged = (value) => {
    this.setState({normalSpeed: Boolean(value)});
  }

  onPressPlayer = () => {
    if(this.state.playAll){
      this.setState({showButtons: !this.state.showButtons});
    }else{
      if(this.currentTime < this.state.currentTargetSubtitle.end){
        this.setState({play: !this.state.play});
      }
    }
  }

  onPressTargetWord = async (word) => {
    this.setState({searchLang: TARGET_LANG, searchWord: word}, async ()=>{
      await this.search();
    });
  }

  onPressNativeWord = async (word) => {
    this.setState({searchLang: NATIVE_LANG, searchWord: word}, async ()=>{
      await this.search();
    });
  }

  onChangeSearchText = (text) => {
    this.setState({searchWord: text});
  }

  onSearch = async () => {
    await this.search();
  }

  onToggleSearchLang = () => {
    let searchLang = (this.state.searchLang == TARGET_LANG) ? NATIVE_LANG : TARGET_LANG;
    console.log(searchLang);
    this.setState({searchLang});
  }

  search = async () => {
    if(this.state.playAll){
      this.setState({play: false});
    }
    let from = this.state.searchLang;
    let dest = (from == TARGET_LANG) ? NATIVE_LANG : TARGET_LANG;
    let dictionaryData = await api.getDictionaryData(from, dest, this.state.searchWord);
    if(dictionaryData){
      this.setState({dictionaryData});
      this.dictionaryList.scrollToTop();  
    }else{
      alert(strings("The glosbe server is down at the moment please check later"));
    }
  }

  onFocusSearch = () => {
  }

  onLayoutSubtitleView = (e) => {
    if(!this.state.videoUrl) return;
    let {nativeEvent: { layout}} = e;
    let endY = layout.y + layout.height + 20;
    let panelBottom = height - endY;
    this.setState({panelBottom, panelPosition: panelBottom}, ()=>{
      if(this.slidingUpPanel && this.state.isLoaded && !this.state.isKeyboardOpen){
        this.slidingUpPanel.transitionTo(panelBottom);
      }
    });
  }

  onDragStartPanel = (position) => {
    this.setState({isDraggingPanel: true, panelPosition: position});
  }

  onDragPanel = (position) => {
    // this.setState({isDraggingPanel: true, panelPosition: position});
  }

  onDragEndPanel = (position) => {
    this.setState({isDraggingPanel: false, panelPosition: position});
  }

  onToggleReviewMode = () => {
    let reviewMode = !this.state.reviewMode;
    if(reviewMode){
      if(this.state.flaggedScenes.length == 0) return;
      this.setState({reviewMode, playAll: false});
      this.toSceneIndex(this.state.flaggedScenes[0]);  
    }else{
      this.setState({reviewMode});
    }
  }

  onToggleFlag = async () => {
    let scene = this.state.currentTargetSubtitle.index;
    let flaggedScenes = this.state.flaggedScenes.slice();
    let index = flaggedScenes.indexOf(scene);
    if(index > -1){
      flaggedScenes.splice(index, 1);
    }else{
      flaggedScenes.push(scene);
    }
    await appdata.setFlaggedScenes(this.state.videoId, this.state.targetTrack.key, flaggedScenes);
    this.setState({
      flaggedScenes,
      currentReviewScene: (flaggedScenes.length > 0) ? 0 : -1
    });
  }

  onBack5 = () => {
    let back5 = this.currentTime - 5;
    if(back5 < 0) back5 = 0;
    this.player.seek(back5);
    this.setState({play: true});
  }

  onForward5 = () => {
    let forward5 = this.currentTime + 5;
    if(forward5 > this.state.duration) forward5 = duration;
    this.player.seek(forward5);
    this.setState({play: true});
  }

  async selectSub(targetTrack, nativeTrack){
    let tlang=null;
    if(targetTrack){
      if(this.state.auto){
        nativeTrack = targetTrack;
        tlang = NATIVE_LANG;
      }else{
        if(this.state.shared && !nativeTrack){
          nativeTrack = targetTrack;
          tlang = NATIVE_LANG;
        }
      }
    }
    if(!targetTrack || !nativeTrack){
      alert(strings('There is no subtitle track'));
      return;
    }
    let targetSubtitles = await api.getSubtitlesFromTrack(targetTrack);
    let nativeSubtitles = await api.getSubtitlesFromTrack(nativeTrack, tlang);

    let flaggedScenes = await appdata.getFlaggedScenes(this.state.videoId, targetTrack.key);

    this.setState({
      targetTrack,
      nativeTrack,
      targetSubtitles: targetSubtitles || [],
      nativeSubtitles: nativeSubtitles || [],
      flaggedScenes,
      currentReviewScene: (flaggedScenes.length > 0) ? 0 : -1,
    }, () => { 
      let currentTargetSubtitle = this.state.targetSubtitles[0];
      let currentNativeSubtitles = this.getNativeSubtitlesForTarget(currentTargetSubtitle);
      if(this.state.isLoaded) this.player.seek(0);
      this.setState({
        play: true,
        currentTargetSubtitle: currentTargetSubtitle || {},
        currentNativeSubtitles: currentNativeSubtitles || []
      });
    });
    await appdata.setSelectedTracks(this.state.videoId, targetTrack.key, nativeTrack.key);
  }

  onSelectSub = async (targetTrack, nativeTrack) => {
    this.setState({modalVisible: false});
    await this.selectSub(targetTrack, nativeTrack);
  }

  onCancelSub = () => {
    this.setState({modalVisible: false});
  }

  saveNewVideo = async (targetTracks, nativeTracks, videoId) => {
    let youtubeTargetTrack = targetTracks.find(track=>track.from=='youtube');
    let available = false;
    if(youtubeTargetTrack){
      available = true;
      await api.saveNewVideo(TARGET_LANG, '', videoId);
    }
    if(targetTracks.length > 0 && nativeTracks.length > 0){
      available = true;
      await api.saveNewVideo(TARGET_LANG, NATIVE_LANG, videoId);
    }
    if(!available){
      alert(strings('The video has not available subtitle tracks'));
    }
  }

  onShareScene = async () => {
    let targetSubtitleText = this.state.currentTargetSubtitle.text;
    let start = Math.floor(this.state.currentTargetSubtitle.start);
    let end = Math.ceil(this.state.currentTargetSubtitle.end);
    let shareUrl = `https://www.youtube.com/watch?v=${this.state.videoId}&t=${start}`;
    Clipboard.setString(shareUrl + '\n' + targetSubtitleText);
    Alert.alert(
      strings('Scene Copied to Clipboard'), 
      strings('The Youtube link for this scene has been copied to your clipboard')
    );
  }

  didShowNextSceneTooltip = async () => {
    let {shownTooltips} = this.state;
    shownTooltips.push("next-scene");
    this.setState({
      shownTooltips
    },async ()=>{
      await appdata.setShownTooltips(shownTooltips);
    });
  }

  render() {
    let currentTargetSubtitleText = this.state.currentTargetSubtitle ? this.state.currentTargetSubtitle.text || "" : "";
    currentTargetSubtitleText = strip(currentTargetSubtitleText);
    let isFlagged = this.state.flaggedScenes.indexOf(this.state.currentTargetSubtitle.index) > -1;
    let isVisibleNextSceneTooltip = !this.state.shownTooltips.includes("next-scene");
    return (
      <View style={styles.container}>
        <MyStatusBar/>
        <TouchableWithoutFeedback onPress={this.onPressPlayer}>
          {this.state.videoUrl ?
            <View style={[styles.playerWrapper, this.state.videoSize]}>
              <Video source={{uri: this.state.videoUrl}}  // Can be a URL or a local file.
                ref={(ref) => this.player = ref}          // Store reference
                onBuffer={this.onBuffer}                  // Callback when remote video is buffering
                onEnd={this.onEnd}                        // Callback when playback finishes
                onError={this.videoError}                 // Callback when video cannot be loaded
                onLoad={this.onLoad}
                style={styles.player}
                paused={!this.state.play}
                progressUpdateInterval={100}
                onProgress={this.onProgress}
                onPress={this.onPressPlayer}
                rate={this.state.normalSpeed ? 1.0 : 0.75}
                resizeMode={"stretch"}
              />
              {(!this.state.play || this.state.showButtons) &&
              <View style={styles.playerOverlay}>
                <View style={styles.playerTopBar}>
                  <Text numberOfLines={1} style={{color: '#fff', paddingVertical: 4,}}>{this.state.videoTitle}</Text>
                  <View style={styles.settingsBar}>
                    <TouchableOpacity 
                      onPress={this.onToggleReviewMode}>
                      {this.state.reviewMode ?
                        <View style={[styles.reviewMode, {backgroundColor: 'red'}]}>
                          <Icon name="flag" size={16} color='#fff' solid/>
                          <Text style={{color: '#fff'}}> {this.state.currentReviewScene + 1}/{this.state.flaggedScenes.length}</Text>
                        </View>
                        :
                        <View style={styles.reviewMode}>
                          <Icon name="flag" size={16} color='red' solid/>
                          <Text style={{color: '#fff'}}> {this.state.flaggedScenes.length}</Text>
                        </View>
                      }
                    </TouchableOpacity>
                    <View style={{flex: 1}}/>
                    <Segment
                      values={[strings('Scenes'), strings('Play all')]}
                      selectedIndex={Number(this.state.playAll)}
                      onTabPress={this.onModeSwitchChanged}
                      tabsContainerStyle={{width: 120, height: 22}}
                      tabStyle={{ paddingVertical: 0}}
                    />
                    <View style={{flex: 1}}/>
                    <Segment
                      values={['75%', '100%']}
                      selectedIndex={Number(this.state.normalSpeed)}
                      onTabPress={this.onSpeedSwitchChanged}
                      tabsContainerStyle={{width: 100, height: 22}}
                      tabStyle={{ paddingVertical: 0}}
                    />
                  </View>
                </View>
                {this.state.playAll ?
                  <View 
                    style={[
                      styles.playallButtons,
                      isRTL ? {flexDirection: 'row-reverse'} : {flexDirection: 'row'}
                    ]}
                  >
                    <View style={{flex: 1, alignItems: 'center'}}>
                      <TouchableOpacity
                        onPress={this.onBack5}
                        style={styles.playerButton}
                      >
                        <Image source={require('../assets/back5.png')} style={styles.imageButton}/>
                      </TouchableOpacity>
                    </View>
                    {this.state.play ?
                      <TouchableOpacity 
                        onPress={this.onPause}
                        style={styles.playerButton}
                      >
                        <Icon name="pause" size={30} color='#fff'/>
                      </TouchableOpacity>
                      :
                      <TouchableOpacity 
                        onPress={this.onPlay}
                        style={styles.playerButton}
                      >
                        <Icon name="play" size={30} color='#fff'/>
                      </TouchableOpacity>
                    }
                    <View style={{flex: 1, alignItems: 'center'}}>
                      <TouchableOpacity 
                        onPress={this.onForward5}
                        style={styles.playerButton}
                      >
                        <Image source={require('../assets/forward5.png')} style={styles.imageButton}/>
                      </TouchableOpacity>
                    </View>
                  </View>
                  :
                  <View 
                    style={[
                      styles.buttons,
                      isRTL ? {flexDirection: 'row-reverse'} : {flexDirection: 'row'}
                    ]}
                  >
                    <View style={{flex: 1, alignItems: 'center'}}>
                      <TouchableOpacity
                        onPress={this.onPrev}
                        disabled={this.state.currentTargetSubtitle.index == 0}
                        style={styles.playerButton}
                      >
                        <Icon name="step-backward" size={30} color='#fff'/>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                      onPress={this.onReplay}
                      style={styles.playerButton}
                    >
                      <Icon name="undo-alt" size={30} color='#fff'/>
                    </TouchableOpacity>
                    <View style={{flex: 1, alignItems: 'center'}}>
                      <Tooltip
                        animated
                        isVisible={isVisibleNextSceneTooltip}
                        content={
                          <View style={{flex: 1}}>
                            <Text style={{fontWeight: 'bold'}}>{strings('Next Scene')}</Text>
                            <Text style={{fontSize: 13}}>{strings('next scene desc')}</Text>
                          </View>
                        }
                        placement="bottom"
                        arrowStyle={{top: -8}}
                        onClose={this.didShowNextSceneTooltip}
                      >
                        <TouchableOpacity 
                          onPress={this.onNext}
                          disabled={this.state.currentTargetSubtitle.index == this.state.targetSubtitles.length - 1}
                          style={styles.playerButton}
                        >
                          <Icon name="step-forward" size={30} color='#fff'/>
                        </TouchableOpacity>
                      </Tooltip>
                    </View>
                  </View>
                }
                <View 
                  style={[
                    styles.playerBottomBar,
                    isRTL ? {flexDirection: 'row-reverse'} : {flexDirection: 'row'}
                  ]}
                >
                  <Text style={{color: '#fff'}}>{timeStringFromSeconds(this.state.currentTimeInSec)}</Text>
                  <Slider 
                    style={styles.playerSlider}
                    thumbStyle={{
                      width: 16,
                      height: 16,
                      borderRadius: 8
                    }}
                    onSlidingComplete={this.onSlidingComplete}
                    onValueChange={this.onSlideValueChange}
                    maximumValue={this.state.duration}
                    minimumValue={0}
                    value={this.state.currentTimeInSec}
                    minimumTrackTintColor='#4682b4'
                    maximumTrackTintColor='#fff'
                    thumbTintColor='#4682b4'
                  />
                  <Text style={{color: '#fff'}}>{timeStringFromSeconds(this.state.duration)}</Text>
                  <TouchableOpacity 
                      style={{padding: 8}}
                      onPress={this.onShareScene}
                    >
                      <Icon name="copy" size={16} color='#fff' regular/>
                  </TouchableOpacity>
                </View>
              </View>
              }
            </View>
            :
            <View style={styles.playerWrapper} />
          }
        </TouchableWithoutFeedback>
        {this.state.isLoaded &&
          <View
            style={styles.subtitleView} 
            onLayout={this.onLayoutSubtitleView}
          >
            {!store.isPurchased &&
              <AdMobBanner
                adSize="smartBannerPortrait"
                adUnitID={AD_UNIT_ID}
                testDevices={[AdMobBanner.simulatorId]}
                onAdFailedToLoad={error => console.log(error)} 
              />
            }
            <View style={styles.transcription}>
              {this.state.showTranscription ?
                <View style={{flexDirection: 'row'}}>
                  {this.state.moreSub ?
                    <TouchableOpacity 
                      style={{padding: 8}}
                      onPress={()=>this.setState({modalVisible: true})}>
                        <Icon name="cog" size={20} solid/>
                    </TouchableOpacity> :
                    <View style={{width: 36}}/>
                  }
                  <ParsedText
                    style={[styles.caption, {flex: 1}]}
                    parse={
                      [
                        {pattern: /[^\s-&+,:;=?@#|'<>.^*()%!\\]+/, style: styles.parsedText, onPress: this.onPressTargetWord},
                      ]
                    }
                    childrenProps={{allowFontScaling: false}}
                  >
                    {currentTargetSubtitleText}
                  </ParsedText>
                  <TouchableOpacity 
                    style={{padding: 8}}
                    onPress={this.onToggleFlag}>
                    <Image 
                      source={isFlagged ? flagFill : flagEmpty} 
                      style={{
                        width: 20, 
                        height: 24, 
                        resizeMode: 'contain'
                      }}
                    />
                  </TouchableOpacity>
                </View>
                :
                <View style={{padding: 8}}>
                  <Button 
                    title={strings("Click here to show transcription")} 
                    onPress={this.onPressedShowTranscription}
                  />
                </View>
              }
            </View>
            <View style={styles.translation}>
              {this.state.showTranslation ?
                <View>
                  {this.state.currentNativeSubtitles.map((subtitle, index)=>
                    <ParsedText
                      key={index.toString()}
                      style={[styles.caption, {color: '#4682b4', marginVertical: 0}]}
                      parse={
                        [
                          {pattern: /[^\s-&+,:;=?@#|'<>.^*()%!\\]+/, style: styles.parsedText, onPress: this.onPressNativeWord},
                        ]
                      }
                      childrenProps={{allowFontScaling: false}}
                    >
                      {strip(subtitle.text)}
                    </ParsedText>
                  )}
                </View>
                :
                <View style={{paddingHorizontal: 8}}>
                  <Button 
                    title={strings("Click here to show translation")} 
                    onPress={this.onPressedShowTranslation}
                  />
                </View>
              }
            </View>
          </View>
        }
        <SlidingUpPanel
          ref={ref=>this.slidingUpPanel=ref}
          visible={true}
          startCollapsed={true}
          showBackdrop={false}
          allowDragging={this.state.allowDragging}
          draggableRange={{
            top: this.state.panelTop,
            bottom: PANEL_BOTTOM,
          }}
          onDrag={this.onDragPanel}
          onDragStart={this.onDragStartPanel}
          onDragEnd={this.onDragEndPanel}
        >
          <View style={styles.panel}>
            <View style={{height: this.state.panelPosition}}>
              <TouchableWithoutFeedback onPressIn={()=>this.setState({allowDragging: true})} onPressOut={()=>this.setState({allowDragging: false})}>
                <View style={styles.panelHeader}>
                  <Image source={require('../assets/glosbe.png')} style={{width: 36, height: 36, marginRight: 12}}/>
                  <TextInput 
                    style={styles.search}
                    returnKeyType={'search'}
                    blurOnSubmit={false} 
                    onChangeText={this.onChangeSearchText}
                    onSubmitEditing={this.onSearch}
                    onFocus={this.onFocusSearch}
                    underlineColorAndroid='#fff'
                    selectionColor='#fff'
                    value={this.state.searchWord}/>
                  <TouchableOpacity style={styles.searchLangBtn} onPress={this.onToggleSearchLang}>
                    <Text style={styles.searchLangText}>{this.state.searchLang.toUpperCase()}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
              <DictionaryList 
                ref={ref=>this.dictionaryList=ref}
                dictionaryData={this.state.dictionaryData}
                searchLang={this.state.searchLang}
              />
            </View>
          </View>
        </SlidingUpPanel>
        {(this.state.subtitleTracks && this.state.targetTrack && this.state.nativeTrack) &&
          <SelectSubModal
            visible={this.state.modalVisible}
            subtitleTracks={this.state.subtitleTracks}
            targetTrack={this.state.targetTrack}
            nativeTrack={this.state.nativeTrack}
            onSelect={this.onSelectSub}
            onCancel={this.onCancelSub}
          />
        }
      </View>
    );
  }
}

class DictionaryList extends React.PureComponent{

  getMeaningStr(){
    let meaningStr = "";
    let {tuc} = this.props.dictionaryData;
    if(tuc){
      let _tuc = tuc.slice(0, 7);
      _tuc.forEach((item, index) => {
        let itemStr = (index + 1) + ". ";
        if(item.meanings){
          let meaning = item.meanings.find(meaning=>meaning.language==this.props.searchLang);
          if(meaning) {
            itemStr = itemStr + meaning.text + ": ";
          }
        }
        if(item.phrase){
          itemStr = itemStr + "<strong class='meaning'>" + item.phrase.text + "</strong>";
        }
        if(itemStr){
          meaningStr = meaningStr + itemStr + "<br/>";
        }
      });
    }
    meaningStr = "<span class='meaningspan'>" + meaningStr + "</span>";
    return meaningStr;
  }

  scrollToTop(){
    this.dictionaryList.scrollToOffset({offset: 0}); 
  }

  render(){
    let dicExamples = this.props.dictionaryData.examples || [];
    dicExamples.sort((a, b)=>a.first.length - b.first.length);
    dicExamples = dicExamples.slice(0, 15);
    return (
      <FlatList
        ref={ref=>this.dictionaryList=ref}
        style={styles.dictionaryList}
        data={dicExamples}
        ListHeaderComponent={
          <HTML classesStyles={styles.dictionaryExampleStyles} html={this.getMeaningStr()}/>
        }
        keyExtractor={(item, index)=>index.toString()}
        ListFooterComponent={
          <Text style={{width: '100%', textAlign: 'center', fontSize: 18,}}>courtesy of glosbe.com</Text>
        }
        renderItem={({item, index})=>(
          <View style={styles.exampleListItem}>
            <HTML classesStyles={styles.dictionaryExampleStyles} html={"<span class='text'>" + item.first + '</span>'}/>
            <HTML classesStyles={styles.dictionaryExampleStyles} html={"<span class='text second'>" + item.second + '</span>'}/>
          </View>
        )}
      />
    )
  }
}

const styles = {

  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },

  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },

  caption: {
    fontSize: 17,
    textAlign: 'center',
    marginHorizontal: 8,
    marginVertical: 8,
  },

  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },

  subtitleView: {
  },

  targetSubtitleView: {
    flexDirection: 'row',
  },

  transcription: {
    zIndex: -1,
  },

  translation: {
    marginVertical: 4,
    zIndex: -1,
  },

  playerWrapper: {
  },

  playerOverlay: {
    flex: 1, 
    backgroundColor: '#0006',
    alignItems: 'center',
    justifyContent: 'center',
  },

  player: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  playerButton: {
    padding: 8,
  },

  buttons: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },

  playallButtons: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  sliderBar: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  },

  playerSlider: {
    flex: 1,
    marginHorizontal: 8
  },

  playerBottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8
  },

  playerTopBar: {
    position: 'absolute',
    top: 0,
    width: '100%',
    paddingHorizontal: 8,
  },

  settingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  parsedText: {
    // color: 'red',
  },

  dictionaryView: {
    flex: 1,
    width: '100%',
    padding: 8,
  },

  dictionaryMeaningText: {
    fontSize: 17,
    marginHorizontal: 8,
    marginVertical: 4,
  },

  panel: {
    flex: 1,
    backgroundColor: 'white',
    position: 'relative',
  },

  panelHeader: {
    height: PANEL_HEADER_HEIGHT,
    paddingHorizontal: 4,
    backgroundColor: '#4682b4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  search: {
    flex: 1,
    color: '#fff', 
    fontSize: 18,
    marginHorizontal: 4,
  },

  dictionaryExampleStyles: {
    keyword: {
      fontSize: 20,
    },
    text: {
      fontSize: 18,
    },
    second: {
      color: '#4682b4'
    },
    meaningspan: {
      fontSize: 18,
      marginHorizontal: 8,
      marginVertical: 4,  
    },
    meaning: {
      color: '#4682b4',
    }
  },

  exampleListItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: 'gray'
  },

  dictionaryList: {
    marginBottom: 24,
  },

  searchLangBtn: {
    borderWidth: 2, 
    borderColor: '#fff', 
    paddingHorizontal: 8,
  },

  searchLangText: {
    color: '#fff',
    fontSize: 20,
  },

  reviewMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderWidth: 1, 
    borderColor: 'red', 
    minWidth: 60,
    marginTop: 2,
  },

  imageButton: {
    width: 30,
    height: 30,
    tintColor: '#fff'
  }
};
