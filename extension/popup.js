console.log("🛡️ OneTech Popup yüklendi.");

document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('status-text');

    // Hafızadaki son analizi çek 
    chrome.storage.local.get(['sonRisk', 'sonEngellenenler'], (result) => {
        if (result.sonRisk !== undefined) {
            if (result.sonRisk > 0) {
                statusText.innerHTML = `Son Risk: <span style="color:#FF3B30">%${result.sonRisk}</span><br><span style="font-size:12px;color:#a0a0a0;font-weight:normal">(${result.sonEngellenenler.join(', ')})</span>`;
            } else {
                statusText.innerHTML = `Durum: <span style="color:#34C759">Güvenli (%0)</span>`;
            }
        }
    });

    // Dashboard Butonu Dinleyicisi
    document.getElementById('dashboard-btn').addEventListener('click', () => {
        // Dünyanın her yerinden erişilebilen GitHub Pages linkin
        const dashboardUrl = 'https://aahmetggungor.github.io/OneTech/dashboard/index.html'; 
        chrome.tabs.create({ url: dashboardUrl });
    });
});