let cart = [];
let orderData = {};
let uploadedFile = null;

function addToCart(packageName, price) {
    cart.push({ name: packageName, price: price });
    updateCart();
    document.getElementById('cartSection').style.display = 'block';
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
    if (cart.length === 0) {
        document.getElementById('cartSection').style.display = 'none';
    }
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    cartItems.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <span>${item.name} - Rp ${item.price.toLocaleString('id-ID')}</span>
            <button class="remove-btn" onclick="removeFromCart(${index})">Hapus</button>
        </div>
    `).join('');
    
    document.getElementById('totalPrice').textContent = total.toLocaleString('id-ID');
}

function goToCheckout() {
    if (cart.length === 0) {
        alert('Keranjang kosong! Pilih paket terlebih dahulu.');
        return;
    }

    const checkoutItems = document.getElementById('checkoutCartItems');
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    
    checkoutItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <span>${item.name}</span>
            <span>Rp ${item.price.toLocaleString('id-ID')}</span>
        </div>
    `).join('');
    
    document.getElementById('checkoutTotal').textContent = total.toLocaleString('id-ID');
    goToPage('checkoutPage');
}

function goToPayment() {
    const robloxUsername = document.getElementById('robloxUsername').value;
    const robloxPassword = document.getElementById('robloxPassword').value;
    const currentLevel = document.getElementById('currentLevel').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    
    if (!robloxUsername || !robloxPassword || !currentLevel || !phoneNumber) {
        alert('⚠️ Mohon lengkapi semua data yang wajib diisi!');
        return;
    }

    orderData = {
        robloxUsername: robloxUsername,
        robloxPassword: robloxPassword,
        currentLevel: currentLevel,
        phoneNumber: phoneNumber,
        notes: document.getElementById('notes').value,
        packages: cart,
        total: cart.reduce((sum, item) => sum + item.price, 0)
    };

    document.getElementById('paymentTotal').textContent = orderData.total.toLocaleString('id-ID');
    goToPage('paymentPage');
}

function previewFile() {
    const fileInput = document.getElementById('proofFile');
    const preview = document.getElementById('filePreview');
    
    if (fileInput.files && fileInput.files[0]) {
        uploadedFile = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.style.display = 'block';
            preview.innerHTML = `
                <div class="file-info">✅ File terpilih: ${uploadedFile.name}</div>
                <img src="${e.target.result}" alt="Preview Bukti Pembayaran">
            `;
        };
        
        reader.readAsDataURL(uploadedFile);
    }
}

function sendToWhatsApp() {
    const fileInput = document.getElementById('proofFile');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('⚠️ Mohon upload bukti pembayaran terlebih dahulu!');
        return;
    }

    // Send to Discord first
    sendToDiscord(orderData, uploadedFile).then(() => {
        const packageList = orderData.packages.map(p => p.name).join('\n');
        const message = `🏍️ *PESANAN JOKI MOTO TRACKDAY PROJECT*

👤 *DATA AKUN:*
Username Roblox: ${orderData.robloxUsername}
Password Roblox: ${orderData.robloxPassword}
Level Saat Ini: ${orderData.currentLevel}
No. WhatsApp: ${orderData.phoneNumber}

🎮 *PAKET JOKI:*
${packageList}

💰 *TOTAL PEMBAYARAN:*
Rp ${orderData.total.toLocaleString('id-ID')}

${orderData.notes ? '📝 *CATATAN:*\n' + orderData.notes + '\n\n' : ''}✅ Bukti pembayaran sudah dikirim ke Discord
🏁 Mohon segera diproses

Terima kasih! 🙏`;

        const waUrl = `https://wa.me/6285737668457?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
        
        setTimeout(() => {
            alert('✅ Pesanan berhasil dikirim!\n\n📱 WhatsApp: Pesan sudah disiapkan\n💬 Discord: Bukti pembayaran sudah terkirim otomatis\n\nSilahkan kirim pesan WhatsApp yang sudah terbuka!');
        }, 500);
        
        goToPage('successPage');
    }).catch(err => {
        alert('❌ Gagal mengirim ke Discord. Silahkan coba lagi atau hubungi admin.\n\nError: ' + err.message);
    });
}

function goToPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

function resetAndGoHome() {
    cart = [];
    orderData = {};
    uploadedFile = null;
    document.getElementById('robloxUsername').value = '';
    document.getElementById('robloxPassword').value = '';
    document.getElementById('currentLevel').value = '';
    document.getElementById('phoneNumber').value = '';
    document.getElementById('notes').value = '';
    document.getElementById('proofFile').value = '';
    document.getElementById('filePreview').style.display = 'none';
    document.getElementById('cartSection').style.display = 'none';
    goToPage('homepage');
}

// Discord Integration
async function sendToDiscord(data, file) {
    const webhookUrl = document.getElementById('discordWebhook').value;
    
    if (!webhookUrl || webhookUrl.includes('PASTE_YOUR')) {
        throw new Error('Discord Webhook belum dikonfigurasi!');
    }

    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    const packageList = data.packages.map(p => p.name).join('\n');
    const embed = {
        title: "🏍️ PESANAN BARU - JOKI MOTO TRACKDAY",
        color: 6724862, // Purple
        fields: [
            { name: "👤 Username Roblox", value: data.robloxUsername, inline: true },
            { name: "🔑 Password", value: data.robloxPassword, inline: true },
            { name: "📊 Level Saat Ini", value: data.currentLevel.toString(), inline: true },
            { name: "📱 WhatsApp", value: data.phoneNumber, inline: true },
            { name: "🎮 Paket Joki", value: packageList, inline: false },
            { name: "💰 Total Pembayaran", value: `Rp ${data.total.toLocaleString('id-ID')}`, inline: false }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Jasa Joki Moto Trackday Project" }
    };
    
    if (data.notes) {
        embed.fields.push({ name: "📝 Catatan", value: data.notes, inline: false });
    }

    // Send message with embed
    const payload = {
        embeds: [embed]
    };

    // Send first message with details
    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    // Send image as attachment
    const blob = await fetch(base64).then(r => r.blob());
    const formData = new FormData();
    formData.append('file', blob, file.name);
    
    const imagePayload = {
        content: '📸 **BUKTI PEMBAYARAN:**'
    };
    formData.append('payload_json', JSON.stringify(imagePayload));

    await fetch(webhookUrl, {
        method: 'POST',
        body: formData
    });
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}