import logo from './logo.svg';
import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import Home from "./pages/Home";
import AddConfig from './pages/AddConfig';
import AllConfigs from './pages/AllConfigs';
import HowToUse from './pages/HowToUse';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/themes/viva-dark/theme.css';
import 'primeicons/primeicons.css';

function App() {
  return (
    <PrimeReactProvider>
      <Router>
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" Component={Home} />
            <Route path="/all-configs" element={<AllConfigs />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/new-doc-config" element={<AddConfig key={1} />} />
            <Route path="/doc-config/:id" element={<AddConfig key={2} />} />
            <Route path="/doc-config2/:id" element={<AddConfig key={3} />} />
          </Routes>
        </main>
      </Router>
    </PrimeReactProvider>
  );
}

export default App;
