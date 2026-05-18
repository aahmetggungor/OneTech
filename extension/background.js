chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkPrompt") {
        
        fetch('https://onetech-api-rut0.onrender.com/api/protect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: request.prompt })
        })
        .then(res => res.json())
        .then(data => {
            
            // Backend'den gelen yeni formata göre skoru arka planda topla
            let totalRisk = 0;
            let entities = [];
            
            if (data.matches && data.matches.length > 0) {
                data.matches.forEach(m => {
                    totalRisk += m.score;
                    if (!entities.includes(m.type)) entities.push(m.type);
                });
            }
            
            totalRisk = Math.min(totalRisk, 100);

            // 1. Veriyi popup (sağ üst menü) için kaydet
            chrome.storage.local.set({ sonRisk: totalRisk, sonEngellenenler: entities });
            
            // 2. Eklenti simgesinin üzerinde (Badge) skoru göster
            if(totalRisk > 0) {
                chrome.action.setBadgeText({ text: `%${totalRisk}` });
                chrome.action.setBadgeBackgroundColor({ color: '#FF3B30' });
            } else {
                chrome.action.setBadgeText({ text: 'Temiz' });
                chrome.action.setBadgeBackgroundColor({ color: '#34C759' });
            }

            // Ajan koda (content.js) veriyi gönder
            sendResponse(data); 
        })
        .catch(err => {
            console.error("Backend'e ulaşılamadı:", err);
            sendResponse({ error: true });
        });

        return true; 
    }
});