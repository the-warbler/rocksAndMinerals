// ======= App State =======
let sessionQueue = [];
let totalCorrect = 0;
let totalWrong = 0;
let sessionSummary = [];
const numImagesPerRock = 2;
let showTags = false;
let currentPage = "review-setup";

// ======= DOM Elements =======
const pages = {
  "review-setup": document.getElementById("review-setup-page"),
  "review": document.getElementById("review-page"),
  "summary": document.getElementById("summary-page"),
  "search": document.getElementById("search-page"),
};
const navBtns = document.querySelectorAll(".nav-btn");

// ======= Navigation Logic =======
function showPage(pageName) {
  for (let key in pages) {
    pages[key].style.display = key === pageName ? "block" : "none";
  }
  navBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  });
  currentPage = pageName;
}
navBtns.forEach(btn => {
  btn.addEventListener("click", e => {
    showPage(btn.dataset.page);
    if (btn.dataset.page === "review-setup") {
      resetSession();
    }
  });
});
showPage("review-setup");

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

// ======= Search Logic =======
document.getElementById("search-bar").addEventListener("input", updateSearchResults);

// ======= Core Functions =======
function updateScoreBoard() {
  document.getElementById("correct-count").innerText = totalCorrect;
  document.getElementById("wrong-count").innerText = totalWrong;
}
function updateTags() {
  const tagsContainer = document.getElementById("tags-container");
  tagsContainer.innerHTML = "";
  if (sessionQueue.length === 0) return;
  const summary = sessionQueue[0].summary;
  const tags = [];
  if (summary.type) tags.push({ text: summary.type, type: summary.type.toLowerCase() });
  if (summary.category) tags.push({ text: summary.category, type: summary.category.toLowerCase() });
  if (summary.mineralFamily) tags.push({ text: summary.mineralFamily, type: "mineral" });
  if (summary.metamorphicIndex) tags.push({ text: "Index Mineral", type: "index" });
  if (summary.mohsRock) tags.push({ text: "Mohs Hardness Scale", type: "mohs" });
  tags.forEach(tagObj => {
    const span = document.createElement("span");
    span.className = "tag tag-" + tagObj.type;
    span.innerText = tagObj.text;
    tagsContainer.appendChild(span);
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
    
  if (sessionQueue.length === 0) {
    showSummary();

    return;
  }
  const rock = sessionQueue[0];
  document.getElementById("rock-image").src = rock.image;
  document.getElementById("guess").value = "";
  const feedback = document.getElementById("feedback");
  feedback.innerText = "";
  feedback.className = "";
  renderTags(); // Always update the reserved tag area
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
      totalCorrect++;
      feedback.className = "correct";
    } else {
      message = `Correct after ${currentRock.attemptCount} tries`;
      totalWrong++;
      feedback.className = "correct";
    }
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
    feedback.innerText = "Incorrect, try again.";
    feedback.className = "incorrect flash";
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
    image: summaryEntry.image,
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
      const fam = rock.mineralFamily ? rock.mineralFamily.toLowerCase() : "";
      const index = rock.metamorphicIndex ? "index" : "";
      const mohs = rock.mohsRock ? "mohs" : "";
      const type = rock.type ? rock.type.toLowerCase() : "";
      return selectedOptions.includes(cat) ||
        selectedOptions.includes(fam) ||
        selectedOptions.includes(index) ||
        selectedOptions.includes(mohs) ||
        selectedOptions.includes(type);
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
  let uniqueRocks = availableRocks.slice();
  uniqueRocks.sort(() => Math.random() - 0.5);
  uniqueRocks = uniqueRocks.slice(0, sessionCount);
  uniqueRocks.forEach(rock => {
    let imgNum = Math.floor(Math.random() * numImagesPerRock) + 1;
    const summaryEntry = {
      name: rock.name,
      image: `images/${rock.name}${imgNum}.jpg`,
      result: "",
      type: rock.type || "",
      category: rock.category || "",
      mineralFamily: rock.mineralFamily || "",
      metamorphicIndex: rock.metamorphicIndex || false,
      mohsRock: rock.mohsRock || false
    };
    sessionSummary.push(summaryEntry);
    sessionQueue.push(createRockInstance(summaryEntry));
  });
  showPage("review");
  showTags = false;
  document.getElementById("tags-container").style.display = "none";
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
    const imgElem = document.createElement("img");
    imgElem.src = entry.image;
    imgElem.alt = entry.name;
    // Container for name and tags on one line.
    const nameTagsDiv = document.createElement("div");
    nameTagsDiv.className = "summary-name-tags";
    // Bolded name.
    const nameElem = document.createElement("span");
    nameElem.innerHTML = `<strong>${entry.name}</strong>`;
    nameTagsDiv.appendChild(nameElem);
    // Inline tags container.
    const tagsSpan = document.createElement("span");
    tagsSpan.className = "summary-tags-inline";
    // Tag for type.
    if (entry.type) {
      const typeTag = document.createElement("span");
      typeTag.className = "tag tag-" + entry.type.toLowerCase();
      typeTag.innerText = entry.type;
      tagsSpan.appendChild(typeTag);
    }
    // Tag for category.
    if (entry.category) {
      const catTag = document.createElement("span");
      catTag.className = "tag tag-" + entry.category.toLowerCase();
      catTag.innerText = entry.category;
      tagsSpan.appendChild(catTag);
    }
    // Tag for mineral family.
    if (entry.mineralFamily) {
      const famTag = document.createElement("span");
      famTag.className = "tag tag-mineral";
      famTag.innerText = entry.mineralFamily;
      tagsSpan.appendChild(famTag);
    }
    // Tag for index minerals.
    if (entry.metamorphicIndex) {
      const indexTag = document.createElement("span");
      indexTag.className = "tag tag-index";
      indexTag.innerText = "Index Mineral";
      tagsSpan.appendChild(indexTag);
    }
    // Tag for Mohs.
    if (entry.mohsRock) {
      const mohsTag = document.createElement("span");
      mohsTag.className = "tag tag-mohs";
      mohsTag.innerText = "Mohs Hardness Scale";
      tagsSpan.appendChild(mohsTag);
    }
    nameTagsDiv.appendChild(tagsSpan);
    const resultElem = document.createElement("div");
    resultElem.className = "result-text";
    resultElem.innerText = entry.result ? entry.result : "N/A";
    itemDiv.appendChild(imgElem);
    itemDiv.appendChild(nameTagsDiv);
    itemDiv.appendChild(resultElem);
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
  document.getElementById("tags-container").innerHTML = "";
}

// ======= Search Functionality =======
function updateSearchResults() {
  const query = document.getElementById("search-bar").value.trim().toLowerCase();
  const container = document.getElementById("search-results");
  container.innerHTML = "";
  if (!query) return;
  const matches = rockTypes.filter(rock =>
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
    const imgElem = document.createElement("img");
    imgElem.src = `images/${rock.name}${imgNum}.jpg`;
    imgElem.alt = rock.name;
    const infoDiv = document.createElement("div");
    infoDiv.className = "search-info";
    const nameElem = document.createElement("strong");
    nameElem.innerText = rock.name;
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
    infoDiv.appendChild(tagsRow);
    card.appendChild(imgElem);
    card.appendChild(infoDiv);
    container.appendChild(card);
  });
}

// ======= ROCKS DATA =======
const rockTypes = [
  // IGNEOUS
  { name: "andesite", type: "rock", category: "igneous" },
  { name: "basalt", type: "rock", category: "igneous" },
  { name: "diorite", type: "rock", category: "igneous" },
  { name: "gabbro", type: "rock", category: "igneous" },
  { name: "granite", type: "rock", category: "igneous" },
  { name: "pegmatite", type: "rock", category: "igneous" },
  { name: "peridotite", type: "rock", category: "igneous" },
  { name: "rhyolite", type: "rock", category: "igneous", mineralFamily: "silicate" },
  { name: "scoria", type: "rock", category: "igneous" },
  // METAMORPHIC
  { name: "amphibolite", type: "rock", category: "metamorphic" },
  { name: "gneiss", type: "rock", category: "metamorphic" },
  { name: "marble", type: "rock", category: "metamorphic", mineralFamily: "carbonate" },
  { name: "phyllite", type: "rock", category: "metamorphic", mineralFamily: "silicate" },
  { name: "quartzite", type: "rock", category: "metamorphic" },
  { name: "schist", type: "rock", category: "metamorphic" },
  // SEDIMENTARY
  { name: "bauxite", type: "rock", category: "sedimentary" },
  { name: "breccia", type: "rock", category: "sedimentary" },
  { name: "limestone", type: "rock", category: "sedimentary", mineralFamily: "carbonate", metamorphicIndex: false },
  { name: "shale", type: "rock", category: "sedimentary" },
  // MINERALS
  { name: "gypsum", type: "mineral", category: "sedimentary", mineralFamily: "sulfate", mohsRock: true },
  { name: "quartz", type: "mineral", mineralFamily: "silicate" }
];
