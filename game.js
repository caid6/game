class Snake {
    constructor() {
        this.body = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 }
        ];
        this.direction = 'right';
        this.nextDirection = 'right';
    }

    move() {
        this.direction = this.nextDirection;
        const head = { ...this.body[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.body.unshift(head);
        this.body.pop();
    }

    grow() {
        const tail = { ...this.body[this.body.length - 1] };
        this.body.push(tail);
    }

    checkCollision(gridSize) {
        const head = this.body[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            return true;
        }

        // 检查是否撞到自己
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }

        return false;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // 20x20的网格
        this.tileSize = this.canvas.width / this.gridSize;
        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.gameOver = false;
        this.difficulty = 'normal'; // 默认难度为中等
        this.difficultySettings = {
            easy: { initialSpeed: 300, speedDecrease: 1, minSpeed: 150 },
            normal: { initialSpeed: 150, speedDecrease: 5, minSpeed: 50 },
            hard: { initialSpeed: 100, speedDecrease: 8, minSpeed: 30 }
        };
        this.speed = this.difficultySettings[this.difficulty].initialSpeed;
        this.isPaused = false;
        this.isRunning = false;
        this.leaderboard = this.loadLeaderboard();

        this.setupEventListeners();
        this.setupGameControls();
    }

    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            // 处理空格键暂停/继续
            if (e.key === ' ') {
                if (this.isRunning && !this.gameOver) {
                    if (this.isPaused) {
                        this.resumeGame();
                    } else {
                        this.pauseGame();
                    }
                }
                e.preventDefault();
                return;
            }

            if (!this.isRunning || this.isPaused || this.gameOver) return;
            
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.snake.direction !== 'down') this.snake.nextDirection = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.snake.direction !== 'up') this.snake.nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.snake.direction !== 'right') this.snake.nextDirection = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.snake.direction !== 'left') this.snake.nextDirection = 'right';
                    break;
            }
        });

        // 触摸控制
        let touchStartX = 0;
        let touchStartY = 0;
        let lastTapTime = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;

            // 检测双击暂停
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
            if (tapLength < 300 && tapLength > 0) {
                if (this.isRunning && !this.gameOver) {
                    if (this.isPaused) {
                        this.resumeGame();
                    } else {
                        this.pauseGame();
                    }
                }
            }
            lastTapTime = currentTime;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isRunning || this.isPaused || this.gameOver) return;
            e.preventDefault();

            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            // 需要足够的滑动距离才改变方向
            const minSwipeDistance = 30;

            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
                // 水平滑动
                if (dx > 0 && this.snake.direction !== 'left') {
                    this.snake.nextDirection = 'right';
                } else if (dx < 0 && this.snake.direction !== 'right') {
                    this.snake.nextDirection = 'left';
                }
            } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipeDistance) {
                // 垂直滑动
                if (dy > 0 && this.snake.direction !== 'up') {
                    this.snake.nextDirection = 'down';
                } else if (dy < 0 && this.snake.direction !== 'down') {
                    this.snake.nextDirection = 'up';
                }
            }

            // 更新起始点，使滑动更流畅
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        });
    }

    setupGameControls() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const difficultySelect = document.createElement('select');
        difficultySelect.id = 'difficultySelect';
        
        const difficulties = [
            { value: 'easy', text: '简单' },
            { value: 'normal', text: '中等' },
            { value: 'hard', text: '困难' }
        ];
        
        difficulties.forEach(diff => {
            const option = document.createElement('option');
            option.value = diff.value;
            option.textContent = diff.text;
            if (diff.value === this.difficulty) {
                option.selected = true;
            }
            difficultySelect.appendChild(option);
        });
        
        difficultySelect.addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            if (!this.isRunning) {
                this.speed = this.difficultySettings[this.difficulty].initialSpeed;
            }
        });
        
        // 将难度选择器插入到开始按钮之前
        startBtn.parentNode.insertBefore(difficultySelect, startBtn);

        startBtn.addEventListener('click', () => {
            if (this.gameOver || this.isPaused) {
                this.resetGame();
            } else if (!this.isRunning) {
                this.startGame();
            }
        });

        pauseBtn.addEventListener('click', () => {
            if (this.isPaused) {
                this.resumeGame();
            } else {
                this.pauseGame();
            }
        });
    }

    startGame() {
        this.isRunning = true;
        document.getElementById('startBtn').textContent = '重新开始';
        document.getElementById('pauseBtn').disabled = false;
        this.gameLoop();
    }

    pauseGame() {
        this.isPaused = true;
        document.getElementById('pauseBtn').textContent = '继续游戏';
    }

    resumeGame() {
        this.isPaused = false;
        document.getElementById('pauseBtn').textContent = '暂停游戏';
        this.gameLoop();
    }

    resetGame() {
        this.gameOver = false;
        this.isPaused = false;
        this.isRunning = false;
        this.snake = new Snake();
        this.food = this.generateFood();
        this.score = 0;
        this.speed = this.difficultySettings[this.difficulty].initialSpeed;
        document.getElementById('score').textContent = '0';
        document.getElementById('pauseBtn').textContent = '暂停游戏';
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('startBtn').textContent = '开始游戏';
        this.startGame();
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (this.snake.body.some(segment => 
            segment.x === food.x && segment.y === food.y));
        return food;
    }

    update() {
        if (this.gameOver || !this.isRunning || this.isPaused) return;

        this.snake.move();

        // 检查是否吃到食物
        if (this.snake.body[0].x === this.food.x && this.snake.body[0].y === this.food.y) {
            this.snake.grow();
            this.food = this.generateFood();
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            // 根据难度增加游戏速度
            const { minSpeed, speedDecrease } = this.difficultySettings[this.difficulty];
            this.speed = Math.max(minSpeed, this.speed - speedDecrease);
        }

        // 检查碰撞
        if (this.snake.checkCollision(this.gridSize)) {
            this.gameOver = true;
            this.isRunning = false;
            document.getElementById('startBtn').textContent = '重新开始';
            document.getElementById('pauseBtn').disabled = true;
            this.updateLeaderboard();
            this.drawLeaderboard();
        }
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制蛇
        this.snake.body.forEach((segment, index) => {
            // 为蛇身创建更丰富的渐变色效果
            const gradient = this.ctx.createLinearGradient(
                segment.x * this.tileSize,
                segment.y * this.tileSize,
                (segment.x + 1) * this.tileSize,
                (segment.y + 1) * this.tileSize
            );
            
            if (index === 0) {
                // 蛇头使用更鲜艳的渐变色
                gradient.addColorStop(0, '#1B5E20');
                gradient.addColorStop(0.4, '#2E7D32');
                gradient.addColorStop(0.6, '#388E3C');
                gradient.addColorStop(1, '#43A047');
            } else {
                // 蛇身使用更细腻的渐变
                const colorPos = index / this.snake.body.length;
                gradient.addColorStop(0, `hsl(120, ${50 + colorPos * 20}%, ${60 + colorPos * 10}%)`);
                gradient.addColorStop(1, `hsl(120, ${45 + colorPos * 20}%, ${55 + colorPos * 10}%)`);
            }
            
            // 添加阴影效果
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(
                    segment.x * this.tileSize,
                    segment.y * this.tileSize,
                    this.tileSize - 1,
                    this.tileSize - 1,
                    4 // 圆角半径
                );
            } else {
                // 为不支持roundRect的浏览器提供后备方案
                const x = segment.x * this.tileSize;
                const y = segment.y * this.tileSize;
                const width = this.tileSize - 1;
                const height = this.tileSize - 1;
                const radius = 4;

                this.ctx.moveTo(x + radius, y);
                this.ctx.lineTo(x + width - radius, y);
                this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                this.ctx.lineTo(x + width, y + height - radius);
                this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                this.ctx.lineTo(x + radius, y + height);
                this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                this.ctx.lineTo(x, y + radius);
                this.ctx.quadraticCurveTo(x, y, x + radius, y);
            }
            this.ctx.fill();
        });

        // 绘制食物
        const foodX = this.food.x * this.tileSize;
        const foodY = this.food.y * this.tileSize;
        const foodSize = this.tileSize - 2;

        // 使用扁平化设计
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.rect(
            foodX + 1,
            foodY + 1,
            foodSize - 2,
            foodSize - 2
        );
        this.ctx.fill();

        // 如果游戏结束，显示结束信息
        if (this.gameOver) {
            this.drawLeaderboard();
        }
    }

    drawLeaderboard() {
        // 使用半透明白色背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 启用字体平滑
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';

        // 使用系统字体栈提升清晰度
        const fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';

        // 根据得分显示不同的段位称号
        this.ctx.fillStyle = '#333';
        this.ctx.font = `bold 48px ${fontStack}`;
        let rankText = '';
        if (this.score === 0) {
            rankText = '菜得抠脚';
        } else if (this.score < 100) {
            rankText = '倔强青铜';
        } else if (this.score < 200) {
            rankText = '秩序白银';
        } else if (this.score < 300) {
            rankText = '荣耀黄金';
        } else if (this.score < 400) {
            rankText = '尊贵铂金';
        } else if (this.score < 500) {
            rankText = '永恒钻石';
        } else if (this.score < 600) {
            rankText = '至尊星耀';
        } else {
            rankText = '最强王者';
        }
        this.ctx.fillText(rankText, this.canvas.width/2, this.canvas.height/2 - 80);
        
        // 最终得分
        this.ctx.font = `bold 24px ${fontStack}`;
        this.ctx.fillText(`最终得分: ${this.score}`, this.canvas.width/2, this.canvas.height/2 - 30);

        // 排行榜标题
        this.ctx.fillText('排行榜', this.canvas.width/2, this.canvas.height/2 + 10);

        // 排行榜内容
        this.ctx.font = `16px ${fontStack}`;
        this.leaderboard.forEach((entry, index) => {
            const text = `${index + 1}. ${entry.score}分 - ${entry.date}`;
            this.ctx.fillText(text, this.canvas.width/2, this.canvas.height/2 + 50 + index * 25);
        });
    }

    gameLoop() {
        if (!this.isPaused && this.isRunning) {
            this.update();
            this.draw();
        }
        if (!this.gameOver && this.isRunning) {
            setTimeout(() => {
                requestAnimationFrame(() => this.gameLoop());
            }, this.speed);
        }
    }

    loadLeaderboard() {
        const savedLeaderboard = localStorage.getItem('snakeGameLeaderboard');
        return savedLeaderboard ? JSON.parse(savedLeaderboard) : [];
    }

    updateLeaderboard() {
        const newEntry = {
            score: this.score,
            date: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            })
        };
        
        this.leaderboard.push(newEntry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 5); // 只保留前5名
        
        localStorage.setItem('snakeGameLeaderboard', JSON.stringify(this.leaderboard));
    }

}

// 初始化游戏
const game = new Game();