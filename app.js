(() => {
  "use strict";

  const body = document.body;
  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector("#mobile-menu");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setMenu = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Aizvērt izvēlni" : "Atvērt izvēlni");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.inert = !open;
    body.classList.toggle("menu-open", open);
    if (open) mobileMenu.querySelector("a")?.focus();
  };

  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  mobileMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuButton.focus();
    }
  });

  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 30);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealItems = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: .08 });
    revealItems.forEach((item) => observer.observe(item));
  }

  const filters = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll("[data-category]")];
  filters.forEach((filter) => filter.addEventListener("click", () => {
    const category = filter.dataset.filter;
    filters.forEach((button) => {
      const active = button === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    cards.forEach((card) => {
      card.hidden = category !== "all" && card.dataset.category !== category;
    });
  }));

  const projectData = {
    house: {
      category: "Māju būvniecība",
      title: "No projekta līdz dzīvošanai",
      description: "Woodenlays nodrošina pilnu privātmājas būvniecības ciklu — no plāna un pamatiem līdz ārējai un iekšējai apdarei.",
      items: ["Projekta izstrāde un plānošana", "Pamatu un konstrukcijas izbūve", "Jumts, fasāde un iekšdarbi"],
      images: ["assets/images/house-construction.jpg"],
      alts: ["Privātmāja būvniecības procesā"]
    },
    facade: {
      category: "Fasāžu darbi",
      title: "Pirms. Procesā. Pēc.",
      description: "Fasādes stāvokļa novērtēšana, sagatavošana, siltināšana un apdares materiālu uzklāšana vienā secīgā procesā.",
      items: ["Fasādes pārbaude un sagatavošana", "Siltumizolācijas izbūve", "Koka apdares uzstādīšana"],
      images: ["assets/images/facade-before.jpg", "assets/images/facade-process.jpg", "assets/images/facade-after.jpg"],
      alts: ["Fasāde pirms atjaunošanas", "Fasādes siltināšana procesā", "Koka fasādes apdare pēc darbu posma"]
    },
    roof: {
      category: "Jumta darbi",
      title: "Jumta izbūve un remonts",
      description: "Jauna jumta konstrukcija, seguma uzstādīšana vai esoša jumta nomaiņa atbilstoši objekta stāvoklim.",
      items: ["Esošā jumta novērtēšana", "Konstrukcijas un seguma darbi", "Darba rezultāta pārbaude"],
      images: ["assets/images/roof-work.jpeg"],
      alts: ["Jumta seguma izbūves process"]
    },
    interior: {
      category: "Iekšdarbi",
      title: "Telpas līdz gatavai apdarei",
      description: "Remonta darbi ietver telpu sagatavošanu, inženierkomunikācijas un apdares posmus.",
      items: ["Telpas sagatavošana", "Santehnikas un elektroinstalācijas darbi", "Sienu, griestu un grīdu apdare"],
      images: ["assets/images/interior-work.jpg"],
      alts: ["Iekšdarbi remonta procesā"]
    },
    detail: {
      category: "Darba kvalitāte",
      title: "Risinājums sākas detaļās",
      description: "Materiālu un konstrukcijas mezglu izvēle tiek saskaņota ar konkrētā objekta prasībām.",
      items: ["Materiālu izvēle", "Mezglu izstrāde", "Montāža un pārbaude"],
      images: ["assets/images/team-detail.jpg"],
      alts: ["Meistars pie fasādes konstrukcijas parauga"]
    }
  };

  const dialog = document.querySelector("#project-dialog");
  const dialogImage = dialog.querySelector("[data-dialog-image]");
  const dialogCategory = dialog.querySelector("[data-dialog-category]");
  const dialogTitle = dialog.querySelector("[data-dialog-title]");
  const dialogDescription = dialog.querySelector("[data-dialog-description]");
  const dialogList = dialog.querySelector("[data-dialog-list]");
  const galleryCount = dialog.querySelector("[data-gallery-count]");
  const galleryControls = dialog.querySelector("[data-dialog-controls]");
  let activeProject = null;
  let activeImage = 0;

  const renderDialogImage = () => {
    const data = projectData[activeProject];
    dialogImage.src = data.images[activeImage];
    dialogImage.alt = data.alts[activeImage];
    galleryCount.textContent = `${activeImage + 1} / ${data.images.length}`;
    galleryControls.hidden = data.images.length < 2;
  };

  const openProject = (key) => {
    const data = projectData[key];
    if (!data) return;
    activeProject = key;
    activeImage = 0;
    dialogCategory.textContent = data.category;
    dialogTitle.textContent = data.title;
    dialogDescription.textContent = data.description;
    dialogList.replaceChildren(...data.items.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }));
    renderDialogImage();
    dialog.showModal();
    body.classList.add("dialog-open");
  };

  document.querySelectorAll("[data-project]").forEach((button) => button.addEventListener("click", () => openProject(button.dataset.project)));
  dialog.querySelector("[data-dialog-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => body.classList.remove("dialog-open"));
  dialog.querySelector("[data-gallery-prev]").addEventListener("click", () => {
    const images = projectData[activeProject].images;
    activeImage = (activeImage - 1 + images.length) % images.length;
    renderDialogImage();
  });
  dialog.querySelector("[data-gallery-next]").addEventListener("click", () => {
    const images = projectData[activeProject].images;
    activeImage = (activeImage + 1) % images.length;
    renderDialogImage();
  });
  dialog.querySelector("[data-dialog-cta]").addEventListener("click", () => dialog.close());

  const form = document.querySelector("#contact-form");
  const formStatus = form.querySelector(".form-status");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = [...form.querySelectorAll("[required]")];
    fields.forEach((field) => field.removeAttribute("aria-invalid"));
    const invalid = fields.find((field) => !field.value.trim());
    const phone = form.elements.phone;
    if (invalid) {
      invalid.setAttribute("aria-invalid", "true");
      invalid.focus();
      formStatus.className = "form-status";
      formStatus.textContent = "Lūdzu, aizpildiet vārdu, tālruni un izvēlieties darba virzienu.";
      return;
    }
    if ((phone.value.match(/\d/g) || []).length < 6) {
      phone.setAttribute("aria-invalid", "true");
      phone.focus();
      formStatus.className = "form-status";
      formStatus.textContent = "Lūdzu, pārbaudiet tālruņa numuru.";
      return;
    }
    formStatus.className = "form-status is-success";
    formStatus.textContent = "Pieteikuma forma ir gatava pieslēgšanai. Koncepta versijā dati netiek nosūtīti.";
  });

  document.querySelector("[data-year]").textContent = new Date().getFullYear();
})();
