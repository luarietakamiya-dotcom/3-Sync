const fs = require('fs');
const path = require('path');

const wallpapersDir = path.join(__dirname, 'assets', 'wallpapers');
const dataDir = path.join(__dirname, 'assets', 'data');
const jsonPath = path.join(dataDir, 'wallpapers.json');

if (fs.existsSync(jsonPath)) {
  const wallpapers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let counter = 1;

  wallpapers.forEach(entry => {
    const oldRelativePath = entry.image; 
    // e.g. "assets/wallpapers/cyber/cyber-01.png"
    const oldPath = path.join(__dirname, oldRelativePath);
    
    if (fs.existsSync(oldPath)) {
      const ext = path.extname(oldPath);
      const newName = `wp_${counter.toString().padStart(3, '0')}${ext}`;
      const newPath = path.join(wallpapersDir, newName);
      
      // Move file to the root of wallpapersDir
      fs.renameSync(oldPath, newPath);
      
      // Update entry
      entry.image = `assets/wallpapers/${newName}`;
      counter++;
    }
  });

  // Rewrite JSON
  fs.writeFileSync(jsonPath, JSON.stringify(wallpapers, null, 2));

  // Clean up empty directories
  const dirs = ['cyber', 'cute', 'cool', 'live', 'casual', 'comedy', 'Luarie', 'Mimi', 'Hatue', 'etc'];
  dirs.forEach(d => {
    const dPath = path.join(wallpapersDir, d);
    if (fs.existsSync(dPath)) {
      try {
        fs.rmdirSync(dPath);
      } catch (e) {
        console.log(`Could not remove ${dPath}:`, e.message);
      }
    }
  });

  console.log('Successfully flattened wallpapers.');
} else {
  console.log('JSON not found.');
}
