let bahanMaster = [];
let kategoriData = {};
let database = [];
let databaseLoaded = false;

const kategoriList = [
  "Balita",
  "Bumil & Busui",
  "SD 1-3",
  "SD 4-6",
  "SMP",
  "SMA"
];

// ================= LOAD DATABASE =================
async function loadDatabase() {
  try {
    const res = await fetch(API_URL);
    database = await res.json();
    databaseLoaded = true;

    console.log("Database loaded:", database.length);
    initKategori();
  } catch (err) {
    console.error("Gagal load database:", err);
    alert("Database gagal dimuat. Cek Apps Script.");
  }
}

loadDatabase();

// ================= INIT KATEGORI =================
function initKategori() {
  kategoriList.forEach(k => {
    kategoriData[k] = [];
  });
}

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
    const total = hitungTotal(kategoriData[kat]);

    hasilDiv.innerHTML += `
      <div class="card kategori">
        <h3>${kat}</h3>
        <label>
          <input type="checkbox" onchange="toggleLibur(this)">
          Libur
        </label>

        ${renderEditableList(kat)}

        <hr>

        <p>Energi: ${total.Energi.toFixed(1)}</p>
        <p>Protein: ${total.Protein.toFixed(1)}</p>
        <p>Lemak: ${total.Lemak.toFixed(1)}</p>
        <p>Karbohidrat: ${total.Karbohidrat.toFixed(1)}</p>
        <p>Kalsium: ${total.Kalsium.toFixed(1)}</p>
        <p>Serat: ${total.Serat.toFixed(1)}</p>
      </div>
    `;
  });
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
    card.querySelectorAll("p").forEach(p => {
      p.innerHTML = p.innerHTML.split(":")[0] + ": 0";
    });
  } else {
    generateLaporan();
  }
}
