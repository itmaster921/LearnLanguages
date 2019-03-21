import React, {Component} from 'react';
import {StyleSheet, Text, View, Button, FlatList, Image, TouchableOpacity, Modal, Picker, TouchableWithoutFeedback} from 'react-native';
import api from '../api';
import ModalSelector from 'react-native-modal-selector'
import { strings } from '../i18n';
import {LANGUAGES} from '../appdata';

export default class SelectLangModal extends Component {
    constructor(props){
        super(props);
        
        let languages = LANGUAGES.map((lang, index)=>{
            return {
                key: lang.code,
                label: lang.text,
            }
        });
        this.state={
            selectedLang: "",
            languages: [
                {kay: "", label: "None"},
                ...languages
            ]
        }    
    }

    componentDidMount () {
    }

    render () {
        let {visible, onCancel, onOK} = this.props;
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
                        <Text style={styles.desc}>{strings('select lang modal desc')}</Text>
                        <ModalSelector
                            overlayStyle={{justifyContent: 'flex-end'}}
                            cancelText="Cancel"
                            data={this.state.languages}
                            initValue={"None"}
                            onChange={(option)=>{ this.setState({selectedLang: option.key}) }} />
                        <View style={styles.buttonBar}>
                            <Button title={strings("Cancel")} onPress={onCancel}/>
                            <Button title={strings("OK")} onPress={()=>onOK(this.state.selectedLang)}/>
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
        marginTop: 16,
        paddingHorizontal: 16,
    }, 

    desc: {
        fontSize: 17,
        marginBottom: 16
    }
});
