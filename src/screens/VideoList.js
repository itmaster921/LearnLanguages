import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, SafeAreaView, TouchableOpacity} from 'react-native';
import VideoListItem from "../components/VideoListItem";
import SubscribeModal from './SubscribeModal';
import api from '../api';
import appdata, {FAV_ICON} from '../appdata';
import store from '../store';

export default class VideoList extends Component {
    static navigationOptions = ({ navigation }) => {
        return {
            headerTitle: <Text style={{fontSize: 20, fontWeight: 'bold'}}>{navigation.getParam('playlistTitle')}</Text>
        };
    };
    
    constructor(props){
        super(props);
        let {state: {params: {playlistId}}} = this.props.navigation;
        this.state = {
            videos: [], 
            playlistId,
            nextPageToken: "",
            focus: true,
            visibleSubscribeModal: false
        };
    }

    async componentDidMount() {
        let playlistItems = await api.getVideoItemsInPlaylist(this.state.playlistId);
        this.setState({videos: playlistItems.items, nextPageToken: playlistItems.nextPageToken});
        this.props.navigation.addListener('willFocus', (route) => { 
            this.setState({focus: true});
        });
        this.props.navigation.addListener('willBlur', (route) => { 
            this.setState({focus: false});
        });
    }

    onEndReached = async ()=>{
        if(!this.state.nextPageToken) return;
        let playlistItems = await api.getVideoItemsInPlaylist(this.state.playlistId, this.state.nextPageToken);
        this.setState({videos: [...this.state.videos, ...playlistItems.items], nextPageToken: playlistItems.nextPageToken});                
    }

    onPressItem = async (item) => {
        let currentTime = await appdata.getCurrentTimeForHistoryVideo(item.id);
        console.log({currentTime});
        await appdata.addHistoryVideo(item);
        let {navigate, state: {params: {human, auto}}} = this.props.navigation;
        navigate('Player', {videoId: item.id, human, auto, currentTime});
    }

    render(){
        return (
            <SafeAreaView style={{flex: 1}}>
                <View style={{flex: 1}}>
                    <FlatList
                        contentContainerStyle={styles.flatList}
                        extraData={this.state}
                        data={this.state.videos}
                        renderItem={({item, index})=>(
                            <VideoListItem
                                item={item}
                                onPress={()=>this.onPressItem(item)}
                                focus={this.state.focus}
                            />
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        onEndReachedThreshold={0.1}
                        onEndReached={this.onEndReached}
                    />
                </View>
                {!store.isPurchased &&
                    <TouchableOpacity 
                        onPress={()=>this.setState({visibleSubscribeModal: true})}
                        style={{
                            padding: 8,
                            alignItems: "center",
                            backgroundColor: "#00d900"
                        }}
                    >
                        <Text style={{fontSize: 20}}>Subscribe to remove all ads</Text>
                    </TouchableOpacity>
                }
                <SubscribeModal 
                    visible={this.state.visibleSubscribeModal}
                    onCancel={()=>this.setState({visibleSubscribeModal: false})}
                    onSuccess={()=>{
                        this.setState({visibleSubscribeModal: false});
                        store.isPurchased = true;
                        this.forceUpdate();
                    }}
                />
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    
    flatList: {
        paddingVertical: 4,
    },
});
