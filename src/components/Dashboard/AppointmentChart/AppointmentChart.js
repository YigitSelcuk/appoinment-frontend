import React, { useState, useEffect } from 'react';
import { getAppointmentStats } from '../../../services/appointmentsService';
import { useAuth } from '../../../contexts/AuthContext';
import './AppointmentChart.css';

const AppointmentChart = () => {
  const { accessToken } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('HAFTALIK');

  // Varsayılan veriler (API hatası durumunda kullanılacak)
  const defaultData = [
    { day: 'PZT', value: 3, color: '#A7F3D0' },
    { day: 'SAL', value: 8, color: '#6EE7B7' },
    { day: 'ÇAR', value: 16, color: '#34D399' },
    { day: 'PER', value: 35, color: '#10B981' },
    { day: 'CUM', value: 45, color: '#059669' },
    { day: 'CMT', value: 23, color: '#047857' },
    { day: 'PZR', value: 22, color: '#065F46' }
  ];

  useEffect(() => {
    fetchAppointmentStats();
  }, [accessToken, period]);

  const fetchAppointmentStats = async () => {
    if (!accessToken) {
      setChartData(defaultData);
      setTotalAppointments(defaultData.reduce((sum, item) => sum + item.value, 0));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getAppointmentStats(accessToken, period);
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

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  // Responsive için kısaltılmış metinler
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPeriodOptions = () => {
    if (isMobile) {
      return [
        { value: 'HAFTALIK', label: 'H' },
        { value: 'AYLIK', label: 'A' },
        { value: 'YILLIK', label: 'Y' }
      ];
    }
    return [
      { value: 'HAFTALIK', label: 'HAFTALIK' },
      { value: 'AYLIK', label: 'AYLIK' },
      { value: 'YILLIK', label: 'YILLIK' }
    ];
  };

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(item => item.value)) : 1;

  if (loading) {
    return (
      <div className="appointment-chart-card">
        <div className="chart-header">
          <div className="chart-title-section">
            <div className="chart-title-with-icon">
              <span className="chart-icon">📅</span>
              <h6 className="chart-title">RANDEVU</h6>
            </div>
            <div className="chart-period">
              <select 
                value={period} 
                onChange={handlePeriodChange}
                className="period-select"
              >
                {getPeriodOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
          <div className="chart-title-with-icon">
            <span className="chart-icon">📅</span>
            <h6 className="chart-title">RANDEVU</h6>
          </div>
          <div className="chart-period">
            <select 
              value={period} 
              onChange={handlePeriodChange}
              className="period-select"
            >
              {getPeriodOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <div className={`chart-bars ${period === 'YILLIK' ? 'annual' : ''}`}>
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
        
        <div className="chart-total-section">
          <div className="total-display">
            <span className="total-icon">👤</span>
            <span className="total-number">{totalAppointments}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentChart;