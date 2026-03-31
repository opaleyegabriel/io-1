import {KeyboardAvoidingView, Platform } from 'react-native'
import React, { Children } from 'react'
import { store } from '@/store/store'
import { Provider } from 'react-redux'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Provider store={store}>
        <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={ Platform?.OS ==="ios" ? "padding" : "height" }
        keyboardVerticalOffset={Platform?.OS ==="ios" ? -64 : 0}
        >

        {children}
        </KeyboardAvoidingView>
        
    </Provider>
  )
}

export default Layout