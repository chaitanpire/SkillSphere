import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';

export default function MessagesInbox() {
  const { user } = useAuth();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setConversations(data);
    };

    if (user) {
      fetchConversations();
      
      if (socket) {
        socket.emit('authenticate', localStorage.getItem('token'));
        
        socket.on('new_message', (message) => {
          setConversations(prev => {
            const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
            const updated = prev.filter(c => c.other_user_id !== otherUserId);
            
            return [{
              other_user_id: otherUserId,
              other_user_name: message.sender_id === user.id ? 
                prev.find(c => c.other_user_id === otherUserId)?.other_user_name || 'Unknown' : 
                message.sender_name,
              last_message: message.content,
              last_message_time: message.sent_at,
              unread_count: message.receiver_id === user.id ? 
                (prev.find(c => c.other_user_id === otherUserId)?.unread_count || 0) + 1 : 0
            }, ...updated];
          });
        });

        socket.on('update_unread_count', () => {
          fetchConversations();
        });
      }
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('update_unread_count');
      }
    };
  }, [user, socket]);

  return (
    <div className="inbox-container">
      <h2>Messages</h2>
      {conversations.map(conv => (
        <div key={conv.other_user_id} className="conversation-item">
          <Link to={`/messages/${conv.other_user_id}`}>
            <h3>{conv.other_user_name}</h3>
            <p>{conv.last_message}</p>
            {conv.unread_count > 0 && <span>{conv.unread_count}</span>}
          </Link>
        </div>
      ))}
    </div>
  );
}