import React, { useState } from "react";
import "./signup.css";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc"; // Import FcGoogle
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

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
  const [message, setMessage] = useState({ type: "", text: "" });

  const API_BASE_URL = "http://157.230.170.41:8000/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }

    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({ type: "", text: "" });

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        setMessage({
          type: "success",
          text: "Account created successfully! Redirecting to login...",
        });

        setForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        if (response.status === 422) {
          if (data.detail && Array.isArray(data.detail)) {
            const fieldErrors = {};
            data.detail.forEach((error) => {
              const field = error.loc[error.loc.length - 1];
              fieldErrors[field] = error.msg;
            });
            setErrors(fieldErrors);
          } else {
            setMessage({
              type: "error",
              text: "Please check your input and try again.",
            });
          }
        } else if (response.status === 400) {
          setMessage({
            type: "error",
            text: data.message || data.detail || "This email is already registered.",
          });
        } else {
          setMessage({
            type: "error",
            text: data.message || data.detail || "Something went wrong. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setMessage({
          type: "error",
          text: "Unable to connect to server. Please check your connection and try again.",
        });
      } else {
        setMessage({
          type: "error",
          text: "Network error. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (token) => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`${API_BASE_URL}/google-signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Google signup successful! Redirecting to dashboard...",
        });

        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("token_type", data.token_type);
        }

        setForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        if (response.status === 422) {
          setMessage({
            type: "error",
            text: "Invalid token. Please try again.",
          });
        } else {
          setMessage({
            type: "error",
            text: data.message || "Something went wrong. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Google signup error:", error);
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (response) => {
    const token = response.credential;
    handleGoogleSignup(token);
  };

  const handleGoogleFailure = (error) => {
    setMessage({
      type: "error",
      text: "Google signup failed. Please try again.",
    });
    setLoading(false);
  };

  return (
    <GoogleOAuthProvider clientId="559361808400-vm6922k7amgee0svoq45k1vi3bcego0h.apps.googleusercontent.com"> {/* Replace with your actual Client ID */}
      <div className="signup-page-wrapper">
        <div className="signup-container">
          <h2>Create Your Account</h2>

          {message.text && (
            <div className={`message ${message.type}`}>{message.text}</div>
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
                className={errors.name ? "error" : ""}
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
                className={errors.email ? "error" : ""}
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
                  className={errors.password ? "error" : ""}
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
                  className={errors.confirmPassword ? "error" : ""}
                  disabled={loading}
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.confirmPassword && (
                <span className="error-text">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" disabled={loading}>
              {loading ? (
                <span className="loading-text">
                  <span className="spinner"></span>
                  Creating Account...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="divider">or</div>

          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
            render={(renderProps) => (
              <button
                className="google-btn"
                onClick={renderProps.onClick}
                disabled={renderProps.disabled || loading}
              >
                <FcGoogle size={22} /> Sign up with Google
              </button>
            )}
          />

          <p style={{ marginTop: "30px" }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Signup;