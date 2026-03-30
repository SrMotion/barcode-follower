// web/app.js
// Initialize Lucide Icons
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
    
    try {
        await fetchAllProducts(storeId);
        
        if (allProducts.length === 0) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                    <i data-lucide="frown" size="48" style="margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Ürün bulunamadı veya bir hata oluştu. Mağaza ID'yi kontrol edin.</p>
                </div>
            `;
            actionsHeader.style.display = 'none';
            statsContainer.style.display = 'none';
        } else {
            renderProducts();
            actionsHeader.style.display = 'flex';
            statsContainer.style.display = 'block';
            productCountBadge.textContent = `${allProducts.length} Ürün Bulundu`;
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert(`Hata: ${error.message}\n\nYerel'de deniyorsanız 'vercel dev' kullanın. Vercel'deyseniz API'de bir sorun oluşmuş olabilir.`);
    } finally {
        stopLoading();
    }
});

async function fetchAllProducts(storeId) {
    let totalPages = 1;
    
    try {
        const firstPageUrl = getTrendyolUrl(storeId, 1);
        const response = await fetch(firstPageUrl);
        
        // Yanıt JSON değilse hata verelim
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            throw new Error(`Servis JSON yerine HTML döndürdü. (Local'de 'npm run dev' yerine 'vercel dev' kullanın veya Vercel linkine girin)`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        if (data.result && data.result.products) {
            const roughTotalCount = Math.min(data.result.roughTotalCount || 0, 240); // Demo limiti
            totalPages = Math.ceil(roughTotalCount / 24);
            
            processProducts(data.result.products);
            
            // Diğer sayfaları çekelim
            const pagePromises = [];
            for (let p = 2; p <= totalPages; p++) {
                pagePromises.push(
                    fetch(getTrendyolUrl(storeId, p)).then(async res => {
                        const json = await res.json();
                        return json;
                    }).catch(e => {
                        console.warn(`Sayfa ${p} çekilemedi:`, e);
                        return null;
                    })
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
        console.error("Fetch All Error: ", e);
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
            originalPrice: p.price ? p.price.sellingPrice : 0,
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
    navigator.clipboard.writeText(text).then(() => {
        // Notification logic would go here
    });
};

copyAllLinksBtn.addEventListener('click', () => {
    const links = allProducts.map(p => p.url).join('\n');
    copyToClipboard(links);
    alert('Tüm ürün linkleri (' + allProducts.length + ') kopyalandı!');
});

copyAllBarcodesBtn.addEventListener('click', () => {
    const barcodes = allProducts.map(p => p.barcode).join('\n');
    copyToClipboard(barcodes);
    alert('Tüm barkodlar (' + allProducts.length + ') kopyalandı!');
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
