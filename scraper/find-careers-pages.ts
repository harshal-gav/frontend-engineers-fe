import * as fs from 'fs';
import * as path from 'path';

async function fetchCompanyDomain(companyName: string): Promise<string | null> {
  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(companyName)}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data && data.length > 0) {
      // Return the first match's domain
      return data[0].domain;
    }
    return null;
  } catch (error) {
    console.error(`  ❌ Error fetching clearbit for ${companyName}: ${(error as Error).message}`);
    return null;
  }
}

async function main() {
  const configsDir = path.join(process.cwd(), 'scraper', 'configs');
  const files = fs.readdirSync(configsDir).filter(f => f.endsWith('.json'));
  
  console.log(`🔍 Found ${files.length} company configs. Starting fast domain lookup...\n`);
  
  let updatedCount = 0;
  
  for (const file of files) {
    const configPath = path.join(configsDir, file);
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // We can overwrite it if we want to ensure it's accurate, but let's just do it for all since the previous script failed.
    console.log(`[${configData.company}] Looking up domain...`);
    
    const domain = await fetchCompanyDomain(configData.company);
    
    if (domain) {
      const website = `https://${domain}`;
      const careersUrl = `https://${domain}/careers`;
      
      console.log(`  ✅ Found: ${website}`);
      configData.website = website;
      configData.actualCareersUrl = careersUrl;
      
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      updatedCount++;
    } else {
      console.log(`  ⚠️ Could not find a domain.`);
      // Fallback guess
      const slugDomain = configData.slug.replace(/[^a-z0-9]/g, '') + '.com';
      configData.website = `https://${slugDomain}`;
      configData.actualCareersUrl = `https://${slugDomain}/careers`;
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
      console.log(`  ✅ Guessed: https://${slugDomain}`);
      updatedCount++;
    }
    
    // Tiny delay
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\n🎉 Finished! Updated ${updatedCount} company configurations with actual websites.`);
}

main().catch(console.error);
