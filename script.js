let bahanMaster = [];
let kategoriLibur = {};
let kategoriData = {};
let database = [];
let databaseLoaded = false;

// ================= TOGGLE LIBUR =================
function toggleLibur(kat, checked) {
  kategoriLibur[kat] = checked;
  generateLaporan();
}

// ✅ TAMBAHKAN DI SINI
function statusClass(persen) {
  return persen >= 100 ? "ok" : "bad";
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

// ================= INIT KATEGORI =================
function initKategori() {
  kategoriList.forEach(k => {
    kategoriData[k] = [];
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
  }
}

// panggil sebelum loadDatabase
loadCache();

// ================= TAMBAH BAHAN =================
function tambahBahan() {
  const nama = document.getElementById("namaBahan").value.trim();
  const berat = parseFloat(document.getElementById("beratBahan").value);

  if (!nama || !berat) return;

  bahanMaster.push({ nama, berat });

  kategoriList.forEach(k => {
    kategoriData[k].push({ nama, berat });
  });

  renderList();
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
      String(d["nama bahan"]).toLowerCase().trim() ===
      item.nama.toLowerCase().trim()
    );

    if (!db) {
      console.warn("Tidak ketemu:", item.nama);
      return;
    }

    total.Energi += (item.berat / 100) * Number(db["energi"] || 0);
    total.Protein += (item.berat / 100) * Number(db["protein"] || 0);
    total.Lemak += (item.berat / 100) * Number(db["lemak"] || 0);
    total.Karbohidrat += (item.berat / 100) * Number(db["karbohidrat"] || 0);
    total.Kalsium += (item.berat / 100) * Number(db["kalsium"] || 0);
    total.Serat += (item.berat / 100) * Number(db["serat"] || 0);
  });

  return total;
}

// ================= GENERATE =================
function generateLaporan() {
  if (!databaseLoaded) {
    alert("Database masih loading...");
    return;
  }

  const hasilDiv = document.getElementById("hasil");
  hasilDiv.innerHTML = "";

  kategoriList.forEach(kat => {

  const namaKategori = kat;

  // ✅ ambil status libur (contoh dari checkbox/state kamu)
  const isLibur = kategoriLibur?.[kat] || false;

  // ✅ TARUH BLOK KAMU DI SINI
  if (isLibur) {
    hasilDiv.innerHTML += `
  <div class="kategori-card">

    <div class="kategori-header">
      <h3>${kat}</h3>

      <label class="switch">
        <input type="checkbox"
               ${kategoriLibur[kat] ? "checked" : ""}
               onchange="toggleLibur('${kat}', this.checked)">
        <span class="slider"></span>
      </label>
    </div>

    ${renderEditableList(kat)}

    <!-- tabel gizi di bawah -->
`;
    return; // ⛔ penting: stop render kategori ini
  }

  // ================================
  // lanjut normal kalau tidak libur
  // ================================

  const total = hitungTotal(kategoriData[kat]);

  // ... lanjut hitung persen dan tabel
});

    html += `
<table class="tabel-gizi">
  <tr>
    <th>Energi</th>
    <th>Protein</th>
    <th>Lemak</th>
    <th>Karbo</th>
    <th>Kalsium</th>
    <th>Serat</th>
  </tr>
  <tr>
    <td class="${statusClass(p.energi)}">${p.energi.toFixed(1)}%</td>
    <td class="${statusClass(p.protein)}">${p.protein.toFixed(1)}%</td>
    <td class="${statusClass(p.lemak)}">${p.lemak.toFixed(1)}%</td>
    <td class="${statusClass(p.karbo)}">${p.karbo.toFixed(1)}%</td>
    <td class="${statusClass(p.kalsium)}">${p.kalsium.toFixed(1)}%</td>
    <td class="${statusClass(p.serat)}">${p.serat.toFixed(1)}%</td>
  </tr>
</table>
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

// ================= LIBUR =================
function toggleLibur(cb) {
  const card = cb.closest(".kategori");

  if (cb.checked) {
    card.querySelectorAll(".table-gizi tbody tr").forEach(tr => {
      tr.children[1].textContent = "0";
      tr.children[2].textContent = "0%";
      tr.children[2].className = "status-low";
    });
  } else {
    generateLaporan();
  }
}

// ================= AUTOCOMPLETE DROPDOWN =================
function initAutocomplete() {
  const input = document.getElementById("namaBahan");
  const dropdown = document.getElementById("dropdownBahan");

  input.addEventListener("input", () => {
    const val = input.value.toLowerCase();
    dropdown.innerHTML = "";

    if (!val) {
      dropdown.style.display = "none";
      return;
    }

    const hasil = database
      .map(d => d["nama bahan"])
      .filter(n => n && n.toLowerCase().includes(val))
      .slice(0, 8);

    if (!hasil.length) {
      dropdown.style.display = "none";
      return;
    }

    dropdown.style.display = "block";

    hasil.forEach(nama => {
      const div = document.createElement("div");
      div.className = "dropdown-item";
      div.textContent = nama;

      div.onclick = () => {
        input.value = nama;
        dropdown.style.display = "none";
      };

      dropdown.appendChild(div);
    });
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete")) {
      dropdown.style.display = "none";
    }
  });
}

// ================= STARTUP =================
loadCache();
loadDatabase();

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
