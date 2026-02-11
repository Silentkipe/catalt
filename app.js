if (!window.alt1) return;

const buffReader = new alt1.Buffs();
const statusReader = new alt1.StatusBars();

let settings = JSON.parse(localStorage.getItem("buffSettings")) || {};
let alerted = false;

const audio = new Audio("https://www.soundjay.com/buttons/beep-01a.mp3");

function saveSettings() {
  localStorage.setItem("buffSettings", JSON.stringify(settings));
}

function showTab(tab) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");
  event.target.classList.add("active");
}

function createRow(name, container) {
  if (!settings[name]) settings[name] = { enabled:true, threshold:10 };

  let row = document.createElement("div");
  row.className = "buff-row";
  row.innerHTML = `
    <label><input type="checkbox" ${settings[name].enabled?"checked":""}> ${name}</label>
    <input type="range" min="0" max="60" value="${settings[name].threshold}">
    <span>${settings[name].threshold}s</span>
  `;

  let cb = row.querySelector("input[type=checkbox]");
  let slider = row.querySelector("input[type=range]");
  let span = row.querySelector("span");

  cb.onchange = () => { settings[name].enabled = cb.checked; saveSettings(); };
  slider.oninput = () => {
    settings[name].threshold = slider.value;
    span.textContent = slider.value + "s";
    saveSettings();
  };

  container.appendChild(row);
}

function updateUI(buffList) {
  let pvm = document.getElementById("pvm");
  let skill = document.getElementById("skilling");
  pvm.innerHTML = "";
  skill.innerHTML = "";

  buffList.forEach(b => {
    if (b.name.toLowerCase().includes("juju") || b.name.toLowerCase().includes("skill"))
      createRow(b.name, skill);
    else
      createRow(b.name, pvm);
  });
}

function mainLoop() {
  let img = alt1.captureHold();
  let buffs = buffReader.read(img) || [];
  let status = statusReader.read(img) || {};

  updateUI(buffs);

  let expiring = [];

  buffs.forEach(b => {
    let cfg = settings[b.name];
    if (!cfg || !cfg.enabled) return;
    if (b.time <= cfg.threshold) {
      expiring.push(`${b.name} (${b.time}s)`);
    }
  });

  if (status.hp && settings["HP"]) {
    if (status.hp.percent <= settings["HP"].threshold)
      expiring.push(`HP (${status.hp.percent}%)`);
  }

  if (status.prayer && settings["Prayer"]) {
    if (status.prayer.percent <= settings["Prayer"].threshold)
      expiring.push(`Prayer (${status.prayer.percent}%)`);
  }

  let tooltip = document.getElementById("tooltip");

  if (expiring.length > 0 && document.getElementById("tooltip-enable").checked) {
    tooltip.style.display = "block";
    tooltip.innerHTML = expiring.map(e => `<div style="color:red">${e}</div>`).join("");
    let m = alt1.mousePosition();
    tooltip.style.left = (m.x+15)+"px";
    tooltip.style.top = (m.y+15)+"px";

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
