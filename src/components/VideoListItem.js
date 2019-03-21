import React, {Component} from 'react';
import {Text, View, Image, TouchableOpacity} from 'react-native';
import {FAV_ICON} from '../appdata';
import appdata from '../appdata';
import Icon from 'react-native-vector-icons/dist/FontAwesome5';
import moment from "moment";
import { timeStringFromSeconds } from '../utils';

export default class VideoListItem extends Component {
    state = {
        flagCount: 0,
        watchedCount: 0,
    }

    async componentDidMount() {

    }

    async componentWillReceiveProps(props){
        let {item, focus} = props;
        if(focus){
            let selectedTrack = await appdata.getSelectedTracks(item.id);
            let flaggedScenes = await appdata.getFlaggedScenes(item.id, selectedTrack.target);
            let flagCount = flaggedScenes.length;

            let watchedCount = await appdata.getWatchedCount(item.id);
            this.setState({flagCount, watchedCount});
        }
    }

    render() {
        let {item, onPress} = this.props;
        let thumbnailUrl = (item.snippet.thumbnails) ? Object.values(item.snippet.thumbnails)[0].url : FAV_ICON;
        let duration = moment.duration(item.contentDetails.duration).asSeconds();
        let durationStr = timeStringFromSeconds(duration - 1);

        return (
            <TouchableOpacity style={styles.item} onPress={onPress}>
                <View>
                    <Image
                        style={styles.image}
                        source={{uri: thumbnailUrl}}
                    />
                    <View style={styles.thumbnailOverlay}>
                        <Text style={styles.duration}>{durationStr}</Text>
                    </View>
                </View>
                <View style={styles.titleView}>
                    <Text style={styles.title} numberOfLines={3}>{item.snippet.title}</Text>
                    <View style={styles.flagView}>
                        <Text style={{marginRight: 8}}>{this.state.watchedCount}x</Text>
                        <Icon name="flag" size={16} color='red' solid/>
                        <Text style={{marginLeft: 8}}>{this.state.flagCount}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }    
}

const styles = {
    item: {
        flex: 1,
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    
    image: {
        width: 120, 
        height: 90, 
        resizeMode: 'cover'
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

    flagView: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 0
    },

    thumbnailOverlay: {
        backgroundColor: '#0006',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },

    duration: {
        color: '#fff',
        position: 'absolute',
        bottom: 4,
        right: 4,
    }
}