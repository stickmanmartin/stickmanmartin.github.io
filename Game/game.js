

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

const playerHpText = document.getElementById("player-hp");
const enemyHpText = document.getElementById("enemy-hp");
const message = document.getElementById("message");
const attackBtn = document.getElementById("attack-btn");
const shop = document.getElementById("shop");
const body = document.getElementById("game");
const restartBtn = document.getElementById("restart-btn");
const punch = document.getElementById("punch");
const die = document.getElementById("doe");

attackBtn.addEventListener("click", () => {
    let playerDamage = Math.floor(Math.random()*player.attack);
    const enemyAction = Math.random() < 0.5 ? "attack" : "defend";
    let enemyDamage = Math.floor(Math.random()*enemy.attack);
    message.innerHTML = "";

    if(enemyAction === "defend"){
        let enemyheal = Math.floor(Math.random()*5)+3;
        let enemyHeal = Math.random() < 0.3 ? "heal" : "defend2";
        if (enemyHpText === (100 + 10 * enemy.wins)){
                playerDamage = Math.floor(Math.random()*playerDamage);
                message.innerHTML += "Enemy partially blocked your attack! <br>";
        }
        else {
            if(enemyHeal === "defend2"){
                playerDamage = Math.floor(Math.random()*playerDamage);
                message.innerHTML += "Enemy partially blocked your attack! <br>";
            }
            else {
                enemyHpText.textContent += enemyheal;
                enemy.hp += enemyheal;
                message.innerHTML += "Enemy healed some hp! <br>"
                enemyDamage = 0
                playerDamage = 0
            }
        }
        }

    else if(Math.random() < 0.3){
        if(enemyheal === "Heal"){
            playerDamage = 0
        }
        else {
            playerDamage *=2;
            message.innerHTML = "CRITICAL HIT! you dealt double the damage! <br>";
        }
    }
    else if (Math.random() < 0.1){
        playerDamage *=0;
        message.innerHTML = "You missed your attak! <br>";
    }
    message.innerHTML += 
        `you dealt ${playerDamage} damage! <br>
        Enemy dealt ${enemyDamage} damage!`;
    
    // body.classList.add("hit-effect");
    // setTimeout(() => body.classList.remove("hit-effect"), 600);
    player.hp = player.hp - enemyDamage;
    enemy.hp = enemy.hp - playerDamage;


    playerHpText.textContent = Math.max(player.hp, 0);
    enemyHpText.textContent = Math.max(enemy.hp, 0);

    if(enemy.hp <= 0){
        message.innerHTML = "You win!";
        attackBtn.disabled = true;
        restartBtn.style.display = "block";
        player.wins += 1;
        shop.style.display = "block";
        
    }

    if(player.hp <= 0){
        message.innerHTML = "You lost!"            
        attackBtn.disabled = true;
        restartBtn.style.display = "block";
        enemy.wins += 1;
        shop.style.display = "block";
    }
}
)

restartBtn.addEventListener("click", ()=>{
    player.hp = 100 + 10 * player.wins;
    playerHpText.textContent = player.hp;
    player.attack = 20 + enemy.wins * 2;
    enemy.hp = 100 + 10 * enemy.wins;
    enemyHpText.textContent = enemy.hp;
    enemy.attack = 15 + player.wins * 2;
    attackBtn.disabled = false;
    restartBtn.style.display = "none";
    message.innerHTML = "Game Restarted! Good Luck! Hope you lose. HAHA";
})