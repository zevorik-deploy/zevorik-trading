#!/bin/bash
# Batch generate 97 missing stock logos using z-ai CLI
# Each logo: professional minimalist company logo on white background

OUTDIR="/home/z/my-project/public/stocks"
mkdir -p "$OUTDIR"

# Associative array of CODE -> "COMPANY_NAME"
declare -A STOCKS
STOCKS[ABT]="Abbott Laboratories"
STOCKS[TMO]="Thermo Fisher Scientific"
STOCKS[DHR]="Danaher Corporation"
STOCKS[ISRG]="Intuitive Surgical"
STOCKS[SYK]="Stryker Corporation"
STOCKS[BSX]="Boston Scientific"
STOCKS[EW]="Edwards Lifesciences"
STOCKS[GILD]="Gilead Sciences"
STOCKS[AMGN]="Amgen"
STOCKS[BIIB]="Biogen"
STOCKS[REGN]="Regeneron Pharmaceuticals"
STOCKS[MRNA]="Moderna"
STOCKS[VRTX]="Vertex Pharmaceuticals"
STOCKS[CVS]="CVS Health"
STOCKS[CI]="Cigna"
STOCKS[HUM]="Humana"
STOCKS[CNC]="Centene"
STOCKS[CL]="Colgate-Palmolive"
STOCKS[EL]="Estee Lauder"
STOCKS[PM]="Philip Morris International"
STOCKS[MO]="Altria Group"
STOCKS[LMT]="Lockheed Martin"
STOCKS[NOC]="Northrop Grumman"
STOCKS[RTX]="RTX Corporation"
STOCKS[GD]="General Dynamics"
STOCKS[FANG]="Diamondback Energy"
STOCKS[MPC]="Marathon Petroleum"
STOCKS[PSX]="Phillips 66"
STOCKS[OXY]="Occidental Petroleum"
STOCKS[EOG]="EOG Resources"
STOCKS[SNAP]="Snapchat"
STOCKS[PINS]="Pinterest"
STOCKS[RIVN]="Rivian Automotive"
STOCKS[LCID]="Lucid Motors"
STOCKS[NIO]="NIO Inc"
STOCKS[PLTR]="Palantir Technologies"
STOCKS[DKNG]="DraftKings"
STOCKS[RBLX]="Roblox"
STOCKS[SHOP]="Shopify"
STOCKS[SE]="Sea Limited"
STOCKS[GRAB]="Grab Holdings"
STOCKS[HOOD]="Robinhood Markets"
STOCKS[ROKU]="Roku"
STOCKS[ZM]="Zoom Video Communications"
STOCKS[TEAM]="Atlassian"
STOCKS[CRWD]="CrowdStrike"
STOCKS[PANW]="Palo Alto Networks"
STOCKS[MNDY]="monday.com"
STOCKS[DDOG]="Datadog"
STOCKS[NET]="Cloudflare"
STOCKS[MDB]="MongoDB"
STOCKS[HUBS]="HubSpot"
STOCKS[TWLO]="Twilio"
STOCKS[OKTA]="Okta"
STOCKS[ZS]="Zscaler"
STOCKS[PATH]="UiPath"
STOCKS[AI]="C3.ai"
STOCKS[SOUN]="SoundHound"
STOCKS[SCHW]="Charles Schwab"
STOCKS[BLK]="BlackRock"
STOCKS[AXP]="American Express"
STOCKS[C]="Citigroup"
STOCKS[MS]="Morgan Stanley"
STOCKS[SPG]="Simon Property Group"
STOCKS[PLD]="Prologis"
STOCKS[AMT]="American Tower"
STOCKS[EQIX]="Equinix"
STOCKS[O]="Realty Income"
STOCKS[PSA]="Public Storage"
STOCKS[CCI]="Crown Castle"
STOCKS[DLR]="Digital Realty"
STOCKS[VICI]="VICI Properties"
STOCKS[WBD]="Warner Bros Discovery"
STOCKS[PARA]="Paramount Global"
STOCKS[FOX]="Fox Corporation"
STOCKS[T]="AT&T"
STOCKS[VZ]="Verizon"
STOCKS[TMUS]="T-Mobile"
STOCKS[TGT]="Target Corporation"
STOCKS[LOW]="Lowe's"
STOCKS[HD]="Home Depot"
STOCKS[DLTR]="Dollar Tree"
STOCKS[TJX]="TJX Companies"
STOCKS[UPS]="UPS"
STOCKS[FDX]="FedEx"
STOCKS[DAL]="Delta Air Lines"
STOCKS[SAP]="SAP SE"
STOCKS[Z]="Zillow"
STOCKS[S]="Salesforce"
STOCKS[DASH]="DoorDash"
STOCKS[SPOT]="Spotify"
STOCKS[ABNB]="Airbnb"
STOCKS[BABA]="Alibaba Group"
STOCKS[ASML]="ASML Holding"
STOCKS[ARM]="ARM Holdings"
STOCKS[NU]="Nu Holdings Nubank"
STOCKS[SONY]="Sony Group"

# Priority order
PRIORITY_ORDER=(
  ABNB SPOT PLTR HOOD SNAP PINS SHOP RIVN NIO LCID
  AXP C MS SCHW BLK
  LMT NOC RTX GD
  TGT LOW HD UPS FDX
  T VZ TMUS
  ABT TMO DHR ISRG SYK BSX EW GILD AMGN BIIB REGN MRNA VRTX
  CVS CI HUM CNC CL EL PM MO
  FANG MPC PSX OXY EOG
  DKNG RBLX SE GRAB ROKU ZM TEAM
  CRWD PANW MNDY DDOG NET MDB HUBS TWLO OKTA ZS PATH AI SOUN
  SPG PLD AMT EQIX O PSA CCI DLR VICI
  WBD PARA FOX
  DLTR TJX DAL SAP Z S DASH BABA ASML ARM NU SONY
)

SUCCESS=0
FAIL=0
FAILED_CODES=()

for CODE in "${PRIORITY_ORDER[@]}"; do
  COMPANY="${STOCKS[$CODE]}"
  if [ -z "$COMPANY" ]; then
    echo "⚠️  No company name for $CODE, skipping"
    continue
  fi

  OUTPUT="$OUTDIR/${CODE}.png"
  
  # Skip if already exists and is valid (>1KB)
  if [ -f "$OUTPUT" ] && [ $(stat -c%s "$OUTPUT" 2>/dev/null || echo 0) -gt 1000 ]; then
    echo "✅ $CODE already exists, skipping"
    SUCCESS=$((SUCCESS+1))
    continue
  fi

  PROMPT="professional minimalist company logo icon for ${COMPANY}, clean flat design, white background, corporate brand identity, high quality, square format"
  
  echo "🎨 Generating $CODE: $COMPANY ..."
  
  if z-ai image --prompt "$PROMPT" --output "$OUTPUT" --size 1024x1024 2>&1; then
    # Verify file was created and is reasonable size
    if [ -f "$OUTPUT" ] && [ $(stat -c%s "$OUTPUT" 2>/dev/null || echo 0) -gt 1000 ]; then
      echo "✅ $CODE generated successfully ($(stat -c%s "$OUTPUT") bytes)"
      SUCCESS=$((SUCCESS+1))
    else
      echo "❌ $CODE output file missing or too small"
      FAIL=$((FAIL+1))
      FAILED_CODES+=("$CODE")
    fi
  else
    echo "❌ $CODE generation failed"
    FAIL=$((FAIL+1))
    FAILED_CODES+=("$CODE")
  fi
  
  # Small delay between requests to avoid rate limiting
  sleep 1
done

echo ""
echo "========================================"
echo "SUMMARY: $SUCCESS successful, $FAIL failed"
echo "========================================"

if [ ${#FAILED_CODES[@]} -gt 0 ]; then
  echo "Failed codes: ${FAILED_CODES[*]}"
  echo ""
  echo "Retrying failed generations..."
  for CODE in "${FAILED_CODES[@]}"; do
    COMPANY="${STOCKS[$CODE]}"
    OUTPUT="$OUTDIR/${CODE}.png"
    PROMPT="professional minimalist company logo icon for ${COMPANY}, clean flat design, white background, corporate brand identity, high quality, square format"
    
    echo "🔄 Retrying $CODE: $COMPANY ..."
    if z-ai image --prompt "$PROMPT" --output "$OUTPUT" --size 1024x1024 2>&1; then
      if [ -f "$OUTPUT" ] && [ $(stat -c%s "$OUTPUT" 2>/dev/null || echo 0) -gt 1000 ]; then
        echo "✅ $CODE retry successful"
      else
        echo "❌ $CODE retry still failed"
      fi
    else
      echo "❌ $CODE retry failed"
    fi
    sleep 2
  done
fi

echo ""
echo "Done! Final count of PNG files in $OUTDIR:"
ls -1 "$OUTDIR"/*.png 2>/dev/null | wc -l
