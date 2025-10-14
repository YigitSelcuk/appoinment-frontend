const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API çağrıları için yardımcı fonksiyon
const apiCall = async (endpoint, token, options = {}) => {
  try {
    if (!token) {
      throw new Error('Erişim token\'ı gerekli');
    }
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const config = {
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Tüm görevleri getir
export const getTasks = async (token, params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
  
  return await apiCall(endpoint, token);
};

// Tek görev getir
export const getTask = async (token, id) => {
  return await apiCall(`/tasks/${id}`, token);
};

// Yeni görev oluştur
export const createTask = async (token, taskData) => {
  return await apiCall('/tasks', token, {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};

// Görev güncelle
export const updateTask = async (token, id, taskData) => {
  return await apiCall(`/tasks/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
};

// Görev sil
export const deleteTask = async (token, id) => {
  return await apiCall(`/tasks/${id}`, token, {
    method: 'DELETE',
  });
};

// Görev istatistikleri
export const getTaskStats = async (token) => {
  return await apiCall('/tasks/stats', token);
};

// Durum güncelle
export const updateTaskStatus = async (token, id, status) => {
  return await updateTask(token, id, { status });
};

// Öncelik güncelle
export const updateTaskPriority = async (token, id, priority) => {
  return await updateTask(token, id, { priority });
};

// Onay durumu güncelle
export const updateTaskApproval = async (token, id, approval) => {
  return await apiCall(`/tasks/${id}/approval`, token, {
    method: 'PUT',
    body: JSON.stringify({ approval }),
  });
};

// Tamamlanma yüzdesi güncelle
export const updateTaskCompletion = async (token, id, completion_percentage) => {
  return await updateTask(token, id, { completion_percentage });
};

// Atanan kişi güncelle
export const updateTaskAssignee = async (token, id, assignee_id, assignee_name) => {
  return await updateTask(token, id, { assignee_id, assignee_name });
};

// Çoklu görev işlemleri
export const bulkUpdateTasks = async (token, taskIds, updateData) => {
  const promises = taskIds.map(id => updateTask(token, id, updateData));
  return await Promise.all(promises);
};

export const deleteMultipleTasks = async (token, taskIds) => {
  return await apiCall('/tasks/bulk', token, {
    method: 'DELETE',
    body: JSON.stringify({ taskIds }),
  });
};

// Görev arama
export const searchTasks = async (token, searchTerm, filters = {}) => {
  return await getTasks(token, {
    search: searchTerm,
    ...filters
  });
};

// Filtrelenmiş görevler
export const getFilteredTasks = async (token, filters) => {
  return await getTasks(token, filters);
};