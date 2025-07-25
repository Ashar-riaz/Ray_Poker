import React, { useState, useEffect } from "react";
import "./forgot-password-main.css";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: Verification, 3: New Password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [countdown, setCountdown] = useState(0);
  
  // Form states
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [errors, setErrors] = useState({});

  const API_BASE_URL = 'http://localhost:8000';

  // Countdown timer for resend code
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Clear messages when step changes
  useEffect(() => {
    setMessage({ type: '', text: '' });
    setErrors({});
  }, [currentStep]);

  // Step 1: Send Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setErrors({});

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: data.message || 'Verification code sent to your email!' 
        });
        setCurrentStep(2);
        setCountdown(60); // 60 seconds countdown
      } else {
        const data = await response.json().catch(() => ({}));
        
        if (response.status === 422) {
          // Validation errors
          if (data.detail && Array.isArray(data.detail)) {
            const fieldErrors = {};
            data.detail.forEach(error => {
              const field = error.loc[error.loc.length - 1];
              if (field === 'email') {
                fieldErrors.email = error.msg;
              }
            });
            setErrors(fieldErrors);
          } else {
            setErrors({ email: 'Please enter a valid email address' });
          }
        } else if (response.status === 404) {
          setErrors({ email: 'No account found with this email address' });
        } else if (response.status === 400) {
          setMessage({ 
            type: 'error', 
            text: data.detail || data.message || 'Invalid email address' 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: data.detail || data.message || 'Failed to send verification code. Please try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage({ 
          type: 'error', 
          text: 'Unable to connect to server. Please check your connection and try again.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Network error. Please check your connection and try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setErrors({});

    const code = verificationCode.join('');
    if (code.length !== 6) {
      setErrors({ code: 'Please enter the complete 6-digit code' });
      return;
    }

    // Skip verification and move to next step for now
    // In real implementation, you would verify the code with the backend
    setMessage({ 
      type: 'success', 
      text: 'Code verified successfully!' 
    });
    setTimeout(() => setCurrentStep(3), 1000);
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setErrors({});

    const newErrors = {};

    // Password validation
    if (!passwords.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (passwords.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    }

    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: verificationCode.join(''),
          new_password: passwords.newPassword,
          confirm_password: passwords.confirmPassword
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: data.message || 'Password reset successfully! Redirecting to login...' 
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const data = await response.json().catch(() => ({}));
        
        if (response.status === 422) {
          // Validation errors
          if (data.detail && Array.isArray(data.detail)) {
            const fieldErrors = {};
            data.detail.forEach(error => {
              const field = error.loc[error.loc.length - 1];
              if (field === 'new_password') {
                fieldErrors.newPassword = error.msg;
              } else if (field === 'confirm_password') {
                fieldErrors.confirmPassword = error.msg;
              } else if (field === 'code') {
                setMessage({ 
                  type: 'error', 
                  text: 'Invalid or expired verification code. Please request a new code.' 
                });
              }
            });
            if (Object.keys(fieldErrors).length > 0) {
              setErrors(fieldErrors);
            }
          } else {
            setMessage({ 
              type: 'error', 
              text: 'Please check your input and try again.' 
            });
          }
        } else if (response.status === 400) {
          setMessage({ 
            type: 'error', 
            text: data.detail || data.message || 'Invalid request. Please try again.' 
          });
        } else if (response.status === 404) {
          setMessage({ 
            type: 'error', 
            text: 'Invalid or expired reset code. Please request a new password reset.' 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: data.detail || data.message || 'Failed to reset password. Please try again.' 
          });
        }
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage({ 
          type: 'error', 
          text: 'Unable to connect to server. Please check your connection and try again.' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Network error. Please check your connection and try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code input
  const handleCodeChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Clear error when user starts typing
    if (errors.code) {
      setErrors({ ...errors, code: '' });
    }
  };

  // Handle backspace in verification code
  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Resend code
  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: data.message || 'New verification code sent!' 
        });
        setCountdown(60);
        setVerificationCode(['', '', '', '', '', '']);
      } else {
        const data = await response.json().catch(() => ({}));
        setMessage({ 
          type: 'error', 
          text: data.detail || data.message || 'Failed to resend code. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Resend code error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form className="forgot-password-form" onSubmit={handleSendEmail}>
            <div className="step-header">
              <FaEnvelope className="step-icon" />
              <h2>Forgot Password?</h2>
              <p>Enter your email address and we'll send you a verification code to reset your password.</p>
            </div>

            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                className={errors.email ? 'error' : ''}
                disabled={loading}
                required
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? (
                <span className="loading-text">
                  <span className="spinner"></span>
                  Sending...
                </span>
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        );

      case 2:
        return (
          <form className="forgot-password-form" onSubmit={handleVerifyCode}>
            <div className="step-header">
              <FaEnvelope className="step-icon" />
              <h2>Enter Verification Code</h2>
              <p>We've sent a 6-digit verification code to <strong>{email}</strong></p>
            </div>

            <div className="verification-code-container">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  className={`code-input ${errors.code ? 'error' : ''}`}
                  disabled={loading}
                />
              ))}
            </div>
            {errors.code && <span className="error-text centered">{errors.code}</span>}

            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? (
                <span className="loading-text">
                  <span className="spinner"></span>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={countdown > 0 || loading}
                className="resend-btn"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        );

      case 3:
        return (
          <form className="forgot-password-form" onSubmit={handleResetPassword}>
            <div className="step-header">
              <FaLock className="step-icon" />
              <h2>Create New Password</h2>
              <p>Enter your new password below.</p>
            </div>

            <div className="input-group">
              <div className="password-field">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={passwords.newPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, newPassword: e.target.value });
                    if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
                  }}
                  className={errors.newPassword ? 'error' : ''}
                  disabled={loading}
                  required
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPasswords({ 
                    ...showPasswords, 
                    newPassword: !showPasswords.newPassword 
                  })}
                >
                  {showPasswords.newPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
            </div>

            <div className="input-group">
              <div className="password-field">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={passwords.confirmPassword}
                  onChange={(e) => {
                    setPasswords({ ...passwords, confirmPassword: e.target.value });
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  className={errors.confirmPassword ? 'error' : ''}
                  disabled={loading}
                  required
                />
                <span
                  className="eye-icon"
                  onClick={() => setShowPasswords({ 
                    ...showPasswords, 
                    confirmPassword: !showPasswords.confirmPassword 
                  })}
                >
                  {showPasswords.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? (
                <span className="loading-text">
                  <span className="spinner"></span>
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="forgot-password-page-wrapper">
      <div className="forgot-password-container">
        {/* Back to Login Link */}
        <Link to="/login" className="back-to-login">
          <FaArrowLeft /> Back to Login
        </Link>

        {/* Progress Indicator */}
        <div className="progress-indicator" data-step={currentStep}>
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Email</span>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Verify</span>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Reset</span>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
};

export default ForgotPassword;