console.log("🛡️ OneTech Popup yüklendi.");

document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('status-text');

    // Hafızadaki son analizi çek 
    chrome.storage.local.get(['sonRisk', 'sonEngellenenler'], (result) => {
        if (result.sonRisk !== undefined) {
            if (result.sonRisk > 0) {
                // Risk varsa kırmızı yüzdelik ve engellenenlerin listesi
                statusText.innerHTML = `Son Risk: <span style="color:#FF3B30">%${result.sonRisk}</span><br><span style="font-size:12px;color:#a0a0a0;font-weight:normal">(${result.sonEngellenenler.join(', ')})</span>`;
            } else {
                // Risk yoksa yeşil güvenli uyarısı
                statusText.innerHTML = `Durum: <span style="color:#34C759">Güvenli (%0)</span>`;
            }
        }
    });

    // Dashboard Butonu Dinleyicisi
    document.getElementById('dashboard-btn').addEventListener('click', () => {
        // Hedef URL doğru klasör yoluyla güncellendi
        const dashboardUrl = 'http://127.0.0.1:5500/dashboard/index.html'; 
        
        // Eklentiye yeni sekme açıp bu adrese gitmesini emrediyoruz
        chrome.tabs.create({ url: dashboardUrl });
    });
});