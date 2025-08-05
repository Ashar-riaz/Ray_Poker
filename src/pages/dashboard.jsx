import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";
import { FaSignOutAlt, FaHistory, FaPaperPlane, FaRobot, FaUser, FaCopy, FaCheck, FaPlus, FaBars, FaTimes } from "react-icons/fa";

const Dashboard = () => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [conversationStorage, setConversationStorage] = useState({});
  const API_BASE_URL = "http://localhost:8000";

  const saveCurrentConversation = () => {
    if (currentConversationId && chatHistory.length > 0) {
      const firstQuestion = chatHistory.find(msg => msg.role === "human")?.content || "New Conversation";
      const title = firstQuestion.length > 50 ? `${firstQuestion.substring(0, 50)}...` : firstQuestion;
      
      setConversationStorage(prev => ({
        ...prev,
        [currentConversationId]: {
          id: currentConversationId,
          messages: [...chatHistory],
          title: title,
          timestamp: new Date().toISOString()
        }
      }));
    }
  };

  useEffect(() => {
    saveCurrentConversation();
  }, [chatHistory, currentConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [scenario]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setMessage({ type: "error", text: "Please log in to access the dashboard." });
      setTimeout(() => navigate("/login"), 1500);
    } else {
      startNewConversation();
    }
  }, [navigate]);

  useEffect(() => {
    fetchStoredConversations();
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowSidebar(true);
      } else {
        setShowSidebar(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const groupQuestionsIntoConversations = (questions) => {
    const groupedByConversation = {};
    
    questions.forEach((q) => {
      const conversationKey = q.conversation_id || q.session_id || 'default-conversation';
      
      if (!groupedByConversation[conversationKey]) {
        groupedByConversation[conversationKey] = {
          id: conversationKey,
          messages: [],
          timestamp: q.timestamp,
          title: ''
        };
      }
      
      groupedByConversation[conversationKey].messages.push(
        { role: "human", content: q.question }
      );
      
      if (q.answer) {
        groupedByConversation[conversationKey].messages.push(
          { role: "assistant", content: q.answer }
        );
      }
      
      if (new Date(q.timestamp) > new Date(groupedByConversation[conversationKey].timestamp)) {
        groupedByConversation[conversationKey].timestamp = q.timestamp;
      }
    });
    
    const convos = Object.values(groupedByConversation).map(convo => {
      const firstQuestion = convo.messages.find(msg => msg.role === "human")?.content || "New Conversation";
      convo.title = firstQuestion.length > 50 ? `${firstQuestion.substring(0, 50)}...` : firstQuestion;
      return convo;
    });
    
    return convos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const startNewConversation = () => {
    saveCurrentConversation();
    
    const newConversationId = `convo-${Date.now()}`;
    setCurrentConversationId(newConversationId);
    setChatHistory([]);
    setScenario("");
    setErrors({});
    setIsTyping(false);
    
    if (window.innerWidth <= 768) {
      setShowSidebar(false);
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

    const userMessage = { 
      role: "human", 
      content: scenario.trim(),
      timestamp: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    const currentScenario = scenario;
    setScenario("");
    setLoading(true);
    setIsTyping(true);

    try {
      const token = localStorage.getItem("access_token");
      
      const requestBody = {
        scenario: currentScenario,
        conversation_id: currentConversationId
      };

      const response = await fetch(`${API_BASE_URL}/analyze-poker-scenario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        
        setTimeout(() => {
          setIsTyping(false);
          const aiMessage = { 
            role: "assistant", 
            content: data.recommendation || data.response || "No response received",
            timestamp: new Date().toISOString()
          };
          setChatHistory(prev => [...prev, aiMessage]);
          setMessage({ type: "success", text: "Analysis complete! 🎯" });
          
          if (data.conversation_id && data.conversation_id !== currentConversationId) {
            setCurrentConversationId(data.conversation_id);
          }
        }, 1000);
        
      } else {
        const data = await response.json().catch(() => ({}));
        setIsTyping(false);
        
        if (response.status === 400) {
          setErrors({ scenario: data.detail || "Invalid scenario. Please try again." });
          setScenario(currentScenario);
          setChatHistory(prev => prev.slice(0, -1));
        } else if (response.status === 401) {
          setMessage({ type: "error", text: "Session expired. Please log in again." });
          setTimeout(() => navigate("/login"), 1500);
        } else {
          setMessage({ type: "error", text: data.detail || "Failed to analyze scenario." });
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: "Sorry, I encountered an error while processing your request.",
            timestamp: new Date().toISOString()
          }]);
        }
      }
    } catch (error) {
      console.error("Analyze scenario error:", error);
      setIsTyping(false);
      setMessage({ type: "error", text: "Network error. Please check your connection." });
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: "Network error occurred. Please try again.",
        timestamp: new Date().toISOString()
      }]);
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
    setShowSidebar(prev => !prev);
  };

  const selectConversation = (convoId) => {
    saveCurrentConversation();
    
    if (conversationStorage[convoId]) {
      setCurrentConversationId(convoId);
      setChatHistory([...conversationStorage[convoId].messages]);
    } else {
      const selectedConvo = conversations.find((c) => c.id === convoId);
      if (selectedConvo) {
        setCurrentConversationId(convoId);
        setChatHistory([...selectedConvo.messages]);
      }
    }
    
    setScenario("");
    setErrors({});
    setIsTyping(false);
    
    if (window.innerWidth <= 768) {
      setShowSidebar(false);
    }
  };

  const getAllConversations = () => {
    const storageConversations = Object.values(conversationStorage);
    const apiConversations = conversations.filter(convo => 
      !conversationStorage[convo.id]
    );
    
    const allConversations = [...storageConversations, ...apiConversations];
    
    return allConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const TypingIndicator = () => (
    <div className="chat-message ai typing-indicator">
      <div className="message-author">
        <FaRobot className="inline mr-2" />
        Ray is analyzing...
      </div>
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );

  const formatMessageContent = (content) => {
    // Basic markdown-like formatting
    const lines = content.split('\n').map((line, index) => {
      // Handle bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="message-list-item">{line.substring(2)}</li>;
      }
      // Handle bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Handle italic text
      line = line.replace(/_(.*?)_/g, '<em>$1</em>');
      return <p key={index} dangerouslySetInnerHTML={{ __html: line }} />;
    });
    
    return lines.length > 1 && lines.some(line => line.type === 'li') 
      ? <ul className="message-list">{lines}</ul> 
      : lines;
  };

  return (
    <div className="dashboard-page-wrapper">
      {showSidebar && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />
      )}
      
      <div className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <h2 className="sidebar-title">Conversations</h2>
            <button
              onClick={toggleSidebar}
              className="sidebar-close-btn"
            >
              <FaTimes />
            </button>
          </div>
          <button
            onClick={startNewConversation}
            className="new-conversation-btn"
          >
            <FaPlus /> New Conversation
          </button>
        </div>
        
        <div className="conversations-list">
          {getAllConversations().length > 0 ? (
            getAllConversations().map((convo) => (
              <div
                key={convo.id}
                className={`conversation-item ${currentConversationId === convo.id ? 'active' : ''}`}
                onClick={() => selectConversation(convo.id)}
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

      <div className={`main-container ${showSidebar ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header>
          <div className="header-brand">
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle"
            >
              <FaBars />
            </button>
            <div className="logo-icon">R</div>
            <h1 className="brand-title">Ray Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            <FaSignOutAlt />
            <span className="logout-text">Log Out</span>
          </button>
        </header>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="chat-container">
          <div className="chat-area">
            {(chatHistory.length > 0 || isTyping) ? (
              <div className="chat-messages">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${msg.role === "human" ? "human" : "ai"}`}
                  >
                    <div className="message-header">
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
                      </div>
                      <div className="message-meta">
                        <span className="message-timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                        <button
                          onClick={() => copyToClipboard(msg.content, `${msg.role}-${index}`)}
                          className="copy-btn"
                        >
                          {copiedMessageId === `${msg.role}-${index}` ? <FaCheck /> : <FaCopy />}
                        </button>
                      </div>
                    </div>
                    <div className="message-content">
                      {formatMessageContent(msg.content)}
                    </div>
                  </div>
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="welcome-message">
                <div className="welcome-icon">
                  <FaRobot />
                </div>
                <h2>Welcome to Ray Dashboard</h2>
                <p>I'm Ray, your poker analysis assistant. Describe any poker situation and I'll provide strategic insights to help you make optimal decisions.</p>
                <p className="welcome-hint">Try something like: "I'm in a $1/$2 NLHE game with AKo in middle position..."</p>
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
                rows={1}
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
                  <span className="loading-text">Analyzing...</span>
                </div>
              ) : (
                <div className="submit-content">
                  <FaPaperPlane />
                  <span className="submit-text">Send</span>
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