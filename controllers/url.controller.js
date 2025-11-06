const pool = require('../config/db');
const { generateShortCode } = require('../utils/shortCodeGenerator');
const { fetchLinkPreview } = require('../utils/LinkPreview');

/**
 * Shorten a URL
 * POST /api/shorten
 * Body: { "url": "https://example.com" }
 */
async function shortenUrl(req, res) {
  try {
    const { url, customAlias } = req.body;

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
    let shortCode;
    if(customAlias){
      // Validate custom alias format (alphanumeric, 3-20 chars)
      const aliasRegex = /^[a-zA-Z0-9-_]{3,20}$/;
      if (!aliasRegex.test(customAlias)) {
        return res.status(400).json({ 
          error: 'Custom alias must be 3-20 characters (letters, numbers, hyphens, underscores only)' 
        });
      }
      // Check if custom alias already exists
      const existing= await pool.query(
        'SELECT id from urls where short_code=$1',
        [customAlias]
      );
      if(existing.rows.length >0){
        return res.status(409).json({
          error: 'Custom Alias already taken. Please take another.'
        });
      }

      shortCode = customAlias;
    }
    else{
      // Generate unique short code
      shortCode = generateShortCode();
      let isUnique = false;
      
      // Retry if code already exists
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
    }

    const metadata = await fetchLinkPreview(url);

    // Store in database
    const result = await pool.query(
      'INSERT INTO urls (original_url, short_code, title, description, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [url, shortCode, metadata.title, metadata.description, metadata.imageUrl]
    );

    const savedUrl = result.rows[0];

    res.status(201).json({
      message: 'URL shortened successfully',
      originalUrl: savedUrl.original_url,
      shortCode: savedUrl.short_code,
      shortUrl: `http://localhost:3000/${savedUrl.short_code}`,
      createdAt: savedUrl.created_at,
      isCustomAlias: !!customAlias,  // Let user know if custom alias was used
      preview: {
        title: savedUrl.title,
        description: savedUrl.description,
        imageUrl: savedUrl.imageUrl
      }
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
      'Update urls SET click_count= click_count+1, last_clicked_at= CURRENT_TIMESTAMP where short_code=$1',
      [shortCode]
    );

    res.redirect(originalUrl);

  }
  catch(error){
    console.error('Error Redirecting URL:', error);
    res.status(500).json({error:'Internal server error'});
  }

}

/*
* Get ananlytics for a short URL 
*/
async function getStats(req,res){
  try{
    const { shortCode} = req.params;
    const result= await pool.query(
      'SELECT * from urls where short_code=$1',
      [shortCode]
    );
    if(result.rows.length==0){
      return res.status(404).json({error: 'Short Url not Found'});
    }
    const urlData = result.rows[0];
    res.json({
      originalUrl: urlData.original_url,
      shortCode: urlData.short_code,
      shortUrl: 'http://localhost:3000/' + urlData.short_code,
      clickCount: urlData.click_count,
      createdAt: urlData.created_at,
      lastClickedAt: urlData.last_clicked_at || 'Never',
      preview: {                                    
        title: urlData.title,
        description: urlData.description,
        imageUrl: urlData.image_url
    }
    });
  }
  catch(error){
    console.error('Error fetching stats:',error);
    res.status(500).json({error:'Internal server error'});
  }
}
    
  

module.exports = {
  shortenUrl,
  redirectUrl,
  getStats,
};