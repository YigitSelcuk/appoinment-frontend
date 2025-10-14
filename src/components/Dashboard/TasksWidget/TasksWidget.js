import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getTasks } from '../../../services/tasksService';
import { FaCheck, FaTimes } from 'react-icons/fa';
import './TasksWidget.css';

const TasksWidget = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      if (!accessToken) return;
      try {
        setLoading(true);
        const res = await getTasks(accessToken, { page: 1, limit: 9 });
        if (res && res.success && Array.isArray(res.data)) {
          setTasks(res.data);
        } else if (Array.isArray(res)) {
          setTasks(res.slice(0, 9));
        } else {
          setTasks([]);
        }
      } catch (e) {
        console.error('TasksWidget: görevler yüklenemedi', e);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, [accessToken]);

  const renderApprovalIcon = (approval) => {
    const approved = approval === 'ONAYLANDI' || approval === 'APPROVED' || approval === true;
    return (
      <div className={`tw-approval ${approved ? 'approved' : 'not-approved'}`}>
        {approved ? <FaCheck /> : <FaTimes />}
      </div>
    );
  };

  return (
    <div className="tasks-widget">
      {/* Header */}
      <div className="tw-header">
        <div className="tw-header-left">
          <div className="tw-header-icon">
            {/* minimal tasks icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="4" stroke="#5b21b6" strokeWidth="2"/>
              <path d="M7 8h10M7 12h10M7 16h6" stroke="#5b21b6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h6 className="tw-title">YAKLAŞAN GÖREVLER</h6>
        </div>
      
      </div>

      {/* Table */}
      <div className="tw-table-wrapper">
        <table className="tw-table">
          <thead>
            <tr>
              <th>SIRA</th>
              <th>YAPILACAK GÖREV</th>
              <th>SORUMLU</th>
              <th>DURUM</th>
              <th>ONAY</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="tw-loading">Yükleniyor...</td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="5" className="tw-empty">Görev bulunamadı</td>
              </tr>
            ) : (
              tasks.map((task, idx) => {
                const assignee = task.assignee_full_name || task.assignee_name || '-';
                return (
                  <tr key={task.id || idx}>
                    <td>
                      <div className="tw-row-number">{idx + 1}</div>
                    </td>
                    <td>
                      <div className="tw-task-text">
                        {task.title || task.description || 'Görev'}
                      </div>
                    </td>
                    <td className="tw-assignee">{assignee}</td>
                    <td className={`tw-status ${String(task.status || '').toLowerCase()}`}>{task.status || '-'}</td>
                    <td>{renderApprovalIcon(task.approval)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Show All */}
      <div className="tw-show-all">
        <button className="tw-show-all-btn" onClick={() => navigate('/tasks')}>TÜMÜNÜ GÖSTER</button>
      </div>
    </div>
  );
};

export default TasksWidget;