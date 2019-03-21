import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  View, 
  Image,
  Text,
} from 'react-native';
import appdata, {APP_NAME, ITEM_SKU, FREE_USE_TIME} from '../appdata';
import SelectLangModal from './SelectLangModal';
import SubscribeModal from './SubscribeModal';
import { strings } from '../i18n';
import * as RNIap from 'react-native-iap';
import store from '../store';

export default class Splash extends Component {
    state = {
        visibleLangModal: false,
        visibleSubscribeModal: false,
    }

    async componentDidMount() {

        let firstRunTime = await appdata.getItem('first-run-time');
        if(!firstRunTime) {
            let time = new Date().getTime();
            appdata.setItem('first-run-time', time);
        }

        await this.checkPurchase();

        setTimeout(async ()=>{
            if(await appdata.getNativeLang()){
                this.props.navigation.navigate('MainStack');
            }else{
                this.setState({visibleLangModal: true});
            }
        }, 2000);
    }

    checkPurchase = async () => {
        try {
            const availablePurchases = await RNIap.getAvailablePurchases();
            console.log({availablePurchases})
            let monthlyPurchase = availablePurchases.find((purchase)=>purchase.productId == ITEM_SKU);
            if (monthlyPurchase){
                store.isPurchased = true;
            }else{
                store.isPurchased = false;
                let time = new Date().getTime();
                let firstRunTime = await appdata.getItem('first-run-time');
                let usedTime = time - firstRunTime;
                setTimeout(async ()=>{
                    if(!store.isPurchased){
                        this.setState({visibleSubscribeModal: true});
                    }
                }, FREE_USE_TIME - usedTime);
            }    
        }catch {
            store.isPurchased = false;
        }
    }

    onSelectLang = async (selectedLang) => {
        console.log({selectedLang});
        if(selectedLang){
            await appdata.setNativeLang(selectedLang);
            this.setState({visibleLangModal: false});
            this.props.navigation.navigate('MainStack');
        }
    }

    onCancelSelectLang = () => {
        this.setState({visibleLangModal: false});
    }

    render() {
        return (
            <View style={styles.container}>
                <Image source={require('../assets/logo.png')} style={styles.logo}/>
                <Text style={styles.title}>{strings(APP_NAME)}</Text>
                <Text style={styles.detail}>{strings('Making Authentic Language Accessible')}</Text>
                <SelectLangModal 
                    visible={this.state.visibleLangModal}
                    onCancel={this.onCancelSelectLang}
                    onOK={this.onSelectLang}
                />
                <SubscribeModal 
                    visible={this.state.visibleSubscribeModal}
                    onCancel={()=>this.setState({visibleSubscribeModal: false})}
                    onSuccess={()=>{
                        this.setState({visibleSubscribeModal: false});
                        store.isPurchased = true;
                    }}
                />
            </View>
        );
    }
}
  
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logo: {
        width: 200,
        height: 200,
    },

    title: {
        fontSize: 24,
        fontWeight: 'bold'
    },

    detail: {
        fontSize: 18,
    }
});
  