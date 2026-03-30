// web/api/search.js
export default async function handler(req, res) {
  const { mid, pi } = req.query;

  if (!mid) {
    return res.status(400).json({ error: 'mid (Mağaza ID) eksik.' });
  }

  const page = pi || 1;
  const trendyolUrl = `https://apigw.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?mid=${mid}&pi=${page}&culture=tr-TR&userGenderId=1&pId=0&isLegalRequirementConfirmed=true&searchStrategyType=DEFAULT&productStampType=TypeA&scoringAlgorithmId=2&fixSlotProductAdsIncluded=true&searchAbDecider=AdvertSlotPeriod_1&location=null&channelId=1`;

  try {
    const response = await fetch(trendyolUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.trendyol.com/'
      }
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!isJson) {
      const text = await response.text();
      return res.status(500).json({ 
        error: 'Trendyol API JSON döndürmedi. (HTML Yanıtı Aldınız)', 
        detail: text.substring(0, 500) // Detaylı debug için
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: `Trendyol Hatası: ${response.statusText}` });
    }

    const data = await response.json();
    
    // CORS ayarlarını Vercel API için veriyoruz
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}
