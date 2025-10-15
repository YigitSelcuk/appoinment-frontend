const API_BASE_URL = process.env.REACT_APP_API_URL;

// Refresh token ile yeni access token alma (fetch tabanlı)
const tryRefreshToken = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
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

// Fetch wrapper: Token ekler, 401/403'te refresh dener ve bir kez yeniden dener
const apiCall = async (url, options = {}) => {
  const makeRequest = async (token) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const config = { ...options, headers };
    return fetch(`${API_BASE_URL}${url}`, config);
  };

  // İlk deneme mevcut token ile
  let token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
  let response = await makeRequest(token);

  // Yetkisiz ise bir kez refresh dene ve tekrar çağır
  if (response.status === 401 || response.status === 403) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      token = newToken;
      response = await makeRequest(token);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.message || (response.status === 401 || response.status === 403
      ? 'Geçersiz veya süresi dolmuş oturum. Lütfen tekrar giriş yapın.'
      : 'API hatası');
    throw new Error(msg);
  }

  return response.json();
};

// Kişiler servisi
export const contactsService = {
  // Tüm kişileri getir
  getContacts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/contacts${queryString ? `?${queryString}` : ''}`;
    return apiCall(url);
  },

  // Tek kişi getir
  getContact: async (id) => {
    return apiCall(`/contacts/${id}`);
  },

  // Yeni kişi ekle
  createContact: async (contactData) => {
    return apiCall('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },

  // Resim ile birlikte kişi ekle
  createContactWithAvatar: async (formData) => {
    const doRequest = async (token) => fetch(`${API_BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        // Content-Type header'ını ekleme, FormData otomatik ayarlar
      },
      body: formData,
    });

    let token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
    let res = await doRequest(token);

    if (res.status === 401 || res.status === 403) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        token = newToken;
        res = await doRequest(token);
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const msg = errorData.message || (res.status === 401 || res.status === 403
        ? 'Geçersiz veya süresi dolmuş oturum. Lütfen tekrar giriş yapın.'
        : 'API hatası');
      throw new Error(msg);
    }

    return res.json();
  },

  // Kişi güncelle
  updateContact: async (id, contactData) => {
    return apiCall(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  },

  // Kişi sil
  deleteContact: async (id) => {
    return apiCall(`/contacts/${id}`, {
      method: 'DELETE',
    });
  },

  // Toplu kişi silme
  deleteMultipleContacts: async (contactIds) => {
    return apiCall('/contacts/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ contactIds }),
    });
  },

  // Kategorileri getir
  getCategories: async () => {
    return apiCall('/contacts/categories');
  },

  // Kategori istatistikleri ile birlikte getir
  getCategoriesWithStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/contacts/categories-stats${queryString ? `?${queryString}` : ''}`;
    return apiCall(url);
  },

  // Dropdown için tüm kategorileri getir
  getAllCategoriesForDropdown: async () => {
    return apiCall('/contacts/categories-all');
  },

  // Kategori ekle
  createCategory: async (categoryData) => {
    return apiCall('/contacts/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Kategori güncelle
  updateCategory: async (id, categoryData) => {
    return apiCall(`/contacts/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  // Kategori sil
  deleteCategory: async (id) => {
    return apiCall(`/contacts/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // TC Kimlik No kontrolü
  checkTCExists: async (tcNo) => {
    return apiCall(`/contacts/check-tc/${tcNo}`);
  },

  // Avatar güncelleme
  updateContactAvatar: async (contactId, formData) => {
    const doRequest = async (token) => fetch(`${API_BASE_URL}/contacts/${contactId}/avatar`, {
      method: 'PUT',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        // Content-Type header'ını ekleme, FormData otomatik ayarlar
      },
      body: formData,
    });

    let token = (typeof localStorage !== 'undefined') ? localStorage.getItem('token') : null;
    let res = await doRequest(token);

    if (res.status === 401 || res.status === 403) {
      const newToken = await tryRefreshToken();
      if (newToken) {
        token = newToken;
        res = await doRequest(token);
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const msg = errorData.message || (res.status === 401 || res.status === 403
        ? 'Geçersiz veya süresi dolmuş oturum. Lütfen tekrar giriş yapın.'
        : 'API hatası');
      throw new Error(msg);
    }

    return res.json();
  },
};

export default contactsService;