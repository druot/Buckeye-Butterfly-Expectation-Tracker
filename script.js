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
  {
    id: "work",
    title: "Completes work",
    detail: "Assignments are finished with effort and turned in when expected.",
    icon: `<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6V3Z"/><path d="M14 3v4h4M9 13l2 2 4-5"/></svg>`,
  },
  {
    id: "directions",
    title: "Follows Directions",
    detail: "Directions are heard, started, and followed the first time.",
    icon: `<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6M5 6h4M5 18h4"/></svg>`,
  },
  {
    id: "safeBody",
    title: "Safe Body",
    detail: "Hands, feet, and movement are safe for self and others.",
    icon: `<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/><path d="M9 12l2 2 4-5"/></svg>`,
  },
];

const stages = [
  {
    name: "Egg",
    minPoints: 0,
    nextAt: 3,
    message: "Earn 10 points to unlock break time. The Buckeye journey starts small.",
    art: eggArt,
  },
  {
    name: "Caterpillar",
    minPoints: 3,
    nextAt: 6,
    message: "Steady practice is showing. Keep building toward break time.",
    art: caterpillarArt,
  },
  {
    name: "Cocoon",
    minPoints: 6,
    nextAt: 10,
    message: "The goal is close. A few more expectations unlock the break.",
    art: cocoonArt,
  },
  {
    name: "Buckeye Butterfly",
    minPoints: 10,
    nextAt: 10,
    message: "Break time is earned. Close the popup to start working toward the next break.",
    art: butterflyArt,
  },
];

const state = loadState();

const grid = document.querySelector("#expectationGrid");
const template = document.querySelector("#expectationTemplate");
const stageArt = document.querySelector("#stageArt");
const stageName = document.querySelector("#stageName");
const stageMessage = document.querySelector("#stageMessage");
const totalPoints = document.querySelector("#totalPoints");
const todayPoints = document.querySelector("#todayPoints");
const breakCount = document.querySelector("#breakCount");
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
  state.totalPoints = 0;
  state.todayPoints = 0;
  state.breaksEarned = 0;
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
  state.breaksEarned = 0;
  expectations.forEach(({ id }) => {
    state.expectations[id] = 0;
  });
  state.log.unshift({ type: "reset", text: "A new break cycle started", time: timeNow() });
  trimLog();
  saveState();
  render();
});

document.querySelector("#closeReward").addEventListener("click", () => {
  startNextBreakCycle();
});

rewardModal.addEventListener("click", (event) => {
  if (event.target === rewardModal) {
    startNextBreakCycle();
  }
});

render();
if (state.totalPoints >= maxPoints) {
  rewardModal.hidden = false;
}

function addPoint(id) {
  if (state.totalPoints >= maxPoints) {
    rewardModal.hidden = false;
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
    state.breaksEarned += 1;
    state.log.unshift({ type: "reward", text: `${state.studentName} earned break time`, time: timeNow() });
    trimLog();
    saveState();
    render();
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
  breakCount.textContent = state.breaksEarned;
  progressFill.style.width = `${(state.totalPoints / maxPoints) * 100}%`;

  const remaining = maxPoints - state.totalPoints;
  nextGoal.textContent = remaining;

  document.querySelectorAll(".expectation-card").forEach((card) => {
    card.querySelector("strong").textContent = state.expectations[card.dataset.id];
  });

}

function startNextBreakCycle() {
  rewardModal.hidden = true;
  state.totalPoints = 0;
  expectations.forEach(({ id }) => {
    state.expectations[id] = 0;
  });
  saveState();
  render();
}

function loadState() {
  const fallback = {
    studentName: "Avery",
    totalPoints: 0,
    todayPoints: 0,
    breaksEarned: 0,
    expectations: createExpectationCounts(),
    log: [],
  };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey)) || {};
    return {
      ...fallback,
      ...saved,
      totalPoints: Math.min(maxPoints, saved.totalPoints ?? fallback.totalPoints),
      breaksEarned: saved.breaksEarned ?? fallback.breaksEarned,
      expectations: {
        ...createExpectationCounts(),
        ...(saved.expectations || {}),
      },
    };
  } catch {
    return fallback;
  }
}

function createExpectationCounts() {
  return Object.fromEntries(expectations.map(({ id }) => [id, 0]));
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

function eggArt() {
  return `<svg viewBox="0 0 400 400" role="img" aria-label="Realistic Buckeye butterfly egg on a host plant leaf">
    <defs>
      <filter id="eggTexture" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="8"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 .18"/>
        </feComponentTransfer>
        <feBlend mode="multiply" in2="SourceGraphic"/>
      </filter>
      <radialGradient id="eggShell" cx="38%" cy="28%" r="72%">
        <stop offset="0" stop-color="#fffce9"/>
        <stop offset="0.42" stop-color="#f1e7a9"/>
        <stop offset="0.78" stop-color="#d6bd70"/>
        <stop offset="1" stop-color="#a67e43"/>
      </radialGradient>
      <linearGradient id="leafGradEgg" x1="58" x2="343" y1="260" y2="112">
        <stop offset="0" stop-color="#1f513d"/>
        <stop offset="0.55" stop-color="#3d805d"/>
        <stop offset="1" stop-color="#85ad67"/>
      </linearGradient>
    </defs>
    <path d="M48 273C104 158 232 96 358 114c-39 95-145 184-310 159Z" fill="url(#leafGradEgg)"/>
    <path d="M70 261c74-49 154-88 253-127" fill="none" stroke="#bdd59a" stroke-width="13" stroke-linecap="round" opacity=".42"/>
    <path class="leaf-vein" d="M83 254c76-51 155-88 240-120" fill="none" stroke="#e0edbd" stroke-width="7" stroke-linecap="round"/>
    <path d="M127 220c-12-26-27-43-48-58M179 194c-9-28-23-49-42-66M231 171c-5-31-14-54-30-75M281 149c0-24-5-43-14-59" stroke="#c9dfa4" stroke-width="3" stroke-linecap="round" opacity=".5"/>
    <g class="life-stage">
      <ellipse cx="202" cy="184" rx="48" ry="70" fill="url(#eggShell)" stroke="#8d6b3d" stroke-width="4"/>
      <ellipse cx="202" cy="184" rx="48" ry="70" fill="#fff3bd" filter="url(#eggTexture)" opacity=".55"/>
      <path d="M174 128c-9 44-9 82 0 123M188 118c-7 50-7 96 0 137M203 114c-5 53-5 102 0 143M219 119c7 49 7 94 0 133M233 131c10 40 10 77 0 112" stroke="#c6a85d" stroke-width="2.8" stroke-linecap="round" fill="none" opacity=".9"/>
      <path d="M161 158c28 10 58 12 87 4M156 179c34 10 67 11 99 2M159 201c33 9 66 9 97 0M169 224c24 7 48 7 72 0" stroke="#ead990" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".8"/>
      <path d="M181 139c11-10 25-14 40-9" stroke="#fff9d8" stroke-width="6" stroke-linecap="round" opacity=".68"/>
      <circle cx="184" cy="155" r="5" fill="#fffbe6" opacity=".85"/>
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
      <filter id="larvaTexture" x="-15%" y="-20%" width="130%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="31"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 .16"/>
        </feComponentTransfer>
        <feBlend mode="multiply" in2="SourceGraphic"/>
      </filter>
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
      <path d="M73 221c18-37 61-62 110-64 45-2 97 10 131 35 19 14 30 30 31 48-30 25-84 35-137 29-63-8-113-25-135-48Z" fill="#313131" filter="url(#larvaTexture)" opacity=".5"/>

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
      <g stroke="#e7dac0" stroke-width="1.4" stroke-linecap="round" opacity=".6">
        <path d="M100 194l-9-8M132 184l-8-10M165 177l-6-11M199 177l-3-12M235 187l4-12M270 202l8-10M299 221l11-7"/>
        <path d="M90 240l-11 6M126 251l-11 9M164 257l-8 11M205 260l-3 12M246 257l6 11M285 246l10 8"/>
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
  return `<svg viewBox="0 0 400 400" role="img" aria-label="Realistic Buckeye chrysalis hanging from a twig">
    <defs>
      <filter id="chrysalisTexture" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency=".62" numOctaves="4" seed="19"/>
        <feColorMatrix type="saturate" values=".45"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 .22"/>
        </feComponentTransfer>
        <feBlend mode="multiply" in2="SourceGraphic"/>
      </filter>
      <linearGradient id="twig" x1="73" x2="334" y1="91" y2="106">
        <stop offset="0" stop-color="#4b3426"/>
        <stop offset=".5" stop-color="#7b5637"/>
        <stop offset="1" stop-color="#3f2b21"/>
      </linearGradient>
      <radialGradient id="chrysalis" cx="42%" cy="22%" r="84%">
        <stop offset="0" stop-color="#d7c27a"/>
        <stop offset=".38" stop-color="#9e8b51"/>
        <stop offset=".72" stop-color="#747448"/>
        <stop offset="1" stop-color="#3e462e"/>
      </linearGradient>
    </defs>
    <path d="M64 94c82-33 190-31 285 10" stroke="#3e2a20" stroke-width="19" stroke-linecap="round" fill="none"/>
    <path d="M64 94c82-33 190-31 285 10" stroke="url(#twig)" stroke-width="14" stroke-linecap="round" fill="none"/>
    <path d="M94 86c12 8 26 11 41 8M257 91c22 0 43 5 64 15" stroke="#9b7550" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <g class="life-stage">
      <path d="M214 102c-10 31-24 56-43 82" stroke="#67492e" stroke-width="7" stroke-linecap="round"/>
      <path d="M163 185c4-24 14-43 29-55 14-11 32-15 53-10 42 10 62 55 53 111-11 73-58 116-104 104-40-11-50-81-31-150Z" fill="url(#chrysalis)" stroke="#3d402a" stroke-width="7"/>
      <path d="M163 185c4-24 14-43 29-55 14-11 32-15 53-10 42 10 62 55 53 111-11 73-58 116-104 104-40-11-50-81-31-150Z" fill="#827c42" filter="url(#chrysalisTexture)" opacity=".72"/>
      <path d="M187 132c12 18 32 29 62 34M177 167c28 16 68 20 100 11M165 207c35 17 84 21 128 5M165 244c39 18 80 18 124 0M180 291c27 14 58 14 87-1" stroke="#d7bd76" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".72"/>
      <path d="M211 121c-21 52-25 125-10 206M241 137c20 49 23 108 9 177" stroke="#38442f" stroke-width="4" stroke-linecap="round" fill="none" opacity=".62"/>
      <path d="M176 190c15-15 36-22 63-19M183 316c23 8 47 7 73-2" stroke="#2e3828" stroke-width="4" stroke-linecap="round" opacity=".46"/>
      <circle cx="193" cy="169" r="4" fill="#ead184"/><circle cx="261" cy="202" r="4" fill="#ead184"/><circle cx="209" cy="260" r="3.5" fill="#ead184"/><circle cx="238" cy="236" r="2.8" fill="#3f4b2e"/><circle cx="184" cy="225" r="2.8" fill="#3f4b2e"/>
    </g>
  </svg>`;
}

function butterflyArt() {
  return `<svg viewBox="0 0 400 400" role="img" aria-label="Realistic Buckeye butterfly with brown wings and eyespots">
    <defs>
      <filter id="wingTexture" x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence type="fractalNoise" baseFrequency=".78" numOctaves="3" seed="27"/>
        <feColorMatrix type="saturate" values=".35"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 .2"/>
        </feComponentTransfer>
        <feBlend mode="multiply" in2="SourceGraphic"/>
      </filter>
      <radialGradient id="foreWing" cx="52%" cy="48%" r="74%">
        <stop offset="0" stop-color="#9a6138"/>
        <stop offset=".5" stop-color="#66402c"/>
        <stop offset=".82" stop-color="#3b2922"/>
        <stop offset="1" stop-color="#1f1714"/>
      </radialGradient>
      <radialGradient id="hindWing" cx="48%" cy="40%" r="82%">
        <stop offset="0" stop-color="#925839"/>
        <stop offset=".64" stop-color="#673c2b"/>
        <stop offset="1" stop-color="#2a201b"/>
      </radialGradient>
      <radialGradient id="eyeSpotBlue" cx="42%" cy="38%" r="64%">
        <stop offset="0" stop-color="#9fd4dd"/>
        <stop offset=".45" stop-color="#486e8a"/>
        <stop offset="1" stop-color="#15120f"/>
      </radialGradient>
      <radialGradient id="eyeSpotAmber" cx="38%" cy="35%" r="70%">
        <stop offset="0" stop-color="#f1c46f"/>
        <stop offset=".55" stop-color="#c96d2f"/>
        <stop offset="1" stop-color="#5a2a1b"/>
      </radialGradient>
    </defs>
    <g class="butterfly-wings">
      <path d="M198 158C162 70 82 54 46 122c-34 66 10 128 77 127 30-1 54-13 76-34Z" fill="url(#foreWing)" stroke="#1f1714" stroke-width="5.5"/>
      <path d="M202 158c36-88 116-104 152-36 34 66-10 128-77 127-30-1-54-13-76-34Z" fill="url(#foreWing)" stroke="#1f1714" stroke-width="5.5"/>
      <path d="M196 215c-55 82-128 87-151 35-21-48 28-88 151-84Z" fill="url(#hindWing)" stroke="#1f1714" stroke-width="5.5"/>
      <path d="M204 215c55 82 128 87 151 35 21-48-28-88-151-84Z" fill="url(#hindWing)" stroke="#1f1714" stroke-width="5.5"/>
      <path d="M198 158C162 70 82 54 46 122c-34 66 10 128 77 127 30-1 54-13 76-34ZM202 158c36-88 116-104 152-36 34 66-10 128-77 127-30-1-54-13-76-34ZM196 215c-55 82-128 87-151 35-21-48 28-88 151-84ZM204 215c55 82 128 87 151 35 21-48-28-88-151-84Z" fill="#8b5b3f" filter="url(#wingTexture)" opacity=".6"/>
      <path d="M67 120c39 35 86 58 132 67M333 120c-39 35-86 58-132 67M72 286c44-34 86-56 126-68M328 286c-44-34-86-56-126-68" stroke="#d99b37" stroke-width="7" stroke-linecap="round" fill="none" opacity=".96"/>
      <path d="M70 149c39 25 83 41 128 47M330 149c-39 25-83 41-128 47M77 229c40 8 80 6 120-6M323 229c-40 8-80 6-120-6" stroke="#e2d8bd" stroke-width="5.5" stroke-linecap="round" fill="none" opacity=".92"/>
      <path d="M100 86c15 57 48 105 99 133M300 86c-15 57-48 105-99 133M132 71c11 59 34 105 67 146M268 71c-11 59-34 105-67 146M51 172c47 12 95 17 146 15M349 172c-47 12-95 17-146 15M68 202c44 12 87 15 129 11M332 202c-44 12-87 15-129 11" stroke="#261b17" stroke-width="3.6" stroke-linecap="round" fill="none" opacity=".65"/>
      <path d="M78 99c29-11 59-12 89-2M233 97c30-10 60-9 89 2M76 263c31 3 62-3 91-18M233 245c29 15 60 21 91 18" stroke="#b97739" stroke-width="3" stroke-linecap="round" fill="none" opacity=".66"/>
      <ellipse cx="116" cy="158" rx="34" ry="32" fill="url(#eyeSpotAmber)"/><circle cx="116" cy="158" r="24" fill="#20130f"/><circle cx="116" cy="158" r="13" fill="url(#eyeSpotBlue)"/><circle cx="116" cy="158" r="5.2" fill="#050403"/><circle cx="109" cy="152" r="4.2" fill="#efe3bf"/>
      <ellipse cx="284" cy="158" rx="34" ry="32" fill="url(#eyeSpotAmber)"/><circle cx="284" cy="158" r="24" fill="#20130f"/><circle cx="284" cy="158" r="13" fill="url(#eyeSpotBlue)"/><circle cx="284" cy="158" r="5.2" fill="#050403"/><circle cx="277" cy="152" r="4.2" fill="#efe3bf"/>
      <ellipse cx="121" cy="250" rx="26" ry="24" fill="#d59b36"/><circle cx="121" cy="250" r="16" fill="#211511"/><circle cx="121" cy="250" r="7.5" fill="#627e91"/><circle cx="116" cy="245" r="3" fill="#eadbb5"/>
      <ellipse cx="279" cy="250" rx="26" ry="24" fill="#d59b36"/><circle cx="279" cy="250" r="16" fill="#211511"/><circle cx="279" cy="250" r="7.5" fill="#627e91"/><circle cx="274" cy="245" r="3" fill="#eadbb5"/>
      <path d="M52 138c13-4 25-4 36-1M312 137c12-3 24-3 36 1M56 244c13 5 26 8 39 8M305 252c13 0 26-3 39-8" stroke="#e2d8bd" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    </g>
    <ellipse cx="200" cy="205" rx="14" ry="78" fill="#201817"/>
    <ellipse cx="197" cy="175" rx="4" ry="43" fill="#6d5649" opacity=".44"/>
    <path d="M190 154c6-13 14-20 24-20M189 181c8 6 16 9 24 0M188 216c8 6 17 6 25 0M190 249c7 6 14 7 22 0" stroke="#7c6557" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path class="antenna" d="M194 137c-19-44-50-64-89-72M206 137c19-44 50-64 89-72" stroke="#211714" stroke-width="4.8" stroke-linecap="round" fill="none"/>
    <circle cx="104" cy="65" r="4.2" fill="#211714"/><circle cx="296" cy="65" r="4.2" fill="#211714"/>
  </svg>`;
}
