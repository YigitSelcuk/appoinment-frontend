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
            <h6 className="chart-title">RANDEVU</h6>
            <div className="chart-total">
              <span className="total-number">...</span>
              <span className="total-icon">📊</span>
            </div>
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
          <h6 className="chart-title">RANDEVU</h6>
          <div className="chart-total">
            <span className="total-number">{totalAppointments}</span>
            <span className="total-icon">📊</span>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <div className="chart-bars">
          {chartData.map((item, index) => (
            <div key={index} className="chart-bar-container">
              <div className="chart-bar-wrapper">
                <div 
                  className="chart-bar"
                  style={{
                    height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    backgroundColor: item.color
                  }}
                >
                  <div className="bar-value">{item.value}</div>
                </div>
              </div>
              <div className="chart-day">{item.day}</div>
            </div>
          ))}
        </div>
        
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#10B981' }}></span>
            <span className="legend-text">TOPLAM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentChart;