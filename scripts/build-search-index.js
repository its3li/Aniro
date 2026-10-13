const fs = require('fs');
const path = require('path');

// Build search index from all Quran editions
async function buildSearchIndex() {
  const surahDir = path.join(__dirname, '../public/data/quran/surah');
  const editions = ['quran-uthmani', 'quran-tajweed', 'quran-warsh'];
  
  const allDocuments = [];
  
  // Load surah list for names
  const surahListPath = path.join(__dirname, '../public/data/quran/surah-list.json');
  const surahList = JSON.parse(fs.readFileSync(surahListPath, 'utf8'));
  
  for (const edition of editions) {
    const editionDir = path.join(surahDir, edition);
    if (!fs.existsSync(editionDir)) continue;
    
    const files = fs.readdirSync(editionDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const surahNum = parseInt(file.replace('.json', ''));
      const surahData = JSON.parse(fs.readFileSync(path.join(editionDir, file), 'utf8'));
      const surahInfo = surahList.find(s => s.number === surahNum);
      
      for (const ayah of surahData.ayahs) {
        allDocuments.push({
          id: `${surahNum}:${ayah.numberInSurah}:${edition}`,
          surahNumber: surahNum,
          surahName: surahInfo?.name || '',
          surahEnglishName: surahInfo?.englishName || '',
          ayahNumber: ayah.numberInSurah,
          ayahText: ayah.text,
          edition: edition
        });
      }
    }
  }
  
  console.log('Preparing bundled search documents: ' + allDocuments.length + ' ayat');
  
  // Save index
  const indexDir = path.join(__dirname, '../public/data/quran/search');
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }
  
  // The app builds one incremental index on demand from these documents.
  fs.writeFileSync(
    path.join(indexDir, 'all-ayat.json'), 
    JSON.stringify(allDocuments.map(d => ({
      id: d.id,
      s: d.surahNumber,
      n: d.surahName,
      e: d.surahEnglishName,
      a: d.ayahNumber,
      t: d.ayahText,
      ed: d.edition
    })))
  );
  
  console.log('[Build] Compact search documents saved.');
  console.log(`[Build] ✓ Total ayat indexed: ${allDocuments.length}`);
  
  return allDocuments.length;
}

buildSearchIndex().catch(console.error);
