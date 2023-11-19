/*
   Код Gaetano Bonofiglio
   https://github.com/Kidel/
   MIT License
*/

// Получение элемента canvas и его контекста для рисования
var canvas = document.getElementById("pongCanvas");
var ctx = canvas.getContext("2d");

// Цвета для мяча, ракеток и линии посередине
var BALL_COLOR = "#f5d900";
var PADDLE_COLOR ="green";
var LINE_COLOR = "#666666";

// Переменные для отслеживания счета и состояния игры
var scored = "none";
var playerScore = 0;
var enemyScore = 0;
// Объект "ball" (мяч)
var ball = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    radius: 10,
    color: BALL_COLOR,
    colliderDifference: 5,
    physics: [],
    // Метод для отрисовки мяча
    draw: function (canvasContext) {
        // Начинаем путь рисования
        canvasContext.beginPath();
        // Рисуем круг (мяч)
        canvasContext.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        // Заполняем цветом
        canvasContext.fillStyle = this.color;
        // Завершаем путь
        canvasContext.fill();
        canvasContext.closePath();
    },
    // Метод для применения скорости мяча
    applyVelocity: function () {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    },
    // Метод для обработки отскока мяча от объектов на поле
    bounce: function (canvas) {
        var i = 0;
        var hitX = false;
        for (i = 0; i < this.physics.length; i++) {
            hitX = this.collisionX(this.physics[i]);
            if (hitX !== false) break;
        }
        // Проверка на выход мяча за границы по горизонтали
        var oocX = this.isOutOfCanvasX(canvas);
        if (oocX == 1) scored = "player";
        if (oocX == -1) scored = "enemy";
        if (hitX !== false) {
            // Изменение направления мяча при отскоке от объекта по горизонтали
            this.velocity.x = -this.velocity.x;
            this.velocity.y = 3 * (hitX - 0.5);
        }
        // Обработка отскока мяча от объектов по вертикали
        var hitY = false;
        var j = 0;
        for (j = 0; j < this.physics.length; j++) {
            hitY = hitY || this.collisionY(this.physics[j]);
            if (hitY) break;
        }
        // Проверка на выход мяча за границы по вертикали
        var oocY = this.isOutOfCanvasY(canvas);
        if (oocY || hitY)
            this.velocity.y = -this.velocity.y;
        // Воспроизведение звука в зависимости от типа отскока
        if (hitX || hitY) j == 0 || i == 0 ? playSound('soft_hit') : playSound('hit');
        if (oocY) playSound('soft_hit');
    },
    // Метод для проверки выхода мяча за границы по горизонтали
    isOutOfCanvasX: function (canvas) {
        if (this.position.x + this.velocity.x > canvas.width - this.radius + this.colliderDifference) return 1; // Игрок набрал очко
        if (this.position.x + this.velocity.x < this.radius - this.colliderDifference) return -1;
        return 0;
    },
    // Метод для проверки выхода мяча за границы по вертикали
    isOutOfCanvasY: function (canvas) {
        return this.position.y + this.velocity.y < this.radius - this.colliderDifference || this.position.y + this.velocity.y > canvas.height - this.radius + this.colliderDifference;
    },
    // Метод для проверки коллизии мяча по горизонтали с объектом
    collisionX: function (something) {
        if (this.position.y + this.radius > something.position.y && this.position.y - this.radius < something.position.y + something.height &&
            ((this.position.x - this.radius + this.colliderDifference == something.position.x + something.width && this.velocity.x < 0) ||
                (this.position.x + this.radius - this.colliderDifference == something.position.x && this.velocity.x >= 0)))
            return (this.position.y - something.position.y) / something.height;
        else return false;
    },
    // Метод для проверки коллизии мяча по вертикали с объектом
    collisionY: function (something) {
        return (this.position.x + this.radius > something.position.x && this.position.x - this.radius < something.position.x + something.width &&
            ((this.position.y - this.radius + this.colliderDifference == something.position.y + something.height && this.velocity.y < 0) ||
                (this.position.y + this.radius - this.colliderDifference == something.position.y && this.velocity.y >= 0)))
    },
    // Метод для начала игры с установкой начальной позиции и скорости мяча
    start: function (position, velocity) {
        this.position = position;
        this.velocity = velocity;
    },
    // Метод для обновления состояния мяча
    update: function (canvas, canvasContext) {
        this.draw(canvasContext);
        this.bounce(canvas);
        this.applyVelocity();
    }
};
// Объект "paddle" (ракетка игрока)
var paddle = {
    height: 80,
    width: 10,
    position: { x: 0, y: 0 },
    color: PADDLE_COLOR,
    canBeDestroyed: false,
    label: "I am",
    // Метод для отрисовки ракетки
    draw: function (canvasContext) {
        canvasContext.beginPath();
        canvasContext.rect(this.position.x, this.position.y, this.width, this.height);
        canvasContext.fillStyle = this.color;
        canvasContext.fill();
        canvasContext.closePath();
          // Отрисовка подписи рядом с ракеткой
        canvasContext.font = "18px Arial";
        canvasContext.fillStyle = "#FFFFFF";
        canvasContext.fillText(this.label, this.position.x + this.width + 5, this.position.y + this.height / 2 + 5);

        canvasContext.closePath();
    },
    // Метод для управления ракеткой (вверх и вниз)
    control: function (canvas) {
        if (controls.downPressed && !this.isOutOfCanvasBottom(canvas)) {
            this.position.y += 2;
        } else if (controls.upPressed && !this.isOutOfCanvasTop(canvas)) {
            this.position.y -= 2;
        }
        
    },
    // Метод для проверки выхода ракетки за границы вниз
    isOutOfCanvasBottom: function (canvas) {
        return this.position.y > canvas.height - this.height;
    },
    // Метод для проверки выхода ракетки за границы вверх
    isOutOfCanvasTop: function (canvas) {
        return this.position.y < 0;
    },
    // Метод для начала игры с установкой начальной позиции ракетки
    start: function (position) {
        this.position = position;
    },
    // Метод для обновления состояния ракетки
    update: function (canvas, canvasContext) {
        this.control(canvas);
        this.draw(canvasContext);
    }
};
// Объект "enemy" (вражеская ракетка)
var enemy = {
    height: 80,
    width: 10,
    position: { x: 0, y: 0 },
    color: "blue",
    canBeDestroyed: false,
    label: "Bot",
    
    // Метод для отрисовки вражеской ракетки
    draw: function (canvasContext) {
        canvasContext.beginPath();
        canvasContext.rect(this.position.x, this.position.y, this.width, this.height);
        canvasContext.fillStyle = this.color;
        canvasContext.fill();
        canvasContext.closePath();
          // Отрисовка подписи рядом с ракеткой
        canvasContext.font = "18px Arial";
        canvasContext.fillStyle = "#FFFFFF";
        canvasContext.fillText(this.label, this.position.x + this.width + -5, this.position.y + this.height / 2 + 5);

        canvasContext.closePath();
    },
    // Метод для проверки выхода вражеской ракетки за границы вниз
    isOutOfCanvasBottom: function (canvas) {
        return this.position.y > canvas.height - this.height;
    },
    // Метод для проверки выхода вражеской ракетки за границы вверх
    isOutOfCanvasTop: function (canvas) {
        return this.position.y < 0;
    },
    // Метод для управления вражеской ракеткой в зависимости от движения мяча
    control: function (ball, canvas) {
        if (ball.position.y > Math.floor(this.position.y + this.height * 2 / 3) && !this.isOutOfCanvasBottom(canvas)) {
            this.position.y += 1;
        } else if (ball.position.y < Math.floor(this.position.y + this.height / 3) && !this.isOutOfCanvasTop(canvas)) {
            this.position.y -= 1;
        }
    },
    // Метод для начала игры с установкой начальной позиции вражеской ракетки
    start: function (position) {
        this.position = position;
    },
    // Метод для обновления состояния вражеской ракетки
    update: function (ball, canvas, canvasContext) {
        this.control(ball, canvas);
        this.draw(canvasContext);
    }
};

// Функция "start": начальная настройка игры
function start() {
    // Добавление ракеток в массив физических объектов мяча
    ball.physics.push(paddle);
    ball.physics.push(enemy);

    // Начальная установка позиции и скорости мяча
    ball.start({ x: canvas.width / 2, y: canvas.height / 2 }, { x: Math.random() > 0.5 ? 1 : -1, y: 0 });

    // Начальная установка позиции ракетки игрока
    paddle.start({ x: 10, y: (canvas.height - paddle.height) / 2 });

    // Начальная установка позиции вражеской ракетки
    enemy.start({ x: canvas.width - enemy.width - 10, y: (canvas.height - enemy.height) / 2 });
}

// Объект "game" (игра)
var game = {
    stop: false,
    alertShown: false,
    // Проверка завершения игры
    isGameOver: function (ball, canvas) {
        return enemyScore >= 5;
    },
    // Проверка выигрыша
    isGameWon: function () {
        return playerScore >= 5;
    },
    // Обработка завершения игры
    gameOver: function () {
        if (!this.alertShown) {
            writeText("GAME OVER");
            writeSubText("click to reload");
            playSound('gameover');
        }
        this.alertShown = true;
    },
    // Обработка выигрыша
    gameWon: function () {
        if (!this.alertShown) {
            writeText("YOU WON");
            writeSubText("click to reload");
            playSound('win');
        }
        this.alertShown = true;
    },
    // Обновление состояния игры
    update: function (canvas, ball) {
        if (this.isGameOver(ball, canvas)) {
            this.gameOver();
            this.stop = true;
        } else if (this.isGameWon()) {
            this.gameWon();
            this.stop = true;
        }
        if (scored == "player")
            playerScore++;
        if (scored == "enemy")
            enemyScore++;
        if (scored != "none") {
            playSound('bip');
            start();
            scored = "none";
        }
    }
};

// Функция "update": обновление состояния игры
function update() {
    if (!game.stop) {
        clearCanvas(canvas, ctx);

        // Рисование линии посередине
        ctx.beginPath();
        ctx.rect(canvas.width / 2, 0, 1, canvas.height);
        ctx.fillStyle = LINE_COLOR;
        ctx.fill();
        ctx.closePath();

        // Обновление состояния игры, ракеток и мяча, вывод счета
        game.update(canvas, ball);
        paddle.update(canvas, ctx);
        enemy.update(ball, canvas, ctx);
        ball.update(canvas, ctx, paddle);
        writeScore(playerScore + "      " + enemyScore);
    }
}

// Начальная настройка игры
start();

// Установка интервала для функции update
setInterval(update, 5);

// Функция reloadGame: перезагрузка игры при завершении
function reloadGame() {
    if (game.stop) location.reload();
}

// Добавление слушателя события touchmove к элементу canvas
canvas.addEventListener("touchmove", function (event) {
    // Получение объекта события
    var touch = event.touches[0];
    
    // Получение координаты по оси Y касания
    var touchY = touch.clientY - canvas.offsetTop;

    // Установка новой позиции ракетки игрока
    paddle.position.y = touchY - paddle.height / 2;

    // Предотвращение выхода ракетки за границы canvas
    if (paddle.isOutOfCanvasTop(canvas)) {
        paddle.position.y = 0;
    } else if (paddle.isOutOfCanvasBottom(canvas)) {
        paddle.position.y = canvas.height - paddle.height;
    }

    // Отмена стандартного поведения события
    event.preventDefault();
}, false);
document.addEventListener("DOMContentLoaded", function () {
    // Добавление ракеток в массив физических объектов мяча
    ball.physics.push(paddle);
    ball.physics.push(enemy);

    // Обработчик события для кнопки "Рестарт"
    document.getElementById("restartButton").addEventListener("click", function () {
        restartGame();
    });

    // Начальная настройка игры
    startGame();

    // Установка интервала для функции update
    setInterval(update, 5);

    // Добавление слушателя события touchmove к элементу canvas
    canvas.addEventListener("touchmove", function (event) {
        // Получение объекта события
        var touch = event.touches[0];

        // Получение координаты по оси Y касания
        var touchY = touch.clientY - canvas.offsetTop;

        // Установка новой позиции ракетки игрока
        paddle.position.y = touchY - paddle.height / 2;

        // Предотвращение выхода ракетки за границы canvas
        if (paddle.isOutOfCanvasTop(canvas)) {
            paddle.position.y = 0;
        } else if (paddle.isOutOfCanvasBottom(canvas)) {
            paddle.position.y = canvas.height - paddle.height;
        }

        // Отмена стандартного поведения события
        event.preventDefault();
    }, false);

    // Функция restartGame: перезапуск игры
    function restartGame() {
        // Начальная установка позиции и скорости мяча
        ball.start({ x: canvas.width / 2, y: canvas.height / 2 }, { x: Math.random() > 0.5 ? 1 : -1, y: 0 });

        // Начальная установка позиции ракетки игрока
        paddle.start({ x: 10, y: (canvas.height - paddle.height) / 2 });

        // Начальная установка позиции вражеской ракетки
        enemy.start({ x: canvas.width - enemy.width - 10, y: (canvas.height - enemy.height) / 2 });

        // Обнуление счета
        playerScore = 0;
        enemyScore = 0;
        scored = "none";

        // Возобновление игры
        game.stop = false;
        game.alertShown = false;
    }
});
