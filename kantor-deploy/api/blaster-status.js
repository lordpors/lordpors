const SUMBER = 'https://telegram-blaster-production.up.railway.app/api/office/account-stats';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ galat: 'cara tidak didukung' });

  try {
    const upstream = await fetch(SUMBER, {
      headers: { 'X-Office-Key': process.env.BLASTER_STATUS_KEY || '' },
      cache: 'no-store',
    });
    if (!upstream.ok) throw new Error(`status sumber ${upstream.status}`);
    const data = await upstream.json();
    return res.status(200).json({
      active: Number(data.active) || 0,
      flood: Number(data.flood) || 0,
      total: Number(data.total) || 0,
    });
  } catch (error) {
    return res.status(502).json({ galat: String(error?.message || error) });
  }
}
