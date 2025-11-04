const pool = require('../config/db');
const { generateShortCode } = require('../utils/shortCodeGenerator');

/**
 * Shorten a URL
 * POST /api/shorten
 * Body: { "url": "https://example.com" }
 */
async function shortenUrl(req, res) {
  try {
    const { url } = req.body;

    // Validation
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    let isUnique = false;
    
    // Retry if code already exists (very rare)
    while (!isUnique) {
      const existing = await pool.query(
        'SELECT id FROM urls WHERE short_code = $1',
        [shortCode]
      );
      
      if (existing.rows.length === 0) {
        isUnique = true;
      } else {
        shortCode = generateShortCode();
      }
    }

    // Store in database
    const result = await pool.query(
      'INSERT INTO urls (original_url, short_code) VALUES ($1, $2) RETURNING *',
      [url, shortCode]
    );

    const savedUrl = result.rows[0];

    res.status(201).json({
      message: 'URL shortened successfully',
      originalUrl: savedUrl.original_url,
      shortCode: savedUrl.short_code,
      shortUrl: `http://localhost:3000/${savedUrl.short_code}`,
      createdAt: savedUrl.created_at,
    });

  } catch (error) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function redirectUrl(req,res){
  try{
    const { shortCode } = req.params;
    const result = await pool.query(
      'Select original_url from urls where short_code=$1',
      [shortCode]
    );
    if(result.rows.length ===0){
      return res.status(404).json({error: 'Short URL not found'});
    }
    const originalUrl = result.rows[0].original_url;

    await pool.query(
      'Update urls SET click_count= click_count+1 where short_code=$1',
      [shortCode]
    );

    res.redirect(originalUrl);

  }
  catch(error){
    console.error('Error Redirecting URL:', error);
    res.status(500).json({error:'Internal server error'});
  }

}

module.exports = {
  shortenUrl,
  redirectUrl,
};