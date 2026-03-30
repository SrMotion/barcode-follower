// web/app.js
lucide.createIcons();

const searchBtn = document.getElementById('searchBtn');
const storeIdInput = document.getElementById('storeIdInput');
const productsGrid = document.getElementById('productsGrid');
const loader = document.getElementById('loader');
const actionsHeader = document.getElementById('actionsHeader');
const statsContainer = document.getElementById('statsContainer');
const productCountBadge = document.getElementById('productCount');
const copyAllLinksBtn = document.getElementById('copyAllLinks');
const copyAllBarcodesBtn = document.getElementById('copyAllBarcodes');
const exportCsvBtn = document.getElementById('exportCsv');
const debugSection = document.getElementById('debugSection');
const debugContent = document.getElementById('debugContent');

let allProducts = [];

searchBtn.addEventListener('click', async () => {
    const storeId = storeIdInput.value.trim();
    if (!storeId) {
        alert('Lütfen bir Mağaza ID girin.');
        return;
    }

    startLoading();
    allProducts = [];
    productsGrid.innerHTML = '';
    debugSection.style.display = 'none';
    debugContent.value = 'Hata analiz ediliyor...';
    
    try {
        await fetchAllProducts(storeId);
        
        if (allProducts.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                    <i data-lucide="frown" size="48" style="margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Ürün bulunamadı. Mağaza ID'yi kontrol edin.</p>
                </div>
            `;
            actionsHeader.style.display = 'none';
        } else {
            renderProducts();
            actionsHeader.style.display = 'flex';
            productCountBadge.textContent = `${allProducts.length} Ürün Bulundu`;
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        debugSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
        stopLoading();
    }
});

async function fetchAllProducts(storeId) {
    let totalPages = 1;
    
    try {
        const firstPageUrl = getTrendyolUrl(storeId, 1);
        const response = await fetch(firstPageUrl);
        
        const contentType = response.headers.get("content-type") || "";
        const rawBody = await response.text();

        if (!contentType.includes("application/json")) {
            // Extract title if it's HTML
            const titleMatch = rawBody.match(/<title>(.*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1] : "Başlık Bulunamadı";
            
            debugContent.value = `### KRİTİK HATA: SERVİS JSON YERİNE HTML DÖNDÜRDÜ ###\n\n` +
                                 `Yanıt Başlığı: ${title}\n` +
                                 `İçerik Tipi: ${contentType}\n` +
                                 `URL: ${firstPageUrl}\n\n` +
                                 `--- RAW YANIT (İLK 5000 KARAKTER) ---\n\n` + 
                                 rawBody.substring(0, 5000);
            throw new Error(`JSON yerine HTML geldi.`);
        }

        let data;
        try {
            data = JSON.parse(rawBody);
        } catch (e) {
            debugContent.value = `### PARSE HATASI ###\n\n` + rawBody;
            throw new Error("JSON Parse Hatası");
        }
        
        if (data.error) {
            debugContent.value = `### API HATASI ###\n\n` + JSON.stringify(data, null, 2);
            throw new Error(data.error);
        }

        if (data.result && data.result.products) {
            const roughTotalCount = Math.min(data.result.roughTotalCount || 0, 360);
            totalPages = Math.ceil(roughTotalCount / 24);
            processProducts(data.result.products);
            
            const pagePromises = [];
            for (let p = 2; p <= totalPages; p++) {
                pagePromises.push(
                    fetch(getTrendyolUrl(storeId, p)).then(async res => {
                        const json = await res.json();
                        return json;
                    }).catch(e => null)
                );
            }
            
            const results = await Promise.all(pagePromises);
            results.forEach(res => {
                if (res && res.result && res.result.products) {
                    processProducts(res.result.products);
                }
            });
        }
    } catch (e) {
        if (!debugContent.value.startsWith('#')) {
            debugContent.value = `### BİLİNMEYEN HATA ###\n\n` + e.message;
        }
        throw e;
    }
}

function processProducts(products) {
    products.forEach(p => {
        let barcode = 'Bilinmiyor';
        if (p.variants && p.variants[0] && p.variants[0].barcode) {
            barcode = p.variants[0].barcode;
        } else if (p.barcode) {
            barcode = p.barcode;
        }

        allProducts.push({
            id: p.id,
            title: p.name,
            url: 'https://www.trendyol.com' + p.url,
            image: p.images && p.images[0] ? 'https://cdn.dsmcdn.com/' + p.images[0] : (p.imageAlt || ''),
            price: p.price ? p.price.discountedPrice : 0,
            barcode: barcode,
            brand: p.brand ? p.brand.name : 'Unknown'
        });
    });
}

function getTrendyolUrl(mid, pi) {
    return `/api/search?mid=${mid}&pi=${pi}`;
}

function renderProducts() {
    productsGrid.innerHTML = allProducts.map(p => `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${p.image}" class="product-image" loading="lazy" alt="${p.title}">
                <div class="price-tag">${p.price} TL</div>
            </div>
            <div class="product-info">
                <div class="product-meta">
                    <span class="meta-badge">${p.brand}</span>
                    <span class="meta-badge">Barkod: ${p.barcode}</span>
                </div>
                <h3 class="product-title">${p.title}</h3>
                <div class="product-footer">
                    <a href="${p.url}" target="_blank" class="btn-icon" title="Linke Git">
                        <i data-lucide="external-link" size="18"></i>
                    </a>
                    <button class="btn-icon" onclick="copyToClipboard('${p.url}')" title="Linki Kopyala">
                        <i data-lucide="copy" size="18"></i>
                    </button>
                    <button class="btn-icon" onclick="copyToClipboard('${p.barcode}')" title="Barkodu Kopyala">
                        <i data-lucide="barcode" size="18"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function startLoading() {
    loader.classList.add('active');
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span class="loading-spinner"></span> Aranıyor...';
    searchBtn.style.opacity = '0.7';
}

function stopLoading() {
    loader.classList.remove('active');
    searchBtn.disabled = false;
    searchBtn.style.opacity = '1';
    searchBtn.innerHTML = '<i data-lucide="search"></i> Mağazayı Tara';
    lucide.createIcons();
}

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {});
};

copyAllLinksBtn.addEventListener('click', () => {
    const links = allProducts.map(p => p.url).join('\n');
    copyToClipboard(links);
    alert('Tüm ürün linkleri kopyalandı!');
});

copyAllBarcodesBtn.addEventListener('click', () => {
    const barcodes = allProducts.map(p => p.barcode).join('\n');
    copyToClipboard(barcodes);
    alert('Tüm barkodlar kopyalandı!');
});


exportCsvBtn.addEventListener('click', () => {
    let csv = 'Ad,Marka,Fiyat,Link,Barkod\n';
    allProducts.forEach(p => {
        csv += `"${p.title.replace(/"/g, '""')}","${p.brand}","${p.price}","${p.url}","${p.barcode}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `magaza_urunleri_${storeIdInput.value}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
