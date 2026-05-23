// ==========================================
// 1. ゲーム全体の状態（データ）を管理するオブジェクト
// ==========================================
let gameState = {
    phase: 'setup',     
    inningNum: 1,       // 現在のイニング (1〜9回)
    isOmote: true,      // true: 表の攻撃, false: 裏の攻撃
    isPlayerFirst: true,// あなたが先攻ならtrue, 後攻ならfalse
    p1Money: 30000,     // あなたの持ち金（初期値: 30,000円）
    p2Money: 30000,     // NPCの持ち金  （初期値: 30,000円）
    streak: 0,          // 現在攻撃している側の連続勝利数
    isGameOver: false   // ゲームが終了したかどうか
};

const kanjiNumbers = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

const tauntPhrases = {
    2: "連続勝ちw",
    3: "おいおい、お留守番か～？ww",
    4: "おい、次負けたら3万超えるぞww",
    5: "甲子園の魔物に嫌われてるぞお前ww",
    6: "もうATMにしか見えないんだけどwww",
    7: "これコールドゲーム直前だろお前ww",
    8: "完全にバッティングセンター状態で草www",
    9: "歴史的大敗おめでとうございまーーすwww"
};

// ==========================================
// 2. 画面の表示（UI）を更新する関数（★ここを修正しました）
// ==========================================
function updateUI() {
    console.log(`[UI更新] 現在のフェーズ: ${gameState.phase}`);

    const p1MoneyEl = document.getElementById('p1-money');
    const p2MoneyEl = document.getElementById('p2-money');

    p1MoneyEl.innerText = `${gameState.p1Money.toLocaleString()}円`;
    p2MoneyEl.innerText = `${gameState.p2Money.toLocaleString()}円`;

    if (gameState.p1Money < 0) {
        p1MoneyEl.classList.add('debt');
    } else {
        p1MoneyEl.classList.remove('debt');
    }

    if (gameState.p2Money < 0) {
        p2MoneyEl.classList.add('debt');
    } else {
        p2MoneyEl.classList.remove('debt');
    }

    // --- A. 先攻後攻を決めるフェーズのUI ---
    if (gameState.phase === 'setup') {
        document.getElementById('inning').innerText = "試合前";
        document.getElementById('current-turn').innerText = "先攻後攻を決めます！";
        document.getElementById('streak-display').innerText = "連続勝利: 0回";
        document.getElementById('left-hand-label').innerText = "あなた";
        document.getElementById('right-hand-label').innerText = "NPC";
        document.getElementById('taunt-bubble').style.display = 'none';
        return;
    }

    // --- B. 本戦フェーズのUI ---
    if (gameState.isPlayerFirst) {
        document.getElementById('p1-team-label').innerText = "先攻（あなた）";
        document.getElementById('p2-team-label').innerText = "後攻（NPC）";
    } else {
        document.getElementById('p1-team-label').innerText = "後攻（あなた）";
        document.getElementById('p2-team-label').innerText = "先攻（NPC）";
    }

    // 【★バグ修正箇所】イニング表示の切り替え
    // ゲーム終了(isGameOverがtrue)なら「試合終了」にし、それ以外は「〇回表/裏」にする
    let inningText = "";
    if (gameState.isGameOver) {
        inningText = "試合終了";
    } else {
        inningText = `${kanjiNumbers[gameState.inningNum]}回${gameState.isOmote ? '表' : '裏'}`;
    }
    document.getElementById('inning').innerText = inningText;

    const isPlayerAtk = (gameState.isOmote && gameState.isPlayerFirst) || (!gameState.isOmote && !gameState.isPlayerFirst);

    // 【★パワーアップ】現在ターンの表示制御
    // ゲーム終了時は「ゲームセット！」と表示し、試合中は攻撃側のターンを表示する
    if (gameState.isGameOver) {
        document.getElementById('current-turn').innerText = "⚾ ゲームセット！ ⚾";
    } else if (isPlayerAtk) {
        document.getElementById('team-p1').classList.add('active');
        document.getElementById('team-p2').classList.remove('active');
        document.getElementById('current-turn').innerText = `攻撃：${gameState.isPlayerFirst ? '先攻' : '後攻'}（あなた）のターン`;
    } else {
        document.getElementById('team-p1').classList.remove('active');
        document.getElementById('team-p2').classList.add('active');
        document.getElementById('current-turn').innerText = `攻撃：${gameState.isPlayerFirst ? '後攻' : '先攻'}（NPC）のターン`;
    }

    const nextReward = 1000 * Math.pow(2, gameState.streak);
    document.getElementById('streak-display').innerText = `連続勝利: ${gameState.streak}回 (次勝つと ${nextReward.toLocaleString()}円)`;

    const bubble = document.getElementById('taunt-bubble');
    bubble.className = 'bubble';

    if (gameState.streak >= 2 && !gameState.isGameOver) {
        const streakKey = gameState.streak >= 9 ? 9 : gameState.streak;
        
        if (isPlayerAtk) {
            bubble.innerText = `あなた「${tauntPhrases[streakKey]}」`;
            bubble.classList.add('player-taunt');
        } else {
            bubble.innerText = `NPC「${tauntPhrases[streakKey]}」`;
            bubble.classList.add('npc-taunt');
        }
        bubble.style.display = 'block';
    } else {
        bubble.style.display = 'none';
    }

    const buttons = document.querySelectorAll('.controls .btn');
    buttons.forEach(btn => btn.disabled = gameState.isGameOver);
}

// 連勝時の獲得金額を計算する関数
function calculateReward(streak) {
    const reward = 1000 * Math.pow(2, streak - 1);
    console.log(`[金額計算] 連勝数: ${streak}回 -> 獲得金額: ${reward}円`);
    return reward;
}

// ボタンが押された時の入り口
function handleUserChoice(playerChoice) {
    if (gameState.phase === 'setup') {
        playSetupJanKen(playerChoice);
    } else {
        playJanKen(playerChoice);
    }
}

// 先攻後攻を決めるじゃんけん
function playSetupJanKen(playerChoice) {
    console.log(`--- 先攻後攻決めじゃんけん開始 ---`);
    
    const hands = ['goo', 'choki', 'par'];
    const npcChoice = hands[Math.floor(Math.random() * 3)];
    const handEmojis = { goo: '✊', choki: '✌️', par: '🖐️' };

    document.getElementById('left-hand').innerText = handEmojis[playerChoice];
    document.getElementById('right-hand').innerText = handEmojis[npcChoice];

    if (playerChoice === npcChoice) {
        document.getElementById('result-log').innerText = "🔄 あいこ！もう一本！";
    } else if (
        (playerChoice === 'goo' && npcChoice === 'choki') ||
        (playerChoice === 'choki' && npcChoice === 'par') ||
        (playerChoice === 'par' && npcChoice === 'goo')
    ) {
        document.getElementById('result-log').innerText = "勝利！あなたは【先攻】です。一回表、あなたの攻撃からスタート！";
        gameState.isPlayerFirst = true;
        gameState.phase = 'playing';
    } else {
        document.getElementById('result-log').innerText = "負け！あなたは【後攻】です。一回表、NPCの攻撃からスタート！";
        gameState.isPlayerFirst = false;
        gameState.phase = 'playing';
    }

    if (gameState.phase === 'playing') {
        document.getElementById('left-hand-label').innerText = "攻撃側";
        document.getElementById('right-hand-label').innerText = "守備側";
    }

    updateUI();
}

// 本戦のじゃんけんロジック
function playJanKen(playerChoice) {
    if (gameState.isGameOver) return;

    console.log(`--- 本戦じゃんけん開始 ---`);
    console.log(`[状況] ${gameState.inningNum}回${gameState.isOmote ? '表' : '裏'} / 現在の連勝: ${gameState.streak}`);

    const hands = ['goo', 'choki', 'par'];
    const npcChoice = hands[Math.floor(Math.random() * 3)];
    const handEmojis = { goo: '✊', choki: '✌️', par: '🖐️' };

    const isPlayerAtk = (gameState.isOmote && gameState.isPlayerFirst) || (!gameState.isOmote && !gameState.isPlayerFirst);

    let atkChoice = isPlayerAtk ? playerChoice : npcChoice;
    let defChoice = isPlayerAtk ? npcChoice : playerChoice;

    document.getElementById('left-hand').innerText = handEmojis[atkChoice];
    document.getElementById('right-hand').innerText = handEmojis[defChoice];

    let result;
    if (atkChoice === defChoice) {
        result = 'draw';
    } else if (
        (atkChoice === 'goo' && defChoice === 'choki') ||
        (atkChoice === 'choki' && defChoice === 'par') ||
        (atkChoice === 'par' && defChoice === 'goo')
    ) {
        result = 'win';
    } else {
        result = 'lose';
    }

    let logMessage = "";

    if (result === 'win') {
        gameState.streak++;
        let reward = calculateReward(gameState.streak);

        if (isPlayerAtk) {
            gameState.p1Money += reward;
            gameState.p2Money -= reward;
            logMessage = `ヒット！あなたが ${reward.toLocaleString()}円 を奪い取った！`;
        } else {
            gameState.p2Money += reward;
            gameState.p1Money -= reward;
            logMessage = `痛恨！NPCに ${reward.toLocaleString()}円 を奪われた！`;
        }
        
        console.log(`[資金移動後] あなた: ${gameState.p1Money}円 / NPC: ${gameState.p2Money}円`);

    } else if (result === 'lose') {
        logMessage = `アウト！攻守交代です。`;
        gameState.streak = 0;
        changeTurn();
    } else {
        logMessage = `🔄 あいこ！粘っています！`;
    }

    document.getElementById('result-log').innerText = logMessage;
    checkGameOver(); // 試合終了チェック
    updateUI();      // 画面更新
}

// 攻守交代
function changeTurn() {
    if (gameState.isOmote) {
        gameState.isOmote = false;
    } else {
        gameState.isOmote = true;
        gameState.inningNum++;
    }
}

// 試合終了（9回裏終了）を判定する関数
function checkGameOver() {
    if (gameState.inningNum > 9) {
        gameState.isGameOver = true;
        let finalReason = "";

        console.log(`--- 9回裏終了・試合終了 ---`);
        
        let moneyResult = gameState.p1Money - 30000;
        let absoluteMoney = Math.abs(moneyResult).toLocaleString();

        if (moneyResult > 0) {
            finalReason = `試合結果は、あなたが ${absoluteMoney}円 勝ち！見事優勝です！🏆`;
        } else if (moneyResult < 0) {
            finalReason = `試合結果は、あなたが ${absoluteMoney}円 負け…準優勝に終わりました。`;
        } else {
            finalReason = `試合結果は、プラスマイナス0円で同点！引き分け再試合です！`;
        }

        console.log(`[試合結果計算] 最終所持金: ${gameState.p1Money}円 / 差額: ${moneyResult}円`);
        console.log(`[確定メッセージ] ${finalReason}`);
        

        document.getElementById('result-log').innerText = finalReason;
        document.getElementById('reset-btn').style.display = 'inline-block';
    }
}

// ゲームリセット
function resetGame() {
    console.clear();
    console.log(`[システム] リセット。新たな試合を開始します。`);
    
    gameState = {
        phase: 'setup',
        inningNum: 1,
        isOmote: true,
        isPlayerFirst: true,
        p1Money: 30000,
        p2Money: 30000,
        streak: 0,
        isGameOver: false
    };

    document.getElementById('left-hand').innerText = '-';
    document.getElementById('right-hand').innerText = '-';
    document.getElementById('result-log').innerText = 'まずはじゃんけんで先攻・後攻を決めよう！';
    document.getElementById('reset-btn').style.display = 'none';
    
    updateUI();
}

// 起動時にUIを更新
updateUI();