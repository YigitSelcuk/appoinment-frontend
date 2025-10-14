import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSimpleToast } from '../../contexts/SimpleToastContext';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import CircularProgress from '../../components/Dashboard/CircularProgress/CircularProgress';
import MobileDownload from '../../components/Dashboard/MobileDownload/MobileDownload';
import Rehber from '../../components/Dashboard/Rehber/Rehber';
import Atalepler from '../../components/Dashboard/Atalepler/Atalepler';
import AppointmentChart from '../../components/Dashboard/AppointmentChart/AppointmentChart';
import CalendarWidget from '../../components/Dashboard/CalendarWidget/CalendarWidget';
import TasksWidget from '../../components/Dashboard/TasksWidget/TasksWidget';
import ContactsWidget from '../../components/Dashboard/ContactsWidget/ContactsWidget';
import RequestsWidget from '../../components/Dashboard/RequestsWidget/RequestsWidget';
import ActivitiesWidget from '../../components/Dashboard/ActivitiesWidget/ActivitiesWidget';
import MessagesWidget from '../../components/Dashboard/MessagesWidget/MessagesWidget';

import FloatingChat from '../../components/FloatingChat/FloatingChat';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess, showWarning, showInfo } = useSimpleToast();

  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalContacts: 0,
    pendingRequests: 0
  });

  // Test toast fonksiyonları
  const testError = () => {
    console.log('Test Error butonu tıklandı');
    showError('Bu bir test hata mesajıdır!');
  };

  const testSuccess = () => {
    console.log('Test Success butonu tıklandı');
    showSuccess('Bu bir test başarı mesajıdır!');
  };

  const testWarning = () => {
    console.log('Test Warning butonu tıklandı');
    showWarning('Bu bir test uyarı mesajıdır!');
  };

  const testInfo = () => {
    console.log('Test Info butonu tıklandı');
    showInfo('Bu bir test bilgi mesajıdır!');
  };





  const statsData = [
    {
      title: 'Toplam Randevu',
      value: '156',
      icon: '📅',
      color: 'primary',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Bekleyen Randevu',
      value: '23',
      icon: '⏳',
      color: 'warning',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Tamamlanan',
      value: '133',
      icon: '✅',
      color: 'success',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Sistem Aktiviteleri',
      value: '45',
      icon: '📊',
      color: 'info',
      change: '+15%',
      changeType: 'positive'
    }
  ];





  return (
    <div className="dashboard">
      <div className="dashboard-content">
        {/* 2 kolonlu layout: sol ana içerik, sağ chat */}
        <div className="dashboard__content">
          {/* Ana içerik */}
          <div className="dashboard-main">
            <Container fluid className="py-0" style={{ padding: '0' }}>
              {/* Header Components */}
              <Row className="mb-1 mx-0">
                {/* Sol üst - Circular Progress */}
                <Col lg={2} md={6} className="mb-1 px-2">
                  <CircularProgress 
                    value={150} 
                    total={200} 
                    label="HİZMET" 
                    color="#007bff" 
                  />
                </Col>
                
                {/* Orta üst - Mobile Download */}
                <Col lg={2} md={6} className="mb-1 px-2">
                  <MobileDownload />
                </Col>
                
                {/* Rehber Widget */}
                <Col lg={2} md={6} className="mb-1 px-2">
                  <Rehber />
                </Col>
                
                {/* Atalepler Widget */}
                <Col lg={3} md={6} className="mb-1 px-2">
                  <Atalepler />
                </Col>
                
                {/* En sağ - Appointment Chart */}
                <Col lg={3} md={6} className="mb-1 px-2">
                  <AppointmentChart />
                </Col>
              </Row>

              {/* Main Content */}
              <Row className="mx-0">
                {/* Calendar Widget */}
                <Col lg={8} className="mb-4">
                  <CalendarWidget />
                </Col>

                {/* Tasks Widget */}
                <Col lg={4} className="mb-4">
                  <TasksWidget />
                </Col>
              </Row>

              {/* Alt bölüm: 3 yeni widget (aynı tasarım) */}
              <Row className="mx-0">
                <Col lg={4} className="mb-4 px-2">
                  <RequestsWidget />
                </Col>
                <Col lg={4} className="mb-4 px-2">
                  <ActivitiesWidget />
                </Col>
                <Col lg={4} className="mb-4 px-2">
                  <MessagesWidget />
                </Col>
              </Row>
            </Container>
          </div>
          
          {/* Sağ: FloatingChat */}
          <div className="right-float-chat">
            <FloatingChat />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;