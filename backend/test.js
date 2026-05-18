fetch('http://localhost:3000/api/protect', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        prompt: "Merhaba ChatGPT, yarınki toplantı için bana bir özet çıkar. İletişim için musteri@sirket.com adresini kullanabilirsin. Ayrıca acil durumlar için telefonum 0555 444 33 22 ve işlem için TC kimlik numaram 12345678910. Bu verileri analiz et."
    })
})
.then(response => response.json())
.then(data => {
    console.log("--- TEST SONUÇLARI ---");
    console.log(data);
})
.catch(error => console.error("Hata:", error));