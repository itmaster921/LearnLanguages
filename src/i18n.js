import ReactNative from 'react-native';
import I18n from 'react-native-i18n';

// Import all locales
import locales from './locale';


// Should the app fallback to English if user locale doesn't exists
I18n.fallbacks = true;

// Define the supported translations
I18n.translations = locales

export const currentLocale = I18n.currentLocale();
export const currentLocaleTwoLetters = currentLocale.substr(0, 2);
console.log({currentLocale, currentLocaleTwoLetters})

// Is it a RTL language?
export const isRTL = currentLocale.indexOf('he') === 0 || currentLocale.indexOf('ar') === 0;
console.log('isRTL', isRTL)

// Allow RTL alignment in RTL languages
ReactNative.I18nManager.allowRTL(isRTL);

// The method we'll use instead of a regular string
export function strings(name, params = {}) {
  return I18n.t(name, params);
};

export default I18n;