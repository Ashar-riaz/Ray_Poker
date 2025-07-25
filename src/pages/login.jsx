import React, { useState } from "react";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_BASE_URL = 'https://c4512133d352.ngrok-free.app';

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
    } else if (form.password.length < 1) {
      newErrors.password = 'Password cannot be empty';
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
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.toLowerCase().trim(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success response
        setMessage({ 
          type: 'success', 
          text: 'Login successful! Redirecting...' 
        });

        // Store token information (if your app uses authentication)
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('token_type', data.token_type);
        }
        
        // Clear form
        setForm({ email: "", password: "" });

        // Redirect to dashboard/home page after 1.5 seconds
        setTimeout(() => {
          navigate('/dashboard'); // Change this to your desired route
        }, 1500);

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
        } else if (response.status === 401) {
          // Unauthorized (invalid credentials)
          setMessage({ 
            type: 'error', 
            text: 'Invalid email or password. Please try again.' 
          });
        } else if (response.status === 400) {
          // Bad request
          setMessage({ 
            type: 'error', 
            text: data.message || data.detail || 'Invalid login credentials.' 
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
      console.error('Login error:', error);
      
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

  const handleGoogleLogin = () => {
    // Add real Google OAuth logic here
    setMessage({ 
      type: 'info', 
      text: 'Google login will be available soon!' 
    });
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password page or show modal
    setMessage({ 
      type: 'info', 
      text: 'Password reset functionality will be available soon!' 
    });
    // You can also navigate to a forgot password page:
    // navigate('/forgot-password');
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <h2>Login to Ray</h2>
        
        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
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
            
            {/* Forgot Password Link */}
            <div className="forgot-password-wrapper">
              <Link 
                to="/forgot-password" 
                className="forgot-password-link"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <span className="loading-text">
                <span className="spinner"></span>
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="divider">or</div>
        
        <button className="google-btn" onClick={handleGoogleLogin} disabled={loading}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
          />
          Login with Google
        </button>
        
        <p style={{ marginTop: "30px" }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;