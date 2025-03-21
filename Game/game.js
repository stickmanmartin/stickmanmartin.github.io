

const player = {
    hp: 100,
    attack: 20,
    wins: 0
}

const enemy = {
    hp: 100,
    attack: 15,
    wins: 0
}

const playerHpText = document.getElementById("player-hp")
const enemyHpText = document.getElementById("enemy-hp")
const message = document.getElementById("message")
const attackBtn = document.getElementById("attack-btn")
const body = document.getElementById("game")
const restartBtn = document.getElementById("restart-btn")

attackBtn.addEventListener("click", () => {
    const playerDamage = Math.floor(Math.random()*player.attack);
    const enemyDamage = Math.floor(Math.random()*enemy.attack);

    // body.classList.add("hit-effect");
    // setTimeout(() => body.classList.remove("hit-effect"), 600);
    player.hp = player.hp - enemyDamage;
    enemy.hp = enemy.hp - playerDamage;

    message.innerHTML = 
    `you dealt ${playerDamage} damage! <br>
    Enemy dealt ${enemyDamage} damage!`;

    playerHpText.textContent = Math.max(player.hp, 0);
    enemyHpText.textContent = Math.max(enemy.hp, 0);

    if(enemy.hp <= 0){
        message.innerHTML = "You win!";
        attackBtn.disabled = true;
        restartBtn.style.display = "block";
        enemy.wins += 1;
    }

    if(player.hp <= 0){
        message.innerHTML = "You lost!"            
        attackBtn.disabled = true;
        restartBtn.style.display = "block";
        player.wins += 1;
    }
}
)

restartBtn.addEventListener("click", ()=>{
    player.hp = 100 + 10 * player.wins;
    playerHpText.textContent = player.hp;
    player.attack = 20 + player.wins * 2;
    enemy.hp = 100 + 10 * enemy.wins;
    enemyHpText.textContent = enemy.hp;
    enemy.attack = 15 + enemy.wins * 2;
    attackBtn.disabled = false;
    restartBtn.style.display = "none";
    message.innerHTML = "Game Restarted! Good Luck! Hope you lose. HAHA";
})