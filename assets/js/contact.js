(function () {
  "use strict";

  const IMG_BASE = "assets/img/";
  const YEARS = ["1988", "1998", "2008", "2023"];

  const tbody = document.getElementById("contact-table-body");
  const extraBody = document.getElementById("extra-table-body");

  function cell(text, label, muted) {
    const td = document.createElement("td");
    td.textContent = text || "—";
    if (label) td.dataset.label = label;
    if (muted && !text) td.classList.add("muted");
    return td;
  }

  function photosCell(poze, nume) {
    const td = document.createElement("td");
    td.className = "contact-photos-cell";
    td.dataset.label = "Poze";
    const wrap = document.createElement("div");
    wrap.className = "contact-photos";
    YEARS.forEach((year, index) => {
      const poza = poze && poze[index];
      const fig = document.createElement("figure");
      fig.className = "contact-photo";
      if (poza) {
        const img = document.createElement("img");
        img.src = IMG_BASE + poza;
        img.alt = `${nume} (${year})`;
        img.loading = "lazy";
        img.className = "contact-thumb";
        fig.appendChild(img);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "contact-thumb contact-thumb-empty";
        placeholder.textContent = "—";
        fig.appendChild(placeholder);
      }
      const caption = document.createElement("figcaption");
      caption.textContent = year;
      fig.appendChild(caption);
      wrap.appendChild(fig);
    });
    td.appendChild(wrap);
    return td;
  }

  function renderColegi(colegiPrivat, colegiPublicById) {
    tbody.innerHTML = "";
    colegiPrivat.forEach((c) => {
      const poze = (colegiPublicById[c.id] || {}).poze || [];
      const tr = document.createElement("tr");
      tr.appendChild(photosCell(poze, c.nume));
      tr.appendChild(cell(c.nume, "Nume"));
      tr.appendChild(cell((c.telefon || []).join(", "), "Telefon", true));
      tr.appendChild(cell((c.email || []).join(", "), "Email", true));
      tr.appendChild(cell(c.adresa, "Adresă", true));
      tr.appendChild(cell(c.data_nasterii, "Data nașterii", true));
      tbody.appendChild(tr);
    });
  }

  function renderExtra(diriginte, contacteSuplimentare) {
    extraBody.innerHTML = "";
    if (diriginte) {
      const tr = document.createElement("tr");
      tr.appendChild(cell(`${diriginte.nume} (diriginte)`, "Nume"));
      tr.appendChild(cell((diriginte.telefon || []).join(", "), "Telefon", true));
      tr.appendChild(cell("", "Email", true));
      extraBody.appendChild(tr);
    }
    (contacteSuplimentare || []).forEach((c) => {
      const tr = document.createElement("tr");
      tr.appendChild(cell(c.nume, "Nume"));
      tr.appendChild(cell(c.telefon, "Telefon", true));
      tr.appendChild(cell(c.email, "Email", true));
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
      tbody.innerHTML = '<tr><td colspan="6" style="color:#a94f21">Nu am putut încărca datele.</td></tr>';
      console.error("Eroare la încărcarea datelor de contact:", err);
    });
})();
