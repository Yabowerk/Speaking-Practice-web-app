import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from 'react'
import './App.css'
import Home from "./pages/Home";
import Recording from "./pages/Recording";
import Results from "./pages/Results";
import History from "./pages/History";

function App() {
  const [count, setCount] = useState(0)

  return (
   
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Recording" element={<Recording />} />
        <Route path="/Results" element={<Results />} />
         <Route path="/history" element={<History/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
