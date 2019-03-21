import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity, SafeAreaView} from 'react-native';
import VideoListItem from "../components/VideoListItem";
import appdata, {FAV_ICON} from '../appdata';
import { timeStringFromSeconds } from '../utils';

export default class History extends Component {
    constructor(props){
        super(props);
        this.state = {
            videos: [], 
            focus: true,
            totalUsedTime: 0
        }
    }

    async componentDidMount() {
        let videos = await appdata.getHistoryVideos();
        let totalUsedTime = await appdata.getTotalUsedTime();
        this.setState({videos, totalUsedTime});

        this.props.navigation.addListener('willFocus', async (route) => { 
            let videos = await appdata.getHistoryVideos();
            this.setState({videos, focus: true});
        });

        this.props.navigation.addListener('willBlur', (route) => { 
            this.setState({focus: false});
        });
    }

    onPressItem = (item) => {
        let {navigate} = this.props.navigation;
        navigate('Player', {videoId: item.id, currentTime: item.currentTime})
    }

    render(){
        return (
            <SafeAreaView style={{flex: 1}}>
                <View style={{flex: 1}}>
                    <Text style={styles.totalUsedTime}>Total used time: {timeStringFromSeconds(this.state.totalUsedTime)}</Text>
                    <FlatList
                        contentContainerStyle={styles.flatList}
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
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    flatList: {
        paddingVertical: 4,
    },

    item: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    title: {
        fontSize: 18,        
    },

    detail: {
        fontSize: 16,
    },

    titleView: {
        flex: 1,
        marginHorizontal: 8,
    },

    totalUsedTime: {
        fontSize: 22,
        margin: 8,
    }
});
  