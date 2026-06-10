# Task ID: 2 - ZEVORIX Trading Platform - Tab Restructuring

## Agent: main

## Work Completed

### Bottom Navigation Changes
- Replaced: home, investasi, sinyal, saldo, more
- With: home, pasar_saham, sinyal, saldo (Saldo Live), profile (Profil)
- Removed 'more/Lainnya' tab and side menu trigger from bottom nav
- Changed activation logic: no special case for 'more', just setActiveTab(tab.key)

### Desktop Sidebar Changes
- Added pasar_saham (BarChart3) as first item after home
- Added investasi (Briefcase) as separate item
- Changed Portofolio icon from Briefcase to PieChart (to avoid icon duplication)
- Labels updated: "Saldo" → "Saldo Live"

### Side Menu Changes
- Added 'Pasar Saham' (key: pasar_saham) as separate item
- Added 'Saldo Live' (key: saldo)
- Added 'Investasi' (key: investasi) as separate item

### Tab Content Changes
- `activeTab === 'investasi'` → `activeTab === 'pasar_saham'` for stock market (IHSG chart, stock list)
- Created NEW `activeTab === 'investasi'` tab for contract products with:
  - Investasi & Kontrak header with gradient background
  - Category tabs (Starter, Growth, Premium)
  - Investment product cards with Beli button
  - Active stock contracts with progress bars and Klaim Profit
  - Active investments list with progress tracking
  - Empty state messaging

### Sinyal Tab - Remove Confirmation Dialog
- BELI/JUAL buttons now directly call openSinyalPosition('NAIK'/'TURUN')
- Removed Trade Confirmation Modal (~70 lines of JSX)
- Removed state variables: showConfirmTrade, confirmTradeDir

### Saldo Live Tab Updates
- Big "Saldo Live" display shows Rp0 when no active positions
- Color-coded: green (profitable), red (losing), dimmed white (no positions)
- Added account balance as separate badge
- Added empty state: "Belum ada posisi aktif. Buka posisi di Sinyal."
- Added "TUTUP POSISI" button to each active position card
- Fixed pos.entryPrice → pos.startPrice

### Navigation References Updated
- All `setActiveTab('investasi')` for stock market → `setActiveTab('pasar_saham')`
- Banner "Mulai Investasi" → "Pasar Saham"
- Wallet buttons → "Pasar Saham" with BarChart3 icon
- Quick access → key 'pasar_saham'
- Kept "INVESTASI PRO" banner → 'investasi' (contract products)

## Lint: 0 errors, 1 pre-existing warning
## Dev Server: No errors
