import React, { useState, useEffect } from "react";
import { useSimpleToast } from "../../contexts/SimpleToastContext";
import Calendar from "../../components/Calendar/Calendar";
import CategoryTable from "../../components/CategoryTable/CategoryTable";
import CategoryMessagingModal from "../../components/CategoryMessagingModal/CategoryMessagingModal";
import FloatingChat from "../../components/FloatingChat/FloatingChat";
import { fetchCategoriesWithStats } from "../../services/categoriesService";
import { sendBulkSMSByCategories } from "../../services/smsService";
import "./Categories.css";

const Categories = () => {
  const { showSuccess, showError } = useSimpleToast();
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleShowMessagingModal = (category) => {
    setSelectedCategory(category);
    setShowMessagingModal(true);
  };

  const handleCloseMessagingModal = () => {
    setShowMessagingModal(false);
    setSelectedCategory(null);
  };

  const handleSendMessage = async (messageData) => {
    try {
      setLoading(true);
      
      // SMS gönderme verilerini hazırla
      const smsData = {
        selectedCategories: messageData.categories,
        message: messageData.message,
        listName: messageData.listName,
        sendingTitle: messageData.sendingTitle,
        sendTime: messageData.sendTime,
        scheduledDate: messageData.scheduledDate,
        scheduledTime: messageData.scheduledTime
      };

      console.log('SMS gönderimi başlatılıyor:', smsData);
      
      const result = await sendBulkSMSByCategories(smsData);
      
      if (result.success) {
        showSuccess(`SMS başarıyla gönderildi! Toplam ${result.totalSent} mesaj gönderildi.`);
        console.log('SMS gönderim sonucu:', result);
      } else {
        throw new Error(result.message || 'SMS gönderilemedi');
      }
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      showError(`SMS gönderme hatası: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Kategorileri yükle
  const loadCategories = async () => {
    try {
      const response = await fetchCategoriesWithStats(1, 100); // Tüm kategorileri al
      if (response.success) {
        const categoryNames = response.data.map(cat => cat.alt_kategori);
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
      showError('Kategoriler yüklenirken hata oluştu.');
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="categories-page">

      <div className="categories-container">
        {/* Sol Panel - Takvim */}
        <div className="left-panel">
          <Calendar />
        </div>
        
        {/* Orta Panel - Kategori Tablosu */}
        <div className="categories-content">
          <CategoryTable 
            onShowMessagingModal={handleShowMessagingModal}
          />
        </div>
        
        {/* Sağ Panel - FloatingChat */}
        <div className="right-panel">
          <FloatingChat />
        </div>
      </div>
      
      {/* Category Messaging Modal */}
      <CategoryMessagingModal
        show={showMessagingModal}
        handleClose={handleCloseMessagingModal}
        category={selectedCategory}
        categories={categories}
        onSend={handleSendMessage}
        loading={loading}
      />
    </div>
  );
};

export default Categories;