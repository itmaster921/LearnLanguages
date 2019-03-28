/** @format */

import {AppRegistry, YellowBox} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import { Sentry } from 'react-native-sentry';

Sentry.config('https://e9cd42ae2e1d4f0384f946762e4f5d4a@sentry.io/1279640').install();

YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated', 'Module RCTImageLoader']);

AppRegistry.registerComponent(appName, () => App);
