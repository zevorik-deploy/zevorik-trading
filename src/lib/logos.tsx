'use client'

import { useState } from 'react'

// ============================================
// LOGO WITH FALLBACK COMPONENT
// ============================================
export function LogoWithFallback({ src, alt, size, code, className = '' }: { src: string; alt: string; size: number; code: string; className?: string }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    return (
      <div className="flex items-center justify-center rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <span className="text-[10px] font-black text-[#3b82f6]">{code.slice(0, 2)}</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ minWidth: size, minHeight: size }}
      onError={() => setErrored(true)}
    />
  )
}

// ============================================
// SVG INSTRUMENT LOGO GENERATOR
// ============================================
export const getInstrumentLogo = (code: string, size: number = 40) => {
  const specialColors: Record<string, [string, string]> = {
    // Crypto
    'BTC': ['#f7931a', '#e88a17'], 'ETH': ['#627eea', '#4c6edb'], 'XRP': ['#00aae4', '#0099cc'],
    'SOL': ['#9945ff', '#14f195'], 'DOGE': ['#c3a634', '#ba9e2d'], 'ADA': ['#0033ad', '#002d99'],
    'AVAX': ['#e84142', '#d13a3b'], 'DOT': ['#e6007a', '#cc006b'], 'LINK': ['#2a5ada', '#2450c2'],
    'MATIC': ['#8247e5', '#703cc9'], 'BCH': ['#0ac18e', '#09ad7e'], 'LTC': ['#bfbbbb', '#a8a5a5'],
    'XLM': ['#14b6e7', '#11a0cc'], 'UNI': ['#ff007a', '#e6006e'], 'AAVE': ['#b6509e', '#9e448c'],
    'SHIB': ['#ffa409', '#e69408'], 'ATOM': ['#2e3148', '#262a3d'], 'FIL': ['#0090ff', '#0080e6'],
    'NEAR': ['#00c1de', '#00abc5'], 'ALGO': ['#000000', '#1a1a1a'], 'VET': ['#15bdff', '#12a8e6'],
    'SAND': ['#04adef', '#039ad6'], 'MANA': ['#ff2d55', '#e6284d'], 'AXS': ['#0055d5', '#004cba'],
    'THETA': ['#2ab8e6', '#25a5cf'], 'APT': ['#2dd8a3', '#26c292'], 'ARB': ['#28a0f0', '#2390d6'],
    'OP': ['#ff0420', '#e6031d'], 'IMX': ['#00c3ff', '#00b0e6'], 'INJ': ['#00f2fe', '#00dbe6'],
    'TIA': ['#7b2bf9', '#6c27e0'], 'SEI': ['#9b1c1e', '#8a1819'], 'SUI': ['#6fbcf0', '#5fa8da'],
    'PEPE': ['#479F45', '#3d8a3b'], 'FTM': ['#1969ff', '#145ce6'], 'GRT': ['#6747ed', '#5a3dd4'],
    'ENS': ['#5298ff', '#4788e6'], 'LDO': ['#00a3ff', '#0092e6'], 'RPL': ['#ff6e4a', '#e66242'],
    'STX': ['#2d2d2d', '#1a1a1a'],
    // Commodities
    'GOLD': ['#ffd700', '#daa520'], 'SILVER': ['#c0c0c0', '#a0a0a0'], 'OIL': ['#2d2d2d', '#1a1a1a'],
    'NATGAS': ['#4a90d9', '#3d7cc2'], 'COPPER': ['#b87333', '#a0652d'], 'PLATINUM': ['#e5e4e2', '#c8c7c5'],
    'PALLADIUM': ['#ced0dd', '#b5b7c4'], 'WHEAT': ['#f5deb3', '#dcc89d'], 'CORN': ['#f4c430', '#dab22b'],
    'SOYBEANS': ['#8db255', '#7d9f4c'], 'SUGAR': ['#f8f8f8', '#dcdcdc'], 'COFFEE': ['#6f4e37', '#5e422e'],
    'COTTON': ['#f0f0f0', '#d4d4d4'], 'LUMBER': ['#deb887', '#c5a476'], 'RICE': ['#f5f5dc', '#d9d9c4'],
    'CACAO': ['#5c3317', '#4d2b14'], 'RUBBER': ['#333333', '#1a1a1a'], 'IRON': ['#8b8b8b', '#747474'],
    // Forex
    'EURUSD': ['#003399', '#002d88'], 'GBPUSD': ['#012169', '#011d5c'], 'USDJPY': ['#bc002d', '#a60027'],
    'AUDUSD': ['#00008b', '#00007a'], 'USDCAD': ['#ff0000', '#e60000'], 'NZDUSD': ['#000000', '#1a1a1a'],
    'USDCHF': ['#ff0000', '#e60000'], 'EURGBP': ['#003399', '#002d88'], 'EURJPY': ['#003399', '#002d88'],
    'GBPJPY': ['#012169', '#011d5c'], 'AUDJPY': ['#00008b', '#00007a'], 'EURAUD': ['#003399', '#002d88'],
    'GBPAUD': ['#012169', '#011d5c'], 'EURNZD': ['#003399', '#002d88'], 'GBPCAD': ['#012169', '#011d5c'],
    'USDSGD': ['#cc0000', '#b30000'], 'USDHKD': ['#cc0000', '#b30000'], 'USDSEK': ['#006aa7', '#005c93'],
    'USDNOK': ['#ba0c2f', '#a50a29'], 'USDDKK': ['#c8102e', '#b30e28'], 'USDZAR': ['#007749', '#006640'],
    'USDTRY': ['#e30a17', '#cc0915'], 'USDMXN': ['#006341', '#005538'], 'USDPLN': ['#dc143c', '#c61236'],
    'EURCHF': ['#003399', '#002d88'],
    // Tech / Bluechip
    'AAPL': ['#555555', '#444444'], 'NVDA': ['#76b900', '#67a000'], 'MSFT': ['#00a4ef', '#0093d6'],
    'GOOGL': ['#4285f4', '#3676d6'], 'META': ['#1877f2', '#1569d8'], 'AMZN': ['#ff9900', '#e68a00'],
    'TSLA': ['#cc0000', '#b30000'], 'AMD': ['#ed1c24', '#d4191f'], 'JPM': ['#003087', '#002b78'],
    'V': ['#1a1f71', '#151a63'], 'MA': ['#ff5f00', '#e65500'],
    // Banking
    'GS': ['#7b9abb', '#6a89a8'], 'BAC': ['#012169', '#011d5c'], 'PGR': ['#0072ce', '#0065b5'],
    // Healthcare
    'UNH': ['#002677', '#001f63'], 'JNJ': ['#d51900', '#bf1700'], 'PFE': ['#0063b2', '#005699'],
    'LLY': ['#d52b1e', '#bf261a'], 'ABBV': ['#071d49', '#061840'], 'MRK': ['#00857c', '#00746c'],
    'ABT': ['#009cde', '#008ac5'], 'TMO': ['#ee3124', '#d62c20'], 'DHR': ['#004b87', '#004075'],
    'ISRG': ['#00573f', '#004b36'], 'SYK': ['#5a2d82', '#4e2772'], 'BSX': ['#00854a', '#007440'],
    'EW': ['#e31837', '#cc1532'], 'GILD': ['#c41230', '#af102b'], 'AMGN': ['#0064b4', '#005799'],
    'BIIB': ['#1a3c6e', '#153360'], 'REGN': ['#c8102e', '#b30e28'], 'MRNA': ['#05204a', '#041b3f'],
    'VRTX': ['#6236a5', '#562e92'], 'CVS': ['#cc0000', '#b30000'], 'CI': ['#003c71', '#003462'],
    'HUM': ['#00539b', '#004887'], 'CNC': ['#005eb8', '#0052a0'],
    // Consumer
    'WMT': ['#0071ce', '#0064b5'], 'COST': ['#e31837', '#cc1532'], 'NKE': ['#f56565', '#e05555'],
    'MCD': ['#ffc72c', '#e6b427'], 'KO': ['#f40009', '#da0008'], 'SBUX': ['#006241', '#005538'],
    'PEP': ['#004b93', '#004080'], 'PG': ['#003DA5', '#003590'], 'CL': ['#d4002a', '#bf0026'],
    'EL': ['#0b2265', '#091d57'], 'PM': ['#003057', '#002a4e'], 'MO': ['#003057', '#002a4e'],
    'SPG': ['#c8102e', '#b30e28'], 'PLD': ['#003da5', '#003590'], 'AMT': ['#e31837', '#cc1532'],
    'EQIX': ['#ed1c24', '#d4191f'], 'O': ['#003da5', '#003590'],
    // Energy
    'XOM': ['#ed1c24', '#d4191f'], 'CVX': ['#0055a5', '#004c93'], 'COP': ['#c8102e', '#b30e28'],
    'SLB': ['#005cb9', '#0051a2'], 'FANG': ['#2e4a2e', '#264026'], 'MPC': ['#00539b', '#004887'],
    'PSX': ['#0d2344', '#0b1d3a'], 'OXY': ['#c8102e', '#b30e28'], 'EOG': ['#006241', '#005538'],
    // Infrastructure / Defense
    'CAT': ['#ffcd11', '#e6b810'], 'BA': ['#0033a0', '#002d8f'], 'GE': ['#3b73b9', '#3366a3'],
    'HON': ['#e31e26', '#cc1b22'], 'DE': ['#367c2b', '#2e6c24'], 'LMT': ['#0033a0', '#002d8f'],
    'NOC': ['#0033a0', '#002d8f'], 'RTX': ['#0033a0', '#002d8f'], 'GD': ['#0033a0', '#002d8f'],
    // Media
    'DIS': ['#113ccf', '#0f35b8'], 'NFLX': ['#e50914', '#cc0812'], 'CMCSA': ['#0c0c0c', '#1a1a1a'],
    // Tech / Growth
    'COIN': ['#0052ff', '#0049e6'], 'SQ': ['#006aff', '#005fe6'], 'PYPL': ['#003087', '#002b78'],
    'AVGO': ['#cc092f', '#b6082a'], 'INTC': ['#0071c5', '#0065ae'], 'TSM': ['#c41230', '#af102b'],
    'CRM': ['#00a1e0', '#0090c7'], 'ORCL': ['#f80000', '#df0000'], 'ADBE': ['#ff0000', '#e60000'],
    'IBM': ['#054ada', '#0442c2'], 'NOW': ['#81b5a1', '#73a291'], 'UBER': ['#000000', '#1a1a1a'],
    'SNAP': ['#fffc00', '#e6e300'], 'PINS': ['#e60023', '#cc001f'], 'RIVN': ['#f5f5f5', '#dcdcdc'],
    'LCID': ['#f5a623', '#db951f'], 'NIO': ['#00bfff', '#00ace6'], 'PLTR': ['#101010', '#1a1a1a'],
    'DKNG': ['#53d769', '#4ac15e'], 'RBLX': ['#e2231a', '#cb1f17'], 'SHOP': ['#96bf48', '#84a83f'],
    'SE': ['#e8333a', '#d02e34'], 'GRAB': ['#00b14f', '#009d45'], 'HOOD': ['#00c805', '#00b405'],
    'ROKU': ['#6d1be1', '#6118ca'], 'ZM': ['#2d8cff', '#267de6'], 'TEAM': ['#0052cc', '#0049b8'],
    // Cybersecurity / Software
    'CRWD': ['#e8243c', '#d02036'], 'PANW': ['#fa582d', '#e14f28'], 'MNDY': ['#ff3d57', '#e6364f'],
    'DDOG': ['#632ca6', '#572795'], 'NET': ['#f38020', '#da731d'], 'MDB': ['#00ed64', '#00d55a'],
    'HUBS': ['#ff7a59', '#e66e4f'], 'TWLO': ['#f22f46', '#da2a3f'], 'OKTA': ['#007dc1', '#006eab'],
    'ZS': ['#0078ff', '#006ce6'], 'PATH': ['#fa1e3c', '#e11b36'], 'AI': ['#c41230', '#af102b'],
    'SOUN': ['#00b4d8', '#00a1c1'],
    // Additional Financials
    'SCHW': ['#003057', '#002a4e'], 'BLK': ['#000000', '#1a1a1a'],
    'AXP': ['#006fcf', '#0062b8'], 'C': ['#003b70', '#003362'], 'WFC': ['#d71e28', '#c21a24'],
    'MS': ['#002395', '#001f82'], 'AXPO': ['#e31837', '#cc1532'],
    // Additional Real Estate / REITs
    'PSA': ['#e31837', '#cc1532'], 'CCI': ['#003da5', '#003590'], 'DLR': ['#003399', '#002d88'],
    'VICI': ['#003057', '#002a4e'],
    // Additional Media
    'WBD': ['#0057b8', '#004da0'], 'PARA': ['#0057b8', '#004da0'], 'FOX': ['#0c2340', '#0a1d36'],
    // Telecom
    'T': ['#009fdb', '#008ec2'], 'VZ': ['#cd040b', '#b6030a'], 'TMUS': ['#e20074', '#cb0068'],
    // Retail / Home
    'TGT': ['#cc0000', '#b30000'], 'LOW': ['#004990', '#004080'], 'HD': ['#f96302', '#e05a02'],
    'DLTR': ['#1f9f43', '#1a8c3b'], 'TJX': ['#c8102e', '#b30e28'],
    // Transportation
    'UPS': ['#351c15', '#2d1712'], 'FDX': ['#4d148c', '#421278'], 'DAL': ['#003366', '#002b57'],
    // Berkshire
    'BRK.B': ['#7b2d26', '#6c2822'],
  }
  // Emoji prefix map for special instrument types
  const emojiMap: Record<string, string> = {
    'BTC': '₿', 'ETH': 'Ξ', 'XRP': '✕', 'SOL': '◎', 'DOGE': 'Ð',
    'GOLD': '🥇', 'SILVER': '🥈', 'OIL': '🛢️', 'NATGAS': '🔥', 'COPPER': '🔶',
    'PLATINUM': '💍', 'PALLADIUM': '💎', 'WHEAT': '🌾', 'CORN': '🌽',
    'SOYBEANS': '🫘', 'SUGAR': '🍬', 'COFFEE': '☕', 'COTTON': '🧵', 'LUMBER': '🪵', 'RICE': '🍚',
    'EURUSD': '🇪🇺', 'GBPUSD': '🇬🇧', 'USDJPY': '🇯🇵', 'AUDUSD': '🇦🇺', 'USDCAD': '🇨🇦',
    'NZDUSD': '🇳🇿', 'USDCHF': '🇨🇭', 'EURGBP': '🇪🇺', 'EURJPY': '🇪🇺', 'GBPJPY': '🇬🇧',
    'AUDJPY': '🇦🇺', 'EURAUD': '🇪🇺', 'GBPAUD': '🇬🇧', 'EURNZD': '🇪🇺', 'GBPCAD': '🇬🇧',
    'USDSGD': '🇸🇬', 'USDHKD': '🇭🇰', 'USDSEK': '🇸🇪', 'USDNOK': '🇳🇴',
    'USDDKK': '🇩🇰', 'USDZAR': '🇿🇦', 'USDTRY': '🇹🇷', 'USDMXN': '🇲🇽',
    'USDPLN': '🇵🇱', 'EURCHF': '🇨🇭',
    'SHIB': '🐕', 'ATOM': '⚛️', 'FIL': '💾', 'NEAR': '🌊', 'ALGO': '∆', 'VET': '⚡',
    'SAND': '🏖️', 'MANA': '🌐', 'AXS': '⚔️', 'THETA': '📡', 'APT': '🔷', 'ARB': '🔵',
    'OP': '🔴', 'IMX': '♾️', 'INJ': '💉', 'TIA': '💜', 'SEI': '🟠', 'SUI': '💧',
    'PEPE': '🐸', 'FTM': '👻', 'GRT': '📊', 'ENS': '📛', 'LDO': '🏛️', 'RPL': '🚀',
    'STX': '🧱',
    'CACAO': '🍫', 'RUBBER': '⚫', 'IRON': '🔩',
  }
  const hash = code.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const hue1 = hash % 360
  const hue2 = (hash * 7) % 360
  const gradientId = `logo-${code}-${size}`
  const colors = specialColors[code] || [`hsl(${hue1}, 70%, 50%)`, `hsl(${hue2}, 60%, 40%)`]
  const emoji = emojiMap[code]
  const displayText = code.length <= 3 ? code.slice(0, 2) : code.slice(0, 3)
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill={`url(#${gradientId})`} />
      {emoji ? (
        <text x="20" y="21" textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="14" fontWeight="900" fontFamily="system-ui">
          {emoji}
        </text>
      ) : (
        <text x="20" y="20" textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize={displayText.length > 2 ? "9" : "12"} fontWeight="900" fontFamily="system-ui">
          {displayText}
        </text>
      )}
    </svg>
  )
}

// ============================================
// REAL LOGO HELPER
// ============================================
export const getRealLogo = (code: string, size: number = 36) => {
  // Stock domain mapping for Google Favicon API
  const stockDomains: Record<string, string> = {
    'AAPL': 'apple.com', 'NVDA': 'nvidia.com', 'MSFT': 'microsoft.com',
    'GOOGL': 'google.com', 'META': 'meta.com', 'AMZN': 'amazon.com',
    'TSLA': 'tesla.com', 'AMD': 'amd.com', 'JPM': 'jpmorgan.com',
    'V': 'visa.com', 'MA': 'mastercard.com', 'GS': 'goldmansachs.com',
    'BAC': 'bankofamerica.com', 'UNH': 'unitedhealthgroup.com',
    'JNJ': 'jnj.com', 'PFE': 'pfizer.com', 'LLY': 'lilly.com',
    'ABBV': 'abbvie.com', 'MRK': 'merck.com', 'WMT': 'walmart.com',
    'COST': 'costco.com', 'NKE': 'nike.com', 'MCD': 'mcdonalds.com',
    'KO': 'coca-cola.com', 'SBUX': 'starbucks.com', 'PEP': 'pepsico.com',
    'XOM': 'exxonmobil.com', 'CVX': 'chevron.com', 'COP': 'conocophillips.com',
    'CAT': 'caterpillar.com', 'BA': 'boeing.com', 'GE': 'ge.com',
    'HON': 'honeywell.com', 'DE': 'deere.com', 'DIS': 'disney.com',
    'NFLX': 'netflix.com', 'CMCSA': 'comcast.com', 'COIN': 'coinbase.com',
    'SQ': 'block.xyz', 'PYPL': 'paypal.com', 'AVGO': 'broadcom.com',
    'INTC': 'intel.com', 'TSM': 'tsmc.com', 'CRM': 'salesforce.com',
    'ORCL': 'oracle.com', 'ADBE': 'adobe.com', 'IBM': 'ibm.com',
    'NOW': 'servicenow.com', 'UBER': 'uber.com', 'PG': 'pg.com',
    'CL': 'colgatepalmolive.com', 'EL': 'estee.com', 'PM': 'pmi.com',
    'MO': 'altria.com', 'ABT': 'abbott.com', 'TMO': 'thermofisher.com',
    'DHR': 'danaher.com', 'ISRG': 'intuitivesurgical.com', 'SYK': 'stryker.com',
    'BSX': 'bsci.com', 'EW': 'edwards.com', 'GILD': 'gilead.com',
    'AMGN': 'amgen.com', 'BIIB': 'biogen.com', 'REGN': 'regeneron.com',
    'MRNA': 'modernatx.com', 'VRTX': 'vertexpharma.com', 'CVS': 'cvshealth.com',
    'CI': 'cigna.com', 'HUM': 'humana.com', 'CNC': 'centene.com',
    'SLB': 'slb.com', 'FANG': 'diamondbackenergy.com', 'MPC': 'marathonpetroleum.com',
    'PSX': 'phillips66.com', 'OXY': 'oxy.com', 'EOG': 'eogresources.com',
    'LMT': 'lockheedmartin.com', 'NOC': 'northropgrumman.com', 'RTX': 'rtx.com',
    'GD': 'gd.com', 'PGR': 'progressive.com', 'SCHW': 'schwab.com',
    'BLK': 'blackrock.com', 'AXP': 'americanexpress.com', 'C': 'citigroup.com',
    'WFC': 'wellsfargo.com', 'MS': 'morganstanley.com',
    'SPG': 'simon.com', 'PLD': 'prologis.com', 'AMT': 'americantower.com',
    'EQIX': 'equinix.com', 'O': 'realtvstock.com', 'PSA': 'publicstorage.com',
    'CCI': 'crowncastle.com', 'DLR': 'digitalrealty.com', 'VICI': 'vicivp.com',
    'WBD': 'warnerbrosdiscovery.com', 'PARA': 'paramount.com', 'FOX': 'fox.com',
    'T': 'att.com', 'VZ': 'verizon.com', 'TMUS': 't-mobile.com',
    'TGT': 'target.com', 'LOW': 'lowes.com', 'HD': 'homedepot.com',
    'DLTR': 'dollartree.com', 'TJX': 'tjx.com',
    'UPS': 'ups.com', 'FDX': 'fedex.com', 'DAL': 'delta.com',
    'DOW': 'dow.com',
    'BRK.B': 'berkshirehathaway.com',
    'SNAP': 'snap.com', 'PINS': 'pinterest.com', 'RIVN': 'rivian.com',
    'LCID': 'lucidmotors.com', 'NIO': 'nio.com', 'PLTR': 'palantir.com',
    'DKNG': 'draftkings.com', 'RBLX': 'roblox.com', 'SHOP': 'shopify.com',
    'SE': 'seagroup.com', 'GRAB': 'grab.com', 'HOOD': 'robinhood.com',
    'ROKU': 'roku.com', 'ZM': 'zoom.us', 'TEAM': 'atlassian.com',
    'CRWD': 'crowdstrike.com', 'PANW': 'paloaltonetworks.com',
    'MNDY': 'monday.com', 'DDOG': 'datadoghq.com', 'NET': 'cloudflare.com',
    'MDB': 'mongodb.com', 'HUBS': 'hubspot.com', 'TWLO': 'twilio.com',
    'OKTA': 'okta.com', 'ZS': 'zscaler.com', 'PATH': 'uipath.com',
    'AI': 'c3.ai', 'SOUN': 'soundhound.com',
  }

  // Crypto code mapping for CoinCap
  const cryptoMap: Record<string, string> = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'XRP': 'xrp', 'SOL': 'solana',
    'DOGE': 'dogecoin', 'ADA': 'cardano', 'AVAX': 'avalanche', 'DOT': 'polkadot',
    'LINK': 'chainlink', 'MATIC': 'polygon', 'BCH': 'bitcoin-cash', 'LTC': 'litecoin',
    'XLM': 'stellar', 'UNI': 'uniswap', 'AAVE': 'aave', 'SHIB': 'shiba-inu',
    'ATOM': 'cosmos', 'FIL': 'filecoin', 'NEAR': 'near-protocol', 'ALGO': 'algorand',
    'VET': 'vechain', 'SAND': 'the-sandbox', 'MANA': 'decentraland', 'AXS': 'axie-infinity',
    'THETA': 'theta', 'APT': 'aptos', 'ARB': 'arbitrum', 'OP': 'optimism',
    'IMX': 'immutable-x', 'INJ': 'injective', 'TIA': 'celestia', 'SEI': 'sei',
    'SUI': 'sui', 'PEPE': 'pepe', 'FTM': 'fantom', 'GRT': 'the-graph',
    'ENS': 'ethereum-name-service', 'LDO': 'lido-dao', 'RPL': 'rocket-pool',
    'STX': 'stacks',
  }

  // Forex flag mapping
  const forexFlags: Record<string, [string, string]> = {
    'EURUSD': ['eu', 'us'], 'GBPUSD': ['gb', 'us'], 'USDJPY': ['us', 'jp'],
    'AUDUSD': ['au', 'us'], 'USDCAD': ['us', 'ca'], 'NZDUSD': ['nz', 'us'],
    'USDCHF': ['us', 'ch'], 'EURGBP': ['eu', 'gb'], 'EURJPY': ['eu', 'jp'],
    'GBPJPY': ['gb', 'jp'], 'AUDJPY': ['au', 'jp'], 'EURAUD': ['eu', 'au'],
    'GBPAUD': ['gb', 'au'], 'EURNZD': ['eu', 'nz'], 'GBPCAD': ['gb', 'ca'],
    'USDSGD': ['us', 'sg'], 'USDHKD': ['us', 'hk'], 'USDSEK': ['us', 'se'],
    'USDNOK': ['us', 'no'], 'USDDKK': ['us', 'dk'], 'USDZAR': ['us', 'za'],
    'USDTRY': ['us', 'tr'], 'USDMXN': ['us', 'mx'], 'USDPLN': ['us', 'pl'],
    'EURCHF': ['eu', 'ch'],
  }

  // Commodity icons
  const commodityIcons: Record<string, { emoji: string; bg: string }> = {
    'GOLD': { emoji: '🥇', bg: '#fbbf24' },
    'SILVER': { emoji: '🥈', bg: '#9ca3af' },
    'OIL': { emoji: '🛢️', bg: '#1f2937' },
    'NATGAS': { emoji: '🔥', bg: '#ef4444' },
    'COPPER': { emoji: '🔶', bg: '#b45309' },
    'PLATINUM': { emoji: '💍', bg: '#e5e7eb' },
    'PALLADIUM': { emoji: '💎', bg: '#a78bfa' },
    'WHEAT': { emoji: '🌾', bg: '#d97706' },
    'CORN': { emoji: '🌽', bg: '#eab308' },
    'SOYBEANS': { emoji: '🫘', bg: '#65a30d' },
    'SUGAR': { emoji: '🍬', bg: '#f9a8d4' },
    'COFFEE': { emoji: '☕', bg: '#78350f' },
    'COTTON': { emoji: '🧵', bg: '#f5f5f4' },
    'LUMBER': { emoji: '🪵', bg: '#a16207' },
    'RICE': { emoji: '🍚', bg: '#fef3c7' },
    'CACAO': { emoji: '🍫', bg: '#5c3317' },
    'RUBBER': { emoji: '⚫', bg: '#1f2937' },
    'IRON': { emoji: '🔩', bg: '#6b7280' },
  }

  // 1. Check crypto
  if (cryptoMap[code]) {
    return (
      <LogoWithFallback
        src={`https://assets.coincap.io/assets/icons/${code.toLowerCase()}@2x.png`}
        alt={code}
        size={size}
        code={code}
        className="rounded-full object-contain"
      />
    )
  }

  // 2. Check forex
  if (forexFlags[code]) {
    const [flag1, flag2] = forexFlags[code]
    return (
      <div className="flex items-center relative" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <img src={`https://flagcdn.com/w40/${flag1}.png`} alt={flag1} width={size * 0.65} height={size * 0.65} className="rounded-sm object-cover absolute left-0 top-0 border border-white/20"
          onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none' }} />
        <img src={`https://flagcdn.com/w40/${flag2}.png`} alt={flag2} width={size * 0.65} height={size * 0.65} className="rounded-sm object-cover absolute right-0 bottom-0 border border-white/20"
          onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none' }} />
        {/* Fallback if both flags fail */}
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-[8px] font-black text-[#3b82f6]">{code.slice(0, 3)}</span>
        </div>
      </div>
    )
  }

  // 3. Check commodity
  if (commodityIcons[code]) {
    const ci = commodityIcons[code]
    return (
      <div className="flex items-center justify-center rounded-full" style={{ width: size, height: size, minWidth: size, minHeight: size, background: ci.bg + '33', border: `1px solid ${ci.bg}55` }}>
        <span style={{ fontSize: size * 0.45 }}>{ci.emoji}</span>
      </div>
    )
  }

  // 4. Check stock
  if (stockDomains[code]) {
    return (
      <LogoWithFallback
        src={`https://www.google.com/s2/favicons?domain=${stockDomains[code]}&sz=64`}
        alt={code}
        size={size}
        code={code}
        className="rounded-lg object-contain bg-white/90 p-0.5"
      />
    )
  }

  // 5. Fallback: first letters
  return (
    <div className="flex items-center justify-center rounded-full bg-[#3b82f6]/15 border border-[#3b82f6]/30" style={{ width: size, height: size, minWidth: size, minHeight: size }}>
      <span className="text-[10px] font-black text-[#3b82f6]">{code.slice(0, 2)}</span>
    </div>
  )
}
