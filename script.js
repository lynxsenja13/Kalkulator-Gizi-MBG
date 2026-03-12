let bahanMaster = {
  OMPRENGAN: [],
  SNACK: []
};

// ✅ TAMBAHKAN INI
window.dataSpreadsheet = {
  OMPRENGAN: {
    gizi: {},
    detail: []
  },
  SNACK: {
    gizi: {},
    detail: []
  }
};

window.hasilGizi = {
  OMPRENGAN: {},
  SNACK: {}
};

const STATE = {
  modeMenu:"OMPRENGAN",
  modeKategori:"SEMUA",
  mainTab:"laporan",
  subTab:"harian",
  subTabCaption:"omprengan"
}

let autocompleteInitialized = false;
let modeMenu = "OMPRENGAN";
let kategoriLibur = {
  "Balita": false,
  "Bumil & Busui": false,
  "SD Awi Gombong": false,
  "SD YAS": false,
  "SMP YAS": false,
  "SMA YAS": false
};
let kategoriData = {
  OMPRENGAN: {},
  SNACK: {}
};

let database = [];
let databaseLoaded = false;
let pendingNama = null;
let pendingBerat = null;
let modeKategori = "SEMUA";
let menuHarian = [""];
let menuKategori = "semua";
let modeMenuLaporan = "semua"; 
let menuSemua = [""];
let menuBalita = [""];
let menuSekolah = [""];
let liburLaporan = {};
let subTabAktif = "harian"; // default
let mainTabAktif = "laporan";
let subTabCaptionAktif = "omprengan";

// ================= DATA PENERIMA =================
const PENERIMA_DEFAULT = {
  "BALITA": 211,
  "BUMIL & BUSUI": 125,

  "SD Awi Gombong": 1015,
  "SD YAS": 186,

  "SMP YAS": 630,
  "SMA YAS": 534,

  "Guru & Tendik SD Awi Gombong": 62,
  "Guru & Tendik SD YAS": 17,
  "Guru & Tendik SMP YAS": 35,
  "Guru & Tendik SMA YAS": 37,

  "PIC POSYANDU": 5
};

const KATEGORI_SEKOLAH = {
  SD_AWI: "SD Awi Gombong",
  SD_YAS: "SD YAS",
  SMP: "SMP YAS",
  SMA: "SMA YAS"
};

function setModeMenu(menu) {
  modeMenu = menu;

  renderKategori();

  document.getElementById("btnOmprengan").classList.remove("active-omprengan");
  document.getElementById("btnSnack").classList.remove("active-snack");

  if (menu === "OMPRENGAN") {
    document.getElementById("btnOmprengan").classList.add("active-omprengan");
  } else {
    document.getElementById("btnSnack").classList.add("active-snack");
  }

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
if (btn) {
  btn.innerText = "Menyimpan...";
  btn.disabled = true;
}
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
bahanMaster[modeMenu].push({ 
  nama: namaBaru, 
  berat: beratBaru,
  satuan: document.getElementById("satuanBahan")?.value || "GRAM"
});

const selected = ambilKategoriDipilih();

if (selected.includes("SEMUA") || selected.length === 0) {

  getKategoriAktif().forEach(k => {
    const berat = pendingBerat;
const satuan = document.getElementById("satuanBahan")?.value || "GRAM";

kategoriData[modeMenu][k].push({
  nama: namaBaru.trim(),
  berat,
  satuan
});
  });

} else {

  selected.forEach(k => {
  kategoriData[modeMenu][k].push({
    nama: namaBaru.trim(),
    berat,
    satuan
  });
});

}

tutupModal();

pendingNama = null;
pendingBerat = null;

renderList();
generateLaporan();
initAutocomplete();

// ❌ HAPUS loadDatabase()
}
function toggleLibur(kat, checked) {

  kategoriLibur[kat] = checked;
  window.kategoriLibur = kategoriLibur;

  if (kat === "SD Awi Gombong") {
    kategoriLibur["SD Awi Gombong"] = checked;
  }

  if (kat === "SD YAS") {
    kategoriLibur["SD YAS"] = checked;
  }

  if (kat === "SMP") {
    kategoriLibur["SMP"] = checked;
  }

  if (kat === "SMA") {
    kategoriLibur["SMA"] = checked;
  }

  /* TAMBAHKAN INI */
  syncLiburModal();

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
  "Keringan Porsi Kecil",
  "Keringan Porsi Besar"
];

function getKategoriAktif() {
  return modeMenu === "OMPRENGAN"
    ? kategoriOmprengan
    : kategoriSnack;
}

function renderKategori(){

const container = document.getElementById("kategoriCheckbox");
if(!container) return;

let kategori =
modeMenu === "SNACK"
? kategoriSnack
: kategoriOmprengan;

let html = "";

/* tombol semua */

html += `
<label class="kategori-chip semua">
<input type="checkbox" id="kategoriSemua" checked>
<span>Semua</span>
</label>
`;

/* kategori lain */

kategori.forEach(k=>{

html += `
<label class="kategori-chip">
<input type="checkbox" class="kategori-check" value="${k}">
<span>${k}</span>
</label>
`;

});

container.innerHTML = html;

initKategoriLogic();

}

function initKategoriLogic(){

const semua = document.getElementById("kategoriSemua");
const kategori = document.querySelectorAll(".kategori-check");

if(!semua) return;

/* default */
semua.checked = true;
kategori.forEach(k => k.checked = false);

/* klik semua */

semua.addEventListener("change", function(){

if(this.checked){
kategori.forEach(k => k.checked = false);
}

});

/* klik kategori lain */

kategori.forEach(k=>{

k.addEventListener("change", function(){

if(this.checked){
semua.checked = false;
}

const adaYangDipilih = [...kategori].some(cb => cb.checked);

if(!adaYangDipilih){
semua.checked = true;
}

});

});

}

function cekKategoriKosong(){

const kategori = document.querySelectorAll(".kategori-check:checked");
const semua = document.getElementById("kategoriSemua");

if(kategori.length === 0){
semua.checked = true;
}

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
AKG["Keringan Porsi Kecil"] = AKG["SD 1-3"];
AKG["Keringan Porsi Besar"] = AKG["SMP"];

// ================= LOAD DATABASE =================
async function loadDatabase() {
  try {

    console.log("Loading database dari API...");

    const res = await fetch(API_URL);

    database = await res.json();
    databaseLoaded = true;

    console.log("Database loaded:", database.length);

    initKategori();
    renderKategori();
    initAutocomplete();
    saveCache();

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

  if (!cache) return false;

  database = JSON.parse(cache);
  databaseLoaded = true;

  console.log("Database dari cache:", database.length);

  initKategori();
  renderKategori();
  initAutocomplete();

  return true;
}

// ================= TAMBAH BAHAN =================
function tambahBahan() {
  if (!databaseLoaded) {
    alert("Tunggu database selesai load dulu");
    return;
  }

  const nama = document.getElementById("namaBahan").value.trim();
  const berat = parseFloat(document.getElementById("beratBahan").value);
  const satuan = document.getElementById("satuanBahan").value.toUpperCase();

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
  nama: nama.trim().toLowerCase(),
  berat,
  satuan
});

  const selected = ambilKategoriDipilih();

if (selected.includes("SEMUA") || selected.length === 0) {

  getKategoriAktif().forEach(k => {
    kategoriData[modeMenu][k].push({
      nama: nama.trim(),
      berat,
      satuan
    });
  });

} else {

  selected.forEach(k => {
    if (!kategoriData[modeMenu][k]) {
      kategoriData[modeMenu][k] = [];
    }

    kategoriData[modeMenu][k].push({
      nama: nama.trim(),
      berat,
      satuan
    });
  });

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
    ul.innerHTML += `<li>${b.nama} - ${b.berat} ${formatSatuan(b.satuan)}</li>`;
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

function renderTabelKategori(menu, kat, dataBahan, standar) {

  // 🔧 PERBAIKAN ERROR
  if (!Array.isArray(dataBahan)) {
    console.warn("dataBahan bukan array:", dataBahan);
    dataBahan = [];
  }
  
  let total = {
    energi: 0,
    protein: 0,
    lemak: 0,
    karbo: 0,
    kalsium: 0,
    serat: 0
  };

  let html = `
  <div class="table-wrapper">
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

  html += `
    </tbody>
    </table>
  </div>
`;
  return html;
}

function generateLaporan() {

syncLiburModal();
  
  if (!databaseLoaded) {
    alert("Database masih loading...");
    return;
  }

  const hasilDiv = document.getElementById("hasil");
  hasilDiv.innerHTML = "";

  // 🔥 RESET DATA SEBELUM HITUNG
  window.dataSpreadsheet.OMPRENGAN.detail = [];
  window.dataSpreadsheet.SNACK.detail = [];
  window.dataSpreadsheet.OMPRENGAN.gizi = {};
  window.dataSpreadsheet.SNACK.gizi = {};

  // 🔥 RESET HASIL GIZI PER KATEGORI
  window.hasilGiziPerKategori = {
    OMPRENGAN: {},
    SNACK: {}
  };

  const semuaMenu = ["OMPRENGAN", "SNACK"];

  semuaMenu.forEach(menu => {

    const listAktif = bahanMaster[menu] || [];
    const kategoriList = menu === "OMPRENGAN" ? kategoriOmprengan : kategoriSnack;

    kategoriList.forEach(kat => {

      const isLibur = kategoriLibur[kat] || false;

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

      const dataKategori = kategoriData[menu][kat] || [];
      const dataAktif = dataKategori.filter(item =>
        listAktif.some(b => b.nama === item.nama)
      );

      const total = hitungTotal(dataAktif);

      // ================= SIMPAN GIZI UNTUK CAPTION =================
      const mapCaption = {
        "Balita": "balita",
        "Bumil & Busui": "bumil",
        "SD 1-3": "sd1_3",
        "SD 4-6": "sd4_6",
        "SMP": "smp",
        "SMA": "sma",
        "Keringan Porsi Kecil": "kecil",
        "Keringan Porsi Besar": "besar"
      };

      const keyCaption = mapCaption[kat];

      if (keyCaption) {
      window.hasilGizi[menu][keyCaption] = {
        energi: Number((total.Energi || 0).toFixed(2)),
        protein: Number((total.Protein || 0).toFixed(2)),
        lemak: Number((total.Lemak || 0).toFixed(2)),
        karbo: Number((total.Karbohidrat || 0).toFixed(2)),
        serat: Number((total.Serat || 0).toFixed(2))
      };
    }

      // ================= SIMPAN TOTAL GIZI KE SPREADSHEET =================
      const keyMap = {
        "Balita": menu === "OMPRENGAN" ? "omprengan_balita" : "snack_balita",
        "Bumil & Busui": menu === "OMPRENGAN" ? "omprengan_bumil" : "snack_bumil",
        "SD 1-3": "omprengan_sd1_3",
        "SD 4-6": "omprengan_sd4_6",
        "SMP": "omprengan_smp",
        "SMA": "omprengan_sma",
        "Keringan Porsi Kecil": "snack_kecil",
        "Keringan Porsi Besar": "snack_besar"
      };

      const key = keyMap[kat];

      if (key) {
        window.dataSpreadsheet[menu].gizi[key] = {
          energi: Number((total.Energi || 0).toFixed(2)),
          protein: Number((total.Protein || 0).toFixed(2)),
          lemak: Number((total.Lemak || 0).toFixed(2)),
          karbo: Number((total.Karbohidrat || 0).toFixed(2)),
          besi: 0,
          serat: Number((total.Serat || 0).toFixed(2))
        };
      }

      // ================= DETAIL PER BAHAN =================
      const detailBahan = dataAktif.map(item => {
        const db = database.find(d =>
          String(getNamaBahan(d) ?? "").toLowerCase().includes(item.nama.toLowerCase().trim())
        );

        let faktor = item.satuan === "GRAM" ? item.berat / 100 : item.berat;

        return {
          nama: item.nama,
          berat: item.berat,
          satuan: item.satuan,
          energi: db ? faktor * Number(db["ENERGI"] ?? db["energi"] ?? 0) : 0,
          protein: db ? faktor * Number(db["PROTEIN"] ?? db["protein"] ?? 0) : 0,
          lemak: db ? faktor * Number(db["LEMAK"] ?? db["lemak"] ?? 0) : 0,
          karbo: db ? faktor * Number(db["KARBOHIDRAT"] ?? db["karbohidrat"] ?? 0) : 0,
          kalsium: db ? faktor * Number(db["KALSIUM"] ?? db["kalsium"] ?? 0) : 0,
          serat: db ? faktor * Number(db["SERAT"] ?? db["serat"] ?? 0) : 0
        };
      });

      // ================= SIMPAN DETAIL =================
      detailBahan.forEach(b => {
        window.dataSpreadsheet[menu].detail.push({
          menu: menu,
          kategori: kat,
          nama: b.nama,
          berat: b.berat,
          satuan: b.satuan,
          energi: Number((b.energi || 0).toFixed(2)),
          protein: Number((b.protein || 0).toFixed(2)),
          lemak: Number((b.lemak || 0).toFixed(2)),
          karbo: Number((b.karbo || 0).toFixed(2)),
          kalsium: Number((b.kalsium || 0).toFixed(2)),
          serat: Number((b.serat || 0).toFixed(2))
        });
      });

      // ================= RENDER =================
      const standar = AKG[kat] || {
        Energi: 0, Protein: 0, Lemak: 0,
        Karbohidrat: 0, Kalsium: 0, Serat: 0
      };

      hasilDiv.innerHTML += `
        <div class="kategori-card">
          <div class="kategori-header">
            <h3>${kat}</h3>
            <div class="libur-ios-wrapper">
              <span class="label-libur">Libur</span>
              <label class="switch-ios">
                <input type="checkbox" ${kategoriLibur[kat] ? "checked" : ""} onchange="toggleLibur('${kat}', this.checked)">
                <span class="slider-ios"></span>
              </label>
            </div>
          </div>
          ${renderEditableList(menu, kat)}
          ${renderTabelKategori(menu, kat, detailBahan, {
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
function renderEditableList(menu, kat) {

  const list = kategoriData[menu][kat] || [];

  let html = `<div class="editable-list">`;

  list.forEach((item,i)=>{

    html += `
      <div class="bahan-row">

        <div class="bahan-nama">
          ${item.nama}
        </div>

        <div class="bahan-edit">

          <input
            type="number"
            value="${item.berat}"
            onchange="editBerat('${menu}','${kat}',${i},this.value)"
          >

          <span>${item.satuan}</span>

          <button
            class="btn-hapus"
            onclick="hapusBahan('${menu}','${kat}',${i})">
            ❌
          </button>

        </div>

      </div>
    `;

  });

  html += `</div>`;

  return html;
}

function editBerat(menu, kat, index, value) {
  kategoriData[menu][kat][index].berat = parseFloat(value) || 0;
  renderList();
  generateLaporan();
}

function hapusBahan(menu, kat, index) {
  const item = kategoriData[menu][kat][index];
  kategoriData[menu][kat].splice(index,1);
  generateLaporan();
}

// ================= AUTOCOMPLETE DROPDOWN =================
function initAutocomplete() {
  if (autocompleteInitialized) return;
  autocompleteInitialized = true;

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
      .filter(n => n && n.includes(keyword))
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

function exportPDF(){

  const laporan = document.getElementById("laporanPDF");

  // ===== tanggal =====
  document.getElementById("tanggalLaporan").innerText =
    formatTanggalIndonesia();

  const mode = modeMenu === "OMPRENGAN"
    ? "Menu Omprengan"
    : "Menu Snack";

  document.getElementById("jenisMenuLaporan").innerText = mode;

  // ===== clone hasil laporan =====
  const hasilAsli = document.getElementById("hasil");
  const clone = hasilAsli.cloneNode(true);

  // hapus elemen interaktif
  clone.querySelectorAll("input,button,.libur-ios-wrapper,.btn-hapus").forEach(el=>{
    el.remove();
  });

  document.getElementById("hasilPDF").innerHTML = clone.innerHTML;

  // ===== catatan =====
  document.getElementById("printNote").innerText =
    document.getElementById("note").value || "-";

  // tampilkan container
  laporan.style.display = "block";

  const opt = {
    margin: 10,
    filename: `Laporan Gizi ${formatTanggalFile()}.pdf`,
    html2canvas: {
      scale: 2,
      useCORS: true
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: {
      mode: ["css", "legacy"]
    }
  };

  setTimeout(() => {
    html2pdf().set(opt).from(laporan).save().then(()=>{
      laporan.style.display = "none";
    });
  }, 500);

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

  initKategori();
  renderKategori();

  // load cache dulu (biar cepat)
  loadCache();

  // selalu sync database terbaru
  loadDatabase();

};

function sdSemuaLibur() {
  return kategoriLibur["SD Awi Gombong"] && kategoriLibur["SD YAS"];
}

function hitungPenerimaFinal() {

  let data = {
    "BALITA": kategoriLibur["Balita"] ? 0 : 211,
    "BUMIL & BUSUI": kategoriLibur["Bumil & Busui"] ? 0 : 125,

    "SD Awi Gombong": kategoriLibur["SD Awi Gombong"] ? 0 : 1015,
    "SD YAS": kategoriLibur["SD YAS"] ? 0 : 186,

    "SMP YAS": kategoriLibur["SMP YAS"] ? 0 : 630,
    "SMA YAS": kategoriLibur["SMA YAS"] ? 0 : 534,

    "Guru & Tendik SD Awi Gombong": kategoriLibur["SD Awi Gombong"] ? 0 : 62,
    "Guru & Tendik SD YAS": kategoriLibur["SD YAS"] ? 0 : 17,

    "Guru & Tendik SMP YAS": kategoriLibur["SMP YAS"] ? 0 : 35,
    "Guru & Tendik SMA YAS": kategoriLibur["SMA YAS"] ? 0 : 37
  };

  let picPosyandu = 5;

  if (kategoriLibur["Balita"] && kategoriLibur["Bumil & Busui"]) {
    picPosyandu = 0;
  }

  data["PIC POSYANDU"] = picPosyandu;

  let total = Object.values(data).reduce((a,b)=>a+b,0);

  return { data, total };
}
function generateCaptionHarian() {
  const { data } = hitungPenerimaFinal();

// 🔥 TOTAL KHUSUS POIN D (HANYA D3–D6)
const totalD =
  (data["SD YAS"] || 0) +
  (data["SMP YAS"] || 0) +
  (data["SMA YAS"] || 0) +
  (data["SD Awi Gombong"] || 0);

// 🔥 TOTAL MAKAN (SEMUA)
const totalSemua = Object.values(data).reduce((a,b)=>a+b,0);
  const tanggal = formatTanggalIndonesia();

let menuList = ambilMenuUntukLaporan().join("\n");
  
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

D. Jumlah penerima sebanyak <b>${totalD}</b> orang.
1. BALITA = ${data["BALITA"]}
2. BUMIL & BUSUI = ${data["BUMIL & BUSUI"]}
3. SD YAS = ${data["SD YAS"]}
4. SMP YAS = ${data["SMP YAS"]}
5. SMA YAS = ${data["SMA YAS"]}
6. SDN Awi Gombong = ${data["SD Awi Gombong"]}
7. Guru & Tendik SD YAS = ${data["Guru & Tendik SD YAS"]}
8. Guru & Tendik SMP YAS = ${data["Guru & Tendik SMP YAS"]}
9. Guru & Tendik SMA YAS = ${data["Guru & Tendik SMA YAS"]}
10. Guru & Tendik SD Awi Gombong = ${data["Guru & Tendik SD Awi Gombong"]}
11. PIC POSYANDU = ${data["PIC POSYANDU"]}

Jumlah makan : <b>${totalSemua}</b> porsi.

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

  // 🔥 kalau input terakhir diisi → tambah baris baru otomatis
  if (index === menuHarian.length - 1 && value.trim() !== "") {
    menuHarian.push("");
    renderMenuHarian();
  }

  generateCaptionHarian();
}

function renderMenuHarian() {
  const container = document.getElementById("menuContainer");

if(modeMenuLaporan === "semua"){

container.innerHTML = `

<h3>Menu Untuk Semua</h3>

${menuSemua.map((menu,i)=>`
<input type="text"
value="${menu}"
placeholder="Menu ${i+1}"
oninput="menuSemua[${i}] = this.value; generateCaptionHarian()">
`).join("")}

<button onclick="menuSemua.push(''); renderMenuHarian()">
+ Tambah Menu
</button>

<br><br>

<button onclick="modeMenuLaporan='terpisah'; renderMenuHarian()">
Gunakan Menu B3 & Sekolah
</button>

`;

}

else{

container.innerHTML = `

<h3>Menu Balita, Bumil & Busui</h3>

${menuBalita.map((menu,i)=>`
<input type="text"
value="${menu}"
placeholder="Menu Balita ${i+1}"
oninput="menuBalita[${i}] = this.value; generateCaptionHarian()">
`).join("")}

<button onclick="menuBalita.push(''); renderMenuHarian()">
+ Tambah Menu Balita
</button>

<br><br>

<h3>Menu Sekolah</h3>

${menuSekolah.map((menu,i)=>`
<input type="text"
value="${menu}"
placeholder="Menu Sekolah ${i+1}"
oninput="menuSekolah[${i}] = this.value; generateCaptionHarian()">
`).join("")}

<button onclick="menuSekolah.push(''); renderMenuHarian()">
+ Tambah Menu Sekolah
</button>

<br><br>

<button onclick="modeMenuLaporan='semua'; renderMenuHarian()">
Gunakan Menu Universal
</button>
  `;
  }
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
  const dataLibur = {
    balita: document.getElementById("liburBalita").checked,
    bumil: document.getElementById("liburBumil").checked,
    sd: document.getElementById("liburSD").checked,
    smp: document.getElementById("liburSMP").checked,
    sma: document.getElementById("liburSMA").checked,
  };

  document.getElementById("modalLibur").style.display = "none";

  buatLaporan(
    window.generateJenis,
    window.generateKategori,
    dataLibur // 🔥 ikut diganti
  );
}

/* ===============================
   TAB LEVEL 1
=================================*/
function setMainTab(tab) {
  mainTabAktif = tab;

  // toggle tombol utama
  document.getElementById("tabLaporan")
    ?.classList.toggle("active-tab", tab === "laporan");

  document.getElementById("tabCaption")
    ?.classList.toggle("active-tab", tab === "caption");

  // 🔥 INI YANG PALING PENTING
  const subLap = document.getElementById("subTabLaporan");
  const subCap = document.getElementById("subTabCaption");

  if (tab === "caption") {
    if (subLap) subLap.style.display = "none";
    if (subCap) subCap.style.display = "flex";
  } else {
    if (subLap) subLap.style.display = "flex";
    if (subCap) subCap.style.display = "none";
  }
}

/* ===============================
   SUB TAB
=================================*/
function setSubTab(tab) {
  subTabAktif = tab;

  document
    .querySelectorAll("#subTabLaporan .btn-primary")
    .forEach(btn => btn.classList.remove("active-subtab"));

  if (tab === "harian") {
    document.getElementById("btnLapHarian").classList.add("active-subtab");
  } else {
    document.getElementById("btnLapGizi").classList.add("active-subtab");
  }
}

function copyCaptionWA() {
  const el = document.getElementById("captionOutput");
  if (!el) return;

  const text = el.value;

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(".btn-copy-wa");
    if (!btn) return;

    const oldText = btn.innerHTML;

    btn.innerHTML = "✅ Tersalin!";
    
    setTimeout(() => {
      btn.innerHTML = oldText;
    }, 2000);
  });
}

function prosesLaporan() {

  // 🔥 SYNC KE STATE UTAMA
  kategoriLibur["Balita"] = document.getElementById("liburBalita").checked;
  kategoriLibur["Bumil & Busui"] = document.getElementById("liburBumil").checked;
  kategoriLibur["SD 1-3"] = document.getElementById("liburSD").checked;
  kategoriLibur["SD 4-6"] = document.getElementById("liburSD").checked;
  kategoriLibur["SMP"] = document.getElementById("liburSMP").checked;
  kategoriLibur["SMA"] = document.getElementById("liburSMA").checked;

  window.kategoriLibur = kategoriLibur;

  // =========================
  // AMBIL STATUS LIBUR
  // =========================
  const liburBalita = document.getElementById("libur_balita").checked;
  const liburBumil = document.getElementById("libur_bumil").checked;
  const  liburAwi = document.getElementById("libur_awig").checked;
  const liburYas = document.getElementById("libur_sdyas").checked;
  const liburSMP = document.getElementById("libur_smpyas").checked;
  const liburSMA = document.getElementById("libur_smayas").checked;

  // =========================
  // ANGKA DEFAULT (UBAH JIKA PERLU)
  // =========================
  const { data, total } = hitungPenerimaFinal();

  let D1 = data["BALITA"];
  let D2 = data["BUMIL & BUSUI"];
  let D3 = data["SD YAS"];
  let D4 = data["SMP YAS"];
  let D5 = data["SMA YAS"];
  let D6 = data["SD Awi Gombong"];
  let D7 = data["Guru & Tendik SD YAS"];
  let D8 = data["Guru & Tendik SMP YAS"];
  let D9 = data["Guru & Tendik SMA YAS"];
  let  D10 = data["Guru & Tendik SD Awi Gombong"];
  let D11 = data["PIC POSYANDU"];

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

D. Jumlah penerima sebanyak ${totalPenerima} orang
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

  document.getElementById("libur_balita").checked = kategoriLibur["Balita"] || false;
  document.getElementById("libur_bumil").checked = kategoriLibur["Bumil & Busui"] || false;
  document.getElementById("libur_awig").checked = kategoriLibur["SD Awi Gombong"] || false;
  document.getElementById("libur_sdyas").checked = kategoriLibur["SD YAS"] || false;
  document.getElementById("libur_smpyas").checked = kategoriLibur["SMP YAS"] || false;
  document.getElementById("libur_smayas").checked = kategoriLibur["SMA YAS"] || false;

}

function tutupModalLibur() {
  const modal = document.getElementById("modalLibur");
  if (!modal) return;
  modal.style.display = "none";
}

// ================= PROSES LAPORAN HARIAN =================
function prosesLaporanHarian() {
  tutupModalLibur();

  // ✅ cek subtab aktif
  if (subTabAktif === "gizi") {
    generateLaporanGizi();
  } else {
    generateCaptionHarian();
  }

  const { data, total } = hitungPenerimaFinal();

    window.totalPenerima = total;
    window.jumlahMakan = total;

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

  // 🔥 kalau nanti mau dipakai, simpan global
  window.totalPenerima = totalPenerima;
  window.jumlahMakan = jumlahMakan;
}

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = (el.scrollHeight) + "px";
}

function generateLaporanGizi() {

generateLaporan();

let caption = "";

const liburData = window.kategoriLibur || {};

const libur = {
  balita: liburData["Balita"] || false,
  bumil: liburData["Bumil & Busui"] || false,
  sd: sdSemuaLibur(),
  smp: liburData["SMP YAS"] || false,
  sma: liburData["SMA YAS"] || false
};

const now = new Date();
const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
const tanggal = now.toLocaleDateString("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric"
});

const menuInputs = document.querySelectorAll("#menuContainer .input-menu");

let menuText = ambilMenuUntukLaporan().join("\n");

menuInputs.forEach((inp,i)=>{
if(inp.value.trim()){
menuText += `${i+1}. ${inp.value.trim()}\n`;
}
});

caption += `Assalamualaikum wr.wb, Selamat Pagi.
Izin menginformasikan, untuk menu hari ini.
Tanggal : ${hari}, ${tanggal}

Menu:
${menuText}
`;

const gizi = window.hasilGizi.OMPRENGAN || {};

if (!libur.balita)
caption += blokGizi("🥗 <b>Analisis Nilai Gizi Balita</b> 🥗", gizi.balita);

if (!libur.bumil)
caption += blokGizi("🥗 <b>Analisis Nilai Gizi Bumil & Busui</b> 🥗", gizi.bumil);

if (!libur.sd)
caption += blokGizi("🥗 <b>Analisis Nilai Gizi SD 1-3</b> 🥗", gizi.sd1_3);

if (!libur.sd)
caption += blokGizi("🥗 <b>Analisis Nilai Gizi SD 4-6</b> 🥗", gizi.sd4_6);

if (!libur.smp)
caption += blokGizi("🥗 <b>Analisis Nilai Gizi SMP</b> 🥗", gizi.smp);

if (!libur.sma)
caption += blokGizi("🥗 <b>Analisis Nilai Gizi SMA</b> 🥗", gizi.sma);

const outputBox = document.getElementById("captionOutput");
if (outputBox) outputBox.value = caption.trim();
}

function prosesGenerateLaporan() {

kategoriLibur["Balita"] = document.getElementById("libur_balita").checked;
  kategoriLibur["Bumil & Busui"] = document.getElementById("libur_bumil").checked;
  kategoriLibur["SD Awi Gombong"] = document.getElementById("libur_awig").checked;
  kategoriLibur["SD YAS"] = document.getElementById("libur_sdyas").checked;
  kategoriLibur["SMP YAS"] = document.getElementById("libur_smpyas").checked;
  kategoriLibur["SMA YAS"] = document.getElementById("libur_smayas").checked;

  tutupModalLibur();

  generateLaporan();
  if (mainTabAktif === "caption") {
    if (subTabCaptionAktif === "omprengan") {
      generateCaptionOmprengan();
    } else {
      generateCaptionSnack();
    }
    return;
  }

  // laporan biasa
  if (subTabAktif === "gizi") {
    generateLaporanGizi();
  } else {
    generateCaptionHarian();
  }
}

function setSubTabCaption(mode) {
  subTabCaptionAktif = mode;

  const btnOm = document.getElementById("btnCapOmprengan");
  const btnSn = document.getElementById("btnCapSnack");

  // reset semua
  btnOm?.classList.remove("active-subtab");
  btnSn?.classList.remove("active-subtab");

  // aktifkan yang dipilih
  if (mode === "omprengan") {
    btnOm?.classList.add("active-subtab");
  } else {
    btnSn?.classList.add("active-subtab");
  }
}

function generateCaptionOmprengan() {
generateLaporan(); // 🔥 refresh gizi dulu
  const now = new Date();
  const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // menu
  const menuInputs = document.querySelectorAll("#menuContainer .input-menu");
  let menuText = ambilMenuUntukLaporan().join("\n");

  menuInputs.forEach((inp) => {
    if (inp.value.trim()) {
      menuText += ` • ${inp.value.trim()}\n`;
    }
  });

  // libur dari sistemmu
  const kategoriLibur = window.kategoriLibur || {};
  
  const libur = {
  balita: kategoriLibur["Balita"] || false,
  bumil: kategoriLibur["Bumil & Busui"] || false,
  sd13: kategoriLibur["SD 1-3"] || false,
  sd46: kategoriLibur["SD 4-6"] || false,
  smp: kategoriLibur["SMP"] || false,
  sma: kategoriLibur["SMA"] || false
};
  
  const gizi = window.hasilGizi.OMPRENGAN || {};

  let caption = `🍱 Menu Bergizi Gratis
📅 ${hari}, ${tanggal}

🥗 Menu:
${menuText}

⚖️ Kandungan Gizi (per porsi):
`;

  if (!libur.balita)
  caption += blokGizi("Analisis Nilai Gizi Balita", gizi.balita);

if (!libur.bumil)
  caption += blokGizi("Analisis Nilai Gizi Bumil & Busui", gizi.bumil);

if (!libur.sd13)
  caption += blokGizi("Analisis Nilai Gizi SD 1-3", gizi.sd1_3);

if (!libur.sd46)
  caption += blokGizi("Analisis Nilai Gizi SD 4-6", gizi.sd4_6);

if (!libur.smp)
  caption += blokGizi("Analisis Nilai Gizi SMP", gizi.smp);

if (!libur.sma)
  caption += blokGizi("Analisis Nilai Gizi SMA", gizi.sma);

  caption += `
🌿 “Makan bergizi, tubuh berenergi!”

#SPPGCicadas01 #MakanBergiziGratis #MBG #MakanSehat #GiziSeimbang
`;

  document.getElementById("captionOutput").value = caption.trim();
}

function generateCaptionSnack() {

  generateLaporan(); // 🔥 refresh gizi dulu

  const gizi = window.hasilGizi.SNACK || {};

  const kecil = gizi.kecil || {};
  const besar = gizi.besar || {};

  let caption = `
🍪 Snack Bergizi Gratis

⚖️ Kandungan Gizi (per porsi):
`;

  if (!kategoriLibur["Balita"]) {
    caption += blokGizi("Analisis Nilai Gizi Balita", gizi.balita);
  }

  if (!kategoriLibur["Bumil & Busui"]) {
    caption += blokGizi("Analisis Nilai Gizi Bumil & Busui", gizi.bumil);
  }

  if (!kategoriLibur["Keringan Porsi Kecil"] && gizi.kecil) {
    caption += blokGizi("Analisis Nilai Gizi Keringan Sekolah Kecil", kecil);
  }

  if (!kategoriLibur["Keringan Porsi Besar"] && gizi.besar) {
    caption += blokGizi("Analisis Nilai Gizi Keringan Sekolah Besar", besar);
  }

  caption += `
🌿 “Makan bergizi, tubuh berenergi!”

#SPPGCicadas01 #MakanBergiziGratis #MBG #MakanSehat #GiziSeimbang
`;

  document.getElementById("captionOutput").value = caption.trim();
}
function blokGizi(judul, data) {
  if (!data) return "";

  return `
${judul}
━━━━━━━━━━━━━━━━
• Energi      : ${data.energi ?? 0} kkal
• Protein     : ${data.protein ?? 0} g
• Lemak       : ${data.lemak ?? 0} g
• Karbohidrat : ${data.karbo ?? 0} g
• Serat       : ${data.serat ?? 0} g
`;
}

function updateMenuAwal(value) {
  if (!window.menuHarian) {
    window.menuHarian = [""];
  }

  window.menuHarian[0] = value;
}

function tambahMenuBaris() {
  menuHarian.push("");
  renderMenuHarian();
}

function editMenuHarian(index, value) {
  menuHarian[index] = value;
}

// ❌ HAPUS semua beforeunload lama dulu

let isDataChanged = false;

document.addEventListener("input", () => {
  isDataChanged = true;
});

window.addEventListener("beforeunload", function (e) {
  if (!isDataChanged) return;

  e.preventDefault();
  e.returnValue = '';
});

window.addEventListener("load", () => {
  isDataChanged = false;
});

document.addEventListener("DOMContentLoaded", () => {
  isDataChanged = false;
});

function konfirmasiAksi(pesan, callback) {
  const yakin = confirm(pesan);
  if (yakin) callback();
}

function kirimKeSpreadsheet() {

  if (!window.dataSpreadsheet) {
    alert("Generate laporan dulu!");
    return;
  }

  // 🔥 PAKSA GENERATE SEMUA MENU
  const modeBackup = modeMenu;
  generateLaporan();

  modeMenu = modeBackup;

  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  fetch(API_URL2, {
    method: "POST",
    body: formData
  })
  .then(res => res.text())
  .then(text => {
    console.log("RESP:", text);
    alert("Data berhasil dikirim");
  })
  .catch(err => {
    console.error("Fetch error:", err);
    alert("Gagal kirim");
  });

}

function kirimLaporan(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const namaSheet = data.tanggal;

  let sheet = ss.getSheetByName(namaSheet);
  if (!sheet) sheet = ss.insertSheet(namaSheet);

  sheet.clear();

  // =======================
  // 🟦 JUDUL
  // =======================
  sheet.getRange("A1").setValue("LAPORAN MENU MBG SPPG CICADAS 01");
  sheet.getRange("A2").setValue("Tanggal: " + data.tanggal);

  sheet.getRange("A1").setFontSize(14).setFontWeight("bold");
  sheet.getRange("A2").setFontSize(11);

  // =======================
  // 🍽️ MENU
  // =======================
  let row = 4;

  sheet.getRange(row, 1).setValue("MENU HARI INI");
  sheet.getRange(row, 1).setFontWeight("bold");

  row++;

  data.menu.forEach((m, i) => {
    sheet.getRange(row, 1).setValue(`Menu ${i + 1}`);
    sheet.getRange(row, 2).setValue(m);
    row++;
  });

  row += 1;

  // =======================
  // 🧪 HEADER
  // =======================
  const header = [
    "Kategori",
    "Energi",
    "Protein",
    "Lemak",
    "Karbo",
    "Serat"
  ];

  sheet.getRange(row, 1, 1, header.length).setValues([header]);

  sheet.getRange(row, 1, 1, header.length)
    .setFontWeight("bold")
    .setBackground("#2b7cff")
    .setFontColor("#ffffff")
    .setHorizontalAlignment("center");

  row++;

  // =======================
  // 🎨 WARNA PER KATEGORI
  // =======================
  const warnaKategori = {
    BALITA: "#d1fae5",
    "BUMIL & BUSUI": "#fef3c7",
    "SD 1-3": "#dbeafe",
    "SD 4-6": "#e9d5ff",
    SMP: "#fee2e2",
    SMA: "#fce7f3"
  };

  // =======================
  // 🧪 DATA + TOTAL
  // =======================
  let total = {
    energi: 0,
    protein: 0,
    lemak: 0,
    karbo: 0,
    serat: 0
  };

  const dataRows = [];

  Object.keys(data.gizi).forEach(k => {
    const g = data.gizi[k];

    total.energi += g.energi;
    total.protein += g.protein;
    total.lemak += g.lemak;
    total.karbo += g.karbo;
    total.serat += g.serat;

    dataRows.push([
      k.toUpperCase(),
      g.energi,
      g.protein,
      g.lemak,
      g.karbo,
      g.serat
    ]);
  });

  // isi data
  sheet.getRange(row, 1, dataRows.length, header.length)
    .setValues(dataRows);

  // =======================
  // 🎨 APPLY WARNA BARIS
  // =======================
  dataRows.forEach((r, i) => {
    const kat = r[0];
    const warna = warnaKategori[kat] || "#ffffff";

    sheet.getRange(row + i, 1, 1, header.length)
      .setBackground(warna);
  });

  row += dataRows.length;

  // =======================
  // 🔥 TOTAL ROW
  // =======================
  sheet.getRange(row, 1).setValue("TOTAL");

  sheet.getRange(row, 2).setValue(total.energi);
  sheet.getRange(row, 3).setValue(total.protein);
  sheet.getRange(row, 4).setValue(total.lemak);
  sheet.getRange(row, 5).setValue(total.karbo);
  sheet.getRange(row, 6).setValue(total.serat);

  const target = AKG["SMA"]; // standar tertinggi

const warnaEnergi = total.energi >= target.Energi ? "#bbf7d0" : "#fecaca";
const warnaProtein = total.protein >= target.Protein ? "#bbf7d0" : "#fecaca";
const warnaLemak = total.lemak >= target.Lemak ? "#bbf7d0" : "#fecaca";
const warnaKarbo = total.karbo >= target.Karbohidrat ? "#bbf7d0" : "#fecaca";
const warnaSerat = total.serat >= target.Serat ? "#bbf7d0" : "#fecaca";

sheet.getRange(row,2).setBackground(warnaEnergi);
sheet.getRange(row,3).setBackground(warnaProtein);
sheet.getRange(row,4).setBackground(warnaLemak);
sheet.getRange(row,5).setBackground(warnaKarbo);
sheet.getRange(row,6).setBackground(warnaSerat);

  sheet.getRange(row, 1, 1, header.length)
    .setFontWeight("bold")
    .setBackground("#111827")
    .setFontColor("#ffffff");

  // =======================
  // 📏 FORMAT ANGKA
  // =======================
  sheet.getRange(6, 2, row, 5)
    .setNumberFormat("0.00");

  // =======================
  // 📦 BORDER
  // =======================
  sheet.getRange(5, 1, row - 4, header.length)
    .setBorder(true, true, true, true, true, true);

  // =======================
  // 📏 AUTO WIDTH
  // =======================
  sheet.autoResizeColumns(1, 6);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function kirimLaporanKeSpreadsheet() {

  const tanggal = formatTanggalIndonesia();
  const menuFix = ambilMenuUntukLaporan();

  const semuaDetail = [];
  const semuaLibur = {};

  // gabungkan semua data spreadsheet
  Object.keys(window.dataSpreadsheet).forEach(mode => {

    const dataMode = window.dataSpreadsheet[mode];

    if (dataMode && dataMode.detail) {
      semuaDetail.push(...dataMode.detail);
    }

  });

  // ambil status libur
  Object.keys(kategoriLibur).forEach(kat => {
    semuaLibur[kat] = kategoriLibur[kat];
  });

  const data = {
    tanggal: tanggal,
    menu: menuFix,
    omprengan: window.dataSpreadsheet.OMPRENGAN,
    snack: window.dataSpreadsheet.SNACK,
    detail: semuaDetail,
    libur: semuaLibur,
    catatan: document.getElementById("note")?.value || ""
  };

  console.log(data);

  const formData = new FormData();
  formData.append("data", JSON.stringify(data));

  fetch(API_URL2, {
    method: "POST",
    body: formData
  })
  .then(res => res.text())
  .then(res => {
    console.log("RESP:", res);
    alert("Berhasil kirim laporan");
  })
  .catch(err => {
    console.error(err);
    alert("Gagal kirim");
  });

}

  function debounce(fn, delay = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function syncLiburModal() {

  const map = {
    "Balita": "liburBalita",
    "Bumil & Busui": "liburBumil",
    "SD 1-3": "liburSD",
    "SD 4-6": "liburSD",
    "SMP": "liburSMP",
    "SMA": "liburSMA"
  };

  Object.keys(map).forEach(kat => {

    const el = document.getElementById(map[kat]);

    if (el) {
      el.checked = kategoriLibur[kat] || false;
    }

  });

}

function ubahKategoriMenu(value){
  menuKategori = value;
  generateCaptionHarian();
}

function ambilMenuUntukLaporan(){

  if(modeMenuLaporan === "semua"){
    return menuSemua.filter(m => m.trim());
  }

  let hasil = [];

  if(menuBalita.length){
    hasil.push("Menu Balita, Bumil & Busui :");
    menuBalita.filter(m=>m.trim()).forEach((m,i)=>{
      hasil.push((i+1)+". "+m);
    });
  }

  if(menuSekolah.length){
    hasil.push("");
    hasil.push("Menu Sekolah :");
    menuSekolah.filter(m=>m.trim()).forEach((m,i)=>{
      hasil.push((i+1)+". "+m);
    });
  }

  return hasil;
}

function renderKategori(){

const container = document.getElementById("kategoriCheckbox");
if(!container) return;

let kategori =
modeMenu === "SNACK"
? kategoriSnack
: kategoriOmprengan;

let html = "";

/* tombol semua */

html += `
<label class="kategori-chip">
<input type="checkbox" id="kategoriSemua">
<span>Semua</span>
</label>
`;

kategori.forEach(k=>{

html += `
<label class="kategori-chip">
<input type="checkbox" class="kategori-check" value="${k}">
<span>${k}</span>
</label>
`;

});

container.innerHTML = html;

}

function ambilKategoriDipilih(){

const checkboxes = document.querySelectorAll(".kategori-check:checked");

let list = [];

checkboxes.forEach(cb=>{
list.push(cb.value);
});

if(list.length === 0){
return ["SEMUA"];
}

return list;

}

function initKategoriChip(){

const chips = document.querySelectorAll(".kategori-chip");

chips.forEach(chip => {

chip.addEventListener("click", function(){

const kategori = this.dataset.kategori;

/* klik SEMUA */

if(kategori === "semua"){

chips.forEach(c => c.classList.remove("active"));

this.classList.add("active");

}

/* klik kategori lain */

else{

const semuaChip = document.querySelector('[data-kategori="semua"]');
semuaChip.classList.remove("active");

/* toggle */

this.classList.toggle("active");

}

});

});

}

document.addEventListener("DOMContentLoaded", function(){

initKategoriChip();

let kategoriAktif = [];

document.querySelectorAll(".kategori-chip").forEach(chip=>{

chip.addEventListener("click", function(){

const kategori = this.dataset.kategori;

if(kategori==="semua"){

document.querySelectorAll(".kategori-chip").forEach(c=>{
c.classList.remove("active");
});

this.classList.add("active");

kategoriAktif=["SEMUA"];

return;

}

this.classList.toggle("active");

document.querySelector('[data-kategori="semua"]').classList.remove("active");

kategoriAktif=[];

document.querySelectorAll(".kategori-chip.active").forEach(c=>{
kategoriAktif.push(c.dataset.kategori);
});

});

});

});

function formatSatuan(satuan){

if(!satuan) return "";

satuan = satuan.toUpperCase();

if(satuan === "GRAM") return "Gram";
if(satuan === "PCS") return "Pcs";

return satuan;

}
