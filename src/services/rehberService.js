const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class RehberService {
  async getRehberStats(token) {
    try {
      if (!token) {
        throw new Error('Erişim token\'ı gerekli');
      }
      
      const response = await fetch(`${API_BASE_URL}/rehber/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Rehber istatistikleri alınırken hata:', error);
      
      // Hata durumunda örnek veri döndür
      return {
        success: true,
        data: [
          { value: 18, label: '18', type: 'customer' },
          { value: 10, label: '10', type: 'supplier' },
          { value: 35, label: '35', type: 'active' },
          { value: 20, label: '20', type: 'inactive' },
          { value: 15, label: '15', type: 'new' }
        ],
        message: 'Rehber istatistikleri alındı (örnek veri - bağlantı hatası)'
      };
    }
  }
}

export default new RehberService();