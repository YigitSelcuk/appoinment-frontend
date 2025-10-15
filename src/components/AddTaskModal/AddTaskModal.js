import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { getUsers } from '../../services/usersService';
import { createTask } from '../../services/tasksService';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useAuth } from '../../contexts/AuthContext';
import './AddTaskModal.css';

// Tarihi MySQL formatına dönüştüren yardımcı fonksiyon
const formatDateForMySQL = (date) => {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

const AddTaskModal = ({ show, onHide, onTaskAdded }) => {
  // Toast hook'u
  const { showSuccess, showError, showWarning, showInfo } = useSimpleToast();
  // Auth hook'u
  const { accessToken } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee_id: null,
    assignee_name: '',
    start_date: new Date(),
    end_date: new Date(),
    status: 'Beklemede',
    priority: 'Normal',
    category: '',
    notes: '',
    approval: 'ONAY BEKLİYOR'
  });

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accessToken) {
      loadUsers();
    }
  }, [accessToken]);

  // Modal açıldığında form'u sıfırla
  useEffect(() => {
    if (show) {
      setFormData({
        title: '',
        description: '',
        assignee_id: null,
        assignee_name: '',
        start_date: new Date(),
        end_date: new Date(),
        status: 'Beklemede',
        priority: 'Normal',
        category: '',
        notes: '',
        approval: 'ONAY BEKLİYOR'
      });
      setUserSearchTerm('');
      setShowUserDropdown(false);
    }
  }, [show]);

  const loadUsers = async () => {
    if (!accessToken) {
      showError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      return;
    }
    
    try {
      setLoading(true);
      const response = await getUsers(accessToken);
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      showError('Kullanıcılar yüklenirken hata oluştu!');
      console.error('Kullanıcılar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Kullanıcı seçildiğinde hem ID hem de ismi güncelle
    if (name === 'assignee_id') {
      const selectedUser = users.find(user => user.id === parseInt(value));
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          assignee_id: selectedUser.id,
          assignee_name: selectedUser.name
        }));
      }
    }
  };

  // Kullanıcı arama fonksiyonu
  const handleUserSearch = (e) => {
    const searchTerm = e.target.value;
    setUserSearchTerm(searchTerm);
    setShowUserDropdown(true);
    
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  // Kullanıcı seçme fonksiyonu
  const handleUserSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      assignee_id: user.id,
      assignee_name: user.name
    }));
    setUserSearchTerm(user.name);
    setShowUserDropdown(false);
  };

  // Dropdown'ı kapatma fonksiyonu
  const handleUserInputBlur = () => {
    setTimeout(() => setShowUserDropdown(false), 200);
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validasyonu
    if (!formData.title.trim()) {
      showError('Görev başlığı gereklidir!');
      return;
    }

    if (!formData.assignee_id) {
      showError('Lütfen bir kişi seçin!');
      return;
    }

    // Tarihleri kontrol et
    if (formData.end_date < formData.start_date) {
      showError('Bitiş tarihi başlangıç tarihinden önce olamaz!');
      return;
    }

    try {
      setLoading(true);
      
      // Boş string'leri null'a çevir ve tarihleri formatla
      const cleanedFormData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => {
          if (value === '') return [key, null];
          if (key === 'start_date' || key === 'end_date') {
            return [key, formatDateForMySQL(value)];
          }
          return [key, value];
        })
      );
      
      const response = await createTask(accessToken, cleanedFormData);
      
      if (response.success) {
        showSuccess('Görev başarıyla eklendi!');
        onTaskAdded();
        onHide();
      } else {
        throw new Error(response.message || 'Görev eklenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Görev ekleme hatası:', error);
      showError(error.message || 'Görev eklenirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" className="add-task-modal">
      <Modal.Header closeButton>
        <Modal.Title>Yeni Görev Ekle</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Başlık</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Atanan Kişi</Form.Label>
                <div className="user-search-container" style={{ position: 'relative' }}>
                  <Form.Control
                    type="text"
                    placeholder="Kişi ara..."
                    value={userSearchTerm}
                    onChange={handleUserSearch}
                    onFocus={() => setShowUserDropdown(true)}
                    onBlur={handleUserInputBlur}
                    disabled={loading}
                    required
                  />
                  {showUserDropdown && filteredUsers.length > 0 && (
                    <div className="user-dropdown" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                      {filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="user-option"
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0'
                          }}
                          onMouseDown={() => handleUserSelect(user)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          {user.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {showUserDropdown && filteredUsers.length === 0 && userSearchTerm && (
                    <div className="user-dropdown" style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      zIndex: 1000,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      color: '#6c757d'
                    }}>
                      Kullanıcı bulunamadı
                    </div>
                  )}
                </div>
                {loading && (
                  <div className="text-muted mt-1">
                    <small>Kullanıcılar yükleniyor...</small>
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Başlangıç Tarihi</Form.Label>
                <DatePicker
                  selected={formData.start_date}
                  onChange={(date) => handleDateChange(date, 'start_date')}
                  className="form-control"
                  dateFormat="dd.MM.yyyy"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Bitiş Tarihi</Form.Label>
                <DatePicker
                  selected={formData.end_date}
                  onChange={(date) => handleDateChange(date, 'end_date')}
                  className="form-control"
                  dateFormat="dd.MM.yyyy"
                  minDate={formData.start_date}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Durum</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Beklemede">Beklemede</option>
                  <option value="Devam Ediyor">Devam Ediyor</option>
                  <option value="Tamamlandı">Tamamlandı</option>
                  <option value="İptal Edildi">İptal Edildi</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Öncelik</Form.Label>
                <Form.Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="Düşük">Düşük</option>
                  <option value="Normal">Normal</option>
                  <option value="Yüksek">Yüksek</option>
                  <option value="Kritik">Kritik</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Açıklama</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          İptal
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Kaydet
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddTaskModal;