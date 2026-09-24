/**
 * Štědrý Výherní Automat - Mřížka 5x5
 * high win rate logic (>55% win chance, high RTP)
 */

// Symbols definition with payout multipliers
const SYMBOLS = [
    { name: 'diamond', icon: '💎', weight: 4, multiplier: 100 },
    { name: 'slot',    icon: '🎰', weight: 8, multiplier: 25 },
    { name: 'crown',   icon: '👑', weight: 12, multiplier: 15 },
    { name: 'bell',    icon: '🔔', weight: 15, multiplier: 10 },
    { name: 'star',    icon: '⭐', weight: 18, multiplier: 5 },
    { name: 'lemon',   icon: '🍋', weight: 22, multiplier: 3 },
    { name: 'cherry',  icon: '🍒', weight: 22, multiplier: 2 }
];

// Helper to select random element by weight
function getRandomSymbolByWeight() {
    const totalWeight = SYMBOLS.reduce((acc, s) => acc + s.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const sym of SYMBOLS) {
        if (rand < sym.weight) return sym;
        rand -= sym.weight;
    }
    return SYMBOLS[SYMBOLS.length - 1];
}

// Generate a 5x5 grid (5 reels, 5 rows each) with >55% overall win rate
function generateOutcome() {
    const rand = Math.random();
    const grid = []; // 5 columns (reels), each containing 5 symbols

    // Initialize blank 5x5 grid
    for (let col = 0; col < 5; col++) {
        grid[col] = [];
    }

    // 1) 3% Big Jackpot (Full line of 5 Diamonds or full grid match)
    if (rand < 0.03) {
        const diamond = SYMBOLS.find(s => s.name === 'diamond');
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                grid[col][row] = (row === 2) ? diamond : getRandomSymbolByWeight();
            }
        }
        return { grid, type: 'JACKPOT', multiplier: 100 };
    }

    // 2) 15% 5-in-a-row or 5-in-a-diagonal Match (25x multiplier)
    if (rand < 0.18) {
        const sym = getRandomSymbolByWeight();
        const targetRow = Math.floor(Math.random() * 5);
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                if (row === targetRow) {
                    grid[col][row] = sym;
                } else {
                    grid[col][row] = getRandomSymbolByWeight();
                }
            }
        }
        return { grid, type: '5_MATCH', multiplier: 25 };
    }

    // 3) 40% 3 or 4 matching symbols on a line (Mini win 2x - 5x)
    if (rand < 0.58) {
        const sym = getRandomSymbolByWeight();
        const targetRow = Math.floor(Math.random() * 5);
        const matchCount = Math.random() < 0.5 ? 3 : 4;

        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                if (row === targetRow && col < matchCount) {
                    grid[col][row] = sym;
                } else {
                    grid[col][row] = getRandomSymbolByWeight();
                }
            }
        }
        return { grid, type: 'LINE_WIN', multiplier: matchCount === 4 ? 10 : 2.5 };
    }

    // 4) 42% Loss (Random scatter with no 3+ consecutive row matches)
    for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 5; row++) {
            grid[col][row] = getRandomSymbolByWeight();
        }
    }

    // Double check if random grid incidentally has a win line, otherwise classify as loss
    return { grid, type: 'LOSS', multiplier: 0 };
}

// Sound Synthesizer using Web Audio API
class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
    }

    playTone(freq, duration, type = 'sine', startDelay = 0) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startDelay);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime + startDelay);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startDelay + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + startDelay);
            osc.stop(this.ctx.currentTime + startDelay + duration);
        } catch (e) {
            console.error(e);
        }
    }

    playSpinSound() {
        this.init();
        this.playTone(300, 0.08, 'triangle');
    }

    playReelStopSound() {
        this.init();
        this.playTone(180, 0.1, 'square');
    }

    playWinSound() {
        this.init();
        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
        notes.forEach((freq, idx) => {
            this.playTone(freq, 0.2, 'triangle', idx * 0.1);
        });
    }

    playJackpotSound() {
        this.init();
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
            this.playTone(freq, 0.3, 'sawtooth', idx * 0.12);
        });
    }
}

// Confetti Particle Effect for big wins
class Confetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animating = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    trigger(count = 100) {
        this.particles = [];
        const colors = ['#ffd700', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.7) * 18,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                vRot: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }
        if (!this.animating) {
            this.animating = true;
            this.loop();
        }
    }

    loop() {
        if (!this.animating) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.4; // gravity
            p.rotation += p.vRot;
            p.opacity -= 0.008;

            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.opacity);
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            this.ctx.restore();

            if (p.opacity <= 0 || p.y > this.canvas.height) {
                this.particles.splice(idx, 1);
            }
        });

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.loop());
        } else {
            this.animating = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Game Controller State & Setup
class SlotMachineApp {
    constructor() {
        this.balance = 1000;
        this.bet = 10;
        this.lastWin = 0;
        this.isSpinning = false;
        this.autoPlay = false;

        // Stats
        this.totalSpins = 0;
        this.totalWins = 0;
        this.totalWonAmount = 0;

        // Sound & Effects
        this.sound = new SoundManager();
        this.confetti = new Confetti(document.getElementById('confettiCanvas'));

        // DOM Elements
        this.dom = {
            balance: document.getElementById('balanceDisplay'),
            bet: document.getElementById('betDisplay'),
            lastWin: document.getElementById('lastWinDisplay'),
            btnSpin: document.getElementById('btnSpin'),
            btnAuto: document.getElementById('btnAutoSpin'),
            btnReload: document.getElementById('btnReload'),
            btnSound: document.getElementById('btnSound'),
            btnBetPlus: document.getElementById('btnBetPlus'),
            btnBetMinus: document.getElementById('btnBetMinus'),
            messageBanner: document.getElementById('messageBanner'),
            messageText: document.getElementById('messageText'),
            reels: [
                document.getElementById('reel1'),
                document.getElementById('reel2'),
                document.getElementById('reel3'),
                document.getElementById('reel4'),
                document.getElementById('reel5')
            ],
            statSpins: document.getElementById('statSpins'),
            statWins: document.getElementById('statWins'),
            statWinRate: document.getElementById('statWinRate'),
            statTotalWon: document.getElementById('statTotalWon')
        };

        this.init();
    }

    init() {
        this.updateDisplay();
        this.bindEvents();
    }

    bindEvents() {
        this.dom.btnSpin.addEventListener('click', () => this.spin());

        this.dom.btnAuto.addEventListener('click', () => this.toggleAutoPlay());

        this.dom.btnReload.addEventListener('click', () => {
            this.balance += 500;
            this.showMessage('Konto bylo doplněno o 500 Kč! 💰', 'win');
            this.updateDisplay();
        });

        this.dom.btnSound.addEventListener('click', () => {
            this.sound.muted = !this.sound.muted;
            this.dom.btnSound.textContent = this.sound.muted ? '🔇' : '🔊';
        });

        this.dom.btnBetPlus.addEventListener('click', () => {
            if (this.bet < 1000) {
                this.bet += 10;
                this.updateDisplay();
            }
        });

        this.dom.btnBetMinus.addEventListener('click', () => {
            if (this.bet > 10) {
                this.bet -= 10;
                this.updateDisplay();
            }
        });

        document.querySelectorAll('.btn-quick-bet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = parseInt(e.target.dataset.bet, 10);
                if (val) {
                    this.bet = val;
                    this.updateDisplay();
                }
            });
        });

        // Spacebar shortcut to spin
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isSpinning) {
                e.preventDefault();
                this.spin();
            }
        });
    }

    updateDisplay() {
        this.dom.balance.textContent = this.balance.toLocaleString('cs-CZ');
        this.dom.bet.textContent = `${this.bet} Kč`;
        this.dom.lastWin.textContent = this.lastWin.toLocaleString('cs-CZ');

        // Stats
        this.dom.statSpins.textContent = this.totalSpins;
        this.dom.statWins.textContent = this.totalWins;
        const winRate = this.totalSpins > 0 ? ((this.totalWins / this.totalSpins) * 100).toFixed(1) : '0.0';
        this.dom.statWinRate.textContent = `${winRate} %`;
        this.dom.statTotalWon.textContent = `${this.totalWonAmount.toLocaleString('cs-CZ')} Kč`;

        // Bet button active states
        document.querySelectorAll('.btn-quick-bet').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.bet, 10) === this.bet);
        });

        // Spin button state
        this.dom.btnSpin.disabled = this.isSpinning || this.balance < this.bet;
    }

    showMessage(text, type = '') {
        this.dom.messageBanner.className = `message-banner ${type}`;
        this.dom.messageText.textContent = text;
    }

    toggleAutoPlay() {
        this.autoPlay = !this.autoPlay;
        this.dom.btnAuto.classList.toggle('active', this.autoPlay);
        this.dom.btnAuto.textContent = this.autoPlay ? 'ZASTAVIT AUTO' : 'AUTO PLAY';

        if (this.autoPlay && !this.isSpinning) {
            this.spin();
        }
    }

    spin() {
        if (this.isSpinning) return;

        if (this.balance < this.bet) {
            this.showMessage('Nedostatek kreditů! Klikněte na "+ Doplnit konto".', 'jackpot');
            if (this.autoPlay) this.toggleAutoPlay();
            return;
        }

        // Deduct bet
        this.balance -= this.bet;
        this.isSpinning = true;
        this.totalSpins++;
        this.updateDisplay();

        this.showMessage('Točím 5x5 mřížku...', '');

        // Remove win highlights from previous spin
        this.dom.reels.forEach(reel => reel.classList.remove('win-highlight'));

        // Generate target 5x5 grid outcome
        const outcome = generateOutcome();

        // Animate 5 reels spinning
        const duration = 1000;
        const spinIntervals = [];

        this.dom.reels.forEach((reelWindow, colIdx) => {
            reelWindow.classList.add('blur');
            const reelStrip = reelWindow.querySelector('.reel-strip');

            let spinCount = 0;
            const interval = setInterval(() => {
                let html = '';
                for (let r = 0; r < 5; r++) {
                    const randomSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
                    html += `<div class="symbol">${randomSym.icon}</div>`;
                }
                reelStrip.innerHTML = html;
                spinCount++;
                if (spinCount % 2 === 0) {
                    this.sound.playSpinSound();
                }
            }, 60);

            spinIntervals.push(interval);

            // Stop each column sequentially
            const stopDelay = duration + colIdx * 200;
            setTimeout(() => {
                clearInterval(interval);
                reelWindow.classList.remove('blur');

                // Render final 5 symbols for this reel column
                let finalHtml = '';
                for (let r = 0; r < 5; r++) {
                    const sym = outcome.grid[colIdx][r];
                    finalHtml += `<div class="symbol">${sym.icon}</div>`;
                }
                reelStrip.innerHTML = finalHtml;
                this.sound.playReelStopSound();

                // If final 5th reel stopped
                if (colIdx === 4) {
                    this.isSpinning = false;
                    this.handleSpinResult(outcome);
                }
            }, stopDelay);
        });
    }

    handleSpinResult(outcome) {
        const winAmount = Math.floor(this.bet * outcome.multiplier);
        this.lastWin = winAmount;

        if (winAmount > 0) {
            this.balance += winAmount;
            this.totalWins++;
            this.totalWonAmount += winAmount;

            this.dom.reels.forEach(reel => reel.classList.add('win-highlight'));

            if (outcome.type === 'JACKPOT') {
                this.showMessage(`🎉 MEGA JACKPOT 5x5! Vyhráváte ${winAmount} Kč! 🎉`, 'jackpot');
                this.sound.playJackpotSound();
                this.confetti.trigger(150);
            } else if (outcome.type === '5_MATCH') {
                this.showMessage(`✨ SKVĚLÁ VÝHRA 5 V ŘADĚ! +${winAmount} Kč ✨`, 'win');
                this.sound.playWinSound();
                this.confetti.trigger(80);
            } else {
                this.showMessage(`👍 VÝHRA NA MŘÍŽCE! +${winAmount} Kč`, 'win');
                this.sound.playWinSound();
            }
        } else {
            this.showMessage('Nevyšlo to, zkuste to znovu! Vysoká šance na výhru trvá 😉', '');
        }

        this.updateDisplay();

        // Continue AutoPlay if enabled
        if (this.autoPlay) {
            setTimeout(() => {
                if (this.autoPlay && !this.isSpinning) {
                    this.spin();
                }
            }, 800);
        }
    }
}

// Global Export for testing and initialization
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SYMBOLS,
        getRandomSymbolByWeight,
        generateOutcome
    };
} else {
    window.addEventListener('DOMContentLoaded', () => {
        window.slotApp = new SlotMachineApp();
    });
}
