
import './App.css'
import PortalProfessor from './pages/PortalProfessor'
import ApresentacaoPlus from './pages/ApresentacaoPlus'
import FormQParser from './pages/FormQParser'
import Tic2Des from './pages/Tic2Des'
import Navbar from './components/Navbar/Navbar'
import { Routes, Route } from 'react-router'

function App() {
  return (
    <>
      <Navbar isLogged="true" />
      <Routes>
        <Route path="/" element={<PortalProfessor/>} />
        <Route path="/apresentacaoplus" element={<ApresentacaoPlus/>} />
        <Route path="/formqparser" element={<FormQParser/>} />
        <Route path="/tic2des" element={<Tic2Des/>} />
      </Routes>
    </>
  )
}

export default App
