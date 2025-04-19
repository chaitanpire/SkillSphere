import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import './Messages.css';

export default function MessagesInbox() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const response = await fetch('http://localhost:4000/api/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();

      if (socket) {
        socket.emit('authenticate', localStorage.getItem('token'));

        const handleNewMessage = (message) => {
          setConversations(prev => {
            const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
            const existingConvIndex = prev.findIndex(c => c.other_user_id === otherUserId);
            
            if (existingConvIndex >= 0) {
              const updated = [...prev];
              updated[existingConvIndex] = {
                ...updated[existingConvIndex],
                last_message: message.content,
                last_message_time: message.sent_at,
                unread_count: message.receiver_id === user.id ? 
                  (updated[existingConvIndex].unread_count || 0) + 1 : 0
              };
              // Move to top
              return [updated[existingConvIndex], ...updated.filter((_, i) => i !== existingConvIndex)];
            } else {
              return [{
                other_user_id: otherUserId,
                other_user_name: message.sender_id === user.id ? 
                  prev.find(c => c.other_user_id === otherUserId)?.other_user_name || 'Unknown' : 
                  message.sender_name,
                last_message: message.content,
                last_message_time: message.sent_at,
                unread_count: message.receiver_id === user.id ? 1 : 0
              }, ...prev];
            }
          });
        };

        socket.on('new_message', handleNewMessage);
        socket.on('update_unread_count', fetchConversations);
      }
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('update_unread_count');
      }
    };
  }, [user, socket]);

  if (isLoading) return <div className="loading">Loading conversations...</div>;

  return (
    <div className="inbox-container">
      <h2 className="inbox-title">Messages</h2>
      {conversations.length === 0 ? (
        <div className="no-conversations">No conversations yet</div>
      ) : (
        <div className="conversations-list">
          {conversations.map(conv => (
            <Link 
              key={conv.other_user_id} 
              to={`/messages/${conv.other_user_id}`}
              className="conversation-item"
            >
              <div className="conversation-avatar">
                {conv.other_user_name.charAt(0).toUpperCase()}
              </div>
              <div className="conversation-details">
                <h3>{conv.other_user_name}</h3>
                <p className="last-message">{conv.last_message}</p>
                <small className="message-time">
                  {new Date(conv.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </small>
              </div>
              {conv.unread_count > 0 && (
                <span className="unread-count">{conv.unread_count}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}