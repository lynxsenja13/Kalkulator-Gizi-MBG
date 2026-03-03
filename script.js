let bahanMaster = {
  OMPRENGAN: [],
  SNACK: []
};

let modeMenu = "OMPRENGAN";
let kategoriLibur = {};
let kategoriData = {
  OMPRENGAN: {},
  SNACK: {}
};
let database = [];
let databaseLoaded = false;
let pendingNama = null;
let pendingBerat = null;
let modeKategori = "SEMUA";
let menuHarian = [""]; // mulai 1 baris
let liburLaporan = {};

// ================= DATA PENERIMA =================
const PENERIMA_DEFAULT = {
  "BALITA": 211,
  "BUMIL & BUSUI": 125,
  "SD YAS": 186,
  "SMP YAS": 630,
  "SMA YAS": 534,
  "SDN Awi Gombong": 1015,
  "Guru & Tendik SD YAS": 17,
  "Guru & Tendik SMP YAS": 35,
  "Guru & Tendik SMA YAS": 37,
  "Guru & Tendik SD Awi Gombong": 62,
  "PIC POSYANDU": 5
};

function setModeMenu(menu) {
  modeMenu = menu;

  document.getElementById("btnOmprengan").classList.remove("active-omprengan");
  document.getElementById("btnSnack").classList.remove("active-snack");

  if (menu === "OMPRENGAN") {
    document.getElementById("btnOmprengan").classList.add("active-omprengan");
  } else {
    document.getElementById("btnSnack").classList.add("active-snack");
  }

  renderDropdownKategori(); // 🔥 TAMBAHKAN INI

  renderList();
  generateLaporan();
}

function getNamaBahan(obj) {
  const key = Object.keys(obj).find(k =>
    k.toLowerCase().replace(/\s/g, "") === "namabahan"
  );
  return key ? String(obj[key]).toLowerCase().trim() : "";
}

function setModeKategori(value) {
  modeKategori = value;
}

// =====================
// MODAL FUNCTION
// =====================
function showModal(nama) {
  pendingNama = nama;

  document.getElementById("modalTitle").innerText =
    "Tambah Gizi: " + nama;

  document.getElementById("modalGizi").style.display = "flex";

  setTimeout(() => {
    document.getElementById("mEnergi").focus();
  }, 100);
}

function tutupModal() {
  const modal = document.getElementById("modalGizi");
  modal.style.opacity = "0";

  setTimeout(() => {
    modal.style.display = "none";
    modal.style.opacity = "1";
  }, 200);
}

window.addEventListener("DOMContentLoaded", function() {
  const modal = document.getElementById("modalGizi");
  if (modal) {
    modal.addEventListener("click", function(e) {
      if (e.target === this) {
        tutupModal();
      }
    });
  }
});

function simpanGizi() {
  const btn = document.querySelector(".btn-save");
  btn.innerText = "Menyimpan...";
  btn.disabled = true;
  const newItem = {
  "nama bahan": pendingNama.toLowerCase().trim(),
  ENERGI: Number(document.getElementById("mEnergi").value) || 0,
  PROTEIN: Number(document.getElementById("mProtein").value) || 0,
  LEMAK: Number(document.getElementById("mLemak").value) || 0,
  KARBOHIDRAT: Number(document.getElementById("mKarbo").value) || 0,
  KALSIUM: Number(document.getElementById("mKalsium").value) || 0,
  SERAT: Number(document.getElementById("mSerat").value) || 0
};

  const namaBaru = pendingNama;
  const beratBaru = pendingBerat;

  // ✅ simpan ke local database
  database.push(newItem);
  database = [...database]; // trigger refresh reference
  saveCache();

  // ✅ TAMBAHKAN KE SPREADSHEET (INI TEMPATNYA)
  fetch(API_URL, {
  method: "POST",
  body: JSON.stringify({
    nama: newItem["nama bahan"],
    ENERGI: newItem.ENERGI,
    PROTEIN: newItem.PROTEIN,
    LEMAK: newItem.LEMAK,
    KARBOHIDRAT: newItem.KARBOHIDRAT,
    KALSIUM: newItem.KALSIUM,
    SERAT: newItem.SERAT
  })
})
.then(res => res.json())
.then(res => console.log("Sync sukses:", res))
.catch(err => console.error("Sync gagal:", err));

// ✅ lanjut logic biasa
bahanMaster[modeMenu].push({ nama: namaBaru, berat: beratBaru });

if (modeKategori === "SEMUA") {

  getKategoriAktif().forEach(k => {
    kategoriData[modeMenu][k].push({ nama: namaBaru, berat: beratBaru });
  });

} else {

  kategoriData[modeMenu][modeKategori].push({ nama: namaBaru, berat: beratBaru });

}

tutupModal();

pendingNama = null;
pendingBerat = null;

renderList();
generateLaporan();
initAutocomplete();

// ❌ HAPUS loadDatabase()
}
// ================= TOGGLE LIBUR =================
function toggleLibur(kat, checked) {
  kategoriLibur[kat] = checked;
  generateLaporan();
}

const kategoriOmprengan = [
  "Balita",
  "Bumil & Busui",
  "SD 1-3",
  "SD 4-6",
  "SMP",
  "SMA"
];

const kategoriSnack = [
  "Balita",
  "Bumil & Busui",
  "Keringan Sekolah Kecil",
  "Keringan Sekolah Besar"
];

function getKategoriAktif() {
  return modeMenu === "OMPRENGAN"
    ? kategoriOmprengan
    : kategoriSnack;
}

function renderDropdownKategori() {
  const select = document.getElementById("pilihKategori");
  if (!select) return;

  const kategoriAktif = getKategoriAktif();

  select.innerHTML = `<option value="SEMUA">Semua Kategori</option>`;

  kategoriAktif.forEach(kat => {
    select.innerHTML += `<option value="${kat}">${kat}</option>`;
  });

  modeKategori = "SEMUA"; // reset pilihan
}

// ================= AKG TARGET =================
const AKG = {
  "Balita": {
    Energi: 343.75,
    Protein: 5.75,
    Lemak: 12,
    Karbohidrat: 54.5,
    Kalsium: 206.25,
    Serat: 5
  },

  "Bumil & Busui": {
    Energi: 712.5,
    Protein: 21,
    Lemak: 23.4,
    Karbohidrat: 105,
    Kalsium: 360,
    Serat: 9.9
  },

  "SD 1-3": {
    Energi: 412.5,
    Protein: 10,
    Lemak: 13.75,
    Karbohidrat: 62.5,
    Kalsium: 250,
    Serat: 5.75
  },

  "SD 4-6": {
    Energi: 585,
    Protein: 15.9,
    Lemak: 19.5,
    Karbohidrat: 87,
    Kalsium: 360,
    Serat: 8.1
  },

  "SMP": {
    Energi: 667.5,
    Protein: 20.4,
    Lemak: 22.5,
    Karbohidrat: 97.5,
    Kalsium: 360,
    Serat: 9.6
  },

  "SMA": {
    Energi: 712.5,
    Protein: 21,
    Lemak: 23.4,
    Karbohidrat: 105,
    Kalsium: 360,
    Serat: 9.9
  }
};

// ================= MAPPING AKG SNACK =================
AKG["Keringan Sekolah Kecil"] = AKG["SD 1-3"];
AKG["Keringan Sekolah Besar"] = AKG["SMP"];

// ================= LOAD DATABASE =================
async function loadDatabase() {
  try {
    const res = await fetch(API_URL);
    database = await res.json();
    databaseLoaded = true;

    console.log("Database loaded:", database.length);

    initKategori();
    renderDropdownKategori();
    initAutocomplete(); // ✅ di sini
    saveCache();        // ✅ di sini

  } catch (err) {
    console.error("Gagal load database:", err);
    alert("Database gagal dimuat. Cek Apps Script.");
  }
}

function resetCache() {
  localStorage.removeItem("dbGizi");
  location.reload();
}

// ================= INIT KATEGORI =================
function initKategori() {
  ["OMPRENGAN", "SNACK"].forEach(menu => {
    const list = menu === "OMPRENGAN"
      ? kategoriOmprengan
      : kategoriSnack;

    list.forEach(k => {
      if (!kategoriData[menu][k]) {
        kategoriData[menu][k] = [];
      }
    });
  });
}

// ================= CACHE =================
function saveCache() {
  localStorage.setItem("dbGizi", JSON.stringify(database));
}

function loadCache() {
  const cache = localStorage.getItem("dbGizi");
  if (cache) {
    database = JSON.parse(cache);
    databaseLoaded = true;
    initKategori();
    renderDropdownKategori();
    initAutocomplete();
    console.log("Database dari cache");
    return true; // 🔥 penting
  }
  return false;
}

// ================= TAMBAH BAHAN =================
function tambahBahan() {
  if (!databaseLoaded) {
    alert("Tunggu database selesai load dulu");
    return;
  }

  const nama = document.getElementById("namaBahan").value.trim();
  const berat = parseFloat(document.getElementById("beratBahan").value);
  const satuan = document.getElementById("satuanBahan").value;

  if (!nama || !berat) return;

  const namaFix = nama.trim().toLowerCase();

let db = database.find(d =>
  getNamaBahan(d) === namaFix
);


  // ❗ JIKA BELUM ADA → MUNCUL MODAL
  if (!db) {
  pendingNama = namaFix;
  pendingBerat = berat;
  showModal(namaFix);
  return;
}

  // ✅ MASUKKAN DATA
  bahanMaster[modeMenu].push({ 
  nama: nama.trim(),
  berat,
  satuan
});

  if (modeKategori === "SEMUA") {

  getKategoriAktif().forEach(k => {
    kategoriData[modeMenu][k].push({ nama: nama.trim(), berat, satuan });
  });

} else {

  kategoriData[modeMenu][modeKategori].push({ nama: nama.trim(), berat, satuan });

}

  renderList();

  document.getElementById("namaBahan").value = "";
  document.getElementById("beratBahan").value = "";
}
// ================= RENDER LIST =================
function renderList() {
  const ul = document.getElementById("listBahan");
  ul.innerHTML = "";

  bahanMaster[modeMenu].forEach(b => {
    ul.innerHTML += `<li>${b.nama} - ${b.berat} ${b.satuan === "GRAM" ? "g" : "pcs"}</li>`;
  });
}

// ================= HITUNG TOTAL =================
function hitungTotal(list) {
  let total = {
    Energi: 0,
    Protein: 0,
    Lemak: 0,
    Karbohidrat: 0,
    Kalsium: 0,
    Serat: 0
  };

  list.forEach(item => {

    const db = database.find(d =>
  getNamaBahan(d) === item.nama.toLowerCase().trim()
);

    if (!db) return;

    let faktor = 0;

    if (item.satuan === "GRAM") {
      faktor = item.berat / 100;
    } else {
      faktor = item.berat;
    }

    total.Energi += faktor * Number(db["ENERGI"] ?? db["energi"] ?? 0);
    total.Protein += faktor * Number(db["PROTEIN"] ?? db["protein"] ?? 0);
    total.Lemak += faktor * Number(db["LEMAK"] ?? db["lemak"] ?? 0);
    total.Karbohidrat += faktor * Number(db["KARBOHIDRAT"] ?? db["karbohidrat"] ?? 0);
    total.Kalsium += faktor * Number(db["KALSIUM"] ?? db["kalsium"] ?? 0);
    total.Serat += faktor * Number(db["SERAT"] ?? db["serat"] ?? 0);

  });

  return total;
}

function renderTabelKategori(namaKategori, dataBahan, standar) {
  let total = {
    energi: 0,
    protein: 0,
    lemak: 0,
    karbo: 0,
    kalsium: 0,
    serat: 0
  };

  let html = `
    <table class="tabel-gizi">
      <thead>
        <tr>
          <th>Nama Bahan</th>
          <th>Berat (g)</th>
          <th>Energi</th>
          <th>Protein</th>
          <th>Lemak</th>
          <th>Karbo</th>
          <th>Kalsium</th>
          <th>Serat</th>
        </tr>
      </thead>
      <tbody>
  `;

  dataBahan.forEach(item => {
    total.energi += item.energi;
    total.protein += item.protein;
    total.lemak += item.lemak;
    total.karbo += item.karbo;
    total.kalsium += item.kalsium;
    total.serat += item.serat;

    html += `
      <tr>
        <td>${item.nama}</td>
        <td>${item.berat}</td>
        <td>${item.energi.toFixed(1)}</td>
        <td>${item.protein.toFixed(1)}</td>
        <td>${item.lemak.toFixed(1)}</td>
        <td>${item.karbo.toFixed(1)}</td>
        <td>${item.kalsium.toFixed(1)}</td>
        <td>${item.serat.toFixed(1)}</td>
      </tr>
    `;
  });

  // cek kecukupan
  const cukup =
    total.energi >= standar.energi &&
    total.protein >= standar.protein &&
    total.lemak >= standar.lemak &&
    total.karbo >= standar.karbo &&
    total.kalsium >= standar.kalsium &&
    total.serat >= standar.serat;

  html += `
<tr class="total-row">
  <td colspan="2"><b>TOTAL</b></td>

  <td class="${total.energi >= standar.energi ? 'total-ok' : 'total-bad'}">
    <b>${total.energi.toFixed(1)}</b>
  </td>

  <td class="${total.protein >= standar.protein ? 'total-ok' : 'total-bad'}">
    <b>${total.protein.toFixed(1)}</b>
  </td>

  <td class="${total.lemak >= standar.lemak ? 'total-ok' : 'total-bad'}">
    <b>${total.lemak.toFixed(1)}</b>
  </td>

  <td class="${total.karbo >= standar.karbo ? 'total-ok' : 'total-bad'}">
    <b>${total.karbo.toFixed(1)}</b>
  </td>

  <td class="${total.kalsium >= standar.kalsium ? 'total-ok' : 'total-bad'}">
    <b>${total.kalsium.toFixed(1)}</b>
  </td>

  <td class="${total.serat >= standar.serat ? 'total-ok' : 'total-bad'}">
    <b>${total.serat.toFixed(1)}</b>
  </td>
</tr>
`;

  return html;
}

function generateLaporan() {
  if (!databaseLoaded) {
    alert("Database masih loading...");
    return;
  }

  const hasilDiv = document.getElementById("hasil");
  hasilDiv.innerHTML = "";

  const listAktif = bahanMaster[modeMenu];

  getKategoriAktif().forEach(kat => {

  const isLibur = kategoriLibur[kat] || false;

    // ================= LIBUR =================
    if (isLibur) {
      hasilDiv.innerHTML += `
        <div class="kategori-card kategori-libur">
          <h3>${kat} Libur</h3>

          <div class="libur-toggle">
            <label>
              <input type="checkbox"
                     checked
                     onchange="toggleLibur('${kat}', this.checked)">
              Libur
            </label>
          </div>
        </div>
      `;
      return;
    }

    // ================= HITUNG =================
    const total = hitungTotal(
  kategoriData[modeMenu][kat].filter(item =>
    listAktif.some(b => b.nama === item.nama)
  )
);

    // 🔥 DETAIL PER BAHAN
    const detailBahan = kategoriData[modeMenu][kat].map(item => {

  const db = database.find(d =>
  String(getNamaBahan(d) ?? "")
    .toLowerCase()
    .trim() === item.nama.toLowerCase().trim()
);

  if (!db) {
    return {
      nama: item.nama,
      berat: item.berat,
      satuan: item.satuan,
      energi: 0,
      protein: 0,
      lemak: 0,
      karbo: 0,
      kalsium: 0,
      serat: 0
    };
  }

  let faktor = 0;

  if (item.satuan === "GRAM") {
    faktor = item.berat / 100;
  } else {
    faktor = item.berat;
  }

  return {
    nama: item.nama,
    berat: item.berat,
    satuan: item.satuan,
    energi: faktor * Number(db["ENERGI"] ?? db["energi"] ?? 0),
    protein: faktor * Number(db["PROTEIN"] ?? db["protein"] ?? 0),
    lemak: faktor * Number(db["LEMAK"] ?? db["lemak"] ?? 0),
    karbo: faktor * Number(db["KARBOHIDRAT"] ?? db["karbohidrat"] ?? 0),
    kalsium: faktor * Number(db["KALSIUM"] ?? db["kalsium"] ?? 0),
    serat: faktor * Number(db["SERAT"] ?? db["serat"] ?? 0)
  };

});

    // ✅ TAMBAHKAN DI SINI
const standar = AKG[kat] || {
  Energi: 0,
  Protein: 0,
  Lemak: 0,
  Karbohidrat: 0,
  Kalsium: 0,
  Serat: 0
};

    // ✅⬅️ TAMBAHKAN DI SINI (SETELAH MAP)
    hasilDiv.innerHTML += `
  <div class="kategori-card">
    
    <div class="kategori-header">
  <h3>${kat}</h3>

  <div class="libur-ios-wrapper">
    <span class="label-libur">Libur</span>
    <label class="switch-ios">
      <input type="checkbox"
        ${kategoriLibur[kat] ? "checked" : ""}
        onchange="toggleLibur('${kat}', this.checked)">
      <span class="slider-ios"></span>
    </label>
  </div>
</div>

    ${renderEditableList(kat)}

    ${renderTabelKategori(kat, detailBahan, {
      energi: standar.Energi,
      protein: standar.Protein,
      lemak: standar.Lemak,
      karbo: standar.Karbohidrat,
      kalsium: standar.Kalsium,
      serat: standar.Serat
    })}
  </div>
`;
  });
}

function renderAKG(nutrien, total, kategori) {
  const nilai = total[nutrien] || 0;
  const target = AKG[kategori][nutrien] || 1;
  const persen = (nilai / target) * 100;

  return `
    <p>
      ${nutrien}: ${nilai.toFixed(1)}
      <span style="color:#2b7cff">
        (${persen.toFixed(1)}%)
      </span>
    </p>
  `;
}

// ================= EDITABLE BERAT =================
function renderEditableList(kat) {
  return kategoriData[modeMenu][kat]
    .map((b, i) => `
    <div style="display:flex; gap:6px; margin:4px 0; align-items:center;">
      <span style="flex:1">${b.nama}</span>

      <input
        type="number"
        value="${b.berat}"
        style="width:80px"
        onchange="editBerat('${kat}', ${i}, this.value)"
      >

      <span style="width:40px;text-align:center">
        ${b.satuan === "GRAM" ? "g" : "pcs"}
      </span>

      <button onclick="hapusBahan('${kat}', ${i})"
        style="background:#ef4444;color:white;border:none;padding:4px 8px;border-radius:6px;">
        ❌
      </button>
    </div>
  `).join("");
}
function editBerat(kat, index, value) {
  kategoriData[modeMenu][kat][index].berat = parseFloat(value) || 0;
  generateLaporan();
}

function hapusBahan(kat, index) {
  kategoriData[modeMenu][kat].splice(index, 1);
  generateLaporan();
}

// ================= AUTOCOMPLETE DROPDOWN =================
function initAutocomplete() {
  const input = document.getElementById("namaBahan");
  const dropdown = document.getElementById("autocomplete-list");

  if (!input || !dropdown) return;

  input.addEventListener("input", function () {
    const keyword = this.value.toLowerCase();
    dropdown.innerHTML = "";

    if (!keyword) {
      dropdown.style.display = "none";
      return;
    }

    const hasil = database
  .map(d => getNamaBahan(d))
  .filter(n => n && n.toLowerCase().includes(keyword))
  .slice(0, 10);

    hasil.forEach(nama => {
      const div = document.createElement("div");
      div.textContent = nama;

      div.onclick = () => {
        input.value = nama;
        dropdown.style.display = "none";
      };

      dropdown.appendChild(div);
    });

    dropdown.style.display = hasil.length ? "block" : "none";
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete-wrapper")) {
      dropdown.style.display = "none";
    }
  });
}

// ================= TABEL GIZI =================
function renderTabelGizi(total, kategori) {
  const nutrienList = [
    "Energi",
    "Protein",
    "Lemak",
    "Karbohidrat",
    "Kalsium",
    "Serat"
  ];

  const rows = nutrienList.map(nutrien => {
    const nilai = total[nutrien] || 0;
    const target = AKG[kategori][nutrien] || 1;
    const persen = (nilai / target) * 100;
    const statusClass = persen >= 100 ? "status-ok" : "status-low";

    return `
      <tr>
        <td>${nutrien}</td>
        <td>${nilai.toFixed(1)}</td>
        <td class="${statusClass}">
          ${persen.toFixed(1)}%
        </td>
      </tr>
    `;
  }).join("");

  return `
    <table class="table-gizi">
      <thead>
        <tr>
          <th>Nutrien</th>
          <th>Jumlah</th>
          <th>% AKG</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function formatTanggalFile() {
  const bulan = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  const now = new Date();

  const tgl = String(now.getDate()).padStart(2, "0");
  const namaBulan = bulan[now.getMonth()];
  const tahun = now.getFullYear();

  return `${tgl}_${namaBulan}_${tahun}`;
}

function formatTanggalIndonesia() {
  const hari = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const bulan = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  const now = new Date();

  return `${hari[now.getDay()]}, ${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;
}

function exportPDF() {

  const hasilHTML = document.getElementById("hasil").innerHTML;
  document.getElementById("hasilPDF").innerHTML = hasilHTML;

  const note = document.getElementById("note").value;
  document.getElementById("printNote").innerText = note || "-";

  const tanggal = getTanggalLengkap();
  document.getElementById("tanggalLaporan").innerText = tanggal;

  document.getElementById("jenisMenuLaporan").innerText =
  modeMenu;

  const element = document.getElementById("laporanPDF");
  element.style.display = "block";

  setTimeout(() => { // 🔥 kasih waktu render

    const opt = {
      margin: [5, 5, 5, 5],
      filename: `Laporan Gizi ${formatTanggalFile()}.pdf`,
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(opt).from(element).save().then(() => {
  element.style.display = "none";
});

  }, 300); // 🔥 delay 300ms
}

function getTanggalLengkap() {
  const now = new Date();

  const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal = now.getDate();
  const bulan = now.toLocaleDateString("id-ID", { month: "long" });
  const tahun = now.getFullYear();

  return `${hari}, ${tanggal} ${bulan} ${tahun}`;
}

function setJudulLaporan() {
  const tanggal = getTanggalLengkap();
  document.getElementById("tanggalLaporan").innerText = tanggal;
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") tutupModal();
});

window.onload = function () {
  if (!loadCache()) {
    loadDatabase(); // ambil dari spreadsheet kalau cache kosong
  } else {
    loadDatabase(); // tetap refresh background 🔥
  }
};

function hitungPenerimaFinal() {
  const data = { ...PENERIMA_DEFAULT };

  // mapping libur
  if (liburLaporan["Balita"]) {
    data["BALITA"] = 0;
    data["PIC POSYANDU"] = 0;
  }

  if (liburLaporan["Bumil & Busui"]) {
    data["BUMIL & BUSUI"] = 0;
  }

  if (liburLaporan["SD YAS"]) {
    data["SD YAS"] = 0;
    data["Guru & Tendik SD YAS"] = 0;
  }

  if (liburLaporan["SMP YAS"]) {
    data["SMP YAS"] = 0;
    data["Guru & Tendik SMP YAS"] = 0;
  }

  if (liburLaporan["SMA YAS"]) {
    data["SMA YAS"] = 0;
    data["Guru & Tendik SMA YAS"] = 0;
  }

  if (liburLaporan["SD Awi Gombong"]) {
    data["SDN Awi Gombong"] = 0;
    data["Guru & Tendik SD Awi Gombong"] = 0;
  }

  const total = Object.values(data).reduce((a,b)=>a+b,0);

  return { data, total };
}

function generateCaptionHarian() {
  const { data, total } = hitungPenerimaFinal();
  const tanggal = formatTanggalIndonesia();

  const menuList = menuHarian
    .filter(m => m.trim())
    .map((m,i)=>`${i+1}. ${m}`)
    .join("\n");

  const caption = `
Yth. Dandim 0618/Kota Bandung
Cc. Pasiter Kodim 0618/Kota Bandung

Selamat Pagi Komandan,
Izin melaporkan, pada hari ${tanggal} telah dilaksanakan kegiatan Pembagian Makan Bergizi Gratis operasional Unit SPPG Khusus/Hybrid.

A. SPPG : Yayasan Pangan Mandiri Barokah Dapur Cicadas 01
B. Lokasi : Jalan Brigjen Katamso RT. 10 RW. 13 Kel. Cicadas Kec. Cibeunying Kidul Kota Bandung.
C. Personel :
1. Kepala SPPG/No tlp : Tata Dhea Wimala/087892330960
2. Ahli Gizi/No tlp : Aliyah Khairunnisa Syafitri/089664825252
3. Akuntan/No tlp : Febrianto/082121312500
4. Jml Karyawan : 44

D. Jumlah penerima sebanyak ${total} orang.
1. BALITA = ${data["BALITA"]}
2. BUMIL & BUSUI = ${data["BUMIL & BUSUI"]}
3. SD YAS = ${data["SD YAS"]}
4. SMP YAS = ${data["SMP YAS"]}
5. SMA YAS = ${data["SMA YAS"]}
6. SDN Awi Gombong = ${data["SDN Awi Gombong"]}
7. Guru & Tendik SD YAS = ${data["Guru & Tendik SD YAS"]}
8. Guru & Tendik SMP YAS = ${data["Guru & Tendik SMP YAS"]}
9. Guru & Tendik SMA YAS = ${data["Guru & Tendik SMA YAS"]}
10. Guru & Tendik SD Awi Gombong = ${data["Guru & Tendik SD Awi Gombong"]}
11. PIC POSYANDU = ${data["PIC POSYANDU"]}

Jumlah makan : ${total} porsi.

E. Menu Makan hari ini ${tanggal}
${menuList}

Demikian kami laporkan.
Dokumentasi terlampir.
`;

  document.getElementById("captionOutput").value = caption.trim();

  const output = document.getElementById("captionOutput");
  if (output) {
    output.value = caption.trim();
    autoResizeTextarea(output);
  }
}

function toggleLiburLaporan(nama, checked) {
  liburLaporan[nama] = checked;
  generateCaptionHarian();
}

function tambahMenuHarian() {
  menuHarian.push("");
  renderMenuHarian();
}

function editMenuHarian(index, value) {
  menuHarian[index] = value;
  generateCaptionHarian();
}

function renderMenuHarian() {
  const wrap = document.getElementById("menuHarianWrap");
  if (!wrap) return;

  wrap.innerHTML = menuHarian.map((m,i)=>`
    <input
      type="text"
      value="${m}"
      placeholder="Nama menu"
      onchange="editMenuHarian(${i}, this.value)"
      style="margin-bottom:6px;width:100%;padding:8px;border-radius:8px;border:none;"
    >
  `).join("");
}

window.addEventListener("DOMContentLoaded", () => {
  renderMenuHarian();
});

function generateReport(jenis, kategori) {
  // simpan state
  window.generateJenis = jenis;
  window.generateKategori = kategori;

  // buka popup libur dulu
  document.getElementById("modalLibur").style.display = "flex";
}

function prosesGenerate() {
  const libur = {
    balita: document.getElementById("liburBalita").checked,
    bumil: document.getElementById("liburBumil").checked,
    sd: document.getElementById("liburSD").checked,
    smp: document.getElementById("liburSMP").checked,
    sma: document.getElementById("liburSMA").checked,
  };

  document.getElementById("modalLibur").style.display = "none";

  // 🔥 engine utama
  buatLaporan(
    window.generateJenis,
    window.generateKategori,
    libur
  );
}

/* ===============================
   TAB LEVEL 1
=================================*/
function setMainTab(tab) {
  document.getElementById("tabLaporan").classList.remove("active-tab");
  document.getElementById("tabCaption").classList.remove("active-tab");

  if (tab === "laporan") {
    document.getElementById("tabLaporan").classList.add("active-tab");
    document.getElementById("subTabLaporan").style.display = "flex";
  } else {
    document.getElementById("tabCaption").classList.add("active-tab");
    document.getElementById("subTabLaporan").style.display = "none";
  }
}

/* ===============================
   SUB TAB
=================================*/
function setSubTab(tab) {
  document.getElementById("btnLapHarian").classList.remove("active-subtab");
  document.getElementById("btnLapGizi").classList.remove("active-subtab");

  if (tab === "harian") {
    document.getElementById("btnLapHarian").classList.add("active-subtab");
  } else {
    document.getElementById("btnLapGizi").classList.add("active-subtab");
  }
}

function bukaModalLibur() {
  document.getElementById("modalLibur").style.display = "flex";
}

function tutupModalLibur() {
  document.getElementById("modalLibur").style.display = "none";
}

function prosesLaporanHarian() {

  const data = {
    balita: document.getElementById("libur_balita").checked ? 0 : 211,
    bumil: document.getElementById("libur_bumil").checked ? 0 : 125,
    sdyas: document.getElementById("libur_sdyas").checked ? 0 : 186,
    smpyas: document.getElementById("libur_smpyas").checked ? 0 : 630,
    smayas: document.getElementById("libur_smayas").checked ? 0 : 534,
    awig: document.getElementById("libur_awig").checked ? 0 : 1015,
    guru_sd: document.getElementById("libur_sdyas").checked ? 0 : 17,
    guru_smp: document.getElementById("libur_smpyas").checked ? 0 : 35,
    guru_sma: document.getElementById("libur_smayas").checked ? 0 : 37,
    guru_awig: document.getElementById("libur_awig").checked ? 0 : 62,
    pic: document.getElementById("libur_balita").checked ? 0 : 5,
  };

  const jumlahPenerima =
  (Number(d3) || 0) +
  (Number(d4) || 0) +
  (Number(d5) || 0) +
  (Number(d6) || 0);

  const totalPenerima =
    data.balita +
    data.bumil +
    data.sdyas +
    data.smpyas +
    data.smayas +
    data.awig +
    data.guru_sd +
    data.guru_smp +
    data.guru_sma +
    data.guru_awig +
    data.pic;

  const jumlahMakan = totalPenerima;

  generateCaptionHarian();

  tutupModalLibur();
}

function copyCaptionWA() {
  const el = document.getElementById("captionOutput");
  if (!el) return;

  const text = el.value;

  navigator.clipboard.writeText(text).then(() => {
    // feedback kecil
    const btn = document.querySelector(".btn-copy-wa");
    if (!btn) return;

    const oldText = btn.innerHTML;
    btn.innerHTML = "✅ Berhasil Disalin";

    setTimeout(() => {
      btn.innerHTML = oldText;
    }, 1500);
  }).catch(() => {
    alert("Gagal menyalin teks");
  });
}

function tambahMenuBaris() {
  menuHarian.push("");

  const container = document.getElementById("menuContainer");

  const input = document.createElement("input");
  input.type = "text";
  input.className = "input-menu";
  input.placeholder = `Nama menu ${menuHarian.length}`;

  input.oninput = (e) => {
    menuHarian[menuHarian.length - 1] = e.target.value;
  };

  // masukkan sebelum tombol
  const btn = container.querySelector(".btn-secondary");
  container.insertBefore(input, btn);
}

function prosesLaporan() {
  // =========================
  // AMBIL STATUS LIBUR
  // =========================
  const liburBalita = document.getElementById("liburBalita").checked;
  const liburSDAwi = document.getElementById("liburSDAwi").checked;
  const liburSDYas = document.getElementById("liburSDYas").checked;
  const liburSMPYas = document.getElementById("liburSMPYas").checked;
  const liburSMAYas = document.getElementById("liburSMAYas").checked;

  // =========================
  // ANGKA DEFAULT (UBAH JIKA PERLU)
  // =========================
  let D1 = liburBalita ? 0 : 211;
  let D2 = liburBalita ? 0 : 125;
  let D3 = liburSDYas ? 0 : 186;
  let D4 = liburSMPYas ? 0 : 630;
  let D5 = liburSMAYas ? 0 : 534;
  let D6 = liburSDAwi ? 0 : 1015;

  let D7 = liburSDYas ? 0 : 17;
  let D8 = liburSMPYas ? 0 : 35;
  let D9 = liburSMAYas ? 0 : 37;
  let D10 = liburSDAwi ? 0 : 62;
  let D11 = liburBalita ? 0 : 5;

  // =========================
  // TOTAL PENERIMA (POIN D)
  // =========================
  const totalPenerima =
    D1 + D2 + D3 + D4 + D5 + D6 + D7 + D8 + D9 + D10 + D11;

  const jumlahMakan = totalPenerima;

  // =========================
  // AMBIL MENU
  // =========================
  const menuList = ambilDaftarMenu();

  // =========================
  // FORMAT TANGGAL
  // =========================
  const today = new Date();
  const tanggalStr = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // =========================
  // BUAT TEKS LAPORAN
  // =========================
  const laporanText = `
Yth. Dandim 0618/Kota Bandung
Cc. Pasiter Kodim 0618/Kota Bandung

Selamat Pagi Komandan,
Izin melaporkan, pada hari ${tanggalStr} telah dilaksanakan kegiatan Pembagian Makan Bergizi Gratis operasional Unit SPPG Khusus/Hybrid.

A. SPPG : Yayasan Pangan Mandiri Barokah Dapur Cicadas 01
B. Lokasi : Jalan Brigjen Katamso RT. 10 RW. 13 Kel. Cicadas Kec. Cibeunying Kidul Kota Bandung.
C. Personel :
1. Kepala SPPG/No tlp : Tata Dhea Wimala/087892330960
2. Ahli Gizi/No tlp : Aliyah Khairunnisa Syafitri/089664825252
3. Akuntan/No tlp : Febrianto/082121312500
4. Jml Karyawan : 44

D. Jumlah penerima sebanyak ${jumlahPenerima} orang
1. BALITA = ${D1}
2. BUMIL & BUSUI = ${D2}
3. SD YAS = ${D3}
4. SMP YAS = ${D4}
5. SMA YAS = ${D5}
6. SDN Awi Gombong = ${D6}
7. Guru & Tendik SD YAS = ${D7}
8. Guru & Tendik SMP YAS = ${D8}
9. Guru & Tendik SMA YAS = ${D9}
10. Guru & Tendik SD Awi Gombong = ${D10}
11. PIC POSYANDU = ${D11}

Jumlah makan : ${jumlahMakan} porsi.

E. Menu Makan hari ini ${tanggalStr}
${menuList}

Demikian kami laporkan.
Dokumentasi terlampir.
`.trim();

  // tampilkan ke box
  document.getElementById("hasilLaporan").value = laporanText;

  // simpan global untuk copy WA
  window.lastLaporanText = laporanText;

  // tutup modal
  tutupModalLibur();
}

function ambilDaftarMenu() {
  const items = document.querySelectorAll(".menu-item-input");
  let teks = "";

  items.forEach((el, i) => {
    if (el.value.trim()) {
      teks += `${i + 1}. ${el.value.trim()}\n`;
    }
  });

  return teks || "-";
}

function copyLaporanWA() {
  if (!window.lastLaporanText) {
    alert("Generate laporan dulu");
    return;
  }

  navigator.clipboard.writeText(window.lastLaporanText);
  alert("Berhasil disalin untuk WhatsApp ✅");
}

function tambahMenuInput() {
  const container = document.getElementById("menuContainer");

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Nama menu";
  input.className = "menu-item-input";

  container.appendChild(input);
}

// ================= MODAL LIBUR =================
function bukaModalLibur() {
  const modal = document.getElementById("modalLibur");
  if (!modal) return;
  modal.style.display = "flex";
}

function tutupModalLibur() {
  const modal = document.getElementById("modalLibur");
  if (!modal) return;
  modal.style.display = "none";
}

// ================= PROSES LAPORAN HARIAN =================
function prosesLaporanHarian() {

  // ambil status libur dari toggle
  liburLaporan = {
    "Balita": document.getElementById("libur_balita")?.checked || false,
    "Bumil & Busui": document.getElementById("libur_bumil")?.checked || false,
    "SD YAS": document.getElementById("libur_sdyas")?.checked || false,
    "SMP YAS": document.getElementById("libur_smpyas")?.checked || false,
    "SMA YAS": document.getElementById("libur_smayas")?.checked || false,
    "SD Awi Gombong": document.getElementById("libur_awig")?.checked || false
  };

  // ambil menu harian dari input
  const inputs = document.querySelectorAll(".input-menu");
  menuHarian = [];

  inputs.forEach(inp => {
    menuHarian.push(inp.value.trim());
  });

  // tutup modal
  tutupModalLibur();

  // 🔥 generate caption otomatis
  generateCaptionHarian();

  // optional: scroll ke hasil
  document.getElementById("cardCreateLaporan")
    ?.scrollIntoView({ behavior: "smooth" });
}

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = (el.scrollHeight) + "px";
}
