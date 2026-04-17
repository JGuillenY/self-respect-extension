#!/usr/bin/env node
/**
 * Minify all JSON files in src/_locales and save to dist/_locales/
 * Usage: node minify-locales.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = 'src/_locales';
const DIST_DIR = 'dist/_locales';

function minifyLocales() {
  console.log('🔧 Minifying locale JSON files...\n');
  
  // Get all language directories
  const languages = fs.readdirSync(SRC_DIR).filter(lang => 
    fs.statSync(path.join(SRC_DIR, lang)).isDirectory()
  );
  
  console.log(`Found ${languages.length} languages: ${languages.join(', ')}\n`);
  
  let stats = [];
  
  languages.forEach(lang => {
    const srcFile = path.join(SRC_DIR, lang, 'messages.json');
    const destFile = path.join(DIST_DIR, lang, 'messages.json');
    
    // Ensure destination directory exists
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    
    try {
      // Read, parse, and minify JSON
      const content = fs.readFileSync(srcFile, 'utf8');
      const data = JSON.parse(content);
      const minified = JSON.stringify(data);
      
      // Write minified JSON
      fs.writeFileSync(destFile, minified, 'utf8');
      
      // Calculate savings
      const originalSize = Buffer.byteLength(content);
      const minifiedSize = Buffer.byteLength(minified);
      const savings = originalSize - minifiedSize;
      const percent = ((savings / originalSize) * 100).toFixed(1);
      
      stats.push({ lang, originalSize, minifiedSize, savings, percent });
      console.log(`✅ ${lang}: ${originalSize} → ${minifiedSize} bytes (${percent}% saved)`);
      
    } catch (error) {
      console.log(`❌ ${lang}: Error - ${error.message}`);
    }
  });
  
  // Print summary
  if (stats.length > 0) {
    const totalOriginal = stats.reduce((sum, s) => sum + s.originalSize, 0);
    const totalMinified = stats.reduce((sum, s) => sum + s.minifiedSize, 0);
    const totalSavings = totalOriginal - totalMinified;
    const totalPercent = ((totalSavings / totalOriginal) * 100).toFixed(1);
    
    console.log('\n📊 Summary:');
    console.log(`  Total: ${totalOriginal} → ${totalMinified} bytes`);
    console.log(`  Saved: ${totalSavings} bytes (${totalPercent}%)`);
    console.log(`  Files: ${stats.length}/${languages.length} minified successfully`);
  }
  
  console.log(`\n✅ Minified files saved to: ${DIST_DIR}`);
}

// Run if called directly
if (require.main === module) {
  minifyLocales();
}

module.exports = minifyLocales;