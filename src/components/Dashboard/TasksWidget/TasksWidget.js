import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import requestsService from '../../../services/requestsService';
import { useAuth } from '../../../contexts/AuthContext';
import './TasksWidget.css';

const TasksWidget = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Backend'den request verilerini çek
  const fetchTasks = async () => {
    if (!accessToken) return;
    
    try {
      console.log('fetchTasks başlatıldı');
      setLoading(true);
      
      const response = await requestsService.getDepartmentRequests({}, accessToken);
      console.log('API Response:', response);
      
      if (response && response.success && response.data) {
        console.log('Gelen veri:', response.data);
        // Request verilerini task formatına dönüştür
        const formattedTasks = response.data.slice(0, 9).map((request, index) => ({
          id: request.id,
          description: request.talep_basligi || 'Talep başlığı belirtilmemiş',
          assignedTo: request.ilgili_mudurluk || 'Kalem Müdürü',
          status: getStatusText(request.durum),
          statusType: getStatusType(request.durum),
          startDate: request.created_at ? new Date(request.created_at).toLocaleDateString('tr-TR') : '',
          endDate: request.updated_at ? new Date(request.updated_at).toLocaleDateString('tr-TR') : ''
        }));
        console.log('Formatlanmış görevler:', formattedTasks);
        setTasks(formattedTasks);
      } else {
        console.log('API response başarısız veya veri yok');
        setTasks([]);
      }
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
      // Hata durumunda boş array set et
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Request durumunu Türkçe metne çevir
  const getStatusText = (durum) => {
    switch (durum) {
      case 'TAMAMLANDI':
        return 'TAMAMLANDI';
      case 'DÜŞÜK':
      case 'NORMAL':
      case 'ACİL':
      case 'ÇOK ACİL':
      case 'KRİTİK':
        return 'BEKLEMEDE';
      default:
        return 'BEKLEMEDE';
    }
  };

  // Request durumunu status type'a çevir
  const getStatusType = (durum) => {
    switch (durum) {
      case 'TAMAMLANDI':
        return 'completed';
      default:
        return 'pending';
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [accessToken]);

  const getStatusIcon = (statusType) => {
    if (statusType === 'completed') {
      return (
        <div className="status-icon completed">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 4.5L6 12L2.5 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="status-icon pending">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" fill="#dc3545"/>
            <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      );
    }
  };

  return (
    <Card className="tasks-widget shadow-sm border-0">
      <Card.Header className="tasks-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold tasks-title">
            <span className="me-2">📋</span>
            YAKLAŞAN GÖREVLER
          </h5>
          <Button 
            variant="primary" 
            size="sm" 
            className="tasks-show-all-btn"
            onClick={() => navigate('/requests')}
          >
            TÜMÜNÜ GÖSTER
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="tasks-body p-0">
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead className="tasks-table-header">
              <tr>
                <th className="tasks-th-sira">SIRA</th>
                <th className="tasks-th-gorev">YAPILACAK GÖREV</th>
                <th className="tasks-th-sorumlu">SORUMLU</th>
                <th className="tasks-th-durum">DURUM</th>
                <th className="tasks-th-onay">ONAY</th>
              </tr>
            </thead>
            <tbody className="tasks-table-body">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    Henüz görev bulunmamaktadır.
                  </td>
                </tr>
              ) : (
                tasks.map((task, index) => (
                  <tr key={task.id} className="tasks-row">
                    <td className="tasks-td-sira">{index + 1}</td>
                    <td className="tasks-td-gorev">{task.description}</td>
                    <td className="tasks-td-sorumlu">{task.assignedTo}</td>
                    <td className="tasks-td-durum">
                      <span className={`tasks-status ${task.statusType}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="tasks-td-onay">
                      {getStatusIcon(task.statusType)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TasksWidget;