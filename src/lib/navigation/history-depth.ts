// Ngelacak berapa entri history yang dibikin DI DALAM app ini, biar tombol
// "Kembali" tau apakah router.back() aman.
//
// Kenapa cuma hitungan, bukan daftar route: history stack browser udah nyimpen
// route-nya dengan bener, termasuk urutan multi-level dan posisi scroll. Satu-
// satunya yang app nggak tau adalah "stack-ku ada isinya nggak" — dan itu satu
// integer. Nyimpen daftar route sendiri berarti nulis ulang history browser,
// dan versi satu-slot ("halaman sebelumnya apa") malah bikin bolak-balik antara
// dua halaman tanpa pernah naik ke atasnya.
//
// State-nya sengaja variabel level-modul, BUKAN sessionStorage. Umurnya harus
// habis pas dokumen di-load ulang: reload, deep link, QR, bookmark — semuanya
// mulai dengan stack kosong. sessionStorage justru selamat dari reload dan
// bakal ngasih jawaban bohong.

let depth = 0
let pendingPop = false
let pendingReplace = false

export function notifyPopState(): void {
  pendingPop = true
}

// Wajib dipanggil sebelum router.replace(). replace nukar entri yang sekarang,
// nggak nambah entri baru — tanpa penanda ini perubahan pathname-nya kebaca
// sebagai navigasi maju dan depth kelebihan hitung.
export function notifyRouteReplaced(): void {
  pendingReplace = true
}

export function notifyPathnameChanged(): void {
  if (pendingReplace) {
    pendingReplace = false
    pendingPop = false
    return
  }

  if (pendingPop) {
    pendingPop = false
    // Clamp di 0: back-lalu-forward ngirim dua popstate dan kita nggak bisa
    // bedain arahnya tanpa nyimpen state per-entri. Kebablasan turun bikin
    // depth negatif, dan negatif berarti canGoBack() ngaco untuk seterusnya.
    // Nge-clamp bikin kasus itu jatuh ke href parent — arah bisa meleset,
    // tapi nggak pernah keluar dari app.
    depth = Math.max(0, depth - 1)
    return
  }

  depth += 1
}

export function canGoBack(): boolean {
  return depth > 0
}

// Cuma buat test — produksi nggak boleh manggil ini.
export function resetHistoryDepthForTest(): void {
  depth = 0
  pendingPop = false
  pendingReplace = false
}
