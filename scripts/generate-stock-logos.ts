import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/public/stocks';
const SIZE = '1024x1024';
const MAX_RETRIES = 2;
const CONCURRENCY = 3; // Generate 3 logos in parallel

interface StockInfo {
  code: string;
  name: string;
  sector: string;
}

const STOCKS: StockInfo[] = [
  { code: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { code: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology/AI' },
  { code: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology/Cloud' },
  { code: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology/Search' },
  { code: 'META', name: 'Meta Platforms Inc.', sector: 'Technology/Social' },
  { code: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology/E-commerce' },
  { code: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive/EV' },
  { code: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology/Semiconductor' },
  { code: 'JPM', name: 'JPMorgan Chase', sector: 'Finance/Banking' },
  { code: 'V', name: 'Visa Inc.', sector: 'Finance/Payments' },
  { code: 'MA', name: 'Mastercard Inc.', sector: 'Finance/Payments' },
  { code: 'GS', name: 'Goldman Sachs', sector: 'Finance/Investment Banking' },
  { code: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare/Insurance' },
  { code: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare/Pharma' },
  { code: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare/Pharma' },
  { code: 'WMT', name: 'Walmart Inc.', sector: 'Consumer/Retail' },
  { code: 'COST', name: 'Costco Wholesale', sector: 'Consumer/Retail' },
  { code: 'NKE', name: 'Nike Inc.', sector: 'Consumer/Apparel' },
  { code: 'MCD', name: 'McDonalds Corp.', sector: 'Consumer/Food' },
  { code: 'XOM', name: 'Exxon Mobil Corp.', sector: 'Energy/Oil & Gas' },
  { code: 'CVX', name: 'Chevron Corp.', sector: 'Energy/Oil & Gas' },
  { code: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrials/Machinery' },
  { code: 'BA', name: 'Boeing Co.', sector: 'Industrials/Aerospace' },
  { code: 'GE', name: 'GE Aerospace', sector: 'Industrials/Aerospace' },
  { code: 'DIS', name: 'Walt Disney Co.', sector: 'Entertainment/Media' },
  { code: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment/Streaming' },
  { code: 'COIN', name: 'Coinbase Global', sector: 'Fintech/Crypto' },
  { code: 'SQ', name: 'Block Inc.', sector: 'Fintech/Payments' },
  { code: 'AVGO', name: 'Broadcom Inc.', sector: 'Technology/Semiconductor' },
  { code: 'INTC', name: 'Intel Corporation', sector: 'Technology/Semiconductor' },
  { code: 'TSM', name: 'Taiwan Semiconductor', sector: 'Technology/Foundry' },
  { code: 'CRM', name: 'Salesforce Inc.', sector: 'Technology/Cloud Software' },
  { code: 'ORCL', name: 'Oracle Corporation', sector: 'Technology/Database' },
  { code: 'ADBE', name: 'Adobe Inc.', sector: 'Technology/Creative Software' },
  { code: 'IBM', name: 'IBM Corporation', sector: 'Technology/AI & Cloud' },
  { code: 'BAC', name: 'Bank of America', sector: 'Finance/Banking' },
  { code: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare/Pharma' },
  { code: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare/Pharma' },
  { code: 'MRK', name: 'Merck & Co.', sector: 'Healthcare/Pharma' },
  { code: 'KO', name: 'Coca-Cola Company', sector: 'Consumer/Beverages' },
  { code: 'SBUX', name: 'Starbucks Corp.', sector: 'Consumer/Food & Beverage' },
  { code: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer/Beverages' },
  { code: 'COP', name: 'ConocoPhillips', sector: 'Energy/Oil & Gas' },
  { code: 'HON', name: 'Honeywell International', sector: 'Industrials/Conglomerate' },
  { code: 'CMCSA', name: 'Comcast Corp.', sector: 'Entertainment/Media' },
  { code: 'PYPL', name: 'PayPal Holdings', sector: 'Fintech/Payments' },
  { code: 'UBER', name: 'Uber Technologies', sector: 'Technology/Ride-sharing' },
  { code: 'NOW', name: 'ServiceNow Inc.', sector: 'Technology/Cloud Software' },
  { code: 'PGR', name: 'Progressive Corp.', sector: 'Finance/Insurance' },
  { code: 'DE', name: 'Deere & Company', sector: 'Industrials/Agriculture' },
];

function buildPrompt(stock: StockInfo): string {
  return `Professional minimalist app icon logo for ${stock.name}, ${stock.sector}, flat design, clean modern style, solid color background matching brand, no text, high quality, detailed, suitable for mobile app display`;
}

async function generateSingleLogo(
  zai: any,
  stock: StockInfo
): Promise<{ success: boolean; code: string; error?: string }> {
  const outputPath = path.join(OUTPUT_DIR, `${stock.code}.png`);
  
  // Skip if already exists and is valid
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    if (stats.size > 1000) {
      console.log(`SKIP [${stock.code}]`);
      return { success: true, code: stock.code };
    }
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const prompt = buildPrompt(stock);
      console.log(`GEN [${stock.code}] attempt ${attempt + 1}`);

      const response = await zai.images.generations.create({
        prompt: prompt,
        size: SIZE,
      });

      if (!response.data || !response.data[0] || !response.data[0].base64) {
        throw new Error('Invalid API response');
      }

      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);

      console.log(`OK [${stock.code}] ${(buffer.length / 1024).toFixed(0)}KB`);
      return { success: true, code: stock.code };
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      console.error(`ERR [${stock.code}] attempt ${attempt + 1}: ${errorMsg}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  console.error(`FAIL [${stock.code}]`);
  return { success: false, code: stock.code, error: 'Max retries exceeded' };
}

async function main() {
  console.log(`Generating ${STOCKS.length} stock logos with concurrency=${CONCURRENCY}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const zai = await ZAI.create();
  console.log('SDK initialized');

  // Filter to only missing logos
  const missing = STOCKS.filter(s => {
    const p = path.join(OUTPUT_DIR, `${s.code}.png`);
    return !fs.existsSync(p) || fs.statSync(p).size <= 1000;
  });
  
  console.log(`Missing: ${missing.length} logos`);
  
  const results: { success: boolean; code: string; error?: string }[] = [];

  // Process in concurrent batches
  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const batch = missing.slice(i, i + CONCURRENCY);
    console.log(`\n--- Batch ${Math.floor(i / CONCURRENCY) + 1}: ${batch.map(s => s.code).join(', ')} ---`);
    
    const batchResults = await Promise.all(
      batch.map(stock => generateSingleLogo(zai, stock))
    );
    
    results.push(...batchResults);
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n=== SUMMARY ===`);
  console.log(`Generated this run: ${successful.length}/${missing.length}`);
  
  if (failed.length > 0) {
    console.log(`Failed: ${failed.length}`);
    failed.forEach(f => console.log(`  - ${f.code}: ${f.error}`));
  }

  const allFiles = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  console.log(`Total logos on disk: ${allFiles.length}/50`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
