import React from "react";
import { Modal, Button } from "react-bootstrap";
import "./WhatsAppSelectModal.css";

const WhatsAppSelectModal = ({ show, onHide, contact, onSelectPhone }) => {
  if (!contact) return null;

  const handlePhoneSelect = (phoneNumber) => {
    onSelectPhone(phoneNumber);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered className="whatsapp-select-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          WhatsApp Numara Seçimi
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="contact-info">
          <h6>{contact.name} {contact.surname}</h6>
        </div>

        <div className="phone-selection">
          <p className="mb-3">Hangi numaraya WhatsApp mesajı göndermek istiyorsunuz?</p>

          <div className="phone-options">
            {contact.phone1 && (
              <Button
                variant="outline-success"
                className="phone-btn mb-2"
                onClick={() => handlePhoneSelect(contact.phone1)}
              >
                {contact.phone1}
              </Button>
            )}

            {contact.phone2 && (
              <Button
                variant="outline-success"
                className="phone-btn"
                onClick={() => handlePhoneSelect(contact.phone2)}
              >
                {contact.phone2}
              </Button>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default WhatsAppSelectModal; 