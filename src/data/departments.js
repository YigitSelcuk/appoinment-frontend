// Departman seçenekleri
export const DEPARTMENTS = [
  { value: '', label: 'DEPARTMAN SEÇİN' },
  { value: 'Başkanlık', label: 'BAŞKAN' },
  { value: 'Başkan Yardımcılığı', label: 'BAŞKAN YARDIMCILIĞI' },
  { value: 'Genel Sekreterlik', label: 'GENEL SEKRETERLİK' },
  { value: 'Mali Hizmetler', label: 'MALİ HİZMETLER' },
  { value: 'İnsan Kaynakları', label: 'İNSAN KAYNAKLARI' },
  { value: 'Bilgi İşlem', label: 'BİLGİ İŞLEM' },
  { value: 'İmar ve Şehircilik', label: 'İMAR VE ŞEHİRCİLİK' },
  { value: 'Çevre ve Temizlik', label: 'ÇEVRE VE TEMİZLİK' },
  { value: 'Park ve Bahçe', label: 'PARK VE BAHÇE' },
  { value: 'Kültür ve Sosyal İşler', label: 'KÜLTÜR VE SOSYAL İŞLER' },
  { value: 'Zabıta', label: 'ZABITA' },
  { value: 'İtfaiye', label: 'İTFAİYE' },
  { value: 'Su ve Kanalizasyon', label: 'SU VE KANALİZASYON' },
  { value: 'Ulaşım', label: 'ULAŞIM' },
  { value: 'Halkla İlişkiler', label: 'HALKLA İLİŞKİLER' },
  { value: 'other', label: 'DİĞER' }
];

// Departman seçeneklerini render eden yardımcı fonksiyon
export const renderDepartmentOptions = () => {
  return DEPARTMENTS.map(dept => (
    <option key={dept.value} value={dept.value}>
      {dept.label}
    </option>
  ));
};

export default DEPARTMENTS;