const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'assets', 'data', 'wallpapers.json');
const siteDataPath = path.join(__dirname, 'site-data.js');

if (fs.existsSync(jsonPath) && fs.existsSync(siteDataPath)) {
  const wallpapers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let siteData = fs.readFileSync(siteDataPath, 'utf8');

  const wallpapersString = JSON.stringify(wallpapers, null, 4).replace(/^/gm, '    ');
  
  // Replace the wallpapers array
  siteData = siteData.replace(
    /wallpapers:\s*\[[\s\S]*?\],\s*lives:/m,
    `wallpapers: ${wallpapersString.trim()},\n\n  lives:`
  );

  fs.writeFileSync(siteDataPath, siteData);
  console.log('Successfully updated site-data.js');
} else {
  console.log('Files missing');
}
