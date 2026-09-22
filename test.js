const { generateOutcome, SYMBOLS } = require('./app.js');

function runSimulation(numSpins = 10000) {
    console.log(`=== SPUŠTĚNÍ SIMULACE ${numSpins} ZATOČENÍ ===\n`);

    let wins = 0;
    let totalBet = 0;
    let totalPayout = 0;
    const bet = 10;

    let jackpots = 0;
    let match3 = 0;
    let match2 = 0;
    let losses = 0;

    for (let i = 0; i < numSpins; i++) {
        totalBet += bet;
        const result = generateOutcome();

        if (result.type === 'JACKPOT') {
            jackpots++;
            wins++;
        } else if (result.type === '3_MATCH') {
            match3++;
            wins++;
        } else if (result.type === '2_MATCH') {
            match2++;
            wins++;
        } else {
            losses++;
        }

        totalPayout += bet * result.multiplier;
    }

    const winPercentage = (wins / numSpins) * 100;
    const rtp = (totalPayout / totalBet) * 100;

    console.log(`Výsledky po ${numSpins} zatočeních:`);
    console.log(` - Výherní zatočení: ${wins} / ${numSpins} (${winPercentage.toFixed(2)} %)`);
    console.log(` - Proherní zatočení: ${losses} / ${numSpins} (${((losses / numSpins) * 100).toFixed(2)} %)`);
    console.log(` - Počet Jackpotů (3x Diamant): ${jackpots}`);
    console.log(` - Počet 3 Shody: ${match3}`);
    console.log(` - Počet 2 Shody: ${match2}`);
    console.log(` - Celkem vsazeno: ${totalBet} Kč`);
    console.log(` - Celkem vyplaceno: ${totalPayout} Kč`);
    console.log(` - Návratnost pro hráče (RTP): ${rtp.toFixed(2)} %\n`);

    // Verification Assertions
    if (winPercentage <= 50) {
        console.error('❌ CHYBA: Šance na výhru je menší než nebo rovna 50 %!');
        process.exit(1);
    } else {
        console.log('✅ TEST PROŠEL: Šance na výhru je vyšší než prohra (> 50 %).');
    }

    if (rtp <= 100) {
        console.error('❌ CHYBA: RTP je menší než 100 %!');
        process.exit(1);
    } else {
        console.log('✅ TEST PROŠEL: Hráč má v průměru zisk (RTP > 100 %).');
    }
}

runSimulation();
