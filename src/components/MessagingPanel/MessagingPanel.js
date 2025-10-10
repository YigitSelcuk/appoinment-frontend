import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import './MessagingPanel.css';

const MessagingPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Örnek kullanıcı verileri
  const users = [
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      avatar: null,
      isOnline: true,
      unreadCount: 3
    },
    {
      id: 2,
      name: 'Mehmet Kaya',
      avatar: null,
      isOnline: true,
      unreadCount: 0
    },
    {
      id: 3,
      name: 'Ayşe Demir',
      avatar: null,
      isOnline: true,
      unreadCount: 12
    },
    {
      id: 4,
      name: 'Fatma Özkan',
      avatar: null,
      isOnline: false,
      unreadCount: 1
    }
  ];

  const totalNotifications = users.reduce((total, user) => 
    total + (user.unreadCount > 0 ? user.unreadCount : 0), 0
  );

  return (
    <div className="messaging-panel">
      {/* Ana Mesajlaşma Butonu */}
      <div className="messaging-header">
        <Button 
          className="messaging-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="messaging-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8.25C6.2125 8.25 6.39075 8.178 6.53475 8.034C6.67875 7.89 6.7505 7.712 6.75 7.5C6.75 7.2875 6.678 7.1095 6.534 6.966C6.39 6.8225 6.212 6.7505 6 6.75C5.7875 6.75 5.6095 6.822 5.466 6.966C5.3225 7.11 5.2505 7.288 5.25 7.5C5.25 7.7125 5.322 7.89075 5.466 8.03475C5.61 8.17875 5.788 8.2505 6 8.25ZM9 8.25C9.2125 8.25 9.39075 8.178 9.53475 8.034C9.67875 7.89 9.7505 7.712 9.75 7.5C9.75 7.2875 9.678 7.1095 9.534 6.966C9.39 6.8225 9.212 6.7505 9 6.75C8.7875 6.75 8.6095 6.822 8.466 6.966C8.3225 7.11 8.2505 7.288 8.25 7.5C8.25 7.7125 8.322 7.89075 8.466 8.03475C8.61 8.17875 8.788 8.2505 9 8.25ZM12 8.25C12.2125 8.25 12.3907 8.178 12.5347 8.034C12.6787 7.89 12.7505 7.712 12.75 7.5C12.75 7.2875 12.678 7.1095 12.534 6.966C12.39 6.8225 12.212 6.7505 12 6.75C11.7875 6.75 11.6095 6.822 11.466 6.966C11.3225 7.11 11.2505 7.288 11.25 7.5C11.25 7.7125 11.322 7.89075 11.466 8.03475C11.61 8.17875 11.788 8.2505 12 8.25ZM1.5 16.5V3C1.5 2.5875 1.647 2.2345 1.941 1.941C2.235 1.6475 2.588 1.5005 3 1.5H15C15.4125 1.5 15.7657 1.647 16.0597 1.941C16.3538 2.235 16.5005 2.588 16.5 3V12C16.5 12.4125 16.3533 12.7657 16.0597 13.0597C15.7662 13.3538 15.413 13.5005 15 13.5H4.5L1.5 16.5ZM3.8625 12H15V3H3V12.8438L3.8625 12Z" fill="white"/>
            </svg>
          </div>
          <div className="messaging-text">MESAJLAŞMA</div>
        </Button>
      </div>

      {/* Kullanıcı Avatarları */}
      <div className="users-list">
        {users.map((user, index) => (
          <div key={user.id} className="user-avatar-container">
            <div className={`user-avatar ${user.unreadCount > 0 ? 'has-unread' : ''}`}>
              <div className="avatar-circle">
                <i className="fas fa-user"></i>
              </div>
              {user.isOnline && <div className="online-indicator"></div>}
              {user.unreadCount > 0 && (
                <div className="user-unread-badge">
                  <span>{user.unreadCount > 99 ? '99+' : user.unreadCount}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bildirim Sayısı */}
      {totalNotifications > 0 && (
        <div className="notification-badge">
          <span>{totalNotifications > 99 ? '99+' : totalNotifications}</span>
        </div>
      )}
    </div>
  );
};

export default MessagingPanel; 