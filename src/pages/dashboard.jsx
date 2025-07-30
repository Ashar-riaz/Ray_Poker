import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css"; // Updated CSS file
import { FaSignOutAlt, FaHistory, FaPaperPlane, FaRobot, FaUser, FaCopy, FaCheck, FaPlus } from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [response, setResponse] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [conversations, setConversations] = useState([]); // Store all conversations
  const [currentConversationId, setCurrentConversationId] = useState(null); // Track current conversation
  const [showSidebar, setShowSidebar] = useState(true); // Sidebar visibility
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
    } else {
      // Start a new conversation on mount
      startNewConversation();
    }
  }, [navigate]);

  // Fetch stored conversations on mount
  useEffect(() => {
    fetchStoredConversations();
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

  const fetchStoredConversations = async () => {
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
        const groupedConversations = groupQuestionsIntoConversations(data);
        setConversations(groupedConversations);
      } else {
        setMessage({ type: "error", text: "Failed to fetch stored conversations." });
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
      setMessage({ type: "error", text: "Network error while fetching conversations." });
    }
  };

  // Group questions into conversations (simplified grouping logic)
  const groupQuestionsIntoConversations = (questions) => {
    const convos = [];
    questions.forEach((q, index) => {
      convos.push({
        id: `convo-${index}`,
        title: q.question.length > 50 ? `${q.question.substring(0, 50)}...` : q.question,
        questions: [q],
        timestamp: q.timestamp,
      });
    });
    return convos;
  };

  const startNewConversation = () => {
    setCurrentConversationId(`convo-${Date.now()}`);
    setChatHistory([]);
    setResponse(null);
    setScenario("");
    setErrors({});
    setIsTyping(false);
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
        setTimeout(() => {
          setIsTyping(false);
          setResponse(data.recommendation);
          setChatHistory(data.chat_history);
          setMessage({ type: "success", text: "Analysis complete! 🎯" });
          setScenario("");
          fetchStoredConversations();
        }, 1000);
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

  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

  const selectConversation = (convoId) => {
    const selectedConvo = conversations.find((c) => c.id === convoId);
    if (selectedConvo) {
      setCurrentConversationId(convoId);
      setChatHistory(selectedConvo.questions.map((q) => ({
        role: "human",
        content: q.question,
      })));
      setResponse(selectedConvo.questions[0]?.answer || null);
      setScenario("");
    }
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
      <div className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Conversations</h2>
          <button
            onClick={startNewConversation}
            className="new-conversation-btn"
            data-tooltip="Start a new conversation"
          >
            <FaPlus /> New Conversation
          </button>
        </div>
        <div className="conversations-list">
          {conversations.length > 0 ? (
            conversations.map((convo) => (
              <div
                key={convo.id}
                className={`conversation-item ${currentConversationId === convo.id ? 'active' : ''}`}
                onClick={() => selectConversation(convo.id)}
                data-tooltip={convo.title}
              >
                <div className="conversation-title">{convo.title}</div>
                <div className="conversation-timestamp">
                  {new Date(convo.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="no-conversations">
              <p>No conversations yet.</p>
              <p className="text-xs mt-2">Start a new conversation!</p>
            </div>
          )}
        </div>
      </div>
      <div className="main-container">
        <header>
          <div className="header-brand">
            <div className="logo-icon">R</div>
            <h1 className="brand-title">Ray Dashboard</h1>
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle"
              data-tooltip={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              <FaHistory />
            </button>
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

        {message.text && (
          <div className={`message ${message.type} ${message.type === 'success' ? 'success-bounce' : message.type === 'error' ? 'error-shake' : ''}`}>
            {message.text}
          </div>
        )}

        <div className="chat-container">
          <div className="chat-area">
            {(chatHistory.length > 0 || response || isTyping) && (
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
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
                {isTyping && <TypingIndicator />}
                {response && !isTyping && (
                  <div className="chat-message ai slide-up">
                    <div className="message-author">
                      <FaRobot className="inline mr-2" />
                      Ray
                      <button
                        onClick={() => copyToClipboard(response, 'latest-response')}
                        className="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity"
                        data-tooltip="Copy analysis"
                      >
                        {copiedMessageId === 'latest-response' ? <FaCheck /> : <FaCopy />}
                      </button>
                    </div>
                    <div className="message-content">{response}</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          <form onSubmit={handleScenarioSubmit} className="scenario-form">
            <div className="input-group">
              <textarea
                ref={textareaRef}
                placeholder="Describe your poker situation in detail..."
                value={scenario}
                onChange={(e) => {
                  setScenario(e.target.value);
                  if (errors.scenario) setErrors({});
                }}
                onKeyDown={handleKeyPress}
                className={`scenario-textarea ${errors.scenario ? 'error' : ''}`}
                disabled={loading}
                rows={3}
              />
              {errors.scenario && (
                <div className="error-text">{errors.scenario}</div>
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
                  <span>Send</span>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;