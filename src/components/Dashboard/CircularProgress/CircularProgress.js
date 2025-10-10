import React, { useState } from 'react';
import './CircularProgress.css';

const CircularProgress = ({ value, total, label, color = '#007bff' }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('AYLIK');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const periods = ['GÜNLÜK', 'HAFTALIK', 'AYLIK', 'YILLIK'];
  
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    setIsDropdownOpen(false);
  };
  const percentage = (value / total) * 100;
  const radius = 70;
  const fullCircumference = 2 * Math.PI * radius;
  // 270 derece için (tam daire 360 derece olduğundan 270/360 = 0.75)
  const circumference = fullCircumference * 0.75;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress-card">
      <div className="circular-progress-container">
        <svg className="circular-progress-svg" width="160" height="160" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#f0f0f0"
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${circumference} ${fullCircumference}`}
            strokeLinecap="round"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="url(#gradient)"
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${circumference} ${fullCircumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-circle"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out'
            }}
          />
          {/* Progress end dot */}
          <circle
            cx={80 + radius * Math.cos((270 * (value / total) - 90) * Math.PI / 180)}
            cy={80 + radius * Math.sin((270 * (value / total) - 90) * Math.PI / 180)}
            r="4"
            fill="url(#gradient)"
            style={{
              transition: 'cx 0.5s ease-in-out, cy 0.5s ease-in-out'
            }}
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="circular-progress-content">
          <div className="progress-icon">👤</div>
          <div className="progress-value">{value} K</div>
          <div className="progress-label">{label}</div>
        </div>
      </div>
      <div className="progress-footer">
        <div className="progress-dropdown-container">
          <div 
            className="progress-dropdown-trigger"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="progress-period">{selectedPeriod}</span>
            <span className={`progress-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
          </div>
          {isDropdownOpen && (
            <div className="progress-dropdown-menu">
              {periods.map((period) => (
                <div
                  key={period}
                  className={`progress-dropdown-item ${selectedPeriod === period ? 'active' : ''}`}
                  onClick={() => handlePeriodChange(period)}
                >
                  {period}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;