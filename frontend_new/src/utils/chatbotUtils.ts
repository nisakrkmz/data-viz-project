import type { ChatbotContext, DataAnalysis } from '../types';

// Chatbot yanıt şablonları
export const chatbotResponses = {
    greeting: [
        "Merhaba! Ben Antigravity Manager. Veri görselleştirme konusunda size nasıl yardımcı olabilirim? 😊",
        "Selam! Verilerinizi harika grafiklere dönüştürmenize yardımcı olmak için buradayım! 🚀",
        "Hey! Veri analizi ve görselleştirme konusunda size rehberlik edebilirim. Ne yapmak istersiniz? 📊",
    ],

    uploadHelp: [
        "Dosya yüklemek çok kolay! Üstteki alana dosyanızı sürükleyip bırakın veya tıklayarak seçin. Excel (.xlsx, .xls) ve CSV formatlarını destekliyorum. 📁",
        "Veri dosyanızı yüklemek için:\n1. Dosya yükleme alanına tıklayın\n2. Excel veya CSV dosyanızı seçin\n3. Yükleme tamamlanınca otomatik analiz başlayacak! ✨",
    ],

    chartSelection: [
        "Grafik seçimi verilerinizin yapısına bağlı! Size önerilen grafikleri 'Grafik Önerileri' panelinde görebilirsiniz. Her grafik için ne zaman kullanılacağını da açıkladım. 📈",
        "En uygun grafik tipini seçmek için:\n1. Önerilen grafikler arasından birini seçin\n2. Her grafik kartında kullanım durumu yazıyor\n3. 'En Uygun' etiketli olanla başlamanızı öneririm! 🎯",
    ],

    dataAnalysis: [
        "Verilerinizi analiz ediyorum ve şunları tespit ediyorum:\n• Sütun tipleri (sayısal, kategorik, tarih)\n• Veri dağılımları\n• Eksik değerler\n• En uygun grafik tipleri\n\nAnaliz sonuçlarını ekranda görebilirsiniz! 🔍",
    ],

    noData: [
        "Henüz veri yüklenmemiş görünüyor. Başlamak için bir Excel veya CSV dosyası yükleyin. Örnek veri ile denemek isterseniz, 'Örnek Veri Yükle' butonuna tıklayabilirsiniz! 💡",
    ],

    chartExplanation: {
        bar: "Bar Chart, kategorileri karşılaştırmak için idealdir. Her çubuk bir kategoriyi temsil eder ve yüksekliği değeri gösterir. Yan yana karşılaştırma yapmak istediğinizde kullanın! 📊",
        line: "Line Chart, zaman içindeki değişimi göstermek için en iyisidir. Trendleri, artış ve azalışları net bir şekilde gösterir. Zaman serisi verileriniz varsa bu grafiği tercih edin! 📈",
        scatter: "Scatter Plot, iki değişken arasındaki ilişkiyi gösterir. Her nokta bir veri kaydını temsil eder. Korelasyon analizi için mükemmeldir! 🔵",
        pie: "Pie Chart, kategorilerin toplam içindeki oranını gösterir. Her dilim bir kategorinin payını temsil eder. 5-7'den az kategori olduğunda en etkilidir! 🥧",
        area: "Area Chart, Line Chart'a benzer ama alan doldurulmuştur. Hacimsel değişimi ve kümülatif değerleri vurgulamak için kullanılır! 📊",
        histogram: "Histogram, sayısal verilerin dağılımını gösterir. Verilerin hangi aralıklarda yoğunlaştığını görmek için idealdir! 📊",
        box: "Box Plot, veri dağılımını, medyanı, çeyrekleri ve aykırı değerleri gösterir. İstatistiksel analiz için çok kullanışlıdır! 📦",
        heatmap: "Heatmap, değerleri renk yoğunluğu ile gösterir. Çok sayıda veri noktasındaki pattern'leri görmek için harikadır! 🌡️",
        'stacked-bar': "Stacked Bar Chart, kategorilerin hem karşılaştırmasını hem de toplam içindeki dağılımını gösterir. Çok boyutlu analiz için idealdir! 📊",
        'multi-line': "Multi-line Chart, birden fazla serinin zaman içindeki değişimini karşılaştırır. Farklı metrikleri aynı anda analiz etmek için kullanın! 📈",
    },

    tips: [
        "💡 İpucu: Grafik üzerine geldiğinizde detaylı bilgileri görebilirsiniz!",
        "💡 İpucu: Renk paletini değiştirerek grafiğinizi özelleştirebilirsiniz!",
        "💡 İpucu: Grafiği PNG, SVG veya PDF olarak dışa aktarabilirsiniz!",
        "💡 İpucu: Birden fazla grafik tipini deneyerek verilerinizi farklı açılardan inceleyebilirsiniz!",
        "💡 İpucu: Zaman serisi verileriniz varsa Line veya Area Chart kullanın!",
    ],

    errors: {
        invalidFile: "Üzgünüm, bu dosya formatını okuyamadım. Lütfen .xlsx, .xls veya .csv formatında bir dosya yükleyin. 😕",
        parseError: "Dosyayı okurken bir hata oluştu. Dosyanın bozuk olmadığından ve doğru formatta olduğundan emin olun. 🔧",
        noColumns: "Dosyada sütun bulunamadı. Lütfen başlık satırı olan bir dosya yükleyin. 📋",
        emptyFile: "Dosya boş görünüyor. Lütfen veri içeren bir dosya yükleyin. 📄",
    },
};

// Context-aware yanıt üretici
export const generateResponse = (
    userMessage: string,
    context: ChatbotContext
): string => {
    const message = userMessage.toLowerCase().trim();

    // Selamlama
    if (message.match(/merhaba|selam|hey|hi|hello/)) {
        return getRandomResponse(chatbotResponses.greeting);
    }

    // Dosya yükleme yardımı
    if (message.match(/nasıl yükle|dosya yükle|upload|yükleme/)) {
        return getRandomResponse(chatbotResponses.uploadHelp);
    }

    // Grafik seçimi
    if (message.match(/hangi grafik|grafik seç|chart|ne kullan/)) {
        if (!context.hasData) {
            return chatbotResponses.noData[0];
        }
        const validCharts: Record<string, string> = {
            'bar': 'Bar Chart',
            'line': 'Line Chart',
            'scatter': 'Scatter Plot',
            'pie': 'Pie Chart',
            'area': 'Area Chart',
            'histogram': 'Histogram',
            'box': 'Box Plot',
            'heatmap': 'Heatmap',
            'stacked-bar': 'Stacked Bar',
            'grouped-bar': 'Grouped Bar',
            'multi-line': 'Multi Line',
            'bubble': 'Bubble Chart',
            'violin': 'Violin Plot',
            'radar': 'Radar Chart',
            'donut': 'Donut Chart',
            'horizontal-bar': 'Horizontal Bar'
        };
        return getRandomResponse(chatbotResponses.chartSelection);
    }

    // Veri analizi
    if (message.match(/analiz|pattern|dağılım|istatistik/)) {
        if (!context.hasData) {
            return chatbotResponses.noData[0];
        }
        return generateDataAnalysisResponse(context.dataAnalysis);
    }

    // Grafik açıklaması
    if (message.match(/bu grafik|grafik ne|ne anlama/)) {
        if (context.selectedChart) {
            return chatbotResponses.chartExplanation[context.selectedChart];
        }
        return "Hangi grafik hakkında bilgi almak istersiniz? Lütfen bir grafik seçin veya grafik adını söyleyin. 🤔";
    }

    // Spesifik grafik soruları
    const chartTypes = ['bar', 'line', 'scatter', 'pie', 'area', 'histogram', 'box', 'heatmap'];
    for (const chartType of chartTypes) {
        if (message.includes(chartType)) {
            return chatbotResponses.chartExplanation[chartType as keyof typeof chatbotResponses.chartExplanation] ||
                "Bu grafik tipi hakkında bilgi bulunamadı.";
        }
    }

    // Hata durumları
    if (message.match(/hata|çalışmıyor|problem|sorun/)) {
        return "Bir sorun mu var? Lütfen şunları kontrol edin:\n1. Dosya formatı doğru mu? (.xlsx, .xls, .csv)\n2. Dosya bozuk değil mi?\n3. Dosyada başlık satırı var mı?\n\nSorun devam ederse, farklı bir dosya deneyebilirsiniz. 🔧";
    }

    // Yardım
    if (message.match(/yardım|help|nasıl/)) {
        return `Size nasıl yardımcı olabilirim? İşte yapabileceklerim:

📁 Dosya yükleme konusunda yardım
📊 Grafik seçimi önerileri
🔍 Veri analizi açıklamaları
💡 Grafik tipleri hakkında bilgi
🎨 Özelleştirme ipuçları

Ne hakkında bilgi almak istersiniz?`;
    }

    // Varsayılan yanıt
    return `Anladığımdan emin değilim. Size şu konularda yardımcı olabilirim:
  
• "Dosya nasıl yüklenir?" - Dosya yükleme rehberi
• "Hangi grafiği seçmeliyim?" - Grafik önerileri
• "Verimi analiz et" - Veri analizi
• "Bar chart nedir?" - Grafik açıklamaları

Başka ne sormak istersiniz? 🤔`;
};

// Veri analizi yanıtı oluştur
const generateDataAnalysisResponse = (analysis?: DataAnalysis): string => {
    if (!analysis) {
        return chatbotResponses.noData[0];
    }

    const { rowCount, columnCount, columns, hasTimeSeries } = analysis;
    const numericCols = columns.filter(c => c.type === 'numeric').length;
    const categoricalCols = columns.filter(c => c.type === 'categorical').length;

    return `📊 Veri Analizi Sonuçları:

📈 Toplam ${rowCount} satır ve ${columnCount} sütun bulundu.

🔢 Sütun Tipleri:
• ${numericCols} sayısal sütun
• ${categoricalCols} kategorik sütun

${hasTimeSeries ? '⏰ Zaman serisi verisi tespit edildi! Line Chart veya Area Chart kullanmanızı öneririm.' : ''}

${numericCols >= 2 ? '🔍 İki veya daha fazla sayısal değişken var. Scatter Plot ile korelasyon analizi yapabilirsiniz!' : ''}

${categoricalCols >= 1 && numericCols >= 1 ? '📊 Kategorik ve sayısal veriler mevcut. Bar Chart veya Stacked Bar Chart idealdir!' : ''}

Daha fazla detay için grafik önerilerine göz atın! ✨`;
};

// Rastgele yanıt seç
const getRandomResponse = (responses: string[]): string => {
    return responses[Math.floor(Math.random() * responses.length)];
};

// Hızlı eylem önerileri
export const quickActions = [
    { id: 'upload', label: 'Veri dosyamı nasıl yüklerim?', icon: '📁' },
    { id: 'chart', label: 'Hangi grafik türünü seçmeliyim?', icon: '📊' },
    { id: 'explain', label: 'Bu grafik ne anlama geliyor?', icon: '💡' },
    { id: 'analyze', label: 'Verimdeki pattern\'leri açıkla', icon: '🔍' },
];

// Typing effect için delay
export const typeMessage = async (
    message: string,
    onUpdate: (partial: string) => void,
    speed: number = 30
): Promise<void> => {
    let currentText = '';
    for (let i = 0; i < message.length; i++) {
        currentText += message[i];
        onUpdate(currentText);
        await new Promise(resolve => setTimeout(resolve, speed));
    }
};

// Mesaj ID oluşturucu
export const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
