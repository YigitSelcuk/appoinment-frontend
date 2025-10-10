import React from 'react';
import { Container } from 'react-bootstrap';
import ActivitiesTable from '../../components/ActivitiesTable/ActivitiesTable';
import './Activities.css';

const Activities = () => {
  return (
    <div className="activities-page">
      <Container fluid className="px-4 py-4">
        <div className="page-header">
          <h2>Son Aktiviteler</h2>
          <p>Sistemde gerçekleştirilen tüm işlemler burada listelenmektedir.</p>
        </div>
        <ActivitiesTable />
      </Container>
    </div>
  );
};

export default Activities;