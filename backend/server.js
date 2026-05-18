const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nlp = require('compromise');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- KURUMSAL HAFIZA (Artık Dinamik!) ---
let customDictionary = {
    people: ["Tim Cook", "Satya Nadella", "Ayşe Yılmaz", "Elon Musk", "Mehmet Demir", "Zeynep Kaya"],
    companies: ["Apple", "Tesla", "SpaceX", "Amazon", "Microsoft", "Google"],
    customRules: ["Pegasus Projesi"] // Dashboard'dan buraya anlık ekleme yapacağız!
};

// --- DASHBOARD İSTATİSTİKLERİ ---
let systemStats = {
    totalScanned: 0,
    totalMaskedItems: 0,
    categories: { email: 0, phone: 0, tc: 0, person: 0, company: 0, custom: 0 }
};

function analyzeText(text) {
    let allMatches = [];
    systemStats.totalScanned++; // Her prompt geldiğinde sayacı artır

    function addTempMatch(original, mask, score, type, startIndex, endIndex, categoryKey) {
        allMatches.push({ original, mask, score, type, startIndex, endIndex, categoryKey });
    }

    // 1. DASHBOARD'DAN EKLENEN ÖZEL KURALLAR (En Yüksek Öncelik)
    customDictionary.customRules.forEach(rule => {
        let regex = new RegExp(`\\b${rule}\\b`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
            addTempMatch(match[0], "[ÖZEL_KURAL]", 50, "Özel Kural", match.index, match.index + match[0].length, "custom");
        }
    });

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let match;
    while ((match = emailRegex.exec(text)) !== null) {
        addTempMatch(match[0], "[EMAIL]", 30, "E-posta", match.index, match.index + match[0].length, "email");
    }

    const phoneRegex = /(?:\+\d{1,3}\s?)?(?:0\s?)?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g;
    while ((match = phoneRegex.exec(text)) !== null) {
        addTempMatch(match[0], "[TELEFON]", 25, "Telefon", match.index, match.index + match[0].length, "phone");
    }

    const tcRegex = /\b[1-9][0-9]{10}\b/g;
    while ((match = tcRegex.exec(text)) !== null) {
        addTempMatch(match[0], "[TC_KIMLIK]", 45, "TC Kimlik", match.index, match.index + match[0].length, "tc");
    }

    customDictionary.people.forEach(person => {
        let regex = new RegExp(`\\b${person}\\b`, 'gi');
        while ((match = regex.exec(text)) !== null) {
            addTempMatch(match[0], "[KİŞİ]", 15, "Kişi", match.index, match.index + match[0].length, "person");
        }
    });

    customDictionary.companies.forEach(company => {
        let regex = new RegExp(`\\b${company}\\b`, 'gi');
        while ((match = regex.exec(text)) !== null) {
            addTempMatch(match[0], "[ŞİRKET]", 25, "Şirket", match.index, match.index + match[0].length, "company");
        }
    });

    let doc = nlp(text);
    doc.people().out('array').forEach(p => {
        let regex = new RegExp(`\\b${p}\\b`, 'gi');
        while ((match = regex.exec(text)) !== null) {
            addTempMatch(match[0], "[KİŞİ]", 15, "Kişi", match.index, match.index + match[0].length, "person");
        }
    });
    
    doc.organizations().out('array').forEach(o => {
        let regex = new RegExp(`\\b${o}\\b`, 'gi');
        while ((match = regex.exec(text)) !== null) {
            addTempMatch(match[0], "[ŞİRKET]", 25, "Şirket", match.index, match.index + match[0].length, "company");
        }
    });

    allMatches.sort((a, b) => b.original.length - a.original.length); 

    let finalMatches = [];
    allMatches.forEach(currentMatch => {
        let isOverlapping = finalMatches.some(approvedMatch => {
            return (currentMatch.startIndex >= approvedMatch.startIndex && currentMatch.startIndex < approvedMatch.endIndex) || 
                   (currentMatch.endIndex > approvedMatch.startIndex && currentMatch.endIndex <= approvedMatch.endIndex);
        });

        if (!isOverlapping) {
            if(!finalMatches.find(m => m.original === currentMatch.original)) {
                finalMatches.push(currentMatch);
                // İSTATİSTİKLERİ GÜNCELLE
                systemStats.totalMaskedItems++;
                if (systemStats.categories[currentMatch.categoryKey] !== undefined) {
                    systemStats.categories[currentMatch.categoryKey]++;
                }
            }
        }
    });

    return {
        originalPrompt: text,
        matches: finalMatches
    };
}

// 1. Eklentiden Gelen Metinleri Tarama API'si
app.post('/api/protect', (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt gerekli." });
    res.json(analyzeText(prompt));
});

// 2. Dashboard İçin İstatistik API'si
app.get('/api/stats', (req, res) => {
    res.json({
        stats: systemStats,
        rules: customDictionary.customRules
    });
});

// 3. Dashboard'dan Yeni Kural Ekleme API'si
app.post('/api/add-rule', (req, res) => {
    const { newRule } = req.body;
    if (newRule && !customDictionary.customRules.includes(newRule)) {
        customDictionary.customRules.push(newRule);
        console.log("🟢 Yeni Kural Eklendi:", newRule);
        res.json({ success: true, message: "Kural eklendi." });
    } else {
        res.status(400).json({ success: false, message: "Geçersiz veya zaten var." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 OneTech Merkezi Sunucusu çalışıyor: http://localhost:${PORT}`);
});