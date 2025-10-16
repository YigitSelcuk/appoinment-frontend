import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getAppointmentsByDateRange, getAppointments } from '../../../services/appointmentsService';
import './CalendarWidget.css';

// Yardımcı: Türkçe ay ve gün isimleri
const MONTHS_TR = ['OCAK','ŞUBAT','MART','NİSAN','MAYIS','HAZİRAN','TEMMUZ','AĞUSTOS','EYLÜL','EKİM','KASIM','ARALIK'];
const WEEKDAYS_TR = ['PAZ','PZT','SAL','ÇAR','PER','CUM','CMT'];
const MONTHS_ABBR_TR = ['OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];

// Zaman formatlayıcı
const formatTime = (t) => {
  if (!t) return '';
  // 'HH:MM:SS' -> 'HH:MM'
  return t.length >= 5 ? t.slice(0,5) : t;
};

// Etiket: "OCA, SAL"
const formatDayLabel = (dateObj) => {
  const monthAbbr = MONTHS_ABBR_TR[dateObj.getMonth()];
  const weekdayAbbr = WEEKDAYS_TR[dateObj.getDay()];
  return `${monthAbbr}, ${weekdayAbbr}`;
};

// Aylık takvim için hücreleri üret
function makeMonthCells(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0: Pazar
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const dayNumber = i - startDow + 1;
    let value, currentMonth;
    if (dayNumber <= 0) {
      value = prevMonthDays + dayNumber;
      currentMonth = false;
    } else if (dayNumber > daysInMonth) {
      value = dayNumber - daysInMonth;
      currentMonth = false;
    } else {
      value = dayNumber;
      currentMonth = true;
    }
    cells.push({ value, currentMonth });
  }
  return cells;
}

const CalendarWidget = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date()); // Bugünün ayı
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [activeTab, setActiveTab] = useState('randevular');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const monthCells = useMemo(() => makeMonthCells(currentDate), [currentDate]);
  const monthName = MONTHS_TR[currentDate.getMonth()];
  const yearNum = currentDate.getFullYear();

  const goPrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const goNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  // Ay aralığını YYYY-MM-DD formatında hazırla
  const formatDate = useCallback((date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const loadAppointments = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const startStr = formatDate(startOfMonth);
      const endStr = formatDate(endOfMonth);

      const response = await getAppointmentsByDateRange(accessToken, startStr, endStr);
      if (response && response.success) {
        setAppointments(Array.isArray(response.data) ? response.data : []);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Randevular getirilemedi, tüm randevular yükleniyor (fallback):', error);
      try {
        const response = await getAppointments(accessToken);
        if (response && response.success) {
          // Yalnızca mevcut ayın randevularını filtrele
          const monthIdx = currentDate.getMonth();
          const year = currentDate.getFullYear();
          const filtered = (response.data || []).filter((apt) => {
            const d = new Date(apt.date);
            return d.getMonth() === monthIdx && d.getFullYear() === year;
          });
          setAppointments(filtered);
        } else {
          setAppointments([]);
        }
      } catch (fallbackError) {
        console.error('Fallback randevu yükleme hatası:', fallbackError);
        setAppointments([]);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentDate, formatDate]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Takvim günlerine küçük renkli noktaları hazırla (randevu renkleri)
  const dotsByDay = useMemo(() => {
    const dots = {};
    const monthIdx = currentDate.getMonth();
    const year = currentDate.getFullYear();
    appointments.forEach((apt) => {
      const d = new Date(apt.date);
      if (d.getMonth() !== monthIdx || d.getFullYear() !== year) return;
      const day = d.getDate();
      const color = apt.color || '#60A5FA';
      if (!dots[day]) dots[day] = [];
      // Aynı gün için en fazla 3 farklı renk
      if (!dots[day].includes(color)) {
        dots[day].push(color);
        if (dots[day].length > 3) dots[day] = dots[day].slice(0, 3);
      }
    });
    return dots;
  }, [appointments, currentDate]);

  // Sağ liste: randevuları güne göre grupla
  const dayList = useMemo(() => {
    const groups = new Map();
    const monthIdx = currentDate.getMonth();
    const year = currentDate.getFullYear();

    appointments.forEach((apt) => {
      const d = new Date(apt.date);
      if (d.getMonth() !== monthIdx || d.getFullYear() !== year) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (!groups.has(key)) {
        groups.set(key, {
          dayNum: d.getDate(),
          label: formatDayLabel(d),
          events: []
        });
      }
      groups.get(key).events.push({
        type: 'time',
        time: formatTime(apt.start_time || apt.startTime),
        color: apt.color || '#60A5FA',
        title: apt.title || apt.subject || 'Randevu'
      });
    });

    // Günleri tarihe göre sırala
    const sorted = Array.from(groups.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([, value]) => {
        // Event'leri saate göre sırala
        value.events.sort((e1, e2) => (e1.time || '').localeCompare(e2.time || ''));
        return value;
      });
    return sorted;
  }, [appointments, currentDate]);

  return (
    <div className="cw-container">
      {/* Üst sekmeler ve dönem seçici */}
      <div className="cw-top">
        <div className="cw-tabs">
          <button className={`cw-tab ${activeTab==='randevular'?'active':''}`} onClick={()=>setActiveTab('randevular')}>
            <span className="cw-tab-icon">📅</span>
            RANDEVULARIMIZ
          </button>
          <button className={`cw-tab ${activeTab==='ertelenen'?'active':''}`} onClick={()=>setActiveTab('ertelenen')}>
            ERTELENEN RANDEVULAR
          </button>
        </div>
      </div>

      {/* İçerik: sol takvim, sağ liste */}
      <div className="cw-content">
        {/* Sol: aylık takvim */}
        <div className="cw-calendar">
          <div className="cw-month-nav">
            <button className="cw-nav-btn" onClick={goPrevMonth} aria-label="Önceki">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            <div className="cw-month-title">
              <span className="cw-month-name">{monthName}</span>
              <span className="cw-year">{yearNum}</span>
            </div>
            <button className="cw-nav-btn" onClick={goNextMonth} aria-label="Sonraki">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          <div className="cw-weekdays">
            {WEEKDAYS_TR.map((w) => (
              <div key={w} className="cw-weekday">{w}</div>
            ))}
          </div>
          <div className="cw-days">
            {monthCells.map((c, i) => {
              const day = c.value;
              const dots = dotsByDay[day] || [];
              const isSelected = c.currentMonth && day === selectedDay;
              return (
                <button
                  key={i}
                  className={`cw-day ${c.currentMonth? 'current':''} ${isSelected? 'selected':''}`}
                  onClick={() => c.currentMonth && setSelectedDay(day)}
                >
                  <span className="cw-day-num">{day}</span>
                  {dots.length > 0 && (
                    <div className="cw-day-dots">
                      {dots.map((color, idx) => (
                        <span key={idx} className="cw-dot" style={{ background: color }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sağ: gün listesi */}
        <div className="cw-daylist">
          <div className="cw-daylist-scroll">
            {loading ? (
              <div style={{ padding: '12px', color: '#6B7280', fontSize: 12 }}>Randevular yükleniyor...</div>
            ) : dayList.length === 0 ? (
              <div style={{ padding: '12px', color: '#6B7280', fontSize: 12 }}>Bu ay için randevu bulunmuyor.</div>
            ) : (
              dayList.map((d, idx) => (
                <div key={idx} className="cw-dayblock">
                  <div className="cw-dayblock-left">
                    <span className="cw-badge">{d.dayNum}</span>
                    <span className="cw-daylabel">{d.label}</span>
                  </div>
                  <div className="cw-dayblock-right">
                    <div className="cw-events">
                      {d.events.map((ev, i2) => (
                        <div key={i2} className="cw-event-row">
                          <span className="cw-event-dot" style={{ background: ev.color }} />
                          <span className="cw-event-time">{ev.time}</span>
                          <span className="cw-event-title">{ev.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cw-footer">
            <button className="cw-show-all" onClick={() => navigate('/appointments')}>TÜMÜNÜ GÖSTER</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;