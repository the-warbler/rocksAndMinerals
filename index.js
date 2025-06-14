// ======= App State =======
let sessionQueue = [];
let totalCorrect = 0;
let totalWrong = 0;
let sessionSummary = [];
let showTags = false;
let currentPage = "review-setup";
let imageCounts = {};
fetch('images.json')
  .then(r => r.json())
  .then(json => {
    imageCounts = json;
  })
  .catch(err => {
    console.warn('Could not load images.json, defaulting to 1 image each', err);
  });


// ======= DOM Elements =======
const pages = {
  "review-setup": document.getElementById("review-setup-page"),
  "review": document.getElementById("review-page"),
  "summary": document.getElementById("summary-page"),
  "search": document.getElementById("search-page"),
};
const navBtns = document.querySelectorAll(".nav-btn");

// ------ Field Notes Modal Logic ------
const modalOverlay = document.getElementById("modal-overlay");
const modalTitle   = document.getElementById("modal-title");
const modalBody    = document.getElementById("modal-body");
document.getElementById("modal-close").onclick = () => {
  modalOverlay.classList.add("hidden");
};

// Show the modal, given a title and text:
function showFieldNotes(title, notes) {
  if (title) {
    modalTitle.innerText = title;
    modalTitle.style.display = "";
  } else {
    modalTitle.style.display = "none";
  }
  modalBody.innerText = notes;
  modalOverlay.classList.remove("hidden");
}

// Close modal when clicking outside the content
modalOverlay.addEventListener("click", e => {
  // if the click is directly on the overlay (not inside the modal-content)
  if (e.target === modalOverlay) {
    modalOverlay.classList.add("hidden");
  }
});

// Prevent clicks inside the modal-content from bubbling up
document.getElementById("modal-content")
        .addEventListener("click", e => e.stopPropagation());


// ------- Gallery Modal Logic -------
const galleryOverlay = document.getElementById("gallery-overlay");
const galleryContent = document.getElementById("gallery-content");
const galleryImages  = document.getElementById("gallery-images");
const zoomedImage    = document.getElementById("zoomed-image");
const galleryClose   = document.getElementById("gallery-close");

// Close handlers
galleryClose.onclick = () => galleryOverlay.classList.add("hidden");
galleryOverlay.addEventListener("click", e => {
  if (e.target === galleryOverlay) galleryOverlay.classList.add("hidden");
});
document.getElementById("gallery-content")
        .addEventListener("click", e => e.stopPropagation());

const galleryZoom = document.getElementById("gallery-zoom");

// Open the grid of thumbnails
function showGallery(rockName) {
  galleryZoom.classList.remove("visible");
  galleryImages.style.display = "";  // ensure grid is shown
  galleryImages.innerHTML = "";
  const count = imageCounts[rockName] || 1;
  for (let i = 1; i <= count; i++) {
    const thumb = document.createElement("img");
    thumb.src = `images/${rockName}${i}.jpg`;
    thumb.alt = `${rockName} ${i}`;
    thumb.onclick = () => openZoom(thumb.src);
    galleryImages.appendChild(thumb);
  }
  galleryOverlay.classList.remove("hidden");
}

// Show one image full-size inside the same modal
function openZoom(src) {
  galleryImages.style.display = "none";      // hide grid
  galleryZoom.src = src;
  galleryZoom.classList.add("visible");
}

// Click on zoomed image to go back to grid
galleryZoom.addEventListener("click", () => {
  galleryZoom.classList.remove("visible");
  galleryImages.style.display = "";
});
// ======= Navigation Logic =======
function showPage(pageName) {
  for (let key in pages) {
    pages[key].style.display = key === pageName ? "block" : "none";
  }
  navBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  });
  currentPage = pageName;
  // ← Persist to localStorage
  localStorage.setItem('lastPage', pageName);
}

navBtns.forEach(btn => {
  btn.addEventListener("click", e => {
    showPage(btn.dataset.page);
    if (btn.dataset.page === "review-setup") {
      resetSession();
    } else if (btn.dataset.page === "search") {
        updateSearchResults();
    }
  });
});

// ======= Review Setup =======
document.getElementById("review-setup-form").addEventListener("submit", function(e) {
  e.preventDefault();
  startSession();
});

// ======= Review Logic =======
document.getElementById("submit-btn").onclick = checkAnswer;
document.getElementById("skip-btn").onclick = skipQuestion;
document.getElementById("hint-btn").onclick = showHint;
document.getElementById("toggle-tags-btn").onclick = toggleTags;
document.getElementById("restart-btn").onclick = resetSession;
document.getElementById("guess").addEventListener("keydown", function(event) {
  if (event.key === "Enter") checkAnswer();
});

document.getElementById("field-notes-btn").onclick = () => {
  if (!sessionQueue.length) return;
  const notes = sessionQueue[0].summary.fieldNotes || "No notes available.";
  showFieldNotes("", notes);
};


// ======= Search Logic =======
document.getElementById("search-bar").addEventListener("input", updateSearchResults);
// ======= Core Functions =======
function updateScoreBoard() {
  document.getElementById("correct-count").innerText = totalCorrect;
  document.getElementById("wrong-count").innerText = totalWrong;
}
function updateTags() {
  if (sessionQueue.length === 0) return;
  const summary = sessionQueue[0].summary;
  const tags = [];
  if (summary.type) tags.push({ text: summary.type, type: summary.type.toLowerCase() });
  if (summary.category) tags.push({ text: summary.category, type: summary.category.toLowerCase() });
  if (summary.mineralFamily) tags.push({ text: summary.mineralFamily, type: "mineral" });
  if (summary.metamorphicIndex) tags.push({ text: "Index Mineral", type: "index" });
  if (summary.mohsRock) tags.push({ text: "Mohs Hardness Scale", type: "mohs" });
  if (summary.metalOre) tags.push({ text: "Metal Ore", type: "metalOre" });
  if (summary.bowenSeries) tags.push({ text: summary.bowenSeries, type: "bowenSeries" });
  tags.forEach(tagObj => {
    const span = document.createElement("span");
    span.className = "tag tag-" + tagObj.type;
    span.innerText = tagObj.text;
  });
}

function renderTags() {
  const tagsRow = document.getElementById("tags-row");
  tagsRow.innerHTML = ""; // Always clear

  if (sessionQueue.length === 0) return;

  const summary = sessionQueue[0].summary;
  const tags = [];
  if (summary.type) tags.push({ text: summary.type, type: summary.type.toLowerCase() });
  if (summary.category) tags.push({ text: summary.category, type: summary.category.toLowerCase() });
  if (summary.mineralFamily) tags.push({ text: summary.mineralFamily, type: "mineral" });
  if (summary.metamorphicIndex) tags.push({ text: "Index Mineral", type: "index" });
  if (summary.mohsRock) tags.push({ text: "Mohs Hardness Scale", type: "mohs" });
  if (summary.metalOre) tags.push({ text: "Metal Ore", type: "metalOre" });
  if (summary.bowenSeries) tags.push({ text: summary.bowenSeries, type: "bowenSeries" });

  // If tags should be shown, add tags. Else, leave empty (but the area stays).
  if (showTags) {
    tags.forEach(tagObj => {
      const span = document.createElement("span");
      span.className = "tag tag-" + tagObj.type;
      span.innerText = tagObj.text;
      tagsRow.appendChild(span);
    });
    tagsRow.classList.remove("hidden");
  } else {
    tagsRow.classList.add("hidden");
  }
}

function toggleTags() {
  showTags = !showTags;
  renderTags();
  const toggleBtn = document.getElementById("toggle-tags-btn");
  toggleBtn.innerText = showTags ? "Hide Tags" : "Show Tags";
}


function loadQuestion() {
  if (!sessionQueue.length) {
    showSummary();
    return;
  }

  const current = sessionQueue[0];
  const maxImg = current.imageCount || 1;
  // pick random 1…maxImg
  const i = Math.floor(Math.random() * maxImg) + 1;
  document.getElementById("rock-image").src = `images/${current.name}${i}.jpg`;

  // clear input/feedback
  document.getElementById("guess").value = "";
  const feedback = document.getElementById("feedback");
  feedback.innerText = "";
  feedback.className = "";
  renderTags(); // your reserved tag area
}

function checkAnswer() {
  const userGuess = document.getElementById("guess").value.trim().toLowerCase();
  const currentRock = sessionQueue[0];
  const feedback = document.getElementById("feedback");
  currentRock.attemptCount++;
  if (userGuess === currentRock.name.toLowerCase()) {
    
    let message;
    if (currentRock.attemptCount === 1) {
      message = "Correct!";
    } else {
      message = `Correct after ${currentRock.attemptCount} tries`;
    }
    totalCorrect++;
    feedback.className = "correct";
    feedback.innerText = message;

    currentRock.summary.result = message;
    sessionQueue.shift();
    updateScoreBoard();
    setTimeout(loadQuestion, 850);

  } else {
    if (currentRock.attemptCount === 1) {
      totalWrong++;
      updateScoreBoard();
    }
    feedback.className = "incorrect flash";
    feedback.innerText = "Incorrect, try again.";
  }
}

function skipQuestion() {
  const currentRock = sessionQueue.shift();
  const feedback = document.getElementById("feedback");
  if (currentRock.attemptCount === 0) {
    currentRock.attemptCount++;
    totalWrong++;
    updateScoreBoard();
  }
  feedback.innerText = "Skipped! The correct answer was: " + currentRock.name;
  feedback.className = "skipped";
  sessionQueue.push(currentRock);
  setTimeout(loadQuestion, 900);
}
function showHint() {
  const currentRock = sessionQueue[0];
  const feedback = document.getElementById("feedback");
  feedback.innerText = "Hint: The first letter is: " + currentRock.name.charAt(0).toUpperCase();
  feedback.className = "hint";
}
function createRockInstance(summaryEntry) {
  return {
    name: summaryEntry.name,
    imageCount: summaryEntry.imageCount,
    attemptCount: 0,
    summary: summaryEntry
  };
}

function startSession() {
  // Get session count
  const countInput = document.getElementById("session-count").value;
  const sessionCount = parseInt(countInput);
  if (isNaN(sessionCount) || sessionCount <= 0) {
    alert("Please enter a valid number greater than 0.");
    return;
  }
  // Get selected filters.
  const select = document.getElementById("session-category");
  const selectedOptions = Array.from(select.options).filter(opt => opt.selected).map(opt => opt.value.toLowerCase());
  let availableRocks = rockTypes;
  if (!selectedOptions.includes("all") && selectedOptions.length > 0) {
    availableRocks = availableRocks.filter(rock => {
      const cat = rock.category ? rock.category.toLowerCase() : "";
      const index = rock.metamorphicIndex ? "index" : "";
      const mohs = rock.mohsRock ? "mohs" : "";
      const type = rock.type ? rock.type.toLowerCase() : "";
      const metal = rock.metalOre ? "metalore" : "";
      const bowen = rock.bowenSeries ? "bowenseries" : "";
      return selectedOptions.includes(cat) ||
        selectedOptions.includes(index) ||
        selectedOptions.includes(mohs) ||
        selectedOptions.includes(type) ||
        selectedOptions.includes(metal) ||
        selectedOptions.includes(bowen);
    });
  }
  if (availableRocks.length < sessionCount) {
    alert("Not enough available items matching your criteria. Available: " + availableRocks.length);
    return;
  }
  sessionQueue = [];
  sessionSummary = [];
  totalCorrect = 0;
  totalWrong = 0;
  updateScoreBoard();

  // Shuffle & pick unique rocks:
  let uniqueRocks = availableRocks.slice();
  uniqueRocks.sort(() => Math.random() - 0.5);
  uniqueRocks = uniqueRocks.slice(0, sessionCount);

  uniqueRocks.forEach(rock => {
    const count = imageCounts[rock.name] || 1;
    const summaryEntry = {
      name: rock.name,
      imageCount: count,               // store how many images exist
      result: "",
      type: rock.type || "",
      category: rock.category || "",
      mineralFamily: rock.mineralFamily || "",
      metamorphicIndex: rock.metamorphicIndex || false,
      mohsRock: rock.mohsRock || false,
      metalOre: rock.metalOre || false,
      bowenSeries: rock.bowenSeries || false,
      fieldNotes: rock.fieldNotes || ""
    };
    sessionSummary.push(summaryEntry);
    sessionQueue.push(createRockInstance(summaryEntry));
  });


  // Now you have one flashcard per image, for every rock.
  showPage("review");
  showTags = false;
  document.getElementById("tags-row").classList.add("hidden");
  document.getElementById("toggle-tags-btn").innerText = "Show Tags";
  loadQuestion();
}
function showSummary() {
  showPage("summary");
  const summaryList = document.getElementById("summary-list");
  summaryList.innerHTML = "";

  sessionSummary.forEach(entry => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "summary-item";

    // 1) Thumbnail image (clickable)
    const imgElem = document.createElement("img");
    const maxImg = entry.imageCount || 1;
    const idx = Math.floor(Math.random() * maxImg) + 1;
    imgElem.src = `images/${entry.name}${idx}.jpg`;
    imgElem.alt = entry.name;
    imgElem.style.cursor = "pointer";
    imgElem.onclick = () => showGallery(entry.name);
    itemDiv.appendChild(imgElem);

    // 2) Name + tags container
    const nameTagsDiv = document.createElement("div");
    nameTagsDiv.className = "summary-name-tags";

    // Name button
    const nameElem = document.createElement("button");
    nameElem.className = "summary-name-btn";
    nameElem.innerHTML = `<strong>${entry.name}</strong>`;
    nameElem.onclick = () =>
      showFieldNotes(entry.name, entry.fieldNotes || "No notes available.");
    nameTagsDiv.appendChild(nameElem);

    // Inline tags
    const tagsSpan = document.createElement("span");
    tagsSpan.className = "summary-tags-inline";
    if (entry.type) {
      const t = document.createElement("span");
      t.className = "tag tag-" + entry.type.toLowerCase();
      t.innerText = entry.type;
      tagsSpan.appendChild(t);
    }
    if (entry.category) {
      const t = document.createElement("span");
      t.className = "tag tag-" + entry.category.toLowerCase();
      t.innerText = entry.category;
      tagsSpan.appendChild(t);
    }
    if (entry.mineralFamily) {
      const t = document.createElement("span");
      t.className = "tag tag-mineral";
      t.innerText = entry.mineralFamily;
      tagsSpan.appendChild(t);
    }
    if (entry.metamorphicIndex) {
      const t = document.createElement("span");
      t.className = "tag tag-index";
      t.innerText = "Index Mineral";
      tagsSpan.appendChild(t);
    }
    if (entry.mohsRock) {
      const t = document.createElement("span");
      t.className = "tag tag-mohs";
      t.innerText = "Mohs Hardness Scale";
      tagsSpan.appendChild(t);
    }
    if (entry.bowenSeries) {
      const t = document.createElement("span");
      t.className = "tag tag-bowen";
      t.innerText = "Bowen’s Reaction Series";
      tagsSpan.appendChild(t);
    }
    if (entry.metalOre) {
      const t = document.createElement("span");
      t.className = "tag tag-metalOre";
      t.innerText = "Metal Ore";
      tagsSpan.appendChild(t);
    }
    nameTagsDiv.appendChild(tagsSpan);
    itemDiv.appendChild(nameTagsDiv);

    // 3) Result text
    const resultElem = document.createElement("div");
    resultElem.className = "result-text";
    resultElem.innerText = entry.result || "N/A";
    itemDiv.appendChild(resultElem);

    // Append to list
    summaryList.appendChild(itemDiv);
  });
}


function resetSession() {
  showPage("review-setup");
  document.getElementById("session-count").value = "";
  document.getElementById("session-category").selectedIndex = 0;

  sessionQueue = [];
  sessionSummary = [];
  totalCorrect = 0;
  totalWrong = 0;
  updateScoreBoard();

  document.getElementById("guess").value = "";
  document.getElementById("feedback").innerText = "";

  const tagsRow = document.getElementById("tags-row");
  if (tagsRow) {
    tagsRow.innerHTML = "";
    tagsRow.classList.add("hidden");
  }
}


// ======= Search Functionality =======
function updateSearchResults() {
  const query = document.getElementById("search-bar").value.trim().toLowerCase();
  const container = document.getElementById("search-results");
  container.innerHTML = "";
  const matches = query === ""
    ? rockTypes
    : rockTypes.filter(rock =>
        rock.name.toLowerCase().includes(query)
    );

  if (matches.length === 0) {
    container.innerHTML = '<p style="color:#ce2626;margin-top:8px;">No results found.</p>';
    return;
  }
  matches.forEach(rock => {
    let imgNum = 1;
    const card = document.createElement("div");
    card.className = "search-card";
    // existing:
    const imgElem = document.createElement("img");
    imgElem.src = `images/${rock.name}1.jpg`;
    imgElem.alt = rock.name;

    // new—open gallery on click
    imgElem.style.cursor = "pointer";
    imgElem.onclick = () => showGallery(rock.name);



    const infoDiv = document.createElement("div");
    infoDiv.className = "search-info";
    const nameElem = document.createElement("button");
    nameElem.className = "search-name-btn";
    nameElem.innerText = rock.name;
    nameElem.onclick = () => {
    showFieldNotes(rock.name, rock.fieldNotes || "No notes available.");
    };
    infoDiv.appendChild(nameElem);
    // Tags row
    const tagsRow = document.createElement("div");
    tagsRow.className = "summary-tags-inline";
    if (rock.type) {
      const typeTag = document.createElement("span");
      typeTag.className = "tag tag-" + rock.type.toLowerCase();
      typeTag.innerText = rock.type;
      tagsRow.appendChild(typeTag);
    }
    if (rock.category) {
      const catTag = document.createElement("span");
      catTag.className = "tag tag-" + rock.category.toLowerCase();
      catTag.innerText = rock.category;
      tagsRow.appendChild(catTag);
    }
    if (rock.mineralFamily) {
      const famTag = document.createElement("span");
      famTag.className = "tag tag-mineral";
      famTag.innerText = rock.mineralFamily;
      tagsRow.appendChild(famTag);
    }
    if (rock.metamorphicIndex) {
      const indexTag = document.createElement("span");
      indexTag.className = "tag tag-index";
      indexTag.innerText = "Index Mineral";
      tagsRow.appendChild(indexTag);
    }
    if (rock.mohsRock) {
      const mohsTag = document.createElement("span");
      mohsTag.className = "tag tag-mohs";
      mohsTag.innerText = "Mohs Hardness Scale";
      tagsRow.appendChild(mohsTag);
    }
    
    if (rock.bowenSeries) {
      const bowenTag = document.createElement("span");
      bowenTag.className = "tag tag-bowen";
      bowenTag.innerText = "Bowen's Reaction Series";
      tagsRow.appendChild(bowenTag);
    }
    
    if (rock.metalOre) {
      const metalTag = document.createElement("span");
      metalTag.className = "tag tag-metalOre";
      metalTag.innerText = "Metal Ore";
      tagsRow.appendChild(metalTag);
    }
    infoDiv.appendChild(tagsRow);
    card.appendChild(imgElem);
    card.appendChild(infoDiv);
    container.appendChild(card);
  });
}

// ======= ROCKS DATA =======
function IgneousRock(name, fieldNotes, extra = {}) {
  return {
    name,
    type: "rock",
    category: "igneous",
    fieldNotes,
    ...extra
  };
}

function MetaRock(name, fieldNotes, extra = {}) {
  return {
    name,
    type: "rock",
    category: "metamorphic",
    fieldNotes,
    ...extra
  };
}

function SedRock(name, fieldNotes, extra = {}) {
  return {
    name,
    type: "rock",
    category: "sedimentary",
    fieldNotes,
    ...extra
  };
}

function Mineral(name, extra = {}) {
  return {
    name,
    type: "mineral",
    category: null,
    mineralFamily: null,
    metamorphicIndex: false,
    mohsRock: false,
    metalOre: false,           // new
    bowenSeries: "",
    fieldNotes: "",
    ...extra
  };
}


const rockTypes = [
    // IGNEOUS
    IgneousRock("andesite", "Fine-grained (aphanitic), gray. Often porphyritic with visible feldspar phenocrysts. Composed mainly of sodium–plagioclase and minor pyroxene/hornblende—intermediate silica (52–63 %)." ),
    IgneousRock("basalt", "Aphanitic, dark grey to black, mafic with low silica. Dense. May have vesicles; volcanic lava flows."),
    IgneousRock("diorite", "Coarse‑grained (phaneritic), salt‑and‑pepper grey, composed of plagioclase and hornblende/biotite; intrusive equivalent to andesite."),
    IgneousRock("gabbro", "Phaneritic, dark (black to dark green), calcium‑rich plagioclase and pyroxene; essentially coarse‑grained, intrusive basalt "),
    IgneousRock("granite", "Coarse-grained, pink to light gray, felsic, intrusive; abundant quartz and feldspar"),
    IgneousRock("komatiite", "Ultramafic, coarse spinifex texture, dark green to black, rich in olivine and magnesium; rare Archean lava indicating very hot mantle melts."),
    IgneousRock("obsidian", "Glassy, aphanitic, conchoidal fracture, jet-black or dark, very high silica—volcanic glass that cooled too fast for crystals."),
    IgneousRock("pegmatite", "Extremely coarse-grained intrusive rock, often over 1 cm crystals, often light-colored quartz/feldspar/mica; late-stage granitic intrusive veins."),
    IgneousRock("peridotite", "Coarse-grained ultramafic, greenish-black, abundant olivine; mantle-derived. High density "),
    IgneousRock("pumice", "Frothy, vesicular, light-colored, low density - volcanic glass from explosive eruptions."),
    IgneousRock("rhyolite", "Aphanitic to porphyritic, light-colored/pink, felsic; extrusive equivalent of granite."),
    IgneousRock("scoria", "Coarse vesicular, dark red/brown to black, basaltic composition—densely vesicular, heavier than pumice."),
    IgneousRock("tuff", "Fine to coarse volcanic ash, often layered, fragmental; may be soft, light-colored; welded or non‑welded pyroclastic rock; can become clay-rich on weathering"),

    // METAMORPHIC
    MetaRock("amphibolite", "Medium to coarse-grained, dark green to black, plagioclase + hornblende, mafic; non-foliated to weakly foliated, medium–high grade."),
    MetaRock("gneiss", "Coarse-grained with wavy, alternating light/dark bands ≥5 mm, weak foliation—not easily split but shows compositional layering "),
    MetaRock("marble", "Medium to coarse crystalline, white to colored, non‑foliated; calcite/dolomite composition—effervesces (bubbles) with acid."),
    MetaRock("phyllite", "Fine-grained, foliated with sheen from mica, between slate and schist grade; wavy foliation. Crystals aren't visible.", "Fine-grained, foliated with sheen from mica, between slate and schist grade; wavy foliation. Crystals aren't visible."),
    MetaRock("quartzite", "Very hard, non‑foliated, interlocking quartz grains, white to grey; from high-grade metamorphism. Parent rock: sandstone"),
    MetaRock("schist", "Medium-grained, schistosity present—easily split into flakes; abundant mica/platy minerals"),
    MetaRock("slate", "Very fine-grained, strong slaty cleavage, foliated, usually dark; breaks into flat sheets perpendicular to stress. Parent rock: shale."),

    // SEDIMENTARY
    SedRock("bauxite", "Clastic/chemical, earthy, reddish brown, composed of aluminum oxides—soft (~1–3 Mohs), heavy, often pisolitic (concentric circle things)."),
    SedRock("breccia", "Coarse‑grained, angular clasts in finer matrix—sediment of nearby source (proximal depositoin); hardness varies with cement."),
    SedRock("coal", "Organic, black, shiny to dull, layered—soft (<2 Mohs), burns, composed of compressed plant material."),
    SedRock("conglomerate", "Coarse-grained, rounded clasts in matrix—hardness depends on cement; clast shapes indicate transport."),
    SedRock("sandstone", "Medium-grained, gritty, colors vary from white to red/brown; hardness ~6–7 (quartz); clastic true to grain patterns."),
    SedRock("shale", "Very fine-grained, fissile, clays and silts; layers split easily; hardness ~3."),
    SedRock("chalk", "Very soft, fine-grained, white to light gray; composed mostly of microscopic coccoliths (calcareous algae); reacts vigorously with acid and easily marks paper."),
    SedRock("coquina", "Coarse-grained, loosely cemented shell fragments; highly porous and light; reacts with acid; visually obvious shell debris makes ID easy."),
    SedRock("travertine", "Crystalline to banded, dense; formed from calcium carbonate precipitation (typically in caves or hot springs); tan to white, reacts with acid, often shows layered banding or voids."),
    SedRock("oolitic", "Fine to medium-grained, composed of small spherical ooids (<2 mm), smooth sandy feel; reacts with acid; typically tan to cream colored with visible ooids under a hand lens."),

    // MINERALS
    Mineral("talc", {fieldNotes: "Mohs Hardness: 1. Soapy, greasy feel; easily scratched by fingernail, extremely soft.", mohsRock: true}),
    Mineral("gypsum", {fieldNotes: "Mohs Hardness: 2. Scratched by fingernail but resists talc; forms clear satin spar, selenite sheets, or dense alabaster.",  category: "sedimentary", mineralFamily: "sulfate", mohsRock: true }),
    Mineral("calcite", {fieldNotes: "Mohs Hardness: 3. Reacts with dilute HCl; good cleavage in three directions; scratched by a penny.", mohsRock: true}),
    Mineral("fluorite", {fieldNotes: "Mohs Hardness: 4. Octahedral cleavage, glassy luster.", mohsRock: true}),
    Mineral("apatite", {fieldNotes: "Mohs Hardness: 5. Waxy luster, often hexagonal", mohsRock: true}),
    Mineral("orthoclase", {fieldNotes: "Mohs Hardness: 6. Two cleavages at ~90°, often salmon-pink", mohsRock: true}),
    Mineral("quartz", {fieldNotes: "Mohs Hardness: 7. Hard, no cleavage, conchoidal fracture; scratches glass easily.", mohsRock: true, mineralFamily: "silicate"}),
    Mineral("topaz", {fieldNotes: "Mohs Hardness:8. Prismatic crystals, basal cleavage.", mohsRock: true}),
    Mineral("corundum", {fieldNotes: "Mohs Hardness: 9. Massive/trigonal crystals, no cleavage, sub-metallic luster", mohsRock: true}),
    Mineral("diamond", {fieldNotes: "Mohs Hardness: 10. Octahedral cleavage, adamantine luster", mohsRock: true}),
    Mineral("olivine", {bowenSeries: true}),
    Mineral("augite", {bowenSeries: true}),
    Mineral("hornblende", {bowenSeries: true}),
    Mineral("plagioclase feldspar", {bowenSeries: true}),
    Mineral("muscovite", {bowenSeries: true}),
    Mineral("potassium feldspar", {bowenSeries: true}),
    Mineral("chlorite", {metamorphicIndex: true}),
    Mineral("biotite", {metamorphicIndex: true}),
    Mineral("almandine", {metamorphicIndex: true}),
    Mineral("staurolite", {metamorphicIndex: true}),
    Mineral("kyanite", {metamorphicIndex: true}),
    Mineral("azurite", {metalOre: true}),
    Mineral("barite", {metalOre: true}),
    Mineral("beryl", {metalOre: true}),
    Mineral("celestite", {metalOre: true}),
    Mineral("copper", {metalOre: true}),
    Mineral("galena", {metalOre: true}),
    Mineral("hematite", {metalOre: true}),
    Mineral("magnetite", {metalOre: true}),
    Mineral("malachite", {metalOre: true}),
    Mineral("pyrite", {metalOre: true}),
    Mineral("sphalerite", {metalOre: true}),
    Mineral("aragonite"),
    Mineral("dolomite"),
    Mineral("epidote"),
    Mineral("graphite"),
    Mineral("halite"),
    Mineral("kaolinite"),
    Mineral("sodalite"),
    Mineral("tourmaline"),
    Mineral("ulexite"),
];




const last = localStorage.getItem('lastPage');
if (last && pages[last]) {
  showPage(last);
  if (last === 'search') updateSearchResults();
  else if (last === 'review-setup') resetSession();
} else {
  showPage("review-setup");
}
