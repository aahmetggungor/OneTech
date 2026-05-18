console.log("🛡️ OneTech İnteraktif Ajanı yüklendi.");

let isProcessing = false;
let skipNextTrigger = false;

// --- İNTERAKTİF MODAL OLUŞTURMA ---
function showInteractiveModal(data, activeElement, triggerType, targetBtn) {
    if (document.getElementById('privacy-shield-modal')) return;

    let matchState = data.matches.map(m => ({ ...m, active: true }));

    const overlay = document.createElement('div');
    overlay.id = 'privacy-shield-modal';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px);
        display: flex; align-items: center; justify-content: center;
        z-index: 999999; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: #1e1e24; color: #ffffff; width: 520px; border-radius: 12px;
        padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.6);
        border: 1px solid #333; text-align: left; display: flex; flex-direction: column; gap: 15px;
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function render() {
        let totalRawScore = 0;
        let exposedRawScore = 0;
        let previewHTML = data.originalPrompt;

        matchState.forEach((m, index) => {
            totalRawScore += m.score;
            if (!m.active) exposedRawScore += m.score;

            let safeOriginal = m.original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            let regex = new RegExp(`\\b${safeOriginal}\\b`, 'g');

            if (m.active) {
                previewHTML = previewHTML.replace(regex, `<span class="ps-toggle" data-idx="${index}" title="Maskeyi kaldırmak için tıkla (Risk artar)" style="background:#FF3B30; color:#fff; padding:2px 6px; border-radius:4px; cursor:pointer; font-size:13px; font-weight:bold; box-shadow: 0 2px 4px rgba(255,59,48,0.3); transition: 0.2s;">${m.mask}</span>`);
            } else {
                previewHTML = previewHTML.replace(regex, `<span class="ps-toggle" data-idx="${index}" title="Tekrar maskelemek için tıkla (Riski sıfırlar)" style="background:rgba(52, 199, 89, 0.2); color:#34C759; border: 1px solid #34C759; padding:1px 5px; border-radius:4px; cursor:pointer; font-size:13px; text-decoration:line-through; transition: 0.2s;">${m.original}</span>`);
            }
        });

        let currentRiskPercentage = totalRawScore > 0 ? Math.round((exposedRawScore / totalRawScore) * 100) : 0;
        let riskColor = currentRiskPercentage > 50 ? "#FF3B30" : (currentRiskPercentage > 0 ? "#FF9500" : "#34C759");
        let btnColor = currentRiskPercentage > 0 ? "#FF3B30" : "#ffffff";
        let btnTextColor = currentRiskPercentage > 0 ? "#ffffff" : "#1e1e24";
        let btnText = currentRiskPercentage > 0 ? "Riskli Olarak Gönder" : "Güvenli Olarak Gönder";

        modal.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #333; padding-bottom: 10px;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 20px; margin-right: 10px;">🛡️</span>
                    <div>
                        <h2 style="margin: 0; font-size: 16px;">OneTech Veri Kontrolü</h2>
                        <div style="font-size: 11px; color: #a0a0a0; margin-top: 2px;">Bulunan Hassas Veri Sayısı: ${matchState.length}</div>
                    </div>
                </div>
                <div style="text-align: right; background: rgba(0,0,0,0.2); padding: 5px 12px; border-radius: 8px; border: 1px solid #333;">
                    <div style="font-size: 10px; color: #a0a0a0;">GÜNCEL GÖNDERİM RİSKİ</div>
                    <div style="font-size: 24px; font-weight: bold; color: ${riskColor};">%${currentRiskPercentage}</div>
                </div>
            </div>
            <p style="font-size: 13px; color: #b0b0b0; margin: 0;">Metin içinde bulunan hassas veriler maskelendi. <strong style="color:#fff;">Maskeleri açmak verinin dışarı sızma riskini artırır.</strong> Etiketlere tıklayarak maskeleri yönetebilirsiniz.</p>
            <div style="background: #15151a; border-radius: 8px; padding: 15px; border: 1px solid #2b2b36; font-size: 14px; line-height: 1.6; color: #e0e0e0; max-height: 200px; overflow-y: auto;">
                ${previewHTML}
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;">
                <button id="ps-cancel-btn" style="padding: 10px 18px; background: transparent; border: 1px solid #555; color: #ccc; border-radius: 6px; cursor: pointer; font-weight: 600;">İptal</button>
                <button id="ps-send-btn" style="padding: 10px 18px; background: ${btnColor}; border: none; color: ${btnTextColor}; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.3s;">${btnText}</button>
            </div>
        `;

        document.querySelectorAll('.ps-toggle').forEach(el => {
            el.addEventListener('click', (e) => {
                let idx = e.target.getAttribute('data-idx');
                matchState[idx].active = !matchState[idx].active;
                render(); 
            });
        });

        document.getElementById('ps-cancel-btn').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        document.getElementById('ps-send-btn').addEventListener('click', () => {
            let finalPrompt = data.originalPrompt;
            matchState.forEach(m => {
                if (m.active) {
                    let safeOriginal = m.original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    let regex = new RegExp(`\\b${safeOriginal}\\b`, 'g');
                    finalPrompt = finalPrompt.replace(regex, m.mask);
                }
            });

            // GEMINI ÇÖZÜMÜ: Eğer ana element contenteditable değilse, içindeki asıl metin kutusunu bul
            let targetNode = activeElement;
            if (activeElement.tagName && activeElement.tagName.toLowerCase() !== 'textarea' && !activeElement.hasAttribute('contenteditable')) {
                let innerEditable = activeElement.querySelector('[contenteditable="true"]');
                if (innerEditable) targetNode = innerEditable;
            }

            // Metni Güvenli Bir Şekilde Yerleştir
            if (targetNode.tagName && targetNode.tagName.toLowerCase() === 'textarea') {
                targetNode.value = finalPrompt;
                targetNode.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                targetNode.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, finalPrompt);
                targetNode.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            }
            
            document.body.removeChild(overlay);
            skipNextTrigger = true;
            
            // GEMINI ÇÖZÜMÜ: Metnin eklendiğinden emin olmak için bekleme süresi 150ms'den 300ms'ye çıkarıldı
            setTimeout(() => {
                if (triggerType === 'click' && targetBtn) {
                    targetBtn.click();
                } else {
                    let sendBtn = document.querySelector('button[data-testid="send-button"]') || 
                                  document.querySelector('button[aria-label*="end"], button[aria-label*="önder"], button.send-button');
                    if (sendBtn && !sendBtn.disabled) sendBtn.click();
                    else activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
                }
            }, 300);
        });
    }

    render();
}

// AI Chat giriş alanlarını güvenilir şekilde bulan yardımcı
function getChatInput() {
    return document.querySelector('#prompt-textarea') || 
           document.querySelector('rich-textarea') || 
           document.querySelector('textarea') || 
           document.querySelector('[contenteditable="true"]');
}

function checkAndMask(userPrompt, activeElement, originalEvent, triggerType, targetBtn) {
    if (isProcessing) {
        originalEvent.preventDefault();
        originalEvent.stopPropagation();
        return;
    }

    originalEvent.preventDefault();
    originalEvent.stopPropagation();
    originalEvent.stopImmediatePropagation();

    isProcessing = true;

    chrome.runtime.sendMessage({ action: "checkPrompt", prompt: userPrompt }, function(response) {
        isProcessing = false;

        if (chrome.runtime.lastError || !response || response.error) {
            skipNextTrigger = true;
            if (triggerType === 'click' && targetBtn) targetBtn.click();
            else activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
            return;
        }

        if(response.matches && response.matches.length > 0) {
            showInteractiveModal(response, activeElement, triggerType, targetBtn);
        } else {
            skipNextTrigger = true; 
            if (triggerType === 'click' && targetBtn) targetBtn.click();
            else {
                let sendBtn = document.querySelector('button[data-testid="send-button"]') || 
                              document.querySelector('button[aria-label*="end"], button[aria-label*="önder"], button.send-button');
                if (sendBtn && !sendBtn.disabled) sendBtn.click();
                else activeElement.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
            }
        }
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        if (skipNextTrigger) { skipNextTrigger = false; return; }
        let inputElement = getChatInput();
        if(inputElement && (e.target === inputElement || inputElement.contains(e.target))) {
            let userPrompt = (inputElement.tagName.toLowerCase() === 'textarea') ? inputElement.value : (inputElement.innerText || inputElement.textContent);
            if(userPrompt && userPrompt.trim() !== "") {
                checkAndMask(userPrompt, inputElement, e, 'enter', null);
            }
        }
    }
}, true);

document.addEventListener('click', function(e) {
    if (skipNextTrigger) { skipNextTrigger = false; return; }
    let sendBtn = e.target.closest('button[data-testid="send-button"], button[aria-label*="end"], button[aria-label*="önder"], button.send-button');
    if (sendBtn) {
        let inputElement = getChatInput();
        if(inputElement) {
            let userPrompt = (inputElement.tagName.toLowerCase() === 'textarea') ? inputElement.value : (inputElement.innerText || inputElement.textContent);
            if(userPrompt && userPrompt.trim() !== "") {
                checkAndMask(userPrompt, inputElement, e, 'click', sendBtn);
            }
        }
    }
}, true);