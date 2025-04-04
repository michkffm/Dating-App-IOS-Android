import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const Upload = ({ onCameraPress, onRemovePress }) => {
  return (
    <View>
      <TouchableOpacity style={styles.optionBtn} onPress={onCameraPress}>
        <MaterialCommunityIcons 
          name='camera-outline'
          size={30}
          color='blue' // Couleur à personnaliser
        />
        <Text style={styles.optionText}>Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionBtn} onPress={onRemovePress}>
        <MaterialCommunityIcons 
          name='trash-can-outline'
          size={30}
          color='red' // Couleur à personnaliser
        />
        <Text style={styles.optionText}>Remove</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  optionBtn: {
    flexDirection: 'row', // Pour afficher l'icône et le texte côte à côte
    alignItems: 'center', // Aligner l'icône et le texte
    marginVertical: 10, // Espacement vertical entre les boutons
  },
  optionText: {
    marginLeft: 10, // Espacement entre l'icône et le texte
    fontSize: 16, // Taille de police du texte
  },
});

export default Upload;
