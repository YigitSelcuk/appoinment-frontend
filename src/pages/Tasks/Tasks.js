import React from "react";
import Calendar from "../../components/Calendar/Calendar";
import TasksTable from "../../components/TasksTable/TasksTable";
import FloatingChat from "../../components/FloatingChat/FloatingChat";
import "./Tasks.css";

const Tasks = () => {
  return (
    <div className="tasks-page">
      <div className="tasks-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - Tasks Tablosu */}
        <div className="tasks-content">
          <TasksTable />
        </div>
        
        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
    </div>
  );
};

export default Tasks; 