import React, { useState, useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import WeeklyCalendar from '../../components/WeeklyCalendar/WeeklyCalendar';
import FloatingChat from '../../components/FloatingChat/FloatingChat';
import './Appointments.css';

const Appointments = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedWeekDate, setSelectedWeekDate] = useState(today);

  // İlk yüklemede bugünün tarihini seç
  useEffect(() => {
    const todayDate = new Date();
    setSelectedDate(todayDate.getDate());
    setCurrentMonth(todayDate.getMonth());
    setCurrentYear(todayDate.getFullYear());
    setSelectedWeekDate(todayDate);
  }, []);

  // Calendar'dan gelen tarih değişikliği
  const handleCalendarDateChange = (day, month, year) => {
    setSelectedDate(day);
    setCurrentMonth(month);
    setCurrentYear(year);
    
    // WeeklyCalendar için tarih objesi oluştur
    const newDate = new Date(year, month, day);
    setSelectedWeekDate(newDate);
  };

  // WeeklyCalendar'dan gelen tarih değişikliği
  const handleWeeklyCalendarDateChange = (date) => {
    // Date objesi kontrolü
    if (!date || typeof date === 'string') {
      // String ise Date objesine çevir
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        setSelectedDate(dateObj.getDate());
        setCurrentMonth(dateObj.getMonth());
        setCurrentYear(dateObj.getFullYear());
        setSelectedWeekDate(dateObj);
      }
      return;
    }
    
    // Date objesi ise direkt kullan
    if (date instanceof Date && !isNaN(date.getTime())) {
      setSelectedDate(date.getDate());
      setCurrentMonth(date.getMonth());
      setCurrentYear(date.getFullYear());
      setSelectedWeekDate(date);
    }
  };

  return (
    <div className="appointments-page">
      <div className="appointments-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar 
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onDateChange={handleCalendarDateChange}
          />
        </div>

        {/* Orta Panel - WeeklyCalendar */}
        <div className="weekly-calendar-section">
          <WeeklyCalendar 
            selectedDate={selectedWeekDate}
            onDateChange={handleWeeklyCalendarDateChange}
          />
        </div>

        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
    </div>
  );
};

export default Appointments;