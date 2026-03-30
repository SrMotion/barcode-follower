export default async function handler(req, res) {
  const { mid, pi } = req.query;

  if (!mid) {
    return res.status(400).json({ error: 'Mağaza ID gerekli.' });
  }

  // Vercel Yurtdışında olduğu için ana motor olan 'web-searchgw' servisini deniyoruz
  // Bu servis yurtdışı IP'lerine bazen daha esnek davranabiliyor
  const trendyolUrl = `https://apigw.trendyol.com/discovery-web-searchgw-service/v2/api/infinite-scroll/sr?mid=${mid}&pi=${pi || 1}&culture=tr-TR&userGenderId=1&pId=0&isLegalRequirementConfirmed=true&searchStrategyType=DEFAULT`;

  try {
    const response = await fetch(trendyolUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'tr-TR,tr;q=0.9',
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
      // Eğer bu API'den farklı bir yapı dönerse frontend'i ona göre besliyoruz
      // discovery-web servisi için result.products şeklinde döner
      const normalizedData = {
        products: data.result ? data.result.products : (data.products || []),
        totalCount: data.result ? data.result.roughTotalCount : (data.total || 0)
      };
      return res.status(200).json(normalizedData);
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
