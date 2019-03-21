import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, Modal, Linking, Platform} from 'react-native';
import { strings } from '../i18n';
import * as RNIap from 'react-native-iap';
import { ITEM_SKU, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../appdata';

export default class SubscribeModal extends Component {

    state = {
        visible: false,
        visiblePrivacyModal: false,
    }

    componentWillReceiveProps(newProps){
        const {visible} = newProps;
        this.setState({visible});
    }

    buyProduct = async () => {
        try {
            if(Platform.OS == 'ios') {
                this.setState({
                    visible: false,
                    visiblePrivacyModal: true
                });
            }else{
                this.setState({
                    visible: false,
                });
                const purchased = await RNIap.buySubscription(ITEM_SKU);
                console.log({purchased});
                this.props.onSuccess();
            }
        } catch(err) {
            console.log(err); // standardized err.code and err.message available
            this.onCancel();
        }
    }

    onSubscribe = () => {
        this.buyProduct();
    }

    onCancel = () => {
        this.setState({visible: false});
        this.props.onCancel();
    }

    onAcceptPrivacy = async () => {
        this.setState({visiblePrivacyModal: false});
        try {
            const products = await RNIap.getProducts([ITEM_SKU]);
            console.log({products});
            const purchased = await RNIap.buySubscription(ITEM_SKU);
            console.log({purchased});
            this.props.onSuccess();
        } catch(err) {
            console.log(err); // standardized err.code and err.message available
            this.onCancelPrivacy();
        }
    }

    onCancelPrivacy = () => {
        this.setState({visiblePrivacyModal: false});
        this.props.onCancel();
    }

    render () {

        return (
            <View style={{backgroundColor: '#0000'}}>
                <Modal
                    supportedOrientations={[ 'portrait', 'landscape' ]}
                    animationType="slide"
                    transparent={true}
                    visible={this.state.visible}
                    onRequestClose={this.onCancel}
                >
                    <View style={styles.container}>
                        <View style={styles.modal}>
                            <Text style={styles.desc}>
                                Would you like to subscribe for $1.49/month and remove all ads?
                            </Text>
                            <View style={styles.buttonBar}>
                                <Button title={strings("No Thanks")} onPress={this.onCancel}/>
                                <Button title={strings("Subscribe")} onPress={this.onSubscribe}/>
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    supportedOrientations={[ 'portrait', 'landscape' ]}
                    animationType="slide"
                    transparent={true}
                    visible={this.state.visiblePrivacyModal}
                    onRequestClose={this.onCancelPrivacy}
                >
                    <View style={styles.container}>
                        <View style={styles.modal}>
                            <Text style={styles.desc}>
                                To use this app, A $1.49/month purchase will be applied to your iTunes account at the end of the trial.
                                Subscriptions will automatically renew unless canceled within 24-hours before the end of the current period. You can cancel anytime with your iTunes account settings. Any unused portion of a free trial will be forfeited if you purchase a subscription.
                            </Text>
                            <Button 
                                title={"Terms of Service"} 
                                onPress={()=>{
                                    Linking.openURL(TERMS_OF_SERVICE_URL).catch((err) =>
                                        console.error('An error occurred', err) 
                                    )
                                }}
                            />
                            <Button 
                                title={"Privacy Policy"} 
                                onPress={()=>{
                                    Linking.openURL(PRIVACY_POLICY_URL).catch((err) =>
                                        console.error('An error occurred', err) 
                                    )
                                }}
                            />
                            <View style={styles.buttonBar}>
                                <Button title={strings("Cancel")} onPress={this.onCancelPrivacy}/>
                                <Button title={strings("OK")} onPress={this.onAcceptPrivacy}/>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        )
    }
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
        backgroundColor: '#0006',
        justifyContent: 'center'
	},

	modal: {
        backgroundColor: '#fff',
        margin: 12,
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    
    buttonBar: {
        flexDirection: 'row', 
        justifyContent: 'space-between',
        marginTop: 16,
        paddingHorizontal: 16,
    }, 

    desc: {
        fontSize: 17,
        marginBottom: 16,
        textAlign: 'justify'
    }
});
