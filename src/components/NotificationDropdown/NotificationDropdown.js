import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStyle,
  formatNotificationTime
} from '../../services/notificationsService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [previousUnreadCount, setPreviousUnreadCount] = useState(null);
  const [timeUpdateTrigger, setTimeUpdateTrigger] = useState(0);
  const dropdownRef = useRef(null);
  const { showError, showSuccess } = useSimpleToast();
  const navigate = useNavigate();
  const { accessToken, refreshAccessToken } = useAuth();



  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Okunmamış bildirim sayısını getir
  const fetchUnreadCount = async () => {
    if (!accessToken) return;
    
    try {
      const response = await getUnreadCount(accessToken, refreshAccessToken);
      const newUnreadCount = response.data.unread_count;
      
      setPreviousUnreadCount(newUnreadCount);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Okunmamış bildirim sayısı getirme hatası:', error);
    }
  };

  // Bildirimleri getir
  const fetchNotifications = async (pageNum = 1, append = false) => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const response = await getNotifications(accessToken, pageNum, 10, false, refreshAccessToken);
      
      if (append) {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      } else {
        setNotifications(response.data.notifications);
      }
      
      setHasMore(pageNum < response.data.pagination.total_pages);
      
      // Unread count'u güncelle
      const newUnreadCount = response.data.unread_count;
      setPreviousUnreadCount(newUnreadCount);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Bildirimler getirme hatası:', error);
      showError('Bildirimler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Dropdown açıldığında bildirimleri yükle
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setPage(1);
      fetchNotifications(1);
    }
  };

  // Bildirime tıklandığında ilgili sayfaya yönlendir
  const handleNotificationClick = async (notification) => {
    try {
      // Bildirimi okundu olarak işaretle
      if (!notification.is_read) {
        await markAsRead(accessToken, notification.id);
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        
        fetchUnreadCount();
      }

      // Bildirim türüne göre yönlendirme yap
      switch (notification.type) {
        case 'task_assigned':
        case 'task_unassigned':
        case 'task_updated':
        case 'task_deleted':
        case 'task_approval_changed':
          // Görev ID'si varsa spesifik göreve yönlendir
          if (notification.related_id) {
            navigate(`/tasks?taskId=${notification.related_id}`);
          } else {
            navigate('/tasks');
          }
          break;
        case 'appointment_created':
        case 'appointment_updated':
        case 'appointment_reminder':
          // Randevu ID'si varsa spesifik randevuya yönlendir
          if (notification.related_id) {
            navigate(`/appointments?appointmentId=${notification.related_id}`);
          } else {
            navigate('/appointments');
          }
          break;
        case 'cv_added':
        case 'cv_updated':
        case 'cv_deleted':
          // CV ID'si varsa spesifik CV'ye yönlendir
          if (notification.related_id) {
            navigate(`/cvs?cvId=${notification.related_id}`);
          } else {
            navigate('/cvs');
          }
          break;
        case 'message_received':
          navigate('/messages');
          break;
        case 'request':
        case 'request_created':
        case 'request_updated':
        case 'request_deleted':
          // Talep ID'si varsa spesifik talepe yönlendir
          if (notification.related_id) {
            navigate(`/requests?requestId=${notification.related_id}`);
          } else {
            navigate('/requests');
          }
          break;
        default:
          // Diğer bildirim türleri için ana sayfaya yönlendir
          navigate('/');
          break;
      }

      // Dropdown'ı kapat
      setIsOpen(false);
    } catch (error) {
      console.error('Bildirim işleme hatası:', error);
      showError('Bildirim işlenirken bir hata oluştu');
    }
  };

  // Bildirimi okundu olarak işaretle
  const handleMarkAsRead = async (notificationId) => {
    if (!accessToken) return;
    
    try {
      await markAsRead(accessToken, notificationId, refreshAccessToken);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );

      fetchUnreadCount();
    } catch (error) {
      console.error('Bildirim okundu işaretleme hatası:', error);
      showError('Bildirim güncellenirken bir hata oluştu');
    }
  };

  // Tüm bildirimleri okundu olarak işaretle
  const handleMarkAllAsRead = async () => {
    if (!accessToken) return;
    
    try {
      await markAllAsRead(accessToken, refreshAccessToken);
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      setUnreadCount(0);

      showSuccess('Tüm bildirimler okundu olarak işaretlendi');
    } catch (error) {
      console.error('Tüm bildirimleri okundu işaretleme hatası:', error);
      showError('Bildirimler güncellenirken bir hata oluştu');
    }
  };

  // Bildirimi sil
  const handleDeleteNotification = async (notificationId) => {
    if (!accessToken) return;
    
    try {
      await deleteNotification(accessToken, notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      fetchUnreadCount();
      showSuccess('Bildirim silindi');
    } catch (error) {
      console.error('Bildirim silme hatası:', error);
      showError('Bildirim silinirken bir hata oluştu');
    }
  };

  // Daha fazla bildirim yükle
  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, true);
    }
  };

  // Sayfa yüklendiğinde okunmamış sayıyı getir ve gerçek zamanlı güncelleme
  useEffect(() => {
    const initializeUnreadCount = async () => {
      if (!accessToken) return;
      
      try {
        const response = await getUnreadCount(accessToken, refreshAccessToken);
        const initialUnreadCount = response.data.unread_count;
        setPreviousUnreadCount(initialUnreadCount);
        setUnreadCount(initialUnreadCount);
      } catch (error) {
        console.error('İlk okunmamış bildirim sayısı getirme hatası:', error);
      }
    };
    
    initializeUnreadCount();
    
    // Her 5 saniyede bir okunmamış sayıyı güncelle
    const unreadInterval = setInterval(() => {
      fetchUnreadCount();
    }, 5000);
    
    return () => {
      clearInterval(unreadInterval);
    };
  }, [accessToken, isOpen]);

  // Bildirim zamanlarını gerçek zamanlı güncellemek için interval
  useEffect(() => {
    const timeUpdateInterval = setInterval(() => {
      setTimeUpdateTrigger(prev => prev + 1);
    }, 30000); // Her 30 saniyede bir zamanları güncelle
    
    return () => {
      clearInterval(timeUpdateInterval);
    };
  }, []);

  // Dropdown açık olduğunda bildirimleri sürekli güncelle
  useEffect(() => {
    let notificationsInterval;
    
    if (isOpen && accessToken) {
      // Dropdown açıldığında hemen yükle
      fetchNotifications(1, false);
      
      // Her 3 saniyede bir bildirimleri yenile
      notificationsInterval = setInterval(() => {
        fetchNotifications(1, false);
      }, 3000);
    }
    
    return () => {
      if (notificationsInterval) {
        clearInterval(notificationsInterval);
      }
    };
  }, [isOpen, accessToken]);

  // Sayfa odaklandığında bildirimleri güncelle
  useEffect(() => {
    const handleFocus = () => {
      fetchUnreadCount();
      if (isOpen) {
        fetchNotifications(1, false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOpen, accessToken]);

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button 
        className="notification-button"
        onClick={handleToggle}
        title="Bildirimler"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M13.73 21a2 2 0 0 1-3.46 0" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu">
          <div className="notification-header">
            <h3>Bildirimler</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn"
                  onClick={handleMarkAllAsRead}
                  title="Tümünü okundu işaretle"
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <span>Bildirimler yükleniyor...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" 
                    stroke="#9CA3AF" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <path 
                    d="M13.73 21a2 2 0 0 1-3.46 0" 
                    stroke="#9CA3AF" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <p>Henüz bildirim yok</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const style = getNotificationStyle(notification.type);
                return (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div 
                      className="notification-icon"
                      style={{ backgroundColor: style.bgColor, color: style.color }}
                    >
                      {style.icon}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time" key={`${notification.id}-${timeUpdateTrigger}`}>
                        {formatNotificationTime(notification.created_at)}
                      </div>
                    </div>

                    <div className="notification-actions">
                      {!notification.is_read && (
                        <button
                          className="mark-read-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          title="Okundu işaretle"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path 
                              d="M20 6L9 17l-5-5" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                      
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        title="Sil"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path 
                            d="M3 6h18" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                          <path 
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {hasMore && notifications.length > 0 && (
              <button 
                className="load-more-btn"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Yükleniyor...' : 'Daha Fazla Göster'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;