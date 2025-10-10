import React from "react";
import Calendar from "../../components/Calendar/Calendar";
import RequestsTable from "../../components/RequestsTable/RequestsTable";
import FloatingChat from "../../components/FloatingChat/FloatingChat";
import "./Requests.css";

const Requests = () => {
  return (
    <div className="requests-page">
      <div className="requests-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - Requests Tablosu */}
        <div className="requests-content">
          <RequestsTable />
        </div>
        
        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
    </div>
  );
};

export default Requests; 