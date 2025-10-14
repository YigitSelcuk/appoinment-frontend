const API_URL = process.env.REACT_APP_API_URL;

// Refresh token dene ve localStorage'a yaz
const tryRefreshToken = async () => {
  try {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (data?.success && data.accessToken) {
      try { localStorage.setItem('token', data.accessToken); } catch (_) {}
      return data.accessToken;
    }
    return null;
  } catch (_) {
    return null;
  }
};

// fetch sarmalayıcı: token ekler, 401/403'te refresh dener ve bir kez yeniden dener
const apiFetch = async (url, options = {}) => {
  const makeRequest = async (token) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
    const config = { ...options, headers };
    return fetch(url, config);
  };

  let token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
  let res = await makeRequest(token);

  if (res.status === 401 || res.status === 403) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      token = newToken;
      res = await makeRequest(token);
    }
  }

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
};

// Kategorileri getir (istatistiklerle birlikte)
export const fetchCategoriesWithStats = async (page = 1, limit = 14, search = '') => {
  try {
    let url = `${API_URL}/contacts/categories-stats?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return await apiFetch(url, { method: 'GET' });
  } catch (error) {
    console.error('Kategoriler getirilirken hata:', error);
    throw error;
  }
};

// Tüm kategorileri ve alt kategorileri getir (dropdown için)
export const fetchAllCategoriesForDropdown = async () => {
  try {
    const url = `${API_URL}/contacts/categories-all`;
    return await apiFetch(url, { method: 'GET' });
  } catch (error) {
    console.error('Kategoriler getirilirken hata:', error);
    throw error;
  }
};

// Kategori ekle
export const createCategory = async (categoryData) => {
  try {
    const url = `${API_URL}/contacts/categories`;
    return await apiFetch(url, { method: 'POST', body: JSON.stringify(categoryData) });
  } catch (error) {
    console.error('Kategori eklenirken hata:', error);
    throw error;
  }
};

// Kategori güncelle
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const url = `${API_URL}/contacts/categories/${categoryId}`;
    return await apiFetch(url, { method: 'PUT', body: JSON.stringify(categoryData) });
  } catch (error) {
    console.error('Kategori güncellenirken hata:', error);
    throw error;
  }
};

// Kategori sil
export const deleteCategory = async (categoryId, deleteData = null) => {
  try {
    const url = `${API_URL}/contacts/categories/${categoryId}`;
    const options = { method: 'DELETE' };
    
    // Eğer hedef kategori bilgisi varsa body'ye ekle
    if (deleteData && deleteData.targetCategoryId) {
      options.body = JSON.stringify({ targetCategoryId: deleteData.targetCategoryId });
    }
    
    return await apiFetch(url, options);
  } catch (error) {
    console.error('Kategori silinirken hata:', error);
    throw error;
  }
};