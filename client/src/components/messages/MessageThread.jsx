// MessageThread.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './Messages.css';

export default function MessageThread() {
  const { otherUserId } = useParams();
  const { user, loading } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const [messagesRes, userRes] = await Promise.all([
        fetch(`http://localhost:4000/api/messages/${otherUserId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:4000/api/users/${otherUserId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const messagesData = await messagesRes.json();
      const userData = await userRes.json();

      setMessages(messagesData);
      setOtherUser(userData);

      setUnreadCount(0);

      // Mark messages as read
      if (socket) {
        socket.emit('mark_read', {
          senderId: otherUserId,
          receiverId: user.id
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [otherUserId, user, socket]);

  // Join conversation and listen for messages
  useEffect(() => {
    if (!user || !socket || !otherUserId) return;

    const conversationId = [user.id, otherUserId].sort().join('_');
    console.log('Joining conversation room:', conversationId);
    socket.emit('join_conversation', conversationId);

    const handleNewMessage = (message) => {
      console.log('📩 New message received:', message);
      setUnreadCount(prev => prev + 1);
      if (
        (message.sender_id === otherUserId && message.receiver_id === user.id) ||
        (message.sender_id === user.id && message.receiver_id === otherUserId)
      ) {
        setMessages(prev => [...prev, message]);

        if (message.sender_id === user.id) {
          socket.emit('mark_read', {
            senderId: user.id,
            receiverId: otherUserId
          });
        }
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user, otherUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      sender_id: user.id,
      sender_name: user.name,
      receiver_id: otherUserId,
      content: newMessage,
      subject: 'New message'
    };

    if (socket) {
      socket.emit('send_message', messageData);
      setMessages(prev => [...prev, {
        ...messageData,
        id: Date.now(),
        sent_at: new Date().toISOString()
      }]);

      setUnreadCount(prev => prev - 1);
    }

    setNewMessage('');
  };

  if (loading) return <div className="loading">Authenticating...</div>;
  if (isLoading) return <div className="loading">Loading...</div>;
  if (!user) return <div className="error">You must be logged in to view this page</div>;
  if (!otherUser) return <div className="error">User not found</div>;

  return (
    <div className="message-thread">
      <header className="message-header">
        <button className="back-button" onClick={() => navigate('/messages')}>
          &larr;
        </button>
        <h2>{otherUser.name}</h2>
      </header>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">Start a new conversation!</div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`message ${message.sender_id === user.id ? 'sent' : 'received'}`}>
              <div className="message-content">
                <p>{message.content}</p>
                <small className="message-time">
                  {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          autoFocus
        />
        <button type="submit" disabled={!newMessage.trim()} className="send-button">
          Send
        </button>
      </form>
      {unreadCount > 0 && (
        <div className="reload-messages" onClick={fetchData}>
          <button className="reload-button">You have {unreadCount} unread messages. Click to reload.</button>
        </div>
      )}
    </div>
  );
}
