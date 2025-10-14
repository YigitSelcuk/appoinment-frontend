import React from 'react';
import { Container, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import ActivitiesTable from '../../components/ActivitiesTable/ActivitiesTable';
import './Activities.css';

const Activities = () => {
  const { user } = useAuth();
  
  // Admin kontrolü
  const isAdmin = user && (user.role === 'admin' || user.role === 'başkan' || user.department === 'BAŞKAN');

  if (!isAdmin) {
    return (
      <div className="activities-page">
        <Container fluid className="px-4 py-4">
          <Alert variant="warning" className="text-center">
            <Alert.Heading>Yetkisiz Erişim</Alert.Heading>
            <p>Bu sayfaya erişim için admin yetkisi gereklidir.</p>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="activities-page">
      <Container fluid className="px-4 py-0">
        <ActivitiesTable />
      </Container>
    </div>
  );
};

export default Activities;