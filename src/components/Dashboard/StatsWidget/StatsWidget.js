import React from 'react';
import './StatsWidget.css';

const StatsWidget = () => {
  const stats = [
    { label: 'MEMBER', value: '18', color: '#6366F1' },
    { label: 'TALEP', value: '20', color: '#8B5CF6' },
    { label: 'TÜMÜ', value: '15', color: '#06B6D4' }
  ];

  const activities = [
    { label: 'AÇIK', value: '20', color: '#8B5CF6' },
    { label: 'DEVAM', value: '30', color: '#06B6D4' },
    { label: 'TAMAN', value: '65', color: '#10B981' }
  ];

  const totals = [
    { label: 'TOPLAM', value: '275', color: '#F59E0B' }
  ];

  return (
    <div className="stats-widget-container">
      {/* İlk Stats Grubu */}
      <div className="stats-widget-card">
        <div className="stats-widget-header">
          <div className="stats-icon">👥</div>
          <h6 className="stats-title">MEMBER</h6>
        </div>
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* İkinci Stats Grubu - Activities */}
      <div className="stats-widget-card">
        <div className="stats-widget-header">
          <div className="stats-icon">📊</div>
          <h6 className="stats-title">TALEP</h6>
        </div>
        <div className="stats-grid">
          {activities.map((activity, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value" style={{ color: activity.color }}>
                {activity.value}
              </div>
              <div className="stat-label">{activity.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toplam */}
      <div className="stats-widget-card">
        <div className="stats-widget-header">
          <div className="stats-icon">🎯</div>
          <h6 className="stats-title">TOPLAM</h6>
        </div>
        <div className="stats-grid">
          {totals.map((total, index) => (
            <div key={index} className="stat-item large">
              <div className="stat-value large" style={{ color: total.color }}>
                {total.value}
              </div>
              <div className="stat-label">{total.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsWidget;