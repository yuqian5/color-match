let now = new Date(Date.now());

// on load, start game
window.onload = function() {
    const game = new Game();
    game.start();

    // set copy right text
    document.getElementById("cp-notice").innerHTML =
        `Copyright &copy; 2022${now.getFullYear() > 2022 ? ` - ${now.getFullYear()}` : ""} by Kerry Cao. All Rights Reserved`;
}

// on resize, resize the canvas
window.onresize = function() {
    let c = document.getElementById("canvas");
    // get canvas color
    let ctx = c.getContext("2d");
    let color = ctx.fillStyle;

    // set canvas size
    let gameDiv = document.getElementById("game");
    this.canvas.width = gameDiv.offsetWidth < 400 ? gameDiv.offsetWidth - 40 : 400;
    this.canvas.height = gameDiv.offsetWidth < 400 ? gameDiv.offsetWidth - 40 : 400;

    // fill canvas with color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
}

class Game {
    // variable for canvas element
    canvas = document.getElementById("canvas");
    ctx = this.canvas.getContext("2d");

    // variable for input element
    redInput = document.getElementById("red");
    greenInput = document.getElementById("green");
    blueInput = document.getElementById("blue");

    // variable for modal element
    modalElement = document.getElementById('score-modal');
    modal = new bootstrap.Modal(this.modalElement, {});
    score = document.getElementById("score");
    message = document.getElementById("message");
    newGameButton = document.getElementById("new-game-button");

    // variable for score history element
    scores = [];
    scoreHistory = document.getElementById("score-history");
    clearButton = document.getElementById("score-history-clear");

    // variable for RBG int values
    red = 0;
    green = 0;
    blue = 0;

    constructor() {
        // add event listener for button
        document.getElementById("submit").addEventListener("click", this.update.bind(this));

        // add event listener for new game button
        this.newGameButton.addEventListener("click", () => {
            this.modal.hide();
            this.start();
        });

        // try to get json score history from local storage
        let scoreHistory = localStorage.getItem("scores");
        if (scoreHistory) {
            this.scores = JSON.parse(scoreHistory);
            this.updateScoreHistory();
        }

        // change canvas size base on window size, game div size or 400px
        let gameDiv = document.getElementById("game");
        this.canvas.width = gameDiv.offsetWidth < 400 ? gameDiv.offsetWidth - 40 : 400;
        this.canvas.height = gameDiv.offsetWidth < 400 ? gameDiv.offsetWidth - 40 : 400;

        // add event listener for clear button
        this.clearButton.addEventListener("click", () => {
            localStorage.clear();
            this.scores = [];
            this.updateScoreHistory();
        });
    }

    start() {
        // randomly generate RGB values
        this.red = Math.floor(Math.random() * 256);
        this.green = Math.floor(Math.random() * 256);
        this.blue = Math.floor(Math.random() * 256);

        // draw the canvas
        this.draw();
    }

    draw() {
        this.ctx.fillStyle = "rgb(" + this.red + "," + this.green + "," + this.blue + ")";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    update() {
        // update RGB values
        let redDiff = Math.abs(this.red - this.redInput.value);
        let greenDiff = Math.abs(this.green - this.greenInput.value);
        let blueDiff = Math.abs(this.blue - this.blueInput.value);

        // calculate score
        let calculatedScore = redDiff + greenDiff + blueDiff;
        this.score.innerText = calculatedScore.toString();
        this.message.innerHTML = `<p>The correct answer is <b>${this.red}</b>, <b>${this.green}</b>, <b>${this.blue}</b></p>`;

        // add score to score history
        this.scores.push(`${moment().format('ll LTS')} - ${calculatedScore}`);

        // update score history
        this.updateScoreHistory();

        // show modal
        this.modal.show();
    }

    updateScoreHistory() {
        // set html for score history
        this.scoreHistory.innerHTML = this.scores.slice(0).reverse().map(score => {
            return ` <li class="list-group-item">${score}</li>`;
        }).join("");

        // save score history to local storage
        localStorage.setItem("scores", JSON.stringify(this.scores));
    }
}