const maxPoints = 10;
const storageKey = "buckeye-butterfly-progress";

const expectations = [
  {
    id: "cleanup",
    title: "Cleaning up",
    detail: "Materials are put away and the space is ready for the next activity.",
    icon: `<svg viewBox="0 0 24 24"><path d="M4 20h16M7 20V9h10v11M9 9V5h6v4M8 13h8M8 16h8"/></svg>`,
  },
  {
    id: "lineup",
    title: "Lining up",
    detail: "Body is calm, voice is quiet, and personal space is respected.",
    icon: `<svg viewBox="0 0 24 24"><path d="M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM16 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM8 12v7M16 12v7M4 19h16"/></svg>`,
  },
  {
    id: "walking",
    title: "Walking appropriately",
    detail: "Feet are safe, hands are managed, and the group moves together.",
    icon: `<svg viewBox="0 0 24 24"><path d="M13 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM12 9l-2 4 3 2 1 5M10 13l-3 2M14 11l3 2M8 20l3-2"/></svg>`,
  },
];

const stages = [
  {
    name: "Egg",
    minPoints: 0,
    nextAt: 3,
    message: "The journey starts small. Keep noticing the first successful routines.",
    art: eggArt,
  },
  {
    name: "Caterpillar",
    minPoints: 3,
    nextAt: 6,
    message: "Steady practice is showing. The caterpillar is growing with each expectation met.",
    art: caterpillarArt,
  },
  {
    name: "Cocoon",
    minPoints: 6,
    nextAt: 10,
    message: "The routines are becoming more independent. Big change is building inside the cocoon.",
    art: cocoonArt,
  },
  {
    name: "Buckeye Butterfly",
    minPoints: 10,
    nextAt: 10,
    message: "The classroom routines are blooming. The Buckeye butterfly has emerged.",
    art: butterflyArt,
  },
];

const state = loadState();
const today = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const grid = document.querySelector("#expectationGrid");
const template = document.querySelector("#expectationTemplate");
const stageArt = document.querySelector("#stageArt");
const stageName = document.querySelector("#stageName");
const stageMessage = document.querySelector("#stageMessage");
const totalPoints = document.querySelector("#totalPoints");
const todayPoints = document.querySelector("#todayPoints");
const bestExpectation = document.querySelector("#bestExpectation");
const nextGoal = document.querySelector("#nextGoal");
const progressFill = document.querySelector("#progressFill");
const studentName = document.querySelector("#studentName");
const rewardModal = document.querySelector("#rewardModal");

studentName.value = state.studentName;

expectations.forEach((expectation) => {
  const card = template.content.firstElementChild.cloneNode(true);
  card.dataset.id = expectation.id;
  card.querySelector(".expectation-icon").innerHTML = expectation.icon;
  card.querySelector("h3").textContent = expectation.title;
  card.querySelector("p").textContent = expectation.detail;
  card.querySelector("button").setAttribute("aria-label", `Add point for ${expectation.title}`);
  grid.append(card);
});

grid.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const card = button.closest(".expectation-card");
  addPoint(card.dataset.id);
});

studentName.addEventListener("input", () => {
  state.studentName = studentName.value.trim() || "Student";
  saveState();
  render();
});

document.querySelector("#resetDay").addEventListener("click", () => {
  state.todayPoints = 0;
  expectations.forEach(({ id }) => {
    state.expectations[id] = 0;
  });
  state.log.unshift({ type: "reset", text: "Today was reset", time: timeNow() });
  trimLog();
  saveState();
  render();
});

document.querySelector("#resetJourney").addEventListener("click", () => {
  state.totalPoints = 0;
  state.todayPoints = 0;
  expectations.forEach(({ id }) => {
    state.expectations[id] = 0;
  });
  state.log.unshift({ type: "reset", text: "A new Buckeye butterfly journey started", time: timeNow() });
  trimLog();
  saveState();
  render();
});

document.querySelector("#closeReward").addEventListener("click", () => {
  rewardModal.hidden = true;
});

rewardModal.addEventListener("click", (event) => {
  if (event.target === rewardModal) {
    rewardModal.hidden = true;
  }
});

render();

function addPoint(id) {
  if (state.totalPoints >= maxPoints) {
    state.log.unshift({
      type: "complete",
      text: `${state.studentName} has already earned the Buckeye butterfly`,
      time: timeNow(),
    });
    trimLog();
    saveState();
    render();
    return;
  }

  const expectation = expectations.find((item) => item.id === id);
  state.totalPoints = Math.min(maxPoints, state.totalPoints + 1);
  state.todayPoints += 1;
  state.expectations[id] += 1;
  state.log.unshift({
    type: "point",
    text: `${state.studentName} earned a point for ${expectation.title.toLowerCase()}`,
    time: timeNow(),
  });
  trimLog();
  saveState();
  render();
  if (state.totalPoints === maxPoints) {
    rewardModal.hidden = false;
  }
}

function render() {
  state.totalPoints = Math.min(maxPoints, state.totalPoints);
  const stageIndex = stages.findLastIndex((stage) => state.totalPoints >= stage.minPoints);
  const stage = stages[stageIndex];
  stageArt.innerHTML = stage.art();
  stageName.textContent = stage.name;
  stageMessage.textContent = stage.message;
  totalPoints.textContent = state.totalPoints;
  todayPoints.textContent = state.todayPoints;
  progressFill.style.width = `${(state.totalPoints / maxPoints) * 100}%`;

  const remaining = stageIndex === stages.length - 1 ? 0 : stage.nextAt - state.totalPoints;
  nextGoal.textContent = remaining;

  const best = expectations
    .map((item) => ({ ...item, count: state.expectations[item.id] }))
    .sort((a, b) => b.count - a.count)[0];
  bestExpectation.textContent = best.count > 0 ? best.title : "-";

  document.querySelectorAll(".expectation-card").forEach((card) => {
    card.querySelector("strong").textContent = state.expectations[card.dataset.id];
  });

}

function loadState() {
  const fallback = {
    studentName: "Avery",
    totalPoints: 0,
    todayPoints: 0,
    expectations: { cleanup: 0, lineup: 0, walking: 0 },
    log: [],
  };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(storageKey)) };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function trimLog() {
  state.log = state.log.slice(0, 30);
}

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function eggArt() {
  return `<svg viewBox="0 0 400 400" role="img" aria-label="Buckeye butterfly egg on a leaf">
    <defs>
      <radialGradient id="eggShell" cx="38%" cy="28%" r="72%">
        <stop offset="0" stop-color="#fffce9"/>
        <stop offset="0.55" stop-color="#efe1a2"/>
        <stop offset="1" stop-color="#caa75d"/>
      </radialGradient>
      <linearGradient id="leafGradEgg" x1="58" x2="343" y1="260" y2="112">
        <stop offset="0" stop-color="#245942"/>
        <stop offset="0.55" stop-color="#3d805d"/>
        <stop offset="1" stop-color="#6fa465"/>
      </linearGradient>
    </defs>
    <path d="M58 266C118 159 236 103 351 118c-36 89-131 175-293 148Z" fill="url(#leafGradEgg)"/>
    <path class="leaf-vein" d="M91 248c73-49 148-84 225-113" fill="none" stroke="#d6e5b7" stroke-width="8" stroke-linecap="round"/>
    <g class="life-stage">
      <ellipse cx="204" cy="184" rx="50" ry="67" fill="url(#eggShell)" stroke="#a98549" stroke-width="5"/>
      <path d="M183 126c-10 42-10 79 0 118M205 119c-8 47-8 92 0 132M227 130c8 38 8 74 0 108" stroke="#d7bf75" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <path d="M164 168c28 8 56 9 83 1M162 190c31 8 62 8 92 0M169 213c25 6 51 6 76 0" stroke="#e6d592" stroke-width="4" stroke-linecap="round" fill="none"/>
      <circle cx="184" cy="156" r="6" fill="#fff8d8" opacity=".72"/>
    </g>
  </svg>`;
}

function caterpillarArt() {
  return `<svg viewBox="0 0 400 400" role="img" aria-label="Buckeye caterpillar with dark body and orange branching spines">
    <defs>
      <linearGradient id="leafGradCat" x1="49" x2="361" y1="276" y2="174">
        <stop offset="0" stop-color="#214e3b"/>
        <stop offset=".55" stop-color="#3e7a55"/>
        <stop offset="1" stop-color="#8baa5f"/>
      </linearGradient>
      <linearGradient id="catBody" x1="76" x2="325" y1="182" y2="223">
        <stop offset="0" stop-color="#1a1c1d"/>
        <stop offset=".3" stop-color="#090b0d"/>
        <stop offset=".68" stop-color="#161718"/>
        <stop offset="1" stop-color="#312018"/>
      </linearGradient>
      <radialGradient id="catHighlight" cx="34%" cy="22%" r="80%">
        <stop offset="0" stop-color="#5b676d" stop-opacity=".78"/>
        <stop offset=".62" stop-color="#202429" stop-opacity=".18"/>
        <stop offset="1" stop-color="#111" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="orangeBase" cx="38%" cy="35%" r="65%">
        <stop offset="0" stop-color="#ffb15a"/>
        <stop offset=".58" stop-color="#db6d27"/>
        <stop offset="1" stop-color="#7f2f18"/>
      </radialGradient>
      <radialGradient id="segmentSheen" cx="35%" cy="24%" r="78%">
        <stop offset="0" stop-color="#5e6a70" stop-opacity=".9"/>
        <stop offset=".34" stop-color="#20252a" stop-opacity=".28"/>
        <stop offset="1" stop-color="#050607" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <path d="M39 269c89-91 204-117 325-79-63 75-180 117-325 79Z" fill="url(#leafGradCat)"/>
    <path class="leaf-vein" d="M77 258c78-33 161-54 249-61" fill="none" stroke="#d8e7b5" stroke-width="8" stroke-linecap="round"/>
    <g class="life-stage">
      <g stroke="#050607" stroke-width="4.5">
        <ellipse cx="92" cy="226" rx="25" ry="33" fill="url(#catBody)" transform="rotate(-18 92 226)"/>
        <ellipse cx="119" cy="213" rx="30" ry="42" fill="url(#catBody)" transform="rotate(-18 119 213)"/>
        <ellipse cx="151" cy="203" rx="33" ry="48" fill="url(#catBody)" transform="rotate(-13 151 203)"/>
        <ellipse cx="187" cy="199" rx="34" ry="50" fill="url(#catBody)" transform="rotate(-5 187 199)"/>
        <ellipse cx="224" cy="204" rx="34" ry="48" fill="url(#catBody)" transform="rotate(7 224 204)"/>
        <ellipse cx="260" cy="216" rx="33" ry="43" fill="url(#catBody)" transform="rotate(16 260 216)"/>
        <ellipse cx="294" cy="232" rx="30" ry="36" fill="url(#catBody)" transform="rotate(24 294 232)"/>
      </g>
      <g opacity=".72">
        <ellipse cx="92" cy="226" rx="22" ry="29" fill="url(#segmentSheen)" transform="rotate(-18 92 226)"/>
        <ellipse cx="119" cy="213" rx="26" ry="37" fill="url(#segmentSheen)" transform="rotate(-18 119 213)"/>
        <ellipse cx="151" cy="203" rx="29" ry="42" fill="url(#segmentSheen)" transform="rotate(-13 151 203)"/>
        <ellipse cx="187" cy="199" rx="30" ry="44" fill="url(#segmentSheen)" transform="rotate(-5 187 199)"/>
        <ellipse cx="224" cy="204" rx="30" ry="42" fill="url(#segmentSheen)" transform="rotate(7 224 204)"/>
        <ellipse cx="260" cy="216" rx="29" ry="38" fill="url(#segmentSheen)" transform="rotate(16 260 216)"/>
        <ellipse cx="294" cy="232" rx="26" ry="32" fill="url(#segmentSheen)" transform="rotate(24 294 232)"/>
      </g>

      <path d="M93 204c61 16 151 27 221 31M96 232c58 20 137 29 210 20" stroke="#efe2c4" stroke-width="4" stroke-linecap="round" fill="none" opacity=".9"/>
      <path d="M109 190c54 16 130 25 195 31M112 221c51 16 121 24 184 20" stroke="#d86f2a" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".9"/>

      <g fill="url(#orangeBase)" stroke="#3d160d" stroke-width="1.5">
        <circle cx="99" cy="202" r="6.5"/><circle cx="125" cy="187" r="7"/><circle cx="156" cy="179" r="7"/><circle cx="190" cy="177" r="7"/><circle cx="225" cy="184" r="7"/><circle cx="260" cy="198" r="7"/><circle cx="293" cy="217" r="7"/>
        <circle cx="94" cy="234" r="5.8"/><circle cx="126" cy="244" r="6"/><circle cx="163" cy="250" r="6"/><circle cx="202" cy="253" r="6"/><circle cx="241" cy="250" r="6"/><circle cx="279" cy="241" r="6"/><circle cx="311" cy="229" r="5.8"/>
      </g>

      <g fill="#e9dfc8" opacity=".95">
        <circle cx="84" cy="216" r="3"/><circle cx="112" cy="211" r="3"/><circle cx="143" cy="209" r="3"/><circle cx="176" cy="211" r="3"/><circle cx="211" cy="216" r="3"/><circle cx="247" cy="224" r="3"/><circle cx="284" cy="232" r="3"/>
        <circle cx="107" cy="249" r="2.5"/><circle cx="145" cy="258" r="2.5"/><circle cx="184" cy="262" r="2.5"/><circle cx="225" cy="261" r="2.5"/><circle cx="265" cy="254" r="2.5"/><circle cx="299" cy="241" r="2.5"/>
      </g>

      <g stroke="#08090a" stroke-width="5" stroke-linecap="round" fill="none">
        <path d="M99 202c-12-27-25-45-43-58M125 187c-8-32-20-54-38-74M156 179c-5-36-14-61-28-86M190 177c-2-38-8-64-21-90M225 184c5-37 15-62 31-86M260 198c11-32 25-54 47-70M293 217c18-25 38-41 62-50"/>
        <path d="M94 234c-13 20-27 34-44 45M126 244c-10 24-23 41-40 53M163 250c-7 26-17 45-31 59M202 253c-3 27-9 48-20 65M241 250c5 26 4 47-4 66M279 241c12 23 18 43 18 64M311 229c18 18 29 35 35 53"/>
      </g>
      <g stroke="#24404f" stroke-width="3.2" stroke-linecap="round" fill="none">
        <path d="M99 202c-20-10-36-13-56-8M125 187c-21-12-39-17-61-16M156 179c-20-16-38-24-61-27M190 177c-18-18-36-28-59-33M225 184c19-19 38-29 63-33M260 198c22-16 43-22 69-20M293 217c24-9 44-10 68-3"/>
        <path d="M94 234c-22 0-39 6-56 19M126 244c-22 4-39 13-54 29M163 250c-20 9-34 22-45 40M202 253c18 13 29 29 35 50M241 250c21 10 36 25 47 48M279 241c24 6 42 18 57 36M311 229c24 1 43 9 61 26"/>
      </g>

      <path d="M78 246c-8 12-18 21-30 28M109 261c-7 14-16 25-28 34M147 270c-4 15-11 28-21 39M188 275c-1 16-6 30-14 43M231 273c4 16 4 31-1 45M272 264c10 13 15 28 15 43M307 247c14 11 23 24 28 39" stroke="#f28a33" stroke-width="5" stroke-linecap="round"/>

      <path d="M306 196c22 3 41 19 49 41-8 16-26 25-50 23 11-20 12-43 1-64Z" fill="#d8732a" stroke="#090909" stroke-width="5"/>
      <path d="M313 205c12 7 23 18 32 32M314 239c11 4 23 4 35-1" stroke="#6f2715" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="336" cy="222" r="4.5" fill="#f3d27f"/>
      <circle cx="338" cy="222" r="2.4" fill="#08090a"/>
      <path d="M337 201c6-18 15-31 28-41M349 211c13-12 27-20 44-25" stroke="#08090a" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M337 201c9-5 17-6 26-4M349 211c10 0 18 3 27 9" stroke="#24404f" stroke-width="3" stroke-linecap="round"/>
    </g>
  </svg>`;
}

function cocoonArt() {
  return `<svg viewBox="0 0 400 400" role="img" aria-label="Buckeye chrysalis hanging from a branch">
    <defs>
      <linearGradient id="twig" x1="73" x2="334" y1="91" y2="106">
        <stop offset="0" stop-color="#4b3426"/>
        <stop offset=".5" stop-color="#7b5637"/>
        <stop offset="1" stop-color="#3f2b21"/>
      </linearGradient>
      <linearGradient id="chrysalis" x1="155" x2="299" y1="132" y2="320">
        <stop offset="0" stop-color="#caa75e"/>
        <stop offset=".4" stop-color="#8f7b46"/>
        <stop offset="1" stop-color="#5f5f3d"/>
      </linearGradient>
    </defs>
    <path d="M80 94c70-28 164-26 251 8" stroke="#59412f" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M80 94c70-28 164-26 251 8" stroke="url(#twig)" stroke-width="16" stroke-linecap="round" fill="none"/>
    <g class="life-stage">
      <path d="M214 103c-12 36-28 59-46 82" stroke="#6f4d31" stroke-width="7" stroke-linecap="round"/>
      <path d="M160 188c8-49 40-76 78-68 46 10 68 53 59 110-11 73-59 115-105 104-41-11-50-83-32-146Z" fill="url(#chrysalis)" stroke="#4e4b31" stroke-width="7"/>
      <path d="M182 138c16 22 45 31 82 27M172 188c30 14 73 19 111 7M163 228c37 17 84 19 130 3M176 278c27 13 61 14 94 0" stroke="#d3b56e" stroke-width="5" stroke-linecap="round" fill="none" opacity=".75"/>
      <path d="M210 121c-22 54-25 122-8 206M244 138c22 52 25 111 8 176" stroke="#4c4b32" stroke-width="4" stroke-linecap="round" fill="none" opacity=".48"/>
      <circle cx="194" cy="173" r="4" fill="#e9d084"/><circle cx="256" cy="201" r="4" fill="#e9d084"/><circle cx="209" cy="258" r="3.5" fill="#e9d084"/>
    </g>
  </svg>`;
}

function butterflyArt() {
  return `<svg viewBox="0 0 400 400" role="img" aria-label="Buckeye butterfly with brown wings and eyespots">
    <defs>
      <radialGradient id="foreWing" cx="52%" cy="48%" r="74%">
        <stop offset="0" stop-color="#8b5734"/>
        <stop offset=".55" stop-color="#5f3929"/>
        <stop offset="1" stop-color="#2b211d"/>
      </radialGradient>
      <radialGradient id="hindWing" cx="48%" cy="40%" r="82%">
        <stop offset="0" stop-color="#8a5134"/>
        <stop offset=".64" stop-color="#673c2b"/>
        <stop offset="1" stop-color="#2a201b"/>
      </radialGradient>
      <radialGradient id="eyeSpotBlue" cx="42%" cy="38%" r="64%">
        <stop offset="0" stop-color="#9fd4dd"/>
        <stop offset=".45" stop-color="#486e8a"/>
        <stop offset="1" stop-color="#15120f"/>
      </radialGradient>
    </defs>
    <g class="butterfly-wings">
      <path d="M199 162C151 67 64 75 47 161c-18 91 62 124 151 67Z" fill="url(#foreWing)" stroke="#1f1714" stroke-width="6"/>
      <path d="M201 162c48-95 135-87 152-1 18 91-62 124-151 67Z" fill="url(#foreWing)" stroke="#1f1714" stroke-width="6"/>
      <path d="M195 224c-58 85-128 78-143 21-15-59 58-86 143-73Z" fill="url(#hindWing)" stroke="#1f1714" stroke-width="6"/>
      <path d="M205 224c58 85 128 78 143 21 15-59-58-86-143-73Z" fill="url(#hindWing)" stroke="#1f1714" stroke-width="6"/>
      <path d="M74 128c42 37 85 55 126 58M326 128c-42 37-85 55-126 58M79 284c44-30 86-51 121-60M321 284c-44-30-86-51-121-60" stroke="#e0a23a" stroke-width="7" stroke-linecap="round" fill="none" opacity=".95"/>
      <path d="M78 151c37 24 76 39 119 44M322 151c-37 24-76 39-119 44M88 236c36 5 72 3 108-8M312 236c-36 5-72 3-108-8" stroke="#d9d0b4" stroke-width="5" stroke-linecap="round" fill="none" opacity=".88"/>
      <path d="M95 102c26 51 63 92 105 126M305 102c-26 51-63 92-105 126" stroke="#2a1f1a" stroke-width="4" stroke-linecap="round" fill="none" opacity=".68"/>
      <circle cx="119" cy="163" r="31" fill="#c36d2d"/><circle cx="119" cy="163" r="22" fill="#15120f"/><circle cx="119" cy="163" r="11" fill="url(#eyeSpotBlue)"/><circle cx="114" cy="157" r="4" fill="#e6d9b7"/>
      <circle cx="281" cy="163" r="31" fill="#c36d2d"/><circle cx="281" cy="163" r="22" fill="#15120f"/><circle cx="281" cy="163" r="11" fill="url(#eyeSpotBlue)"/><circle cx="276" cy="157" r="4" fill="#e6d9b7"/>
      <circle cx="125" cy="250" r="23" fill="#d59b36"/><circle cx="125" cy="250" r="15" fill="#15120f"/><circle cx="125" cy="250" r="6" fill="#627e91"/>
      <circle cx="275" cy="250" r="23" fill="#d59b36"/><circle cx="275" cy="250" r="15" fill="#15120f"/><circle cx="275" cy="250" r="6" fill="#627e91"/>
      <path d="M54 174c45 12 91 17 138 15M346 174c-45 12-91 17-138 15" stroke="#241916" stroke-width="5" stroke-linecap="round" opacity=".55"/>
    </g>
    <ellipse cx="200" cy="205" rx="15" ry="75" fill="#201817"/>
    <path d="M190 154c6-13 14-20 24-20M189 182c8 6 16 9 24 0M188 217c8 6 17 6 25 0M190 249c7 6 14 7 22 0" stroke="#6c5648" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path class="antenna" d="M194 137c-20-42-47-60-80-67M206 137c20-42 47-60 80-67" stroke="#211714" stroke-width="5" stroke-linecap="round" fill="none"/>
    <circle cx="113" cy="70" r="4" fill="#211714"/><circle cx="287" cy="70" r="4" fill="#211714"/>
  </svg>`;
}
