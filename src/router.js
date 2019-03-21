import React from 'react';
import { Text } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import PlayLists from './screens/PlayLists'
import VideoList from './screens/VideoList'
import History from './screens/History';
import NativePlayer from './screens/NativePlayer';
import Splash from './screens/Splash';

import { strings } from "./i18n";
import store from "./store";

const HumanPlayLists = (props) => {
    return (
        <PlayLists human {...props}/>
    )
}

const AutoPlayLists = (props) => {
    return (
        <PlayLists auto {...props}/>
    )
}

const HumanStack = createStackNavigator({
    PlayLists: { 
        screen: HumanPlayLists,
        navigationOptions: {
            header: null,
        }
    },
    VideoList: {
        screen: VideoList, 
        navigationOptions: {
            gesturesEnabled: false
        }
    },
});

HumanStack.navigationOptions = ({ navigation }) => {
    let tabBarVisible = navigation.state.index == 0;
  
    return {
        tabBarVisible,
    };
};

const AutoStack = createStackNavigator({
    PlayLists: { 
        screen: AutoPlayLists,
        navigationOptions: {
            header: null,
        }
    },
    VideoList: {
        screen: VideoList, 
        navigationOptions: {
            gesturesEnabled: false
        }
    },
});

AutoStack.navigationOptions = ({ navigation }) => {
    let tabBarVisible = navigation.state.index == 0;
  
    return {
        tabBarVisible,
    };
};

const TabNav =  createBottomTabNavigator({
    HumanTranslation: HumanStack,
    AutoTranslation: AutoStack,
    History: History,
    // Settings: Settings,
}, {
    navigationOptions: ({ navigation }) => ({
        tabBarLabel: ({ focused, tintColor }) => {
            const { routeName } = navigation.state;
            return (
                <Text 
                    style={{
                        textAlign: 'center', 
                        fontSize: 16,
                        fontWeight: 'bold', 
                        color: tintColor
                    }}
                >
                    {strings(routeName)}
                </Text>
            );
        },
        // tabBarOnPress: ({previousScene, scene}) => {
        //     console.log(previousScene, scene);
        // },
    }),
    tabBarOptions: {
        activeTintColor: 'tomato',
        inactiveTintColor: 'gray',
    }
});

const MainStack = createStackNavigator(
    {
        MainTab: { screen: TabNav },
        Player: { screen: NativePlayer },
    },
    {
      mode: 'modal',
      headerMode: 'none',
    }
);

export const RootStack = createStackNavigator(
    {
        Splash: { screen: Splash },
        MainStack: { screen: MainStack },
    },
    {
      headerMode: 'none',
      navigationOptions: {
          gesturesEnabled: false,
      }
    }
);
