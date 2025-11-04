/**
 * Generates a random 6-character alphanumeric short code
 * Example output: "aB3xY9"
 */
function generateShortCode() {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let shortCode = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    shortCode += characters[randomIndex];
  }
  
  return shortCode;
}

module.exports = { generateShortCode };