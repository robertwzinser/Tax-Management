import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />

      </Routes>
    </Router>
  );
}

export default App;