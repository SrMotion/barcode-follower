export default async function handler(req, res) {
  const { mid, pi } = req.query;

  if (!mid) {
    return res.status(400).json({ error: 'mid (Store ID) is required' });
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

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Trendyol API error' });
    }

    const data = await response.json();
    
    // Set CORS headers just in case for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal server error while fetching from Trendyol' });
  }
}
