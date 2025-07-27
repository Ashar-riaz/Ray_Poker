import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css"; // Your enhanced CSS file
import { FaSignOutAlt, FaHistory, FaArrowLeft, FaPaperPlane, FaRobot, FaUser, FaCopy, FaCheck } from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [response, setResponse] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [storedQuestions, setStoredQuestions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const API_BASE_URL = "http://localhost:8000";

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, response]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [scenario]);

  // Check for authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setMessage({ type: "error", text: "Please log in to access the dashboard." });
      setTimeout(() => navigate("/login"), 1500);
    }
  }, [navigate]);

  // Fetch stored questions on mount
  useEffect(() => {
    fetchStoredQuestions();
  }, []);

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchStoredQuestions = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/stored-questions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStoredQuestions(data);
      } else {
        setMessage({ type: "error", text: "Failed to fetch stored questions." });
      }
    } catch (error) {
      console.error("Fetch stored questions error:", error);
      setMessage({ type: "error", text: "Network error while fetching questions." });
    }
  };

  const handleScenarioSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setErrors({});

    if (!scenario.trim()) {
      setErrors({ scenario: "Please enter a poker scenario." });
      textareaRef.current?.focus();
      return;
    }

    setLoading(true);
    setIsTyping(true);

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/analyze-poker-scenario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scenario: scenario.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Simulate typing effect
        setTimeout(() => {
          setIsTyping(false);
          setResponse(data.recommendation);
          setChatHistory(data.chat_history);
          setMessage({ type: "success", text: "Analysis complete! 🎯" });
          setScenario("");
          fetchStoredQuestions();
        }, 1000); // Simulate AI thinking time
      } else {
        const data = await response.json().catch(() => ({}));
        setIsTyping(false);
        
        if (response.status === 400) {
          setErrors({ scenario: data.detail || "Invalid scenario. Please try again." });
        } else if (response.status === 401) {
          setMessage({ type: "error", text: "Session expired. Please log in again." });
          setTimeout(() => navigate("/login"), 1500);
        } else {
          setMessage({ type: "error", text: data.detail || "Failed to analyze scenario." });
        }
      }
    } catch (error) {
      console.error("Analyze scenario error:", error);
      setIsTyping(false);
      setMessage({ type: "error", text: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleScenarioSubmit(e);
    }
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token_type");
    setMessage({ type: "success", text: "Logged out successfully! 👋" });
    setTimeout(() => navigate("/login"), 1500);
  };

  const toggleHistory = () => {
    setShowHistory((prev) => !prev);
  };

  const handleQuestionClick = (question) => {
    setScenario(question.question);
    textareaRef.current?.focus();
  };

  const TypingIndicator = () => (
    <div className="chat-message ai typing-indicator">
      <div className="message-author">
        <FaRobot className="inline mr-2" />
        Ray is thinking...
      </div>
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page-wrapper min-h-screen flex bg-gradient-to-br from-gray-900 via-slate-800 to-slate-700">
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        {/* Enhanced Header */}
        <header>
          <div className="header-brand">
            <div className="logo-icon">
              R
            </div>
            <h1 className="brand-title">Ray Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
            data-tooltip="Sign out of your account"
          >
            <FaSignOutAlt />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </header>

        {/* Enhanced Message Display */}
        {message.text && (
          <div className={`message ${message.type} ${message.type === 'success' ? 'success-bounce' : message.type === 'error' ? 'error-shake' : ''}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 main-content">
            <h2 className="section-title">
              Analyze Poker Scenario
            </h2>
            
            <form onSubmit={handleScenarioSubmit} className="scenario-form">
              <div className="input-group">
                <textarea
                  ref={textareaRef}
                  placeholder="Describe your poker situation in detail... 
                  
Examples:
• 'I'm in the big blind with A♠K♥. UTG raises to 3BB, fold to me. Pot is 4.5BB, effective stacks 100BB. What should I do?'
• 'Final table, 6 players left. I have 15BB in the cutoff with Q♦J♦. UTG shoves for 12BB. Action?'

💡 Tip: Press Ctrl+Enter to submit quickly!"
                  value={scenario}
                  onChange={(e) => {
                    setScenario(e.target.value);
                    if (errors.scenario) setErrors({});
                  }}
                  onKeyDown={handleKeyPress}
                  className={`scenario-textarea ${errors.scenario ? 'error' : ''}`}
                  disabled={loading}
                  rows={6}
                />
                {errors.scenario && (
                  <div className="error-text">
                    {errors.scenario}
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading || !scenario.trim()}
                className="submit-btn"
              >
                {loading ? (
                  <div className="loading-content">
                    <div className="spinner"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaPaperPlane />
                    <span>Analyze Scenario</span>
                  </div>
                )}
              </button>
            </form>

            {/* Enhanced Chat Display */}
            {(chatHistory.length > 0 || response || isTyping) && (
              <div className="chat-history">
                <div className="chat-title">
                  💬 Conversation
                </div>
                
                <div className="chat-messages">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`chat-message ${msg.role === "human" ? "human" : "ai"} fade-in`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="message-author">
                        {msg.role === "human" ? (
                          <>
                            <FaUser className="inline mr-2" />
                            You
                          </>
                        ) : (
                          <>
                            <FaRobot className="inline mr-2" />
                            Ray
                          </>
                        )}
                        <button
                          onClick={() => copyToClipboard(msg.content, `${msg.role}-${index}`)}
                          className="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity"
                          data-tooltip="Copy message"
                        >
                          {copiedMessageId === `${msg.role}-${index}` ? <FaCheck /> : <FaCopy />}
                        </button>
                      </div>
                      <div className="message-content">
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && <TypingIndicator />}
                  
                  {response && !isTyping && (
                    <div className="response-section slide-up">
                      <div className="response-title">
                        🤖 Ray's Latest Analysis
                        <button
                          onClick={() => copyToClipboard(response, 'latest-response')}
                          className="ml-auto text-sm opacity-60 hover:opacity-100 transition-opacity"
                          data-tooltip="Copy analysis"
                        >
                          {copiedMessageId === 'latest-response' ? <FaCheck /> : <FaCopy />}
                        </button>
                      </div>
                      <div className="response-content">
                        {response}
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced History Sidebar */}
          <div className="lg:col-span-1 history-sidebar">
            <button
              onClick={toggleHistory}
              className="history-toggle tooltip"
              data-tooltip={showHistory ? "Hide question history" : "Show question history"}
            >
              <FaHistory />
              <span>{showHistory ? "Hide History" : "Show History"}</span>
            </button>
            
            {showHistory && (
              <div className="stored-questions">
                <h3 className="text-lg font-semibold mb-4 text-amber-400">
                  📚 Question History
                </h3>
                
                {storedQuestions.length > 0 ? (
                  <div className="questions-container">
                    {storedQuestions.map((q, index) => (
                      <div
                        key={q.id}
                        className="question-item interactive-hover tooltip"
                        onClick={() => handleQuestionClick(q)}
                        data-tooltip="Click to reuse this question"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="question-text">
                          <strong>Q:</strong> {q.question.length > 100 ? 
                            `${q.question.substring(0, 100)}...` : 
                            q.question
                          }
                        </div>
                        <div className="answer-text">
                          <strong>A:</strong> {q.answer.length > 150 ? 
                            `${q.answer.substring(0, 150)}...` : 
                            q.answer
                          }
                        </div>
                        <div className="question-timestamp">
                          {new Date(q.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-questions">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>No questions yet.</p>
                    <p className="text-xs mt-2">Ask Ray your first poker question!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional CSS for typing indicator */}
      <style jsx>{`
        .typing-indicator {
          animation: fadeIn 0.5s ease-in;
        }
        
        .typing-dots {
          display: flex;
          gap: 4px;
          padding: 1rem 0;
        }
        
        .typing-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: rgba(245, 158, 11, 0.7);
          animation: typingDots 1.4s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes typingDots {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        /* Smooth transitions for all interactive elements */
        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;