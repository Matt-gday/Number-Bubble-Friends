class NumberBubbleGame {
    constructor() {
        this.gameArea = document.getElementById('gameArea');
        this.score = 0;
        this.level = 1;
        this.bubbles = [];
        this.selectedBubble = null;
        this.gameRunning = false;
        this.gamePaused = false;
        this.spawnTimer = null;
        this.moveTimer = null;
        this.bubblesPerLevel = 6; // Start with 3 pairs
        this.totalBubblesThisLevel = 0; // Track total bubbles for current level
        this.bubblesPopped = 0; // Track how many bubbles have been popped
        this.bubbleSpeed = 0.6;
        this.spawnRate = 2000; // ms between spawns
        
        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
            '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
        ];
        
        this.bubbleImages = [
            'bubble1.png', 'bubble2.png', 'bubble3.png', 'bubble4.png', 'bubble5.png',
            'bubble6.png', 'bubble7.png', 'bubble8.png', 'bubble9.png'
        ];
        
        this.numberPairs = [
            [0, 10], [1, 9], [2, 8], [3, 7], [4, 6], [5, 5],
            [0, 10], [1, 9], [2, 8], [3, 7], [4, 6], [5, 5],
            [0, 10], [1, 9], [2, 8], [3, 7], [4, 6], [5, 5]
        ];
        
        this.highScores = this.loadHighScores();
        this.currentGameScore = 0;
    }
    
    startGame() {
        // Stop any existing game and clear timers
        this.gameRunning = false;
        if (this.moveTimer) {
            clearInterval(this.moveTimer);
            this.moveTimer = null;
        }
        
        // Reset game state
        this.score = 0;
        this.level = 1;
        this.bubbles = [];
        this.selectedBubble = null;
        this.gameRunning = true;
        this.gamePaused = false;
        
        // Reset level-specific values to initial state
        this.bubblesPerLevel = 6; // Reset to level 1 bubble count
        this.bubbleSpeed = 0.6; // Reset to initial speed
        this.totalBubblesThisLevel = this.bubblesPerLevel;
        this.bubblesPopped = 0;
        
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('levelComplete').style.display = 'none';
        document.getElementById('startBtn').textContent = 'Restart';
        
        this.clearAllBubbles();
        this.updateDisplay();
        this.spawnLevelBubbles();
        this.startGameLoop();
    }
    
    spawnLevelBubbles() {
        const pairs = [...this.numberPairs];
        const bubblesNeeded = this.bubblesPerLevel;
        const pairsNeeded = Math.ceil(bubblesNeeded / 2);
        
        // Shuffle and select pairs for this level
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }
        
        const selectedPairs = pairs.slice(0, pairsNeeded);
        const numbersToSpawn = [];
        
        selectedPairs.forEach(pair => {
            numbersToSpawn.push(pair[0], pair[1]);
        });
        
        // If we need an odd number of bubbles, remove one
        if (numbersToSpawn.length > bubblesNeeded) {
            numbersToSpawn.pop();
        }
        
        // Shuffle the numbers
        for (let i = numbersToSpawn.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbersToSpawn[i], numbersToSpawn[j]] = [numbersToSpawn[j], numbersToSpawn[i]];
        }
        
        // Spawn bubbles at intervals
        numbersToSpawn.forEach((number, index) => {
            setTimeout(() => {
                if (this.gameRunning) {
                    this.createBubble(number);
                }
            }, index * 800);
        });
    }
    
    createBubble(number) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = number;
        bubble.dataset.number = number;
        
        // Randomly select a bubble image
        const randomImageIndex = Math.floor(Math.random() * this.bubbleImages.length);
        const bubbleImage = this.bubbleImages[randomImageIndex];
        bubble.style.backgroundImage = `url('${bubbleImage}')`;
        bubble.style.backgroundSize = 'cover';
        bubble.style.backgroundPosition = 'center';
        bubble.style.backgroundRepeat = 'no-repeat';
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const bubbleX = this.findNonOverlappingPosition(gameAreaRect.width - 70);
        bubble.style.left = bubbleX + 'px';
        bubble.style.top = gameAreaRect.height + 'px';
        
        bubble.addEventListener('click', () => this.clickBubble(bubble));
        
        this.gameArea.appendChild(bubble);
        
        // Assign a random speed to each bubble (between 0.3 and 1.2)
        const bubbleSpeed = 0.2 + Math.random() * 0.4;
        
        this.bubbles.push({
            element: bubble,
            number: number,
            x: bubbleX,
            y: gameAreaRect.height,
            speed: bubbleSpeed
        });
        
        this.updateDisplay();
    }
    
    clickBubble(bubble) {
        if (!this.gameRunning || this.gamePaused) return;
        
        const number = parseInt(bubble.dataset.number);
        
        if (this.selectedBubble === null) {
            // First selection
            this.selectedBubble = { element: bubble, number: number };
            bubble.classList.add('selected');
        } else if (this.selectedBubble.element === bubble) {
            // Deselect
            bubble.classList.remove('selected');
            this.selectedBubble = null;
        } else {
            // Second selection - check if they add to 10
            if (this.selectedBubble.number + number === 10) {
                // Correct pair!
                this.popBubbles(this.selectedBubble.element, bubble);
                this.score += 10 * this.level;
                this.selectedBubble = null;
            } else {
                // Wrong pair - switch selection
                this.selectedBubble.element.classList.remove('selected');
                this.selectedBubble = { element: bubble, number: number };
                bubble.classList.add('selected');
            }
        }
    }
    
    popBubbles(bubble1, bubble2) {
        bubble1.classList.add('popping');
        bubble2.classList.add('popping');
        
        // Create soap particles at bubble positions
        const rect1 = bubble1.getBoundingClientRect();
        const rect2 = bubble2.getBoundingClientRect();
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        // Calculate relative positions within the game area
        const x1 = rect1.left - gameAreaRect.left + rect1.width / 2;
        const y1 = rect1.top - gameAreaRect.top + rect1.height / 2;
        const x2 = rect2.left - gameAreaRect.left + rect2.width / 2;
        const y2 = rect2.top - gameAreaRect.top + rect2.height / 2;
        
        // Create particles for both bubbles
        this.createSoapParticles(x1, y1);
        this.createSoapParticles(x2, y2);
        
        // Increment popped count (2 bubbles popped)
        this.bubblesPopped += 2;
        
        setTimeout(() => {
            this.removeBubble(bubble1);
            this.removeBubble(bubble2);
            this.checkLevelComplete();
        }, 800);
    }
    
    removeBubble(bubbleElement) {
        const index = this.bubbles.findIndex(b => b.element === bubbleElement);
        if (index > -1) {
            this.bubbles.splice(index, 1);
            bubbleElement.remove();
            this.updateDisplay();
        }
    }
    
    checkLevelComplete() {
        if (this.bubbles.length === 0 && this.gameRunning) {
            this.gameRunning = false;
            document.getElementById('levelComplete').style.display = 'block';
        }
    }
    
    nextLevel() {
        this.level++;
        // Start with 6 bubbles (3 pairs), increase by 2 each level (1 pair)
        this.bubblesPerLevel = 6 + (this.level - 1) * 2;
        this.totalBubblesThisLevel = this.bubblesPerLevel;
        this.bubblesPopped = 0;
        
        // Increase speed starting at level 10
        if (this.level >= 10) {
            this.bubbleSpeed = 0.8; // Slightly faster speed from level 10 onwards
        }
        
        document.getElementById('levelComplete').style.display = 'none';
        this.updateDisplay();
        this.spawnLevelBubbles();
        this.gameRunning = true;
    }
    
    startGameLoop() {
        this.moveTimer = setInterval(() => {
            if (this.gameRunning && !this.gamePaused) {
                this.moveBubbles();
            }
        }, 16); // ~60 FPS
    }
    
    moveBubbles() {
        const gameAreaHeight = this.gameArea.getBoundingClientRect().height;
        
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            bubble.y -= bubble.speed; // Use individual bubble speed
            bubble.element.style.top = bubble.y + 'px';
            
            // Check if bubble reached the top
            if (bubble.y < -70) {
                this.gameOver();
                return;
            }
        }
    }
    
    gameOver() {
        this.gameRunning = false;
        clearInterval(this.moveTimer);
        this.currentGameScore = this.score;
        
        // Create array of remaining bubbles and shuffle them
        const remainingBubbles = [...this.bubbles];
        this.shuffleArray(remainingBubbles);
        
        // Pop all remaining bubbles in random order
        remainingBubbles.forEach((bubble, index) => {
            setTimeout(() => {
                if (bubble.element && bubble.element.parentNode) {
                    // Create particles for game over bubbles too
                    const rect = bubble.element.getBoundingClientRect();
                    const gameAreaRect = this.gameArea.getBoundingClientRect();
                    const x = rect.left - gameAreaRect.left + rect.width / 2;
                    const y = rect.top - gameAreaRect.top + rect.height / 2;
                    this.createSoapParticles(x, y);
                    
                    bubble.element.classList.add('popping');
                    setTimeout(() => {
                        if (bubble.element && bubble.element.parentNode) {
                            bubble.element.remove();
                        }
                    }, 800);
                }
            }, index * 150); // 150ms delay between each pop
        });
        
        // Clear the bubbles array
        this.bubbles = [];
        
        // Show game over screen after all bubbles have started popping
        setTimeout(() => {
            document.getElementById('finalScore').textContent = this.score;
            document.getElementById('finalLevel').textContent = this.level;
            
            this.displayHighScores();
            document.getElementById('gameOver').style.display = 'block';
        }, remainingBubbles.length * 150 + 400);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    findNonOverlappingPosition(maxWidth) {
        const bubbleWidth = 70;
        const minDistance = 80; // Minimum distance between bubble centers
        const maxAttempts = 50;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const candidateX = Math.random() * maxWidth;
            let validPosition = true;
            
            // Check against existing bubbles in the lower portion of screen
            for (const existingBubble of this.bubbles) {
                const existingX = existingBubble.x;
                const existingY = existingBubble.y;
                const gameAreaHeight = this.gameArea.getBoundingClientRect().height;
                
                // Only check against bubbles in the lower 60% of the screen
                if (existingY > gameAreaHeight * 0.4) {
                    const horizontalDistance = Math.abs(candidateX - existingX);
                    
                    if (horizontalDistance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            if (validPosition) {
                return candidateX;
            }
        }
        
        // If no valid position found after max attempts, return random position
        return Math.random() * maxWidth;
    }
    
    createSoapParticles(x, y) {
        const particleCount = 6 + Math.floor(Math.random() * 4); // 6-9 particles
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'soap-particle';
            
            // Random position around the bubble center
            const offsetX = (Math.random() - 0.5) * 40; // ±20px from center
            const offsetY = (Math.random() - 0.5) * 40; // ±20px from center
            
            particle.style.left = (x + offsetX) + 'px';
            particle.style.top = (y + offsetY) + 'px';
            
            // Random size variation
            const size = 6 + Math.random() * 4; // 6-10px
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            // Random fall direction and distance
            const fallX = (Math.random() - 0.5) * 60; // ±30px horizontal drift
            const fallY = 40 + Math.random() * 40; // 40-80px fall distance
            const rotation = Math.random() * 720 - 360; // Random rotation
            const duration = 1 + Math.random() * 0.8; // 1-1.8 seconds
            
            // Apply custom animation
            particle.style.animation = `soapParticleFall ${duration}s ease-out forwards`;
            particle.style.setProperty('--fall-x', fallX + 'px');
            particle.style.setProperty('--fall-y', fallY + 'px');
            particle.style.setProperty('--rotation', rotation + 'deg');
            
            this.gameArea.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, duration * 1000);
        }
    }
    
    pauseGame() {
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.querySelector('.btn-secondary');
        pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
    }
    
    clearAllBubbles() {
        // Remove all bubbles from the array
        this.bubbles.forEach(bubble => bubble.element.remove());
        this.bubbles = [];
        
        // Also remove any bubble elements that might still be in the DOM
        const remainingBubbles = this.gameArea.querySelectorAll('.bubble');
        remainingBubbles.forEach(bubble => bubble.remove());
        
        this.selectedBubble = null;
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('bubblesLeft').textContent = `${this.bubblesPopped}/${this.totalBubblesThisLevel}`;
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    loadHighScores() {
        const stored = localStorage.getItem('bubbleFriendsHighScores');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveHighScores() {
        localStorage.setItem('bubbleFriendsHighScores', JSON.stringify(this.highScores));
    }
    
    isHighScore(score) {
        return this.highScores.length < 10 || score > this.highScores[this.highScores.length - 1].score;
    }
    
    addHighScore(name, score) {
        this.highScores.push({ name: name, score: score });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);
        this.saveHighScores();
    }
    
    displayHighScores() {
        const container = document.getElementById('leaderboardRows');
        container.innerHTML = '';
        
        // Create a temporary list including the current score to determine position
        const tempScores = [...this.highScores];
        let newScorePosition = -1;
        
        if (this.currentGameScore > 0 && this.isHighScore(this.currentGameScore)) {
            tempScores.push({ name: '', score: this.currentGameScore, isNew: true });
            tempScores.sort((a, b) => b.score - a.score);
            newScorePosition = tempScores.findIndex(score => score.isNew);
        }
        
        for (let i = 0; i < 10; i++) {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            
            if (i === newScorePosition) {
                // This is the new score position - show input field
                row.classList.add('new-score');
                row.innerHTML = `
                    <span class="rank">${i + 1}</span>
                    <span class="name">
                        <input type="text" class="name-input" id="newScoreName" maxlength="20" placeholder="Enter your name" />
                    </span>
                    <span class="score">${this.currentGameScore}</span>
                    <span class="save-column">
                        <button class="save-btn" onclick="saveInlineScore(${i})">Save</button>
                    </span>
                `;
                
                // Focus the input after a brief delay
                setTimeout(() => {
                    const input = document.getElementById('newScoreName');
                    if (input) {
                        input.focus();
                        // Add Enter key support
                        input.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') {
                                saveInlineScore(i);
                            }
                        });
                    }
                }, 100);
                
            } else if (i < this.highScores.length + (newScorePosition >= 0 ? 1 : 0)) {
                // Existing score (adjust index if new score is inserted)
                const scoreIndex = i > newScorePosition && newScorePosition >= 0 ? i - 1 : i;
                if (scoreIndex < this.highScores.length) {
                    const score = this.highScores[scoreIndex];
                    row.innerHTML = `
                        <span class="rank">${i + 1}</span>
                        <span class="name">${score.name}</span>
                        <span class="score">${score.score}</span>
                        <span class="save-column"></span>
                    `;
                    
                    // Highlight recently saved score
                    if (score.score === this.currentGameScore && score.name === this.lastAddedName) {
                        row.classList.add('new-score');
                    }
                }
            } else {
                // Empty slot
                row.innerHTML = `
                    <span class="rank">${i + 1}</span>
                    <span class="name">---</span>
                    <span class="score">---</span>
                    <span class="save-column"></span>
                `;
            }
            
            container.appendChild(row);
        }
    }
    
    clearAllHighScores() {
        this.highScores = [];
        this.saveHighScores();
        this.displayHighScores();
    }
}

// Initialize game
const game = new NumberBubbleGame();

// Global functions for buttons
function startGame() {
    game.startGame();
}

function pauseGame() {
    game.pauseGame();
}

function nextLevel() {
    game.nextLevel();
}

function showInstructions() {
    document.getElementById('instructionsModal').style.display = 'flex';
}

function hideInstructions() {
    document.getElementById('instructionsModal').style.display = 'none';
}

function saveInlineScore(position) {
    const nameInput = document.getElementById('newScoreName');
    const name = nameInput.value.trim() || 'Anonymous';
    
    game.lastAddedName = name;
    game.addHighScore(name, game.currentGameScore);
    
    // Reset current game score so it doesn't show the input again
    game.currentGameScore = 0;
    
    game.displayHighScores();
}

function showClearWarning() {
    document.getElementById('clearWarning').style.display = 'flex';
}

function hideClearWarning() {
    document.getElementById('clearWarning').style.display = 'none';
}

function clearHighScores() {
    game.clearAllHighScores();
    hideClearWarning();
}

// Initialize high scores display on page load
window.addEventListener('load', () => {
    game.displayHighScores();
});
