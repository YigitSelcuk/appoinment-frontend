import React from 'react';
import './ContactsWidget.css';

const ContactsWidget = () => {
  const contacts = [
    { id: 1, name: 'YAKUP', surname: 'YILMAZ', title: 'TASARIMCI', phone: '0533 236 65 64' },
    { id: 2, name: 'MEHMET', surname: 'YILDIRIM', title: 'DERNEK BAŞKANI', phone: '0533 236 65 64' },
    { id: 3, name: 'ABDULLAH', surname: 'ŞEN', title: 'İŞ ADAMI', phone: '0533 236 65 64' },
    { id: 4, name: 'MUAMMER', surname: 'ŞAHİN', title: 'TEKNİSYEN', phone: '0533 236 65 64' },
    { id: 5, name: 'İSMAİL', surname: 'CAN', title: 'MUHTAR', phone: '0533 236 65 64' },
    { id: 6, name: 'CUMALI', surname: 'YILMAZ', title: 'İŞ ADAMI', phone: '0533 236 65 64' },
    { id: 7, name: 'ŞAHİN', surname: 'YALÇIN', title: 'İŞ ADAMI', phone: '0533 236 65 64' },
    { id: 8, name: 'FATİH', surname: 'ALPTEKİN', title: 'İŞ ADAMI', phone: '0533 236 65 64' },
    { id: 9, name: 'AHMET', surname: 'KARAKUŞ', title: 'DERNEK BAŞKANI', phone: '0533 236 65 64' }
  ];

  const handleWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/90${cleanPhone}`, '_blank');
  };

  const handleCall = (phone) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleSMS = (phone) => {
    window.open(`sms:${phone}`, '_self');
  };

  const handleEmail = () => {
    // Email functionality
  };

  return (
    <div className="contacts-widget">
      <div className="contacts-header">
        <div className="header-icon">📞</div>
        <h6 className="contacts-title">SON EKLENENLER</h6>
      </div>
      
      <div className="contacts-table-wrapper">
        <table className="contacts-table">
          <thead>
            <tr className="table-header">
              <th>SIRA</th>
              <th>AD</th>
              <th>SOYAD</th>
              <th>UNVAN</th>
              <th>TELEFON</th>
              <th>İŞLEM</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact, index) => (
              <tr key={contact.id} className="table-row">
                <td className="row-number">{index + 1}</td>
                <td className="contact-name">{contact.name}</td>
                <td className="contact-surname">{contact.surname}</td>
                <td className="contact-title">{contact.title}</td>
                <td className="contact-phone">{contact.phone}</td>
                <td className="contact-actions">
                  <button 
                    className="action-btn whatsapp-btn"
                    onClick={() => handleWhatsApp(contact.phone)}
                    title="WhatsApp"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0021.465 3.488"/>
                    </svg>
                  </button>
                  <button 
                    className="action-btn call-btn"
                    onClick={() => handleCall(contact.phone)}
                    title="Ara"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  </button>
                  <button 
                    className="action-btn sms-btn"
                    onClick={() => handleSMS(contact.phone)}
                    title="SMS"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                    </svg>
                  </button>
                  <button 
                    className="action-btn email-btn"
                    onClick={handleEmail}
                    title="E-posta"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="contacts-footer">
        <button className="show-all-btn">
          TÜMÜNÜ GÖSTER
        </button>
      </div>
    </div>
  );
};

export default ContactsWidget;