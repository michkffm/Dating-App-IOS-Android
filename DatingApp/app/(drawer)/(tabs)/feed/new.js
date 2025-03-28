import { View, Text, Button } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const NewPage = () => {
  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      <Text style={{fontSize:18}}>Add new post page</Text>
      <Button onPress={()=>router.back()} title='go back'/>
    </View>
  )
}

export default NewPage