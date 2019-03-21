import React, {Component} from 'react';
import {Text, View, Image, TouchableOpacity} from 'react-native';
import {FAV_ICON} from '../appdata';

export default PlayListItem = (props) => {
    let {item, onPress} = props;
    let thumbnailUrl = (item.snippet.thumbnails) ? Object.values(item.snippet.thumbnails)[0].url : FAV_ICON;
    return (
        <TouchableOpacity style={styles.item} onPress={onPress}>
            <View>
                <Image
                    style={styles.image}
                    source={{uri: thumbnailUrl}}
                />
                <View style={styles.thumbnailOverlay}>
                    <Text style={styles.count}>{item.contentDetails.itemCount}</Text>
                </View>
            </View>
            <View style={styles.titleView}>
                <Text style={styles.title} numberOfLines={3}>{item.snippet.title}</Text>
                {/* <Text style={styles.detail} numberOfLines={3}>{item.snippet.channelTitle}</Text> */}
            </View>
        </TouchableOpacity>
    )
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
        fontSize: 20,        
    },

    detail: {
        fontSize: 16,
    },

    titleView: {
        flex: 1,
        marginHorizontal: 8,
    },

    thumbnailOverlay: {
        backgroundColor: '#0006',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },

    count: {
        color: '#fff',
        fontSize: 24,
    }
}