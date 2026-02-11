if (!window.alt1) {
  console.log("Alt1 not detected");
  return;
}

const buffReader = new alt1.BuffReader();
const statusReader = new alt1.StatusBars();

let buffPos = null;
let knownBuffs = new Set();
let settings = JSON.parse(localStorage.getItem("buffSettings")) || {};
let alerted = false;

const audio = new Audio("https://www.soundjay.com/buttons/beep-01a.mp3");

const pvmContainer = document.getElementById("pvm");
const skillContainer = document.getElementById("skilling");
const tooltip = document.getElementById("tooltip");

function saveSettings() {
  localStorage.setItem("buffSettings", JSON.stringify(settings));
}

function createRow(name, container) {
  if (document.getElementById("buff-" + name)) return;

  if (!settings[name]) settings[name] = { enabled: true, threshold: 10 };

  let row = document.createElement("div");
  row.className = "buff-row";
  row.id = "buff-" + name;

  row.innerHTML = `
    <label>
      <input type="checkbox" ${settings[name].enabled ? "checked" : ""}>
      ${name}
    </label>
    <input type="range" min="0" max="60" value="${settings[name].threshold}">
    <span>${settings[name].threshold}s</span>
  `;

  let cb = row.querySelector("input[type=checkbox]");
  let slider = row.querySelector("input[type=range]");
  let span = row.querySelector("span");

  cb.onchange = () => {
    settings[name].enabled = cb.checked;
    saveSettings();
  };

  slider.oninput = () => {
    settings[name].threshold = slider.value;
    span.textContent = slider.value + "s";
    saveSettings();
  };

  container.appendChild(row);
}

function detectStatusBars() {
  if (!settings["HP"]) settings["HP"] = { enabled: true, threshold: 30 };
  if (!settings["Prayer"]) settings["Prayer"] = { enabled: true, threshold: 30 };

  createRow("HP", pvmContainer);
  createRow("Prayer", pvmContainer);
}

detectStatusBars();

function mainLoop() {
  let img = alt1.captureHold();

  if (!buffPos) {
    buffPos = buffReader.find(img);
    return;
  }

  let buffs = buffReader.read(img, buffPos);
  if (!buffs) return;

  buffs.forEach(b => {
    if (!knownBuffs.has(b.name)) {
      knownBuffs.add(b.name);
      if (b.name.toLowerCase().includes("juju") || b.name.toLowerCase().includes("skill")) {
        createRow(b.name, skillContainer);
      } else {
        createRow(b.name, pvmContainer);
      }
    }
  });

  let expiring = [];

  buffs.forEach(b => {
    let cfg = settings[b.name];
    if (!cfg || !cfg.enabled) return;
    if (b.time <= cfg.threshold) {
      expiring.push(`${b.name} (${b.time}s)`);
    }
  });

  let status = statusReader.read(img);

  if (status && status.hp) {
    let cfg = settings["HP"];
    if (cfg.enabled && status.hp.percent <= cfg.threshold) {
      expiring.push(`HP (${status.hp.percent}%)`);
    }
  }

  if (status && status.prayer) {
    let cfg = settings["Prayer"];
    if (cfg.enabled && status.prayer.percent <= cfg.threshold) {
      expiring.push(`Prayer (${status.prayer.percent}%)`);
    }
  }

  if (expiring.length > 0 && document.getElementById("tooltip-enable").checked) {
    tooltip.style.display = "block";
    tooltip.innerHTML = expiring.map(e => `<div style="color:red">${e}</div>`).join("");

    let m = alt1.mousePosition();
    tooltip.style.left = (m.x + 15) + "px";
    tooltip.style.top = (m.y + 15) + "px";

    if (!alerted && document.getElementById("sound-enable").checked) {
      audio.volume = document.getElementById("volume").value / 100;
      audio.play();
      alerted = true;
    }
  } else {
    tooltip.style.display = "none";
    alerted = false;
  }
}

setInterval(mainLoop, 600);
