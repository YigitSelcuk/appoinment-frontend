const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// E-posta gönder
export const sendEmail = async (emailData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: JSON.stringify(emailData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('E-posta API hatası:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.message || 'E-posta gönderilirken hata oluştu');
    }

    console.log('E-posta başarıyla gönderildi:', data);
    return data;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw error;
  }
};

// Randevu bildirimi e-postası gönder
export const sendAppointmentNotification = async (appointmentData, recipientEmail, notificationType = 'created') => {
  try {
    const response = await fetch(`${API_BASE_URL}/email/send-appointment-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: JSON.stringify({
        appointmentData,
        recipientEmail,
        notificationType
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Randevu bildirimi e-postası API hatası:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.message || 'Randevu bildirimi e-postası gönderilirken hata oluştu');
    }

    console.log('Randevu bildirimi e-postası başarıyla gönderildi:', data);
    return data;
  } catch (error) {
    console.error('Randevu bildirimi e-postası gönderme hatası:', error);
    throw error;
  }
};

// E-posta geçmişini getir
export const getEmailHistory = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.email_type) queryParams.append('email_type', params.email_type);

    const response = await fetch(`${API_BASE_URL}/email/history?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('E-posta geçmişi API hatası:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.message || 'E-posta geçmişi getirilirken hata oluştu');
    }

    return data;
  } catch (error) {
    console.error('E-posta geçmişi getirme hatası:', error);
    throw error;
  }
};

// E-posta istatistikleri getir
export const getEmailStats = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const response = await fetch(`${API_BASE_URL}/email/stats?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('E-posta istatistikleri API hatası:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.message || 'E-posta istatistikleri getirilirken hata oluştu');
    }

    return data;
  } catch (error) {
    console.error('E-posta istatistikleri getirme hatası:', error);
    throw error;
  }
};

// E-posta konfigürasyonu test et
export const testEmailConfig = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/email/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('E-posta konfigürasyon test API hatası:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      throw new Error(data.message || 'E-posta konfigürasyonu test edilirken hata oluştu');
    }

    return data;
  } catch (error) {
    console.error('E-posta konfigürasyon test hatası:', error);
    throw error;
  }
};

// E-posta ve SMS birlikte gönder
export const sendNotificationCombo = async (appointmentData, contacts, options = {}) => {
  const results = {
    email: { success: [], failed: [] },
    sms: { success: [], failed: [] }
  };

  // E-posta bildirimleri gönder
  if (options.sendEmail && contacts.length > 0) {
    for (const contact of contacts) {
      if (contact.email) {
        try {
          await sendAppointmentNotification(
            appointmentData,
            contact.email,
            options.notificationType || 'created'
          );
          results.email.success.push({
            contact: contact.name,
            email: contact.email
          });
        } catch (error) {
          results.email.failed.push({
            contact: contact.name,
            email: contact.email,
            error: error.message
          });
        }
      }
    }
  }

  // SMS bildirimleri gönder
  if (options.sendSMS && contacts.length > 0) {
    const { sendSMS } = await import('./smsService');
    
    for (const contact of contacts) {
      if (contact.phone || contact.phone1) {
        try {
          const phoneNumber = contact.phone || contact.phone1;
          const smsMessage = options.smsMessage || 
            `Randevu: ${appointmentData.title}\nTarih: ${appointmentData.date}\nSaat: ${appointmentData.startTime}`;
          
          await sendSMS({
            phoneNumber,
            message: smsMessage
          });
          
          results.sms.success.push({
            contact: contact.name,
            phone: phoneNumber
          });
        } catch (error) {
          results.sms.failed.push({
            contact: contact.name,
            phone: contact.phone || contact.phone1,
            error: error.message
          });
        }
      }
    }
  }

  return results;
};

export default {
  sendEmail,
  sendAppointmentNotification,
  getEmailHistory,
  getEmailStats,
  testEmailConfig,
  sendNotificationCombo
};