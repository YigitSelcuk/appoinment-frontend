import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const BASE_URL = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : null;
console.log('Profile Service API_URL:', API_URL);
console.log('Profile Service BASE_URL:', BASE_URL);

// Kullanıcı profilini getir
export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Kullanıcı profilini güncelle
export const updateUserProfile = async (token, profileData) => {
  try {
    console.log('updateUserProfile çağrıldı, profileData:', profileData);
    
    // FormData oluştur (dosya yükleme için)
    const formData = new FormData();
    
    // Profil verilerini FormData'ya ekle
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== null && profileData[key] !== undefined) {
        console.log(`FormData'ya ekleniyor: ${key} =`, profileData[key]);
        formData.append(key, profileData[key]);
      }
    });
    
    // FormData içeriğini logla
    console.log('FormData içeriği:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    const response = await axios.put(`${API_URL}/users/profile`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('updateUserProfile hatası:', error);
    console.error('Error response:', error.response);
    
    if (error.response?.data) {
      throw error.response.data;
    } else {
      throw { success: false, message: error.message || 'Bilinmeyen hata oluştu' };
    }
  }
};

// Avatar URL'ini getir
export const getAvatarUrl = (filename) => {
  if (!filename) return null;
  // Cache busting için timestamp ekle
  const timestamp = new Date().getTime();
  const url = `${BASE_URL}/uploads/avatars/${filename}?t=${timestamp}`;
  console.log('Avatar URL oluşturuluyor:', { filename, url, BASE_URL });
  console.log('Full avatar URL:', url);
  return url;
};