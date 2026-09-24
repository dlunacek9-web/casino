const { generateOutcome, SYMBOLS } = require('./app.js');

function runSimulation(numSpins = 10000) {
    console.log(`=== SPUŠTĚNÍ SIMULACE 5x5 MŘÍŽKY (${numSpins} ZATOČENÍ) ===\n`);

    let wins = 0;
    let totalBet = 0;
    let totalPayout = 0;
    const bet = 10;

    let jackpots = 0;
    let match5 = 0;
    let lineWins = 0;
    let losses = 0;

    for (let i = 0; i < numSpins; i++) {
        totalBet += bet;
        const result = generateOutcome();

        // Basic verification that grid is 5x5
        if (result.grid.length !== 5 || result.grid[0].length !== 5) {
            console.error('❌ CHYBA: Grid nemá rozměr 5x5!');
            process.exit(1);
        }

        if (result.type === 'JACKPOT') {
            jackpots++;
            wins++;
        } else if (result.type === '5_MATCH') {
            match5++;
            wins++;
        } else if (result.type === 'LINE_WIN') {
            lineWins++;
            wins++;
        } else {
            losses++;
        }

        totalPayout += bet * result.multiplier;
    }

    const winPercentage = (wins / numSpins) * 100;
    const rtp = (totalPayout / totalBet) * 100;

    console.log(`Výsledky 5x5 mřížky po ${numSpins} zatočeních:`);
    console.log(` - Výherní zatočení: ${wins} / ${numSpins} (${winPercentage.toFixed(2)} %)`);
    console.log(` - Proherní zatočení: ${losses} / ${numSpins} (${((losses / numSpins) * 100).toFixed(2)} %)`);
    console.log(` - Počet Jackpotů: ${jackpots}`);
    console.log(` - Počet 5 v řadě: ${match5}`);
    console.log(` - Počet Line wins (3-4 v řadě): ${lineWins}`);
    console.log(` - Celkem vsazeno: ${totalBet} Kč`);
    console.log(` - Celkem vyplaceno: ${totalPayout} Kč`);
    console.log(` - Návratnost pro hráče (RTP): ${rtp.toFixed(2)} %\n`);

    // Verification Assertions
    if (winPercentage <= 50) {
        console.error('❌ CHYBA: Šance na výhru u 5x5 je menší než nebo rovna 50 %!');
        process.exit(1);
    } else {
        console.log('✅ TEST PROŠEL: Šance na výhru u 5x5 mřížky je vyšší než prohra (> 50 %).');
    }

    if (rtp <= 100) {
        console.error('❌ CHYBA: RTP u 5x5 je menší než 100 %!');
        process.exit(1);
    } else {
        console.log('✅ TEST PROŠEL: Hráč má v průměru zisk (RTP > 100 %).');
    }
}

runSimulation();
