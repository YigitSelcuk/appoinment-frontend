import React from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import { FaUser, FaCalendarAlt, FaClock, FaCheckCircle, FaExclamationCircle, FaTasks, FaTimes } from 'react-icons/fa';
import './ViewTaskModal.css';

const ViewTaskModal = ({ show, onHide, task }) => {
  if (!task) return null;

  // Durum badge'lerinin renkleri
  const getStatusColor = (status) => {
    switch (status) {
      case 'Beklemede':
        return '#FFA500';
      case 'Devam Ediyor':
        return '#4E0DCC';
      case 'Tamamlandı':
        return '#10B981';
      case 'İptal Edildi':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Öncelik badge'lerinin renkleri
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Kritik':
        return '#EF4444';
      case 'Yüksek':
        return '#F59E0B';
      case 'Normal':
        return '#10B981';
      case 'Düşük':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  // Tamamlanma yüzdesi için renk
  const getProgressColor = (percentage) => {
    if (percentage >= 75) return '#10B981';
    if (percentage >= 50) return '#4E0DCC';
    if (percentage >= 25) return '#FFA500';
    return '#EF4444';
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="view-task-modal">
      <div className="modal-header">
        <h4 className="modal-title">Görev Detayları</h4>
        <button className="close-btn" onClick={onHide}>
          <FaTimes />
        </button>
      </div>
      <div className="modal-body">
        <div className="unified-info-card">
          {/* Görev Bilgileri */}
          <div className="info-section">
           
            
            {/* Tamamlanma Durumu */}
            {task.completion_percentage !== undefined && (
              <div className="info-grid-row">
                <div className="info-item full-width">
                  <div className="item-header">
                    <span className="item-label">Tamamlanma Durumu</span>
                  </div>
                  <div className="item-value">
                    <div className="completion-info">
                      <span className="completion-percentage">{task.completion_percentage}%</span>
                      <ProgressBar
                        now={task.completion_percentage}
                        variant="custom"
                        style={{ '--progress-color': getProgressColor(task.completion_percentage) }}
                        className="completion-bar"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Atanan Kişi ve Tarih Bilgileri */}
            <div className="info-grid-row">
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Atanan Kişi</span>
                </div>
                <div className="item-value">
                  {task.assignee_name}
                </div>
              </div>
              {task.assignee_email && (
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">E-posta</span>
                  </div>
                  <div className="item-value email-address">
                    {task.assignee_email}
                  </div>
                </div>
              )}
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Başlangıç Tarihi</span>
                </div>
                <div className="item-value date-value">
                  {task.start_date_display}
                </div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Bitiş Tarihi</span>
                </div>
                <div className="item-value date-value">
                  {task.end_date_display}
                </div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Öncelik</span>
                </div>
                <div className="item-value">
                  <span
                    className="priority-badge-inline"
                    style={{
                      backgroundColor: getPriorityColor(task.priority),
                      color: 'white'
                    }}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Oluşturan</span>
                </div>
                <div className="item-value">
                  {task.created_by_name}
                </div>
              </div>
              {task.created_by_email && (
                <div className="info-item">
                  <div className="item-header">
                    <span className="item-label">Oluşturan E-posta</span>
                  </div>
                  <div className="item-value email-address">
                    {task.created_by_email}
                  </div>
                </div>
              )}
              <div className="info-item">
                <div className="item-header">
                  <span className="item-label">Oluşturma Tarihi</span>
                </div>
                <div className="item-value date-value">
                  {task.created_at_display}
                </div>
              </div>
            </div>
            
            {/* Açıklama ve Notlar */}
            {(task.description || task.notes) && (
              <div className="info-grid-row">
                {task.description && (
                  <div className="info-item full-width">
                    <div className="item-header">
                      <span className="item-label">Açıklama</span>
                    </div>
                    <div className="notes-container">
                      <div className="notes-text">{task.description}</div>
                    </div>
                  </div>
                )}
                {task.notes && (
                  <div className="info-item full-width">
                    <div className="item-header">
                      <span className="item-label">Notlar</span>
                    </div>
                    <div className="notes-container">
                      <div className="notes-text">{task.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <div className="footer-info">
        </div>
        <Button className="close-button" onClick={onHide}>
          Kapat
        </Button>
      </div>
    </Modal>
  );
};

export default ViewTaskModal;