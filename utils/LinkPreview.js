const axios = require('axios');
const cheerio = require('cheerio');

async function fetchLinkPreview(url){
    try{
        const response = await axios.get(url,{
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; LinkForge/1.0; +http://linkforge.com/bot)'
            }
        })

        const html= response.data;
        const $= cheerio.load(html);

        let title = $('meta[property="og:title"]').attr('content') || 
                $('title').text() || 
                'No title';

        let description = $('meta[property="og:description"]').attr('content') || 
                      $('meta[name="description"]').attr('content') || 
                      'No description';
        
        let imageUrl = $('meta[property="og:image"]').attr('content') || 
                   $('meta[name="twitter:image"]').attr('content') || 
                   null;

        title = title.substring(0, 200);
        description = description.substring(0, 500);

        return {
            title: title.trim(),
            description: description.trim(),
            imageUrl: imageUrl
        };

    }catch(error){
        console.error('Error fetching link preview:', error.message);

        return {
            title: 'Link Preview Unavailable',
            description: 'Unable to fetch metadata',
            imageUrl: null
        };

    }
}


module.exports = {fetchLinkPreview};