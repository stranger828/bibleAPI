const fs = require('fs');
const path = require('path');

// Input and Output paths
const inputFile = path.join(__dirname, '../bible.json');
const outputFile = path.join(__dirname, '../bible_structured.json');

try {
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const bibleData = JSON.parse(rawData);
    
    const structuredData = [];
    const regex = /^([가-힣]+)(\d+):(\d+)$/; // Captures: [Name] [Chapter] : [Verse]

    for (const [key, text] of Object.entries(bibleData)) {
        const match = key.match(regex);
        if (match) {
            const [, book, chapter, verse] = match;
            structuredData.push({
                book: book,
                chapter: parseInt(chapter, 10),
                verse: parseInt(verse, 10),
                content: text.trim()
            });
        } else {
            console.warn(`Skipping invalid key format: ${key}`);
        }
    }

    // Sort by canonical order if possible, but JSON order is usually preserved.
    // Since original key order (Genesis -> Revelation) is standard, we trust parsing order.
    
    fs.writeFileSync(outputFile, JSON.stringify(structuredData, null, 2), 'utf8');
    console.log(`Successfully converted ${Object.keys(bibleData).length} verses.`);
    console.log(`Saved to: ${outputFile}`);

} catch (error) {
    console.error("Error transforming data:", error);
}
