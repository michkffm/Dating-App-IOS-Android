import { View, Text, Button } from 'react-native'
import React from 'react'
import {usePathname, useRouter,Link} from 'expo-router'

const BlogPage = () => {
    const router = useRouter()
  return (
    <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
      <Text style={{fontSize:18}}>Blog Page</Text>
      <Button onPress={()=>router.push("/blog/1")} title='go to blog 1'/>
      <Button onPress={()=>router.push("/blog/2")} title='go to blog 2'/>
      <Button onPress={()=>router.push("/blog/3?author=paco")} title='go to blog 3'/>
      <Link href={{
        usePathname: "/blog/4",
        search: {author: "franck"}
      }}>
        <Text style={{fontSize:18}}>go to blog 4</Text>
      </Link>
      <Button onPress={()=>router.back()} title='go back'/>
    </View>
  )
}

export default BlogPage