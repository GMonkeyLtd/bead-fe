import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { DesignProvider } from '@/store/DesignContext'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  // children 是将要会渲染的页面
  return (
    <DesignProvider>
      {children}
    </DesignProvider>
  )
}
  
export default App
