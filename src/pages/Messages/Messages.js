import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Calendar from '../../components/Calendar/Calendar';
import MessagesTable from '../../components/MessagesTable/MessagesTable';
import './Messages.css';

const Messages = () => {
  const navigate = useNavigate();

  const goToMessagingPanel = () => {
    console.log('MessagingPanel\'e yönlendiriliyor...');
    navigate('/messaging-panel');
  };

  return (
    <div className="messages-page">
      <Container fluid className="px-0">
        <Row className="g-0 h-100">
          {/* Sol Taraf - Takvim */}
          <Col lg={3} xl={3} className="calendar-sidebar">
            <div className="calendar-container">
              <Calendar />
            </div>
          </Col>
          
          {/* Sağ Taraf - SMS Tablosu */}
          <Col lg={9} xl={9} className="messages-content">
            {/* Debug: MessagingPanel Test Butonu */}
            <div className="mb-3 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <Button 
                variant="primary" 
                onClick={goToMessagingPanel}
                className="me-2"
              >
                🔧 MessagingPanel'e Git (Test)
              </Button>
              <small className="text-muted">
                Bu buton MessagingPanel'e erişimi test etmek içindir.
              </small>
            </div>
            
            <MessagesTable />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Messages; 