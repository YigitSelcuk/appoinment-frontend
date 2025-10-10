const API_BASE_URL = process.env.REACT_APP_API_URL;

// API çağrısı için yardımcı fonksiyon
const apiCall = async (url, token, options = {}) => {
  if (!token) {
    throw new Error('Erişim token\'ı gerekli');
  }
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API hatası');
  }

  return response.json();
};

// Tüm randevuları getir
export const getAppointments = async (token) => {
  try {
    return await apiCall('/appointments', token);
  } catch (error) {
    console.error('Randevular getirme hatası:', error);
    throw error;
  }
};

// Belirli bir randevuyu ID ile getir
export const getAppointmentById = async (token, id) => {
  try {
    return await apiCall(`/appointments/${id}`, token);
  } catch (error) {
    console.error('Randevu getirme hatası:', error);
    throw error;
  }
};

// Randevu çakışması kontrolü
export const checkAppointmentConflict = async (token, conflictData) => {
  try {
    // conflictData obje olarak geliyorsa destructure et
    const { date, startTime, endTime, excludeId } = conflictData;
    
    const params = new URLSearchParams({
      date,
      startTime,
      endTime
    });
    
    if (excludeId) {
      params.append('excludeId', excludeId);
    }
    
    return await apiCall(`/appointments/check-conflict?${params.toString()}`, token);
  } catch (error) {
    console.error('Randevu çakışması kontrolü hatası:', error);
    throw error;
  }
};

// Yeni randevu ekle
export const createAppointment = async (token, appointmentData) => {
  try {
    return await apiCall('/appointments', token, {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
  } catch (error) {
    console.error('Randevu oluşturma hatası:', error);
    throw error;
  }
};

// Randevu güncelle
export const updateAppointment = async (token, id, appointmentData) => {
  try {
    return await apiCall(`/appointments/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(appointmentData)
    });
  } catch (error) {
    console.error('Randevu güncelleme hatası:', error);
    throw error;
  }
};

// Randevu sil
export const deleteAppointment = async (token, id) => {
  try {
    return await apiCall(`/appointments/${id}`, token, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Randevu silme hatası:', error);
    throw error;
  }
};

// Belirli tarih aralığındaki randevuları getir
export const getAppointmentsByDateRange = async (token, startDate, endDate) => {
  try {
    return await apiCall(`/appointments/range?start=${startDate}&end=${endDate}`, token);
  } catch (error) {
    console.error('Tarih aralığındaki randevular getirme hatası:', error);
    throw error;
  }
};

// Davetli kişilerin önceki randevularını getir
export const getInviteePreviousAppointments = async (token, requestData) => {
  try {
    const { inviteeEmails, currentDate, page = 1, limit = 10 } = requestData;
    
    if (!inviteeEmails || !Array.isArray(inviteeEmails) || inviteeEmails.length === 0) {
      throw new Error('Davetli e-postaları gerekli');
    }
    
    return await apiCall('/appointments/invitee-previous', token, {
      method: 'POST',
      body: JSON.stringify({
        inviteeEmails,
        currentDate,
        page,
        limit
      })
    });
  } catch (error) {
    console.error('Davetli kişilerin önceki randevularını getirme hatası:', error);
    throw error;
  }
};

// Hatırlatma yeniden gönder
export const resendReminder = async (token, appointmentId, reminderDateTime = null) => {
  try {
    return await apiCall(`/appointments/${appointmentId}/resend-reminder`, token, {
      method: 'POST',
      body: JSON.stringify({
        reminderDateTime
      })
    });
  } catch (error) {
    console.error('Hatırlatma yeniden gönderme hatası:', error);
    throw error;
  }
};

// Hatırlatma zamanını güncelle
export const updateReminderTime = async (token, appointmentId, reminderValue, reminderUnit) => {
  try {
    return await apiCall(`/appointments/${appointmentId}/reminder-time`, token, {
      method: 'PUT',
      body: JSON.stringify({
        reminderValue,
        reminderUnit
      })
    });
  } catch (error) {
    console.error('Hatırlatma zamanı güncelleme hatası:', error);
    throw error;
  }
};

// Randevu istatistiklerini getir
export const getAppointmentStats = async (token) => {
  try {
    return await apiCall('/appointments/stats', token);
  } catch (error) {
    console.error('Randevu istatistikleri getirme hatası:', error);
    throw error;
  }
};