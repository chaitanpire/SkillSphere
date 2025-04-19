import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './Messages.css';
export default function MessageThread() {
  const { otherUserId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      
      // Fetch messages
      const messagesRes = await fetch(`http://localhost:4000/api/messages/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const messagesData = await messagesRes.json();
      setMessages(messagesData);

      // Fetch other user
      const userRes = await fetch(`http://localhost:4000/api/users/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const userData = await userRes.json();
      setOtherUser(userData);

      // Mark messages as read
      if (socket) {
        socket.emit('mark_read', { 
          senderId: otherUserId, 
          receiverId: user.id 
        });
      }
    };

    fetchData();

    if (socket) {
      const conversationId = [user.id, otherUserId].sort().join('_');
      socket.emit('join_conversation', conversationId);

      socket.on('new_message', (message) => {
        if ((message.sender_id === otherUserId && message.receiver_id === user.id) || 
            (message.sender_id === user.id && message.receiver_id === otherUserId)) {
          setMessages(prev => [...prev, message]);
          
          // Mark as read if we're the sender
          if (message.sender_id === user.id) {
            socket.emit('mark_read', {
              senderId: user.id,
              receiverId: otherUserId
            });
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
      }
    };
  }, [user, otherUserId, socket]);

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
    }

    setNewMessage('');
  };

  return (
    <div className="message-thread">
      <button onClick={() => navigate('/messages')}>Back</button>
      <h2>Chat with {otherUser?.name}</h2>
      
      <div className="messages-container">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.sender_id === user.id ? 'sent' : 'received'}`}>
            <p>{message.content}</p>
            <small>{new Date(message.sent_at).toLocaleTimeString()}</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
