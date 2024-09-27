import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import './App.css';
import EmployerSignup from './pages/EmployerSignup';
import EmployerSignin from './pages/EmployerSignin';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />


        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/employersignup"element={<EmployerSignup/>}/>
        <Route path="/employersignin"element={<EmployerSignin/>}/>

      </Routes>
    </Router>
  );
}

export default App;