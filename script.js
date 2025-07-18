// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAt3hxoXba8wqD7X7p1WDlC_YTIm_VUVog",
  authDomain: "votes-galerapagos.firebaseapp.com",
  databaseURL: "https://votes-galerapagos-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "votes-galerapagos",
  storageBucket: "votes-galerapagos.appspot.com",
  messagingSenderId: "583997438955",
  appId: "1:583997438955:web:1aa922ecc997f3da1877ae"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);


let onlineMode = false;
let gameRoom = "";
let players = [];
let votes = {};
let voteDetails = [];
let eliminated = "";
let eliminatedPlayers = [];
let currentVoterIndex = 0;
let ghostMode = false;
let conchHolder = null;
let clubHolder = null;
let clubVotedOnce = false;


const jungleSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-jungle-ambience-ambients-113.mp3");

function setNetworkMode(isOnline) {
  onlineMode = isOnline;
  document.getElementById("networkQuestion").style.display = "none";

  if (onlineMode) {
    gameRoom = prompt("Nom de la salle (ex: naufrage23)").trim();
    if (!gameRoom) {
      alert("Veuillez entrer un nom de salle.");
      return;
    }
    alert(`🛖 Salle "${gameRoom}" créée ! Tous les joueurs doivent entrer ce nom.`);

    const refPath = `players/${gameRoom}`;
    firebase.database().ref(refPath).on("value", snapshot => {
      const data = snapshot.val();
      const list = document.getElementById("playerList");
      list.innerHTML = "";
      if (data) {
        players = Object.keys(data);
        players.forEach(name => {
          const li = document.createElement("li");
          li.textContent = name;
          list.appendChild(li);
        });
      }
    });
  } else {
    document.getElementById("registration").style.display = "block";
  }
}

function addPlayer() {
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (name && !players.includes(name)) {
    if (onlineMode) {
  const path = `players/${gameRoom}/${name}`;
  firebase.database().ref(path).set({ alive: true });
} else {
  players.push(name);
}

    input.value = "";
document.getElementById("confirmation").textContent = `${name} a été ajouté ✅`;

    input.value = "";
    document.getElementById("confirmation").textContent = `${name} a été ajouté ✅`;
  } else {
    alert("Nom vide ou déjà utilisé !");
  }
  const refPath = onlineMode ? `players/${gameRoom}` : `players`;
firebase.database().ref(refPath).on("value", snapshot => {
  const data = snapshot.val();
  // ...affiche la liste
});

}

function startDisappearanceQuestion() {
  jungleSound.play();
  ghostMode = document.getElementById("ghostMode").checked;
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
    startSpecialCardsPhase();
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
  eliminatedPlayers = eliminatedPlayers.concat(selected);
  players = players.filter(p => !selected.includes(p));
  document.getElementById("disappearance").style.display = "none";
  startSpecialCardsPhase();
}

function startSpecialCardsPhase() {
  conchHolder = null;
  clubHolder = null;
  clubVotedOnce = false;
  document.getElementById("specialCards").style.display = "block";
  document.getElementById("conchQuestion").style.display = "block";
  document.getElementById("conchSelectContainer").style.display = "none";
  document.getElementById("clubQuestion").style.display = "none";
  document.getElementById("clubSelectContainer").style.display = "none";
}

function hasConch(answer) {
  document.getElementById("conchQuestion").style.display = "none";
  if (answer) {
    const select = document.getElementById("conchSelect");
    select.innerHTML = players.map(p => `<option value="${p}">${p}</option>`).join("");
    document.getElementById("conchSelectContainer").style.display = "block";
  } else {
    document.getElementById("clubQuestion").style.display = "block";
  }
}

function confirmSpecialCards() {
  const selected = document.getElementById("conchSelect").value;
  if (!selected || !players.includes(selected)) {
    alert("Sélectionne un joueur vivant pour la conque.");
    return;
  }
  conchHolder = selected;
  document.getElementById("conchSelectContainer").style.display = "none";
  document.getElementById("clubQuestion").style.display = "block";
}

function hasClub(answer) {
  document.getElementById("clubQuestion").style.display = "none";
  if (answer) {
    const select = document.getElementById("clubSelect");
    select.innerHTML = players.map(p => `<option value="${p}">${p}</option>`).join("");
    document.getElementById("clubSelectContainer").style.display = "block";
  } else {
    document.getElementById("specialCards").style.display = "none";
    startVoting();
  }
}

function confirmClub() {
  const selected = document.getElementById("clubSelect").value;
  if (!selected || !players.includes(selected)) {
    alert("Sélectionne un joueur vivant pour le gourdin.");
    return;
  }
  clubHolder = selected;
  clubVotedOnce = false;
  document.getElementById("clubSelectContainer").style.display = "none";
  document.getElementById("specialCards").style.display = "none";
  startVoting();
}

function startVoting() {
  jungleSound.play();
  votes = {};
  voteDetails = [];
  currentVoterIndex = 0;
  document.querySelector("button[onclick='showRescue()']").style.display = "none";
  document.getElementById("votePhase").style.display = "block";
  nextVote();
}

function nextVote() {
  let allVoters = ghostMode ? players.concat(eliminatedPlayers) : players;

  if (currentVoterIndex >= allVoters.length) {
    document.getElementById("votePhase").style.display = "none";
    showResults();
    return;
  }

  const voter = allVoters[currentVoterIndex];
  document.getElementById("currentVoterInfo").textContent =
    ghostMode && eliminatedPlayers.includes(voter)
      ? `${voter} (revenant 👻) vote`
      : `${voter} vote`;

  let options = players.filter(p => p !== voter);
  if (ghostMode) {
    options = options.filter(p => !eliminatedPlayers.includes(p));
  }
  if (conchHolder) {
    options = options.filter(p => p !== conchHolder);
  }

  if (options.length === 0) {
    alert("Aucun joueur n’est disponible pour être voté.");
    showResults();
    return;
  }

  const voteSelect = document.getElementById("voteSelect");
  voteSelect.innerHTML = '<option value="" disabled selected>Choisis qui éliminer</option>' +
    options.map(p => `<option value="${p}">${p}</option>`).join("");

  if (clubHolder === voter && !clubVotedOnce) {
    clubVotedOnce = true;
  } else {
    clubVotedOnce = false;
    currentVoterIndex++;
  }
}

function submitVote() {
  const voted = document.getElementById("voteSelect").value;
  if (!voted) {
    alert("Choisis un joueur à éliminer.");
    return;
  }
  const voterName = document.getElementById("currentVoterInfo").textContent.split(" ")[0];
  voteDetails.push(`${voterName} → ${voted}`);
  votes[voted] = (votes[voted] || 0) + 1;
  nextVote();
}

function showResults() {
  jungleSound.play();
  document.getElementById("revealResults").style.display = "block";

  let max = 0;
  let maxPlayers = [];

  for (const p in votes) {
    if (votes[p] > max) {
      max = votes[p];
      maxPlayers = [p];
    } else if (votes[p] === max) {
      maxPlayers.push(p);
    }
  }

  // ⚖️ Cas d'égalité
  if (maxPlayers.length > 1) {
    document.getElementById("resultText").innerHTML =
      `<p>⚖️ <strong>Égalité entre :</strong> ${maxPlayers.join(", ")}</p>` +
      `<p>📣 <strong>Égalité, vous devez revoter</strong></p>`;

    // ⛔ Empêcher l'accès au sauvetage
    document.querySelector("button[onclick='showRescue()']").style.display = "none";

    // 🔄 Réinitialisation du vote
    votes = {};
    voteDetails = [];
    currentVoterIndex = 0;

    // 🕐 Pause pour afficher le message d’égalité
    setTimeout(() => {
      document.getElementById("revealResults").style.display = "none";
      startVoting(); // 🔁 Relance un vote avec tous les joueurs vivants
    }, 2500);

    return;
  }

  // ✅ Cas avec élimination unique
  eliminated = maxPlayers[0];
  document.getElementById("resultText").innerHTML =
    `<span class="eliminated-name">${eliminated}</span> a été éliminé !` +
    `<h3>🗂️ Détail des votes :</h3><ul>` +
    voteDetails.map(v => `<li>${v}</li>`).join("") +
    `</ul>`;

  // ✅ Autoriser l’accès à la phase de sauvetage
  document.querySelector("button[onclick='showRescue()']").style.display = "inline-block";
}

function showRescue() {
  jungleSound.play();
  document.getElementById("revealResults").style.display = "none";
  document.getElementById("rescuePhase").style.display = "block";
  document.getElementById("rescuedName").innerHTML =
    `<span class="eliminated-name">${eliminated}</span>`;
}

function rescueDecision(choice) {
  document.getElementById("rescuePhase").style.display = "none";
  if (!choice) {
    players = players.filter(p => p !== eliminated);
    eliminatedPlayers.push(eliminated);
  }
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
  voteDetails = [];
  eliminated = "";
  eliminatedPlayers = [];
  currentVoterIndex = 0;
  ghostMode = false;
  conchHolder = null;
  clubHolder = null;
  clubVotedOnce = false;
  document.querySelectorAll("section").forEach(s => s.style.display = "none");
  document.getElementById("playerList").innerHTML = "";
  document.getElementById("playerName").value = "";
  document.getElementById("confirmation").textContent = "";
  document.getElementById("ghostMode").checked = false;
  document.getElementById("registration").style.display = "block";
}