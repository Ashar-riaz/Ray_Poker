import React, { useState } from "react";
import "./signup.css";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE_URL = 'http://127.0.0.1:8000';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // Clear general message
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage({ type: '', text: '' });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
          confirm_password: form.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success response
        setMessage({ 
          type: 'success', 
          text: 'Account created successfully! Redirecting to login...' 
        });
        
        // Clear form
        setForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);

      } else {
        // Handle different error responses
        if (response.status === 422) {
          // Validation errors
          if (data.detail && Array.isArray(data.detail)) {
            const fieldErrors = {};
            data.detail.forEach(error => {
              const field = error.loc[error.loc.length - 1];
              fieldErrors[field] = error.msg;
            });
            setErrors(fieldErrors);
          } else {
            setMessage({ 
              type: 'error', 
              text: 'Please check your input and try again.' 
            });
          }
        } else if (response.status === 400) {
          // Bad request (e.g., email already exists)
          setMessage({ 
            type: 'error', 
            text: data.message || data.detail || 'This email is already registered.' 
          });
        } else {
          // Other errors
          setMessage({ 
            type: 'error', 
            text: data.message || data.detail || 'Something went wrong. Please try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage({ 
          type: 'error', 
          text: 'Unable to connect to server. Please check your connection and try again.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Network error. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Add real Google OAuth logic here
    setMessage({ 
      type: 'info', 
      text: 'Google signup will be available soon!' 
    });
  };

  return (
    <div className="signup-page-wrapper">
      <div className="signup-container">
        <h2>Create Your Account</h2>
        
        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className={errors.name ? 'error' : ''}
              disabled={loading}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className={errors.email ? 'error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className={errors.password ? 'error' : ''}
                disabled={loading}
              />
              <span
                className="eye-icon"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="input-group">
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className={errors.confirmPassword ? 'error' : ''}
                disabled={loading}
              />
              <span
                className="eye-icon"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <span className="loading-text">
                <span className="spinner"></span>
                Creating Account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="divider">or</div>
        
        <button className="google-btn" onClick={handleGoogleSignup} disabled={loading}>
          <FcGoogle size={22} /> Sign up with Google
        </button>
        
        <p style={{ marginTop: "30px" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;