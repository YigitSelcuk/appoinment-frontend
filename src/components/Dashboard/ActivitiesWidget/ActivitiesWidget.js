import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getActivities } from '../../../services/activitiesService';
import { FaCheck, FaTimes } from 'react-icons/fa';
import './ActivitiesWidget.css';

const ActivitiesWidget = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!accessToken) return;
      try {
        setLoading(true);
        const res = await getActivities(accessToken, { page: 1, limit: 9 });
        if (res && res.success && Array.isArray(res.data)) {
          setItems(res.data);
        } else if (Array.isArray(res)) {
          setItems(res.slice(0, 9));
        } else if (Array.isArray(res?.activities)) {
          setItems(res.activities.slice(0, 9));
        } else if (Array.isArray(res?.data?.items)) {
          setItems(res.data.items.slice(0, 9));
        } else {
          setItems([]);
        }
      } catch (e) {
        console.error('ActivitiesWidget: veriler yüklenemedi', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [accessToken]);

  const renderApprovalIcon = (status) => {
    const success = status === 'SUCCESS' || status === 'OK' || status === true;
    return (
      <div className={`aw-approval ${success ? 'approved' : 'not-approved'}`}>
        {success ? <FaCheck /> : <FaTimes />}
      </div>
    );
  };

  return (
    <div className="activities-widget">
      {/* Header */}
      <div className="aw-header">
        <div className="aw-header-left">
          <div className="aw-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#5b21b6" strokeWidth="2"/>
              <path d="M12 7v5l3 3" stroke="#5b21b6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h6 className="aw-title">SİSTEM AKTİVİTELERİ</h6>
        </div>
      </div>

      {/* Body + Inner Panel (rounded) */}
      <div className="aw-body">
        <div className="aw-panel">
          <div className="aw-table-wrapper">
            <table className="aw-table">
              <thead>
                <tr>
                  <th>SIRA</th>
                  <th>AKTİVİTE</th>
                  <th>KULLANICI</th>
                  <th>İŞLEM</th>
                  <th>TABLO</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="aw-loading">Yükleniyor...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="aw-empty">Kayıt bulunamadı</td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const user = item.user_name || item.username || item.user || '-';
                    const operation = item.action_type || item.actionType || item.type || '-';
                    const table = item.table_name || item.tableName || item.table || '-';
                    const activity = item.description || item.details || `${operation} işlemi`;
                    console.log('Activity item:', item); // Debug için
                    return (
                      <tr key={item.id || idx}>
                        <td>
                          <div className="aw-row-number">{idx + 1}</div>
                        </td>
                        <td>
                          <div className="aw-task-text">{activity}</div>
                        </td>
                        <td className="aw-assignee">{user}</td>
                        <td className={`aw-status ${String(operation).toLowerCase()}`}>{operation}</td>
                        <td className="aw-table">{table}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Show All */}
      <div className="aw-show-all">
        <button className="aw-show-all-btn" onClick={() => navigate('/activities')}>TÜMÜNÜ GÖSTER</button>
      </div>
    </div>
  );
};

export default ActivitiesWidget;