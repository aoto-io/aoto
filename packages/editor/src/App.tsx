import { Editor } from './editor'
import { SideBar } from './sidebar'

function App() {
  return (
    <div className='flex h-[100%] w-[100%]'>
      <SideBar></SideBar>
      <Editor className='flex-1'></Editor>
    </div>
  )
}

export default App
