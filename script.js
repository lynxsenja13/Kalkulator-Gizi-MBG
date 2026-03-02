let bahanMaster = [];
let kategoriLibur = {};
let kategoriData = {};
let database = [];
let databaseLoaded = false;
let pendingNama = null;
let pendingBerat = null;

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
  document.getElementById("modalGizi").style.display = "none";
}

function simpanGizi() {
  const newItem = {
    "nama bahan": pendingNama.toLowerCase().trim(),
    "ENERGI": Number(mEnergi.value),
    "PROTEIN": Number(mProtein.value),
    "LEMAK": Number(mLemak.value),
    "KARBOHIDRAT": Number(mKarbo.value),
    "KALSIUM": Number(mKalsium.value),
    "SERAT": Number(mSerat.value)
  };

  const namaBaru = pendingNama;
  const beratBaru = pendingBerat;

  // ✅ simpan ke local database
  database.push(newItem);
  saveCache();

  // ✅ TAMBAHKAN KE SPREADSHEET (INI TEMPATNYA)
  fetch("https://script.google.com/macros/s/AKfycbzIzaaCT0IQtDCogdOzUs0zBUAYGiVshOK2oe8yPDcYQBTNbRfvrY6qwAyu81yZlNeM/exec", {
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
});
  .then(res => res.json())
  .then(res => console.log("Sync sukses:", res))
  .catch(err => console.error("Sync gagal:", err));

  // ✅ lanjut logic biasa
  bahanMaster.push({ nama: namaBaru, berat: beratBaru });

  kategoriList.forEach(k => {
    kategoriData[k].push({ nama: namaBaru, berat: beratBaru });
  });

  tutupModal();

  pendingNama = null;
  pendingBerat = null;

  renderList();
  generateLaporan();
}
// ================= TOGGLE LIBUR =================
function toggleLibur(kat, checked) {
  kategoriLibur[kat] = checked;
  generateLaporan();
}

const kategoriList = [
  "Balita",
  "Bumil & Busui",
  "SD 1-3",
  "SD 4-6",
  "SMP",
  "SMA"
];

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

// ================= LOAD DATABASE =================
async function loadDatabase() {
  try {
    const res = await fetch(API_URL);
    database = await res.json();
    databaseLoaded = true;

    console.log("Database loaded:", database.length);

    initKategori();
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
  kategoriList.forEach(k => {
    if (!kategoriData[k]) {
      kategoriData[k] = [];
    }
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

  if (!nama || !berat) return;

  const namaFix = nama.toLowerCase().trim();

  // cek database
  let db = database.find(d =>
    String(d["nama bahan"] || d["NAMA BAHAN"])
      .toLowerCase()
      .trim() === namaFix
  );

  // ❗ JIKA BELUM ADA → MUNCUL MODAL
  if (!db) {
  pendingNama = namaFix;
  pendingBerat = berat;
  showModal(namaFix);
  return;
}

  // ✅ MASUKKAN DATA
  bahanMaster.push({ nama, berat });

  kategoriList.forEach(k => {
    kategoriData[k].push({ nama, berat });
  });

  renderList();

  document.getElementById("namaBahan").value = "";
  document.getElementById("beratBahan").value = "";
}
// ================= RENDER LIST =================
function renderList() {
  const ul = document.getElementById("listBahan");
  ul.innerHTML = "";

  bahanMaster.forEach(b => {
    ul.innerHTML += `<li>${b.nama} - ${b.berat} g</li>`;
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
  String(d["nama bahan"] || d["NAMA BAHAN"])
    .toLowerCase()
    .trim() === item.nama.toLowerCase().trim()
);

    if (!db) {
  console.warn("Belum ada gizi:", item.nama);
  return;
}

    total.Energi += (item.berat / 100) * Number(db["ENERGI"] ?? db["energi"] ?? 0);
    total.Protein += (item.berat / 100) * Number(db["PROTEIN"] ?? db["protein"] ?? 0);
    total.Lemak += (item.berat / 100) * Number(db["LEMAK"] ?? db["lemak"] ?? 0);
    total.Karbohidrat += (item.berat / 100) * Number(db["KARBOHIDRAT"] ?? db["karbohidrat"] ?? 0);
    total.Kalsium += (item.berat / 100) * Number(db["KALSIUM"] ?? db["kalsium"] ?? 0);
    total.Serat += (item.berat / 100) * Number(db["SERAT"] ?? db["serat"] ?? 0);
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

  kategoriList.forEach(kat => {
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
    const total = hitungTotal(kategoriData[kat]);

    // 🔥 DETAIL PER BAHAN
    const detailBahan = kategoriData[kat].map(item => {
      const db = database.find(d =>
  String(d["nama bahan"] || d["NAMA BAHAN"])
    .toLowerCase()
    .trim() === item.nama.toLowerCase().trim()
);

      if (!db) {
        return {
          nama: item.nama,
          berat: item.berat,
          energi: 0,
          protein: 0,
          lemak: 0,
          karbo: 0,
          kalsium: 0,
          serat: 0
        };
      }

      return {
        nama: item.nama,
        berat: item.berat,
        energi: (item.berat / 100) * Number(db["ENERGI"] ?? db["energi"] ?? 0),
        protein: (item.berat / 100) * Number(db["PROTEIN"] ?? db["protein"] ?? 0),
        lemak: (item.berat / 100) * Number(db["LEMAK"] ?? db["lemak"] ?? 0),
        karbo: (item.berat / 100) * Number(db["KARBOHIDRAT"] ?? db["karbohidrat"] ?? 0),
        kalsium: (item.berat / 100) * Number(db["KALSIUM"] ?? db["kalsium"] ?? 0),
        serat: (item.berat / 100) * Number(db["SERAT"] ?? db["serat"] ?? 0)
      };
    });

    // ✅⬅️ TAMBAHKAN DI SINI (SETELAH MAP)
    hasilDiv.innerHTML += `
  <div class="kategori-card">
    
    <div class="kategori-header">
      <h3>${kat}</h3>

      <label class="libur-switch">
        <input type="checkbox"
          ${kategoriLibur[kat] ? "checked" : ""}
          onchange="toggleLibur('${kat}', this.checked)">
        <span>Libur</span>
      </label>
    </div>

    ${renderEditableList(kat)}

    ${renderTabelKategori(kat, detailBahan, {
      energi: AKG[kat].Energi,
      protein: AKG[kat].Protein,
      lemak: AKG[kat].Lemak,
      karbo: AKG[kat].Karbohidrat,
      kalsium: AKG[kat].Kalsium,
      serat: AKG[kat].Serat
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
  return kategoriData[kat]
    .map(
      (b, i) => `
    <div style="display:flex; gap:6px; margin:4px 0;">
      <span style="flex:1">${b.nama}</span>
      <input type="number"
        value="${b.berat}"
        style="width:80px"
        onchange="editBerat('${kat}', ${i}, this.value)">
    </div>
  `
    )
    .join("");
}

function editBerat(kat, index, value) {
  kategoriData[kat][index].berat = parseFloat(value) || 0;
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
      .map(d => d["nama bahan"] || d["NAMA BAHAN"])
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
// ================= STARTUP =================
if (!loadCache()) {
  loadDatabase();
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
