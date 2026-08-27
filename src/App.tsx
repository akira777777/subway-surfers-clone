import { Canvas } from '@react-three/fiber'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Canvas 
        camera={{ position: [0, 3, 6], fov: 45 }}
        shadows
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.7} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
      </Canvas>
    </div>
  )
}
