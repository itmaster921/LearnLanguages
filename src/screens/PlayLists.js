import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, Platform, TouchableOpacity} from 'react-native';
import PlayListItem from "../components/PlayListItem";
import api from '../api';
import {getVideoIdFromYoutubeLink} from '../utils';
import { strings } from '../i18n';
import appdata, {TARGET_LANG, APP_NAME} from '../appdata';
import { getStatusBarHeight } from 'react-native-iphone-x-helper'
import Dialog from "react-native-dialog";

export default class PlayLists extends Component {
    state = {
        playLists: [], 
        channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
        humanChannelId: "UCxbq9z7XbThxhIxx2dyWSMg",
        autoChannelId: "UC8XwOvmFVdImmPSaJF-OUew",
        nextPageToken: "", 
        sharingDialogVisible: false,
        pastedVideoUrl: "",
    }

    async componentDidMount() {
        // let channelId = (this.props.human) ? this.state.humanChannelId : this.state.autoChannelId;
        let channelId = '';
        if(this.props.human){
            const NATIVE_LANG = await appdata.getNativeLang();
            channelId = await api.getChannelID(TARGET_LANG, NATIVE_LANG); 
        }else{
            channelId = await api.getChannelID(TARGET_LANG); 
        }

        this.setState({channelId});

        let playLists = await api.getPlaylistsInChannel(channelId);
        this.setState({playLists: playLists.items, nextPageToken: playLists.nextPageToken});

        console.log({getStatusBarHeight:getStatusBarHeight()})
    }

    onEndReached = async () => {
        if(!this.state.nextPageToken) return;
        let playLists = await api.getPlaylistsInChannel(this.state.channelId, this.state.nextPageToken);
        this.setState({playLists: [...this.state.playLists, ...playLists.items], nextPageToken: playLists.nextPageToken});                
    }

    onPressItem = (item) => {
        let {navigation: {navigate}, human, auto} = this.props;
        navigate('VideoList', {playlistId: item.id, playlistTitle: item.snippet.title, human, auto})
    }

    onPasteYoutubeLink = () => {
        if(!this.state.pastedVideoUrl) return;
        let sharedVideoId = getVideoIdFromYoutubeLink(this.state.pastedVideoUrl);
        this.setState({
            sharingDialogVisible: false,
            pastedVideoUrl: ""
        });
        if(sharedVideoId){
            let {navigation: {navigate}} = this.props;        
            navigate('Player', {videoId: sharedVideoId, shared: true});    
        }
    }

    render(){ 
        return (
            <View style={{flex: 1}}>
                <View style={styles.nav}>
                    <Image source={require('../assets/logo.png')} style={styles.navIcon}/>
                    <Text style={styles.navTitle}>{strings(APP_NAME)}</Text>
                    <View style={{flex: 1}}/>
                    <TouchableOpacity onPress={()=>{this.setState({sharingDialogVisible: true})}}>
                        <Image source={require('../assets/add.png')} style={styles.addIcon}/>
                    </TouchableOpacity>
                </View>
                <FlatList
                    contentContainerStyle={styles.FlatList}
                    data={this.state.playLists}
                    renderItem={({item, index})=>(
                        <PlayListItem
                            item={item}
                            onPress={()=>this.onPressItem(item)}
                        />
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    onEndReachedThreshold={0.1}
                    onEndReached={this.onEndReached}
                />
                <Dialog.Container 
                    visible={this.state.sharingDialogVisible}
                    contentStyle={{width: '80%'}}
                >
                    <Dialog.Title>Add new video</Dialog.Title>
                    <Dialog.Description>
                        Paste link to YouTube video below.
                    </Dialog.Description>
                    <Dialog.Input onChangeText={(pastedVideoUrl)=>this.setState({pastedVideoUrl})}/>
                    <Dialog.Button 
                        label="Cancel" 
                        onPress={()=>this.setState({
                            sharingDialogVisible: false,
                            pastedVideoUrl: ""
                        })}
                    />
                    <Dialog.Button 
                        label="Done" 
                        onPress={this.onPasteYoutubeLink}
                    />
                </Dialog.Container>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    FlatList: {
        paddingVertical: 4,
    },

    nav: {
        padding: 12, 
        paddingTop: Platform.select({
            ios: getStatusBarHeight() + 12,
            android: 12
        }),
        elevation: 2, 
        backgroundColor: '#fff', 
        flexDirection: 'row', 
        alignItems: 'center'
    },

    navIcon: {
        width: 32, 
        height: 32,
        marginRight: 8
    },

    addIcon: {
        width: 30, 
        height: 30,
        marginHorizontal: 4,
    },

    navTitle: {
        fontSize: 20, 
        fontWeight: 'bold'
    }
});
  