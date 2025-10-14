import React, { useState, useEffect } from 'react';
import { getAppointmentStats } from '../../../services/appointmentsService';
import { useAuth } from '../../../contexts/AuthContext';
import './AppointmentChart.css';

const AppointmentChart = () => {
  const { accessToken } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loading, setLoading] = useState(true);

  // Varsayılan veriler (API hatası durumunda kullanılacak)
  const defaultData = [
    { day: 'PZT', value: 35, color: '#10B981' },
    { day: 'SAL', value: 25, color: '#10B981' },
    { day: 'ÇAR', value: 45, color: '#10B981' },
    { day: 'PER', value: 30, color: '#10B981' },
    { day: 'CUM', value: 50, color: '#10B981' },
    { day: 'CTS', value: 20, color: '#10B981' },
    { day: 'PAZ', value: 15, color: '#10B981' }
  ];

  useEffect(() => {
    fetchAppointmentStats();
  }, [accessToken]);

  const fetchAppointmentStats = async () => {
    if (!accessToken) {
      setChartData(defaultData);
      setTotalAppointments(defaultData.reduce((sum, item) => sum + item.value, 0));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getAppointmentStats(accessToken);
      if (response.success) {
        setChartData(response.data.dailyStats);
        setTotalAppointments(response.data.total);
      } else {
        // API hatası durumunda varsayılan verileri kullan
        setChartData(defaultData);
        setTotalAppointments(defaultData.reduce((sum, item) => sum + item.value, 0));
      }
    } catch (error) {
      console.error('Randevu istatistikleri yüklenirken hata:', error);
      // Hata durumunda varsayılan verileri kullan
      setChartData(defaultData);
      setTotalAppointments(defaultData.reduce((sum, item) => sum + item.value, 0));
    } finally {
      setLoading(false);
    }
  };

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(item => item.value)) : 1;

  if (loading) {
    return (
      <div className="appointment-chart-card">
        <div className="chart-header">
          <div className="chart-title-section">
            <div className="chart-title-left">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="16" rx="4" fill="#FFF1E6"/>
                <path d="M8 2V5M16 2V5M3.5 9.09H20.5" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h6 className="chart-title">RANDEVU</h6>
            </div>
            <button className="chart-filter" type="button">
              AYLIK <span className="caret">▾</span>
            </button>
          </div>
        </div>
        <div className="chart-container">
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-chart-card">
      <div className="chart-header">
        <div className="chart-title-section">
          <div className="chart-title-left">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="5" width="18" height="16" rx="4" fill="#FFF1E6"/>
              <path d="M8 2V5M16 2V5M3.5 9.09H20.5" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h6 className="chart-title">RANDEVU</h6>
          </div>
          <button className="chart-filter" type="button">
            AYLIK <span className="caret">▾</span>
          </button>
        </div>
      </div>
      
      <div className="chart-container">
        <div className="chart-bars">
          {chartData.map((item, index) => {
            const isMax = item.value === maxValue;
            const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const background = isMax
              ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(180deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.2) 100%)';
            return (
              <div key={index} className="chart-bar-container">
                <div className="chart-bar-wrapper">
                  <div
                    className="chart-bar"
                    style={{ height: `${heightPercent}%`, background }}
                  >
                    <div className="bar-value">{item.value}</div>
                  </div>
                </div>
                <div className="chart-day-circle">{item.day}</div>
              </div>
            );
          })}
        </div>

        <div className="chart-summary">
          <div className="summary-label">TOPLAM</div>
          <div className="summary-content">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#FFA726"/>
              <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="#FFA726"/>
            </svg>
            <span className="summary-number">{totalAppointments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentChart;