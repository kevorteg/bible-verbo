import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_BIBLE_KEY = process.env.API_BIBLE_KEY || process.env.VITE_API_BIBLE_KEY;
const BASE_URL = 'https://rest.api.bible/v1/bibles';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the path from the query, e.g., /api/bible?path=/592420522e16049f-01/books
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  const fullUrl = `${BASE_URL}${path}`;

  try {
    const response = await fetch(fullUrl, {
      headers: { "api-key": API_BIBLE_KEY } as HeadersInit
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Bible API error:", errorText);
        return res.status(response.status).json({ error: `Bible API error: ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Serverless Proxy Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
