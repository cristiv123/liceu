(function () {
  "use strict";

  const tbody = document.getElementById("contact-table-body");
  const extraBody = document.getElementById("extra-table-body");

  function cell(text, muted) {
    const td = document.createElement("td");
    td.textContent = text || "—";
    if (muted && !text) td.classList.add("muted");
    return td;
  }

  function renderColegi(colegi) {
    tbody.innerHTML = "";
    colegi.forEach((c) => {
      const tr = document.createElement("tr");
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

  fetch("colegi_complet_privat.json")
    .then((res) => res.json())
    .then((data) => {
      renderColegi(data.colegi || []);
      renderExtra(data.diriginte, data.contacte_suplimentare);
    })
    .catch((err) => {
      tbody.innerHTML = '<tr><td colspan="5" style="color:#a94f21">Nu am putut încărca datele.</td></tr>';
      console.error("Eroare la încărcarea colegi_complet_privat.json:", err);
    });
})();
