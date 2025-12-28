import { SideBar } from './sidebar'
import { Canvas } from './canvas'

function App() {
  return (
    <div className='flex h-[100%] w-[100%]'>
      <SideBar></SideBar>
      <Canvas></Canvas>
    </div>
  )
}

export default App
