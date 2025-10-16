import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { updateTask } from '../../services/tasksService';
import { getUsers } from '../../services/usersService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './EditTaskModal.css';

const EditTaskModal = ({ show, onHide, task, onTaskUpdated }) => {
  // Toast hook'u
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  // Auth hook'u
  const { accessToken } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee_id: '',
    assignee_name: '',
    start_date: '',
    end_date: '',
    status: '',
    priority: '',
    notes: ''
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tarih formatını DD.MM.YYYY'den YYYY-MM-DD'ye çevir
  const convertDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('.');
    return `${year}-${month}-${day}`;
  };

  // Tarih formatını YYYY-MM-DD'den DD.MM.YYYY'ye çevir
  const convertDateForSubmit = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  // Form alanlarını task verisiyle doldur
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignee_id: task.assignee_id || '',
        assignee_name: task.assignee_name || '',
        start_date: convertDateForInput(task.start_date_display) || '',
        end_date: convertDateForInput(task.end_date_display) || '',
        status: task.status || '',
        priority: task.priority || '',
        notes: task.notes || ''
      });
    }
  }, [task]);

  // Kullanıcıları getir
  useEffect(() => {
    const loadUsers = async () => {
      if (!accessToken) {
        showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }
      
      try {
        const response = await getUsers(accessToken);
        if (response.success) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error('Kullanıcılar yüklenirken hata:', error);
        showError('Kullanıcılar yüklenirken hata oluştu!');
      }
    };

    if (show && accessToken) {
      loadUsers();
    }
  }, [show, accessToken]);

  // Form değişikliklerini handle et
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'assignee_id') {
      const selectedUser = users.find(user => user.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        assignee_id: value,
        assignee_name: selectedUser ? selectedUser.name : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Formu gönder
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Tarihleri backend formatına çevir ve onay durumunu sıfırla
      const submissionData = {
        ...formData,
        start_date: convertDateForSubmit(formData.start_date),
        end_date: convertDateForSubmit(formData.end_date),
        approval: 'ONAY BEKLİYOR'
      };

      const response = await updateTask(accessToken, task.id, submissionData);
      
      if (response.success) {
        onTaskUpdated();
        onHide();
      } else {
        throw new Error(response.message || 'Görev güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Görev güncelleme hatası:', error);
      setError(error.message);
      showError(error.message || 'Görev güncellenirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="edit-task-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Görevi Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Başlık</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Atanan Kişi</Form.Label>
                <Form.Select
                  name="assignee_id"
                  value={formData.assignee_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seçiniz</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Durum</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="Beklemede">Beklemede</option>
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Tamamlandi">Tamamlandı</option>
                  <option value="Iptal Edildi">İptal Edildi</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Başlangıç Tarihi</Form.Label>
                <Form.Control
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Bitiş Tarihi</Form.Label>
                <Form.Control
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Öncelik</Form.Label>
                <Form.Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seçiniz</option>
                  <option value="Kritik">Kritik</option>
                  <option value="Yuksek">Yüksek</option>
                  <option value="Normal">Normal</option>
                  <option value="Dusuk">Düşük</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={12}>
              <Form.Group>
                <Form.Label>Açıklama</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            İptal
          </Button>
          <Button style={{backgroundColor: '#3C02AA'}} variant="primary" type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditTaskModal;