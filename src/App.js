import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import UserSettings from "./pages/UserSettings";
import DailyIncome from "./pages/DailyIncome";
import JobBoard from "./pages/JobBoard";
import Generate1099 from './pages/1099';
import Expenses from './pages/Expenses';
import Layout from "./components/Navbar/Layout";

function App() {
  return (
    <Router>
      <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
        <Route path="/" element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user-settings" element={<UserSettings />} />
          <Route path="/daily-income" element={<DailyIncome />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/job-board" element={<JobBoard />} />
          <Route path="/generate-1099" element={<Generate1099 />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;