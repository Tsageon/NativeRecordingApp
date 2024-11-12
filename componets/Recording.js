import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, Pressable, StatusBar, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RecordingsScreen() {
    const [recordings, setRecordings] = useState([]);
    const [recording, setRecording] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogVisible, setDialogVisible] = useState(false);
    const [recordingName, setRecordingName] = useState('');

    useEffect(() => {
        loadRecordings();
    }, []);

    async function loadRecordings() {
        const storedRecordings = await AsyncStorage.getItem('recordings') || '[]';
        setRecordings(JSON.parse(storedRecordings));
    }

    async function startRecording() {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) return;

            const { recording } = await Audio.Recording.createAsync(
                Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
            );
            setRecording(recording);
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    }

    async function stopRecording() {
        try {
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            setDialogVisible(true);
            setRecordingName('');

            const newRecording = {
                id: Date.now().toString(),
                uri,
                date: new Date().toLocaleString(),
                name: recordingName || 'Untitled',
            };

            const updatedRecordings = [...recordings, newRecording];
            setRecordings(updatedRecordings);
            await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    }

    async function handleRecording() {
        if (recording) {
            await stopRecording();
        } else {
            await startRecording();
        }
    }

    async function playRecording(recording) {
        const { sound } = await Audio.Sound.createAsync({ uri: recording.uri });
        await sound.playAsync();
    }

    async function deleteRecording(id) {
        const updatedRecordings = recordings.filter((rec) => rec.id !== id);
        setRecordings(updatedRecordings);
        await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
    }

    const handleSaveRecording = () => {
        setDialogVisible(false);
        if (recordingName) {
            setRecordings((prevRecordings) => {
                const updated = [...prevRecordings];
                updated[updated.length - 1].name = recordingName;
                AsyncStorage.setItem('recordings', JSON.stringify(updated));
                return updated;
            });
        }
        setRecordingName('');
    };

    const filteredRecordings = recordings.filter((rec) =>
        rec.date.includes(searchTerm) || rec.name.includes(searchTerm)
    );

    const renderItem = ({ item }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1 }}>
            <Text style={{ flex: 1 }}>{item.name} - {item.date}</Text>

            <TouchableOpacity onPress={() => playRecording(item)}>
                <Ionicons name="play-circle-outline" size={24} color="green" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => deleteRecording(item.id)} style={{ marginLeft: 10 }}>
                <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <StatusBar style="auto" />
            <Text style={styles.heading}>Welcome to Generic Recorder</Text>

            <TextInput
                placeholder="Search by date or name"
                onChangeText={setSearchTerm}
                style={styles.searchInput}
            />

            <TouchableOpacity onPress={handleRecording} style={styles.recordButton}>
                <Ionicons name={recording ? "stop-circle-outline" : "mic-circle-outline"} size={24} color={recording ? "red" : "blue"} />
                <Text style={{ marginLeft: 8 }}>{recording ? "Stop Recording" : "New Voice Note"}</Text>
            </TouchableOpacity>

            <FlatList
                data={filteredRecordings}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={{ marginTop: 20 }}
            />

            <Modal visible={isDialogVisible} animationType="slide" transparent>
                <View style={styles.modal}>
                    <Text>Enter Recording Name:</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setRecordingName}
                        value={recordingName}
                    />
                    <Pressable style={styles.button} onPress={handleSaveRecording}>
                        <Ionicons name="save-outline" size={20} color="black" />
                        <Text style={styles.buttonText}>Save</Text>
                    </Pressable>
                    <Pressable style={styles.button} onPress={() => setDialogVisible(false)}>
                        <Ionicons name="close-circle-outline" size={20} color="black" />
                        <Text style={styles.buttonText}>Cancel</Text>
                    </Pressable>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    searchInput: { marginBottom: 10, padding: 8, borderWidth: 1, borderRadius: 5 },
    recordButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    modal: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, padding: 10, width: 200, borderRadius: 5, backgroundColor: '#fff' },
    button: {
        flexDirection: 'row',
        width: 150,
        paddingVertical: 15,
        backgroundColor: '#ddd',
        borderRadius: 15,
        marginTop: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        marginLeft: 5,
        fontWeight: 'bold',
    },
});
