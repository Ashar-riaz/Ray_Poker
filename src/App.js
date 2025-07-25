import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RayLandingPage from "./RayLandingPage";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from './pages/ForgotPassword';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RayLandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </Router>
  );
};

export default App;
