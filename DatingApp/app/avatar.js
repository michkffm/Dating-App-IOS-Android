import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import React from 'react'
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Avatar = ({ uri, aviOnly, imgStyle, onButtonPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <Image 
          source={{ uri }} 
          style={[
            styles.image,
            aviOnly && { height: 35, width: 35, borderWidth: 0 },
            imgStyle,
          ]} 
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.editButton} onPress={onButtonPress}>
        <MaterialCommunityIcons
          name='camera-outline'
          size={30}
          color='blue'  // Utilisation d'une couleur par défaut ici
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop:200  // Centrer l'ensemble du contenu
  },
  image: {
    width: 100,  // Valeur par défaut
    height: 100,  // Valeur par défaut
    borderRadius: 50,  // Par exemple, pour rendre l'image ronde
    borderWidth: 2,  // Exemple de bordure
    borderColor: 'black',  // Exemple de couleur de bordure
  },
  editButton: {
    position: 'absolute',  // Placer le bouton de l'appareil photo au-dessus de l'image
    bottom: 10,  // Espacement par rapport au bas de l'image
    right: 147,  // Espacement par rapport à la droite de l'image
    backgroundColor: 'rgba(255, 255, 255, 0.7)',  // Fond légèrement transparent
    borderRadius: 20,  // Rendre le fond rond
    padding: 5,  // Espacement autour de l'icône
  },
});

export default Avatar;
