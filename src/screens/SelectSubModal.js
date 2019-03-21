import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity, Modal, Picker, TouchableWithoutFeedback} from 'react-native';
import api from '../api';
import { strings } from '../i18n';
import appdata, {TARGET_LANG} from '../appdata';
import ModalSelector from 'react-native-modal-selector'

export default class SelectSubModal extends Component {
    state={
        selectedTargetTrackKey: "",
        selectedNativeTrackKey: "",
        targetTracks: [],
        nativeTracks: [],
    }

    async componentWillReceiveProps (props) {
        let {subtitleTracks, targetTrack, nativeTrack} = props;
        const NATIVE_LANG = await appdata.getNativeLang();
        let targetTracks = subtitleTracks.filter(track=>track.lang_code.includes(TARGET_LANG));
        let nativeTracks = subtitleTracks.filter(track=>track.lang_code.includes(NATIVE_LANG));

        this.setState({
            targetTracks,
            nativeTracks,
            selectedTargetTrackKey: targetTrack.key,
            selectedNativeTrackKey: nativeTrack.key,
            selectedTargetTrackLabel: targetTrack.label,
            selectedNativeTrackLabel: nativeTrack.label,
        });
    }

    onPressOK = () => {
        let {subtitleTracks, onSelect} = this.props;

        let targetTrack = subtitleTracks.find(track=>track.key == this.state.selectedTargetTrackKey);
        let nativeTrack = subtitleTracks.find(track=>track.key == this.state.selectedNativeTrackKey);

        onSelect(targetTrack, nativeTrack);
    }

    render () {
        let {visible, onSelect, onCancel} = this.props;
        return (
            <Modal
                supportedOrientations={[ 'portrait', 'landscape' ]}
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={onCancel}
            >
                <View style={styles.container}>
                    <View style={styles.modal}>
                        <Text style={{marginVertical: 8, fontSize: 18}}>{strings("Transcription Subtitles")}</Text>
                        <ModalSelector
                            overlayStyle={{justifyContent: 'flex-end'}}
                            cancelText="Cancel"
                            data={this.state.targetTracks}
                            initValue={this.state.selectedTargetTrackLabel}
                            onChange={(option)=>{ this.setState({selectedTargetTrackKey: option.key}) }} />
                        <Text style={{marginVertical: 8, fontSize: 18}}>{strings("Translation Subtitles")}</Text>
                        <ModalSelector
                            overlayStyle={{justifyContent: 'flex-end'}}
                            cancelText="Cancel"
                            data={this.state.nativeTracks}
                            initValue={this.state.selectedNativeTrackLabel}
                            onChange={(option)=>{ this.setState({selectedNativeTrackKey: option.key}) }} />
                        <View style={styles.buttonBar}>
                            <Button title={strings("Cancel")} onPress={onCancel}/>
                            <Button title={strings("OK")} onPress={this.onPressOK}/>
                        </View>
                    </View>
                </View>
            </Modal>
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
        paddingHorizontal: 16,
        marginTop: 18
    }
});
