import React from 'react';
import { useNavigate } from 'react-router-dom';
import './RequestsWidget.css';

// Halkalı ilerleme göstergesi (yüzde ve renk)
const RingProgress = ({ percent = 0, color = '#22C55E' }) => {
  const size = 32;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(percent, 0), 100) / 100);
  return (
    <svg width={size} height={size} className="rw-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

const formatNum = (n) => Number(n).toLocaleString('tr-TR');

const sampleRows = [
  { name: 'SOSYAL YARDIM', v1: 4869, v2: 5647, p: 90.5, color: '#cbd5e1' },
  { name: 'YOL YAPIMI', v1: 4869, v2: 5647, p: 90.5, color: '#22c55e' },
  { name: 'HİZMET TALEBİ', v1: 4869, v2: 5647, p: 90.5, color: '#6366f1' },
  { name: 'GENEL TALEPLER', v1: 4869, v2: 5647, p: 90.5, color: '#ef4444' },
  { name: 'ETKİNLİK KONSER', v1: 4869, v2: 5647, p: 90.5, color: '#06b6d4' },
  { name: 'SIFIR ATIK', v1: 4869, v2: 5647, p: 90.5, color: '#f59e0b' },
  { name: 'MOBİL UYGULAMA', v1: 4869, v2: 5647, p: 90.5, color: '#22c55e' },
];

const RequestsWidget = () => {
  const navigate = useNavigate();
  return (
    <div className="requests-widget">
      {/* Üst başlık */}
      <div className="rw2-header">
        <div className="rw2-left">
          <div className="rw2-icon">
            {/* Telefon simgesi */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v2a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 5.18 2 2 0 0 1 5 3h2a2 2 0 0 1 2 1.72c.12.9.32 1.77.58 2.6a2 2 0 0 1-.45 2.11l-1 1a16 16 0 0 0 6.88 6.88l1-1a2 2 0 0 1 2.11-.45c.83.26 1.7.46 2.6.58A2 2 0 0 1 22 16.92Z" fill="#f59e0b"/>
            </svg>
          </div>
          <h6 className="rw2-title">ÇÖZÜM MERKEZİ</h6>
        </div>
        <div className="rw2-right">
          <button className="rw2-period" aria-label="Dönem">
            AYLIK
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M7 10l5 5 5-5" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="rw2-menu" aria-label="Menü">
            <span/><span/><span/>
          </button>
        </div>
      </div>

      {/* Satırlar */}
      <div className="rw2-list">
        {sampleRows.map((row, idx) => (
          <div key={idx} className="rw2-row">
            <div className="rw2-col-name">{row.name}</div>
            <div className="rw2-col-num">{formatNum(row.v1)}</div>
            <div className="rw2-col-num">{formatNum(row.v2)}</div>
            <div className="rw2-col-pct">{row.p}%</div>
            <div className="rw2-col-ring"><RingProgress percent={row.p} color={row.color} /></div>
          </div>
        ))}
      </div>

      {/* Tümü butonu (isteğe bağlı) */}
      <div className="rw2-footer">
        <button className="rw2-show-all" onClick={() => navigate('/requests')}>TÜMÜNÜ GÖSTER</button>
      </div>
    </div>
  );
};

export default RequestsWidget;