(function () {
  "use strict";

  const IMG_BASE = "assets/img/";
  const YEARS = ["1988", "1998", "2008", "2023"];

  const tbody = document.getElementById("contact-table-body");
  const extraBody = document.getElementById("extra-table-body");

  function cell(text, muted) {
    const td = document.createElement("td");
    td.textContent = text || "—";
    if (muted && !text) td.classList.add("muted");
    return td;
  }

  function photoCell(poze, index, nume) {
    const td = document.createElement("td");
    const poza = poze && poze[index];
    if (poza) {
      const img = document.createElement("img");
      img.src = IMG_BASE + poza;
      img.alt = `${nume} (${YEARS[index]})`;
      img.loading = "lazy";
      img.className = "contact-thumb";
      td.appendChild(img);
    } else {
      td.classList.add("muted");
      td.textContent = "—";
    }
    return td;
  }

  function renderColegi(colegiPrivat, colegiPublicById) {
    tbody.innerHTML = "";
    colegiPrivat.forEach((c) => {
      const poze = (colegiPublicById[c.id] || {}).poze || [];
      const tr = document.createElement("tr");
      for (let i = 0; i < YEARS.length; i++) {
        tr.appendChild(photoCell(poze, i, c.nume));
      }
      tr.appendChild(cell(c.nume));
      tr.appendChild(cell((c.telefon || []).join(", "), true));
      tr.appendChild(cell((c.email || []).join(", "), true));
      tr.appendChild(cell(c.adresa, true));
      tr.appendChild(cell(c.data_nasterii, true));
      tbody.appendChild(tr);
    });
  }

  function renderExtra(diriginte, contacteSuplimentare) {
    extraBody.innerHTML = "";
    if (diriginte) {
      const tr = document.createElement("tr");
      tr.appendChild(cell(`${diriginte.nume} (diriginte)`));
      tr.appendChild(cell((diriginte.telefon || []).join(", "), true));
      tr.appendChild(cell("", true));
      extraBody.appendChild(tr);
    }
    (contacteSuplimentare || []).forEach((c) => {
      const tr = document.createElement("tr");
      tr.appendChild(cell(c.nume));
      tr.appendChild(cell(c.telefon, true));
      tr.appendChild(cell(c.email, true));
      extraBody.appendChild(tr);
    });
  }

  const footerYear = document.getElementById("footer-year");
  if (footerYear) footerYear.textContent = new Date().getFullYear();

  Promise.all([
    fetch("colegi_complet_privat.json").then((res) => res.json()),
    fetch("assets/data/colegi.json").then((res) => res.json()),
  ])
    .then(([privat, public_]) => {
      const colegiPublicById = {};
      (public_.colegi || []).forEach((c) => {
        colegiPublicById[c.id] = c;
      });
      renderColegi(privat.colegi || [], colegiPublicById);
      renderExtra(privat.diriginte, privat.contacte_suplimentare);
    })
    .catch((err) => {
      tbody.innerHTML = '<tr><td colspan="9" style="color:#a94f21">Nu am putut încărca datele.</td></tr>';
      console.error("Eroare la încărcarea datelor de contact:", err);
    });
})();
