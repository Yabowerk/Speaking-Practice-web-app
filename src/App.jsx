import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Home from "./pages/Home";
import Recording from "./pages/Recording";
import Results from "./pages/Results";

function App() {
  const [count, setCount] = useState(0)

  return (
   
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Recording" element={<Recording />} />
        <Route path="/Results" element={<Results />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
