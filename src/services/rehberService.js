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
      
      // Hata durumunda boş veri döndür
      const emptyData = [];
      for (let i = 0; i < 7; i++) {
        emptyData.push({
          customers: 0,
          suppliers: 0,
          doctors: 0,
          total_contacts: 0,
          weekly_new: 0
        });
      }
      
      return {
        success: false,
        data: emptyData,
        message: 'Rehber istatistikleri alınırken hata oluştu'
      };
    }
  }
}

export default new RehberService();