export default async function handler(req, res) {
  const { mid, pi } = req.query;

  if (!mid) {
    return res.status(400).json({ error: 'mid (Mağaza ID) gereklidir.' });
  }

  const page = pi || 1;
  const trendyolUrl = `https://apigw.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?mid=${mid}&pi=${page}&culture=tr-TR&userGenderId=1&pId=0&isLegalRequirementConfirmed=true&searchStrategyType=DEFAULT&productStampType=TypeA&scoringAlgorithmId=2&fixSlotProductAdsIncluded=true&searchAbDecider=AdvertSlotPeriod_1&location=null&channelId=1`;

  try {
    const response = await fetch(trendyolUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.trendyol.com/'
      }
    });

    const contentType = response.headers.get("content-type");
    
    if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Trendyol JSON yerine HTML veya farklı bir format döndürdü.");
        return res.status(500).json({ 
            error: "Trendyol API yanıtı geçersiz (JSON değil).", 
            message: "Trendyol bot kontrolüne takılmış olabilir veya geçici bir hata oluştu.",
            detail: text.substring(0, 100)
        });
    }

    if (!response.ok) {
        return res.status(response.status).json({ error: 'Trendyol API hatası: ' + response.statusText });
    }

    const data = await response.json();
    
    // Vercel Cache-Control (Opsiyonel: 1 saat cacheleyebilirsin)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Hatası:', error);
    return res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
}
