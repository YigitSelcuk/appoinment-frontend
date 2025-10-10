import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, getAvatarUrl } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { logActivity } from '../../services/activitiesService';
import { DEPARTMENTS, renderDepartmentOptions } from '../../data/departments';
import './Profile.css';

const Profile = () => {
  const { updateUser, accessToken } = useAuth();
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    avatar: null,
    role: '',
    permissions: '',
    created_at: '',
    updated_at: '',
    color: '',
    is_online: false,
    last_seen: '',
    department: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    role: '',
    department: '',
    customDepartment: '',
    customRole: '',
    color: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [accessToken]);

  const loadProfile = async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      const response = await getUserProfile(accessToken);
      const userData = response.data;
      
      setProfile(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        bio: userData.bio || '',
        role: userData.role || '',
        department: userData.department || '',
        customDepartment: '',
        customRole: '',
        color: userData.color || '#007bff',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      console.log('Profile yüklendi, avatar bilgisi:', userData.avatar);
      if (userData.avatar) {
        const avatarUrl = getAvatarUrl(userData.avatar);
        console.log('Avatar URL set ediliyor:', avatarUrl);
        setAvatarPreview(avatarUrl);
      } else {
        console.log('Avatar bulunamadı, null set ediliyor');
        setAvatarPreview(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Profil yüklenirken hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setMessage({ type: 'error', text: 'Dosya boyutu 5MB\'dan küçük olmalıdır' });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Sadece resim dosyaları yüklenebilir' });
        return;
      }
      
      setAvatarFile(file);
      
      // Preview oluştur
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Şifre doğrulama
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setMessage({ type: 'error', text: 'Yeni şifre belirlemek için mevcut şifrenizi girmelisiniz' });
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' });
        return;
      }
      
      if (formData.newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır' });
        return;
      }
    }
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
        role: formData.role === 'other' ? formData.customRole : formData.role,
        department: formData.department === 'other' ? formData.customDepartment : formData.department,
        color: formData.color
      };
      
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      if (avatarFile) {
        updateData.avatar = avatarFile;
      }
      
      const response = await updateUserProfile(accessToken, updateData);
      
      // Aktivite logla
      try {
        await logActivity(accessToken, {
          action_type: 'UPDATE',
          table_name: 'users',
          record_id: response.data?.id,
          description: `Kullanıcı profili güncellendi: ${formData.name} (${formData.email})`
        });
      } catch (logError) {
        console.error('Aktivite loglanırken hata:', logError);
      }
      
      setMessage({ type: 'success', text: response.message || 'Profil başarıyla güncellendi' });
      
      // AuthContext'teki user bilgilerini güncelle
      if (response.data) {
        updateUser(response.data);
      }
      
      // Şifre alanlarını temizle
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setShowPasswordFields(false);
      
      // Avatar file'ı temizle
      setAvatarFile(null);
      
      // Profili yeniden yükle
      await loadProfile();
      
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Profil güncellenirken hata oluştu' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container-fluid py-4">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                  </div>
                  <p className="mt-3 text-muted">Profil bilgileri yükleniyor...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex align-items-center">
                  <div className="profile-header-icon me-3">
                    <i className="fas fa-user-edit text-white"></i>
                  </div>
                  <div>
                    <h4 className="card-title mb-1">Profil Düzenleme</h4>
                    <p className="text-muted mb-0">Kişisel bilgilerinizi güncelleyin</p>
                  </div>
                </div>
              </div>
              
              <div className="card-body">
                {message.text && (
                  <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`} role="alert">
                    <i className={`fas fa-${message.type === 'error' ? 'exclamation-triangle' : 'check-circle'} me-2`}></i>
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  {/* Avatar Section */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="avatar-section text-center">
                        <div className="avatar-container mb-3">
                          <div 
                            className="avatar-wrapper"
                            style={{
                              border: `4px solid ${formData.color || '#007bff'}`,
                              boxShadow: `0 0 20px ${formData.color || '#007bff'}40`
                            }}
                          >
                            {avatarPreview ? (
                              <img 
                                src={avatarPreview} 
                                alt="Avatar" 
                                className="avatar-image"
                                onError={(e) => {
                                  console.error('Avatar yüklenemedi:', avatarPreview);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                                onLoad={() => {
                                  console.log('Avatar başarıyla yüklendi:', avatarPreview);
                                }}
                              />
                            ) : null}
                            <div 
                              className="avatar-placeholder" 
                              style={{
                                display: avatarPreview ? 'none' : 'flex',
                                backgroundColor: `${formData.color || '#007bff'}20`,
                                color: formData.color || '#007bff'
                              }}
                            >
                              <i className="fas fa-user"></i>
                            </div>
                            <div className="avatar-overlay">
                              <label htmlFor="avatar-input" className="avatar-change-btn">
                                <i className="fas fa-camera"></i>
                              </label>
                            </div>
                          </div>
                        </div>
                        <input
                          type="file"
                          id="avatar-input"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="d-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Account Information */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <h5 className="section-title">
                        <i className="fas fa-id-card me-2 text-primary"></i>
                        Hesap Bilgileri
                      </h5>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-hashtag me-2"></i>Kullanıcı ID
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.id || 'Yükleniyor...'}
                        disabled
                        style={{backgroundColor: '#f8f9fa'}}
                      />
                    </div>

                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-calendar-plus me-2"></i>Kayıt Tarihi
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.created_at ? new Date(profile.created_at).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                        disabled
                        style={{backgroundColor: '#f8f9fa'}}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-clock me-2"></i>Son Görülme
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.last_seen ? new Date(profile.last_seen).toLocaleString('tr-TR') : 'Bilinmiyor'}
                        disabled
                        style={{backgroundColor: '#f8f9fa'}}
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        <i className="fas fa-edit me-2"></i>Son Güncelleme
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                        disabled
                        style={{backgroundColor: '#f8f9fa'}}
                      />
                    </div>
                  </div>
                  
                  {/* Personal Information */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <h5 className="section-title">
                        <i className="fas fa-user me-2 text-primary"></i>
                        Kişisel Bilgiler
                      </h5>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">
                        <i className="fas fa-user me-2"></i>Ad Soyad *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Adınızı ve soyadınızı girin"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        <i className="fas fa-envelope me-2"></i>E-posta *
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="E-posta adresinizi girin"
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">
                        <i className="fas fa-phone me-2"></i>Telefon
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Telefon numaranızı girin"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="address" className="form-label">
                        <i className="fas fa-map-marker-alt me-2"></i>Adres
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Adresinizi girin"
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-12">
                      <label htmlFor="bio" className="form-label">
                        <i className="fas fa-info-circle me-2"></i>Hakkında
                      </label>
                      <textarea
                        className="form-control"
                        id="bio"
                        name="bio"
                        rows="3"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Kendiniz hakkında kısa bir açıklama yazın"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="role" className="form-label">
                        <i className="fas fa-user-tag me-2"></i>Rol
                      </label>
                      <select
                        className="form-select"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                      >
                        <option value="">Rol Seçin</option>
                        <option value="admin">Admin</option>
                        <option value="user">Kullanıcı</option>
                        <option value="moderator">Moderatör</option>
                        <option value="editor">Editör</option>
                        <option value="viewer">Görüntüleyici</option>
                        <option value="other">Diğer</option>
                      </select>
                      {formData.role === 'other' && (
                        <input 
                          className="form-control mt-2" 
                          name="customRole" 
                          value={formData.customRole || ''} 
                          onChange={handleInputChange} 
                          placeholder="Rol adını yazınız" 
                        />
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="department" className="form-label">
                        <i className="fas fa-building me-2"></i>Departman
                      </label>
                      <select
                        className="form-select"
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                      >
                        {renderDepartmentOptions()}
                      </select>
                      {formData.department === 'other' && (
                        <input 
                          className="form-control mt-2" 
                          name="customDepartment" 
                          value={formData.customDepartment || ''} 
                          onChange={handleInputChange} 
                          placeholder="Departman adını yazınız" 
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="color" className="form-label">
                        <i className="fas fa-palette me-2"></i>Profil Rengi
                      </label>
                      <input
                        type="color"
                        className="form-control form-control-color"
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        title="Profil renginizi seçin"
                      />
                    </div>
                  </div>
                  
                  {/* Password Section */}
                  <div className="row mb-4">
                    <div className="col-12">
                      <div className="d-flex align-items-center justify-content-between">
                       
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setShowPasswordFields(!showPasswordFields)}
                        >
                          {showPasswordFields ? 'İptal' : 'Şifre Değiştir'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {showPasswordFields && (
                    <div className="password-fields">
                      <div className="row mb-3">
                        <div className="col-md-4 mb-3">
                          <label htmlFor="currentPassword" className="form-label">
                            <i className="fas fa-key me-2"></i>Mevcut Şifre
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder="Mevcut şifrenizi girin"
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label htmlFor="newPassword" className="form-label">
                            <i className="fas fa-lock me-2"></i>Yeni Şifre
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder="Yeni şifrenizi girin"
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label htmlFor="confirmPassword" className="form-label">
                            <i className="fas fa-lock me-2"></i>Şifre Tekrar
                          </label>
                          <input
                            type="password"
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Yeni şifrenizi tekrar girin"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <div className="row">
                    <div className="col-12">
                      <div className="d-flex justify-content-end gap-2">

                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Kaydediliyor...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-2"></i>
                              Değişiklikleri Kaydet
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;