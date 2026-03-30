export default async function handler(req, res) {
  const { mid, pi } = req.query;

  if (!mid) {
    return res.status(400).json({ error: 'Mağaza ID gerekli.' });
  }

  // Senin verdiğin ve çalışan o sihirli URL
  // wb=104932 (Microsoft) sabit, mid senin girdiğin mağaza id
  const trendyolUrl = `https://apigw.trendyol.com/discovery-sfint-search-service/api/search/products?wb=104932&os=1&mid=${mid}&pathModel=sr&channelId=1&storefrontId=1&culture=tr-TR&pi=${pi || 1}`;

  try {
    const response = await fetch(trendyolUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'X-Domain': 'TR',
        'X-Platform': 'web',
        'X-Culture': 'tr-TR',
        'X-Language': 'tr',
        'X-Country': 'TR',
        'X-Channel': 'TR',
        'X-Request-Source': 'single-search-result',
        'Baggage': 'ty.kbt.name=ViewSearchResult,ty.platform=Web,ty.business_unit=Core%20Commerce,ty.channel=TR,com.trendyol.observability.business_transaction.name=ViewSearchResult,ty.source.service.name=Puzzle%20WEB%20Storefront%20TR,ty.source.deployment.environment=production,ty.source.service.version=14ffe088,ty.source.client.path=%2Fsr,ty.source.service.type=client',
        'Cookie': 'platform=web; language=tr; storefrontId=1; countryCode=TR',
        'Referer': 'https://www.trendyol.com/',
        'Origin': 'https://www.trendyol.com'
      }
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json(data);
    } else {
      return res.status(response.status).json({ 
        error: 'Trendyol API hatası.', 
        detail: data 
      });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
}
