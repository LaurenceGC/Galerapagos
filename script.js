let players = [];
let votes = {};
let eliminated = "";
let currentVoterIndex = 0;
const jungleSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-jungle-ambience-ambients-113.mp3");

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (name && !players.includes(name)) {
    players.push(name);
    const li = document.createElement("li");
    li.textContent = name;
    document.getElementById("playerList").appendChild(li);
    input.value = "";
    document.getElementById("confirmation").textContent = `${name} a été ajouté ✅`;
  } else {
    alert("Nom vide ou déjà utilisé !");
  }
}

function startDisappearanceQuestion() {
  jungleSound.play();
  document.getElementById("registration").style.display = "none";
  document.getElementById("confirmation").textContent = "";
  document.getElementById("disappearanceQuestion").style.display = "block";
}

function confirmDisappearance(hasDisappeared) {
  document.getElementById("disappearanceQuestion").style.display = "none";
  if (hasDisappeared) {
    updateDisappearanceDropdown();
    document.getElementById("disappearance").style.display = "block";
  } else {
    startVoting();
  }
}

function updateDisappearanceDropdown() {
  const container = document.getElementById("disappearedList");
  container.innerHTML = players.map(p => `
    <label style="display:block; margin:5px 0;">
      <input type="checkbox" value="${p}"> ${p}
    </label>
  `).join("");
}


function eliminateDisappeared() {
  const checkboxes = document.querySelectorAll('#disappearedList input[type="checkbox"]:checked');
  const selected = Array.from(checkboxes).map(cb => cb.value);

  if (selected.length === 0) {
    alert("Sélectionne au moins un naufragé.");
    return;
  }

  players = players.filter(p => !selected.includes(p));
  document.getElementById("disappearance").style.display = "none";
  startVoting();
}


function startVoting() {
  jungleSound.play();
  votes = {};
  currentVoterIndex = 0;
  document.getElementById("votePhase").style.display = "block";
  nextVote();
}

function nextVote() {
  if (currentVoterIndex >= players.length) {
    document.getElementById("votePhase").style.display = "none";
    showResults();
    return;
  }
  const voter = players[currentVoterIndex];
  document.getElementById("currentVoterInfo").textContent = `${voter} vote`;
  const voteSelect = document.getElementById("voteSelect");
  voteSelect.innerHTML = '<option value="" disabled selected>Choisis qui éliminer</option>' +
    players.filter(p => p !== voter).map(p => `<option value="${p}">${p}</option>`).join("");
}

function submitVote() {
  const voted = document.getElementById("voteSelect").value;
  if (!voted) {
    alert("Choisis un joueur à éliminer.");
    return;
  }
  votes[voted] = (votes[voted] || 0) + 1;
  currentVoterIndex++;
  nextVote();
}

function showResults() {
  jungleSound.play();
  document.getElementById("revealResults").style.display = "block";
  let max = 0;
  for (const p in votes) {
    if (votes[p] > max) {
      max = votes[p];
      eliminated = p;
    }
  }
  document.getElementById("resultText").innerHTML = `<span class="eliminated-name">${eliminated}</span> a été éliminé !`;
}

function showRescue() {
  jungleSound.play();
  document.getElementById("revealResults").style.display = "none";
  document.getElementById("rescuePhase").style.display = "block";
  document.getElementById("rescuedName").innerHTML = `<span class="eliminated-name">${eliminated}</span>`;
}

function rescueDecision(choice) {
  document.getElementById("rescuePhase").style.display = "none";
  if (!choice) players = players.filter(p => p !== eliminated);
  if (players.length <= 2) {
    jungleSound.play();
    document.getElementById("restartPhase").style.display = "block";
  } else {
    document.getElementById("disappearanceQuestion").style.display = "block";
  }
}

function restartGame() {
  players = [];
  votes = {};
  eliminated = "";
  currentVoterIndex = 0;
  document.querySelectorAll("section").forEach(s => s.style.display = "none");
  document.getElementById("playerList").innerHTML = "";
  document.getElementById("playerName").value = "";
  document.getElementById("confirmation").textContent = "";
  document.getElementById("registration").style.display = "block";
}