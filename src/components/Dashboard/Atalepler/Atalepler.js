import React, { useState, useEffect } from 'react';
import { getRequestStats } from '../../../services/requestsService';
import { useAuth } from '../../../contexts/AuthContext';
import './Atalepler.css';

const Atalepler = () => {
  const { accessToken } = useAuth();
  const [data, setData] = useState({
    devam_eden: 0,
    tamamlanan: 0,
    acik: 0,
    toplam: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTalepStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const fetchTalepStats = async () => {
    if (!accessToken) {
      // Hata durumunda sample data kullan
      setData({
        devam_eden: 45,
        tamamlanan: 120,
        acik: 25,
        toplam: 190
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getRequestStats(accessToken);
      if (response.success) {
        setData(response.data);
      } else {
        throw new Error('API yanıtı başarısız');
      }
    } catch (error) {
      console.error('Talep istatistikleri alınırken hata:', error);
      // Hata durumunda sample data kullan
      setData({
        devam_eden: 45,
        tamamlanan: 120,
        acik: 25,
        toplam: 190
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="atalepler-container">
      <div className="atalepler-header">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1C11.866 1 15 4.134 15 8C15 11.866 11.866 15 8 15C4.134 15 1 11.866 1 8C1 4.134 4.134 1 8 1Z" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 4.5V8L10.5 10.5" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h6 className="atalepler-title">TALEPLER</h6>
      </div>
      <div className="atalepler-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Veriler yükleniyor...</span>
          </div>
        ) : (
          <>
            <div className="data-rows">
              <div className="data-row">
                <span className="data-label">DEVAM EDEN</span>
                <span className="data-value">{data.devam_eden}</span>
              </div>
              <div className="data-row">
                <span className="data-label">TAMAMLANAN</span>
                <span className="data-value">{data.tamamlanan}</span>
              </div>
              <div className="data-row">
                <span className="data-label">AÇIK</span>
                <span className="data-value">{data.acik}</span>
              </div>
            </div>
            <div className="total-section">
              <span className="total-label">TOPLAM</span>
              <span className="total-value">{data.toplam}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Atalepler;