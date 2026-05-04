const fs = require('fs');
const path = require('path');

const wallpapersDir = path.join(__dirname, 'assets', 'wallpapers');
const dataDir = path.join(__dirname, 'assets', 'data');
const jsonPath = path.join(dataDir, 'wallpapers.json');

// Ensure data dir exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Categories and characters
const categories = ['cyber', 'cute', 'cool', 'live', 'casual', 'comedy', 'Luarie', 'Mimi', 'Hatue', 'etc'];
const allCharacters = ['luarie', 'hatsue', 'mimi'];
const types = ['solo', 'duo', 'group'];

const wallpapers = [];
const files = fs.readdirSync(wallpapersDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

let counts = {};
categories.forEach(c => counts[c] = 0);

files.forEach((file, index) => {
  // Random primary category
  const primaryCat = categories[index % categories.length];
  counts[primaryCat]++;
  
  // Random secondary category
  const secondaryCat = categories[(index + 3) % categories.length];
  const genres = [primaryCat];
  if (primaryCat !== secondaryCat && Math.random() > 0.5) {
    genres.push(secondaryCat);
  }

  // Random characters
  const charCount = Math.floor(Math.random() * 3) + 1; // 1 to 3
  const chars = [...allCharacters].sort(() => 0.5 - Math.random()).slice(0, charCount);
  
  // Determine type
  const type = chars.length === 1 ? 'solo' : (chars.length === 2 ? 'duo' : 'group');

  // New file name and path
  const ext = path.extname(file);
  const newFileName = `${primaryCat}-${counts[primaryCat].toString().padStart(2, '0')}${ext}`;
  const targetDir = path.join(wallpapersDir, primaryCat);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const oldPath = path.join(wallpapersDir, file);
  const newPath = path.join(targetDir, newFileName);

  // Move file
  fs.renameSync(oldPath, newPath);

  // Create JSON entry
  const entry = {
    title: `${primaryCat.charAt(0).toUpperCase() + primaryCat.slice(1)} ${counts[primaryCat]}`,
    category: genres, // array for multiple genres
    characters: chars,
    type: type,
    image: `assets/wallpapers/${primaryCat}/${newFileName}`
  };
  
  wallpapers.push(entry);
});

fs.writeFileSync(jsonPath, JSON.stringify(wallpapers, null, 2));
console.log(`Organized ${files.length} wallpapers into JSON and folders.`);
