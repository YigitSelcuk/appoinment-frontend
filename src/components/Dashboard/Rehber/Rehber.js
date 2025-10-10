import React, { useState, useEffect } from 'react';
import './Rehber.css';
import rehberService from '../../../services/rehberService';
import { useAuth } from '../../../contexts/AuthContext';

const Rehber = () => {
  const { accessToken } = useAuth();
  const [data, setData] = useState([
    { customers: 25, suppliers: 8, doctors: 5, total_contacts: 45, weekly_new: 8 },
    { customers: 23, suppliers: 7, doctors: 4, total_contacts: 42, weekly_new: 6 },
    { customers: 20, suppliers: 6, doctors: 4, total_contacts: 38, weekly_new: 5 },
    { customers: 18, suppliers: 5, doctors: 3, total_contacts: 35, weekly_new: 4 },
    { customers: 16, suppliers: 4, doctors: 3, total_contacts: 32, weekly_new: 3 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRehberStats();
  }, [accessToken]);

  const fetchRehberStats = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await rehberService.getRehberStats(accessToken);
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Rehber verileri alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toplam randevu sayısını hesapla
  const totalAppointments = data.reduce((sum, item) => sum + (item.customers || 0), 0);
  
  // Bar chart için maksimum değer
  const maxValue = Math.max(...data.map(item => item.customers || 0));
  
  // Günlerin kısaltmaları
  const dayLabels = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PZR'];

  return (
    <div className="rehber-container">
      <div className="rehber-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="#FF6B35" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.6947 13.7002H15.7037M15.6947 16.7002H15.7037M11.9955 13.7002H12.0045M11.9955 16.7002H12.0045M8.29431 13.7002H8.30329M8.29431 16.7002H8.30329" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h6 className="rehber-title">REHBER</h6>
      </div>
      
      <div className="rehber-chart">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span>Veriler yükleniyor...</span>
          </div>
        ) : (
          <>
            <div className="chart-bars">
              {data.slice(0, 7).map((item, index) => (
                <div key={index} className="bar-container">
                  <div className="bar-value-top">{item.customers || 0}</div>
                  <div className="bar-wrapper">
                    <div
                      className="bar bar-appointment"
                      style={{ height: `${maxValue > 0 ? (item.customers / maxValue) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="bar-label">{dayLabels[index] || `D${index + 1}`}</div>
                </div>
              ))}
            </div>
            
            <div className="rehber-total">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#FFA726"/>
                <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="#FFA726"/>
              </svg>
              <span className="total-number">{totalAppointments}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Rehber;