import React, { Component } from 'react';
import {
    View,
    Platform,
    StatusBar
} from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper'

const MyStatusBar = (props) => {
    return (
        Platform.OS == 'ios' ? 
        <View 
            style={{
                backgroundColor: '#000',
                height: getStatusBarHeight(true),
            }}
        >
            <StatusBar barStyle='light-content' />
        </View>
        :
        <View/>
    )
}

export default MyStatusBar;