import React from "react";
import { Container } from "react-bootstrap";
import DepartmentRequestsTable from "../../components/DepartmentRequestsTable/DepartmentRequestsTable";
import "./DepartmentRequests.css";

const DepartmentRequests = () => {
  return (
    <div className="department-requests-page">
      <Container fluid>
        <div className="page-header">
          <h2 className="page-title">Müdürlük Talepleri</h2>
          <p className="page-description">
            Müdürlüğünüze ait talepleri görüntüleyebilir ve durum güncellemeleri yapabilirsiniz.
          </p>
        </div>

        <DepartmentRequestsTable />
      </Container>
    </div>
  );
};

export default DepartmentRequests;