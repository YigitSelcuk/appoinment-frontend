import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactsService } from '../../../services/contactsService';
import './MessagesWidget.css';

const MessagesWidget = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const res = await contactsService.getContacts({ page: 1, limit: 9 });
        let rows = [];
        if (Array.isArray(res)) rows = res;
        else if (Array.isArray(res?.data)) rows = res.data;
        else if (Array.isArray(res?.items)) rows = res.items;
        else if (Array.isArray(res?.results)) rows = res.results;
        setContacts(rows.slice(0, 9));
      } catch (e) {
        console.error('MessagesWidget: kontaklar yüklenemedi', e);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest('.mw2-actions-cell')) {
        setOpenIndex(null);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(c =>
      `${c.name || ''} ${c.surname || ''}`.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const handleWhatsApp = (phone) => {
    const clean = String(phone || '').replace(/[^0-9]/g, '');
    if (!clean) return;
    window.open(`https://wa.me/90${clean}`, '_blank');
  };

  const handleCall = (phone) => {
    if (!phone) return;
    window.open(`tel:${phone}`, '_self');
  };

  const handleSMS = (phone) => {
    if (!phone) return;
    window.open(`sms:${phone}`, '_self');
  };

  const handleEmail = (email) => {
    if (!email) return;
    window.open(`mailto:${email}`, '_self');
  };

  const getPhone = (c) => c.phone || c.phone1 || c.mobile || c.mobilePhone || c.gsm || '';
  const getEmail = (c) => c.email || c.mail || '';
  const getTitle = (c) => c.title || c.jobTitle || c.position || c.role || (c.category?.name) || '';

  const handleView = (c) => {
    // İsteğe göre detay sayfasına yönlendirme yapılabilir
    navigate('/contacts');
  };

  const handleSendMessage = (c) => {
    navigate('/messages');
  };

  const handleEdit = (c) => {
    navigate('/contacts');
  };

  const handleDelete = async (c) => {
    // Güvenli olması için sadece uyarı gösteriyoruz
    alert('Silme işlemi burada devre dışı. Contacts sayfasından kullanın.');
  };

  return (
    <div className="messages-widget">
      {/* Üst Başlık - Son Eklenenler */}
      <div className="mw2-header">
        <div className="mw2-left">
          <div className="mw2-icon">📞</div>
          <h6 className="mw2-title">SON EKLENENLER</h6>
        </div>
        <div className="mw2-center">
          <div className="mw2-search">
            <svg className="mw2-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2"/>
              <path d="M20 20l-3.5-3.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="AD SOYAD"
              className="mw2-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Body + Inner Panel (rounded) */}
      <div className="mw2-body">
        <div className="mw2-panel">
          <div className="mw2-table-wrapper">
            <table className="mw2-table">
              <thead>
                <tr className="mw2-header-row">
                  <th>SIRA</th>
                  <th>AD</th>
                  <th>SOYAD</th>
                  <th>ÜNVAN</th>
                  <th>TELEFON</th>
                  <th>İŞLEM</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="mw2-loading">Yükleniyor...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6" className="mw2-empty">Kayıt bulunamadı</td></tr>
                ) : (
                  filtered.map((c, index) => (
                    <tr key={c.id || index} className="mw2-row">
                      <td className="mw2-col-number">{index + 1}</td>
                      <td className="mw2-col-name">{String(c.name || '').toUpperCase()}</td>
                      <td className="mw2-col-surname">{String(c.surname || '').toUpperCase()}</td>
                      <td className="mw2-col-title">{String(getTitle(c) || '').toUpperCase()}</td>
                      <td className="mw2-col-phone">{getPhone(c) || '-'}</td>
                      <td className="mw2-col-actions mw2-actions-cell">
                        <button className="mw2-action-menu-btn" title="İşlemler" aria-label="İşlemler" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                            <circle cx="8" cy="13" r="1.5" fill="currentColor" />
                          </svg>
                        </button>
                        {openIndex === index && (
                          <div className="mw2-dropdown" role="menu">
                            <button className="mw2-dropdown-item view" onClick={() => handleView(c)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" fill="currentColor"/></svg>
                              <span>Görüntüle</span>
                            </button>
                            <button className="mw2-dropdown-item message" onClick={() => handleSendMessage(c)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                              <span>İleti Gönder</span>
                            </button>
                            <button className="mw2-dropdown-item whatsapp" onClick={() => handleWhatsApp(getPhone(c))}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0021.465 3.488"/></svg>
                              <span>WhatsApp</span>
                            </button>
                            <button className="mw2-dropdown-item edit" onClick={() => handleEdit(c)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg>
                              <span>Düzenle</span>
                            </button>
                            <button className="mw2-dropdown-item delete" onClick={() => handleDelete(c)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-3h6l1 2H8l1-2z"/></svg>
                              <span>Sil</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mw2-footer">
        <button className="mw2-show-all" onClick={() => navigate('/contacts')}>TÜMÜNÜ GÖSTER</button>
      </div>
    </div>
  );
};

export default MessagesWidget;