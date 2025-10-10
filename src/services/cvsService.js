import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Tüm CV'leri getir
export const getCVs = async (params = {}) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_BASE_URL}/cvs`, {
      params,
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response.data;
  } catch (error) {
    console.error('CV getirme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// CV detayını getir
export const getCVById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/cvs/${id}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('CV detay getirme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// Yeni CV ekle
export const createCV = async (cvData) => {
  try {
    // Eğer cvData zaten FormData ise, doğrudan kullan
    let formData;
    if (cvData instanceof FormData) {
      formData = cvData;
    } else {
      // Değilse, yeni FormData oluştur
      formData = new FormData();
      
      // CV verilerini FormData'ya ekle
      Object.keys(cvData).forEach(key => {
        if (cvData[key] !== null && cvData[key] !== undefined) {
          if ((key === 'cv_dosyasi' || key === 'profil_resmi') && cvData[key] instanceof File) {
            formData.append(key, cvData[key]);
          } else {
            formData.append(key, cvData[key]);
          }
        }
      });
    }

    const response = await axios.post(`${API_BASE_URL}/cvs`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('CV ekleme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// CV güncelle
export const updateCV = async (id, cvData) => {
  try {
    // Eğer cvData zaten FormData ise, doğrudan kullan
    let formData;
    if (cvData instanceof FormData) {
      formData = cvData;
    } else {
      // Değilse, yeni FormData oluştur
      formData = new FormData();
      
      // CV verilerini FormData'ya ekle
      Object.keys(cvData).forEach(key => {
        if (cvData[key] !== null && cvData[key] !== undefined) {
          if ((key === 'cv_dosyasi' || key === 'profil_resmi') && cvData[key] instanceof File) {
            formData.append(key, cvData[key]);
          } else {
            formData.append(key, cvData[key]);
          }
        }
      });
    }

    const response = await axios.put(`${API_BASE_URL}/cvs/${id}`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('CV güncelleme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// CV sil
export const deleteCV = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/cvs/${id}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('CV silme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// CV durumlarını getir
export const getCVStatuses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/cvs/statuses`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('CV durumları getirme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// CV dosyasını indir
export const downloadCVFile = async (id, filename) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/cvs/${id}/download`, {
      withCredentials: true,
      responseType: 'blob'
    });

    // Blob olarak al
    const blob = response.data;
    
    // İndirme linki oluştur
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename || 'cv.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: 'CV dosyası indirildi' };
  } catch (error) {
    console.error('CV dosyası indirme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// Profil resmi URL'ini getir (Authentication ile)
export const getProfileImageUrl = async (filename) => {
  if (!filename) return null;
  
  try {
    // Eğer filename '/uploads/' ile başlıyorsa, sadece dosya adını al
    let actualFilename = filename;
    if (filename.startsWith('/uploads/')) {
      actualFilename = filename.split('/').pop(); // Son kısmı al (dosya adı)
    }
    
    const response = await axios.get(`${API_BASE_URL}/cvs/profile-image/${actualFilename}`, {
      withCredentials: true,
      responseType: 'blob'
    });

    const blob = response.data;
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Profil resmi getirme hatası:', error);
    return null;
  }
};

// Profil resmi URL'ini getir (Authentication olmadan - sadece URL)
export const getProfileImageUrlDirect = (filename) => {
  if (!filename) return null;
  return `${API_BASE_URL}/cvs/profile-image/${filename}`;
};

// CV durumunu güncelle
export const updateCVStatus = async (id, durum) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/cvs/${id}/status`, {
      durum
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('CV durum güncelleme hatası:', error);
    throw error.response?.data || error.message;
  }
};

// Default export
const cvsService = {
  getCVs,
  getCVById,
  createCV,
  updateCV,
  deleteCV,
  getCVStatuses,
  downloadCVFile,
  getProfileImageUrl,
  updateCVStatus
};

export { cvsService };
export default cvsService;