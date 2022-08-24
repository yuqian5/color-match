let now = new Date(Date.now());

// on load, start game
window.onload = function () {
    const game = new Game();
    game.start();

    // set copy right text
    document.getElementById("cp-notice").innerHTML =
        `Copyright &copy; 2022${now.getFullYear() > 2022 ? ` - ${now.getFullYear()}` : ""} by Kerry Cao. All Rights Reserved`;
}

// on resize, resize the canvas
window.onresize = function () {
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

    // variable for input mode
    rgbMode = true;
    modeInput = document.getElementById("mode");

    // variable for input section
    rgbSection = document.getElementById("rgb-mode");
    cmykSection = document.getElementById("cmyk-mode");

    // variable for input element
    redInput = document.getElementById("red");
    greenInput = document.getElementById("green");
    blueInput = document.getElementById("blue");
    cyanInput = document.getElementById("cyan");
    magentaInput = document.getElementById("magenta");
    yellowInput = document.getElementById("yellow");
    keyInput = document.getElementById("key");

    // variable for modal element
    modalElement = document.getElementById('score-modal');
    modal = new bootstrap.Modal(this.modalElement, {backdrop: 'static', keyboard: false});
    score = document.getElementById("score");
    message = document.getElementById("message");
    newGameButton = document.getElementById("new-game-button");
    inputCanvas = document.getElementById("input-canvas");
    inputCanvasCtx = this.inputCanvas.getContext("2d");
    targetCanvas = document.getElementById("target-canvas");
    targetCanvasCtx = this.targetCanvas.getContext("2d");

    // variable for score history element
    scores = [];
    scoreHistory = document.getElementById("score-history");
    clearButton = document.getElementById("score-history-clear");
    highScore = document.getElementById("high-score");

    // variable for RBG int values
    red = 0;
    green = 0;
    blue = 0;

    constructor() {
        // add event listener for button
        document.getElementById("submit").addEventListener("click", this.submit.bind(this));

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

        // add event listener for mode input
        this.modeInput.addEventListener("change", () => {
            this.switchMode();
        });

        // when any input element is in focus, select all the text
        document.querySelectorAll("input").forEach(input => {
            input.addEventListener("focus", () => {
                input.select();
            });
        });
    }

    static cmykToRGB(c, m, y, k) {
        let r = 255 * (1 - c) * (1 - k);
        let g = 255 * (1 - m) * (1 - k);
        let b = 255 * (1 - y) * (1 - k);
        return [r, g, b];
    }

    static rgbToCMYK(r, g, b) {
        r = r / 255;
        g = g / 255;
        b = b / 255;
        let k = 1 - Math.max(r, g, b);
        let c = (1 - r - k) / (1 - k);
        let m = (1 - g - k) / (1 - k);
        let y = (1 - b - k) / (1 - k);
        return [c, m, y, k];
    }

    // https://github.com/antimatter15/rgb-lab
    static rgbToLab(rgb) {
        let r = rgb[0] / 255,
            g = rgb[1] / 255,
            b = rgb[2] / 255,
            x, y, z;

        r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

        x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
        y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
        z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

        x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
        y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
        z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

        return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
    }

    // https://github.com/antimatter15/rgb-lab
    static deltaE(labA, labB) {
        const deltaL = labA[0] - labB[0];
        const deltaA = labA[1] - labB[1];
        const deltaB = labA[2] - labB[2];
        const c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2]);
        const c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2]);
        const deltaC = c1 - c2;
        let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC;
        deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH);
        const sc = 1.0 + 0.045 * c1;
        const sh = 1.0 + 0.015 * c1;
        const deltaLKlsl = deltaL / (1.0);
        const deltaCkcsc = deltaC / (sc);
        const deltaHkhsh = deltaH / (sh);
        const i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh;
        return i < 0 ? 0 : Math.sqrt(i);
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

    drawModalCanvases(input) {
        this.targetCanvasCtx.fillStyle = "rgb(" + this.red + "," + this.green + "," + this.blue + ")";
        this.targetCanvasCtx.fillRect(0, 0, this.targetCanvas.width, this.targetCanvas.height);
        this.inputCanvasCtx.fillStyle = "rgb(" + input[0] + "," + input[1] + "," + input[2] + ")";
        this.inputCanvasCtx.fillRect(0, 0, this.inputCanvas.width, this.inputCanvas.height);
    }

    submit() {
        if (!this.validateInput()) {
            alert("Invalid input, please check your answers.");
            return;
        }

        // calculate score
        let calculatedScore = 0;
        let inputRgb = null;

        // region [obsolete] euclidean distance method
        // if (this.rgbMode) {
        //     // calculate color distance
        //     let distance = Math.sqrt(Math.pow(this.red - parseInt(this.redInput.value), 2) + Math.pow(this.green - parseInt(this.greenInput.value), 2) + Math.pow(this.blue - parseInt(this.blueInput.value), 2));
        //
        //     // calculate percentage of distance
        //     calculatedScore = distance / Math.sqrt(Math.pow(255, 2) * 3);
        // } else {
        //     // convert to RBG values
        //     let rbg = Game.cmykToRGB(parseInt(this.cyanInput.value) / 100, parseInt(this.magentaInput.value) / 100, parseInt(this.yellowInput.value) / 100, parseInt(this.keyInput.value) / 100);
        //
        //     // calculate color distance
        //     let distance = Math.sqrt(Math.pow(this.red - rbg[0], 2) + Math.pow(this.green - rbg[1], 2) + Math.pow(this.blue - rbg[2], 2));
        //
        //     // calculate percentage of distance
        //     calculatedScore = distance / Math.sqrt(Math.pow(255, 2) * 3);
        // }
        // endregion

        if (this.rgbMode) {
            // get input values
            let red = parseInt(this.redInput.value);
            let green = parseInt(this.greenInput.value);
            let blue = parseInt(this.blueInput.value);

            inputRgb = [red, green, blue];

            calculatedScore = this.compareColors([red, green, blue]);
        } else {
            // get input values
            let cyan = parseInt(this.cyanInput.value);
            let magenta = parseInt(this.magentaInput.value);
            let yellow = parseInt(this.yellowInput.value);
            let key = parseInt(this.keyInput.value);

            inputRgb = Game.cmykToRGB(cyan / 100, magenta / 100, yellow / 100, key / 100);
            calculatedScore = this.compareColors(inputRgb);
        }

        calculatedScore = (100 - calculatedScore).toFixed(2);

        // set modal content
        this.score.innerText = calculatedScore.toString();
        this.message.innerHTML = `
            <p>The correct answer is RGB(<b>${this.red}</b>, <b>${this.green}</b>, <b>${this.blue}</b>) or CMYK(${Game.rgbToCMYK(this.red, this.green, this.blue).map(x => `<b>${(x * 100).toFixed(2)}%</b>`).join(", ")})</p>
        `;
        this.drawModalCanvases(inputRgb);

        // add score to score history
        this.scores.push(`${moment().format('ll LTS')}: ${calculatedScore}% (${this.rgbMode ? "RGB" : "CMYK"})`);

        // update score history
        this.updateScoreHistory();

        // show modal
        this.modal.show();
    }

    updateScoreHistory() {
        if (this.scores.length > 0) {
            // get the highest score
            let r = RegExp("([0-9][0-9]\\.[0-9][0-9]%)");
            let highestScore = Math.max(...this.scores.map(score => parseFloat(r.exec(score)[1])));

            // set the high score if high score is not negative infinity
            this.highScore.innerText = highestScore !== -Infinity ? `${highestScore.toString()}%` : "0%";
        }

        // set html for score history
        this.scoreHistory.innerHTML = this.scores.slice(0).reverse().map(score => {
            return ` <li class="list-group-item">${score}</li>`;
        }).join("");

        // save score history to local storage
        localStorage.setItem("scores", JSON.stringify(this.scores));
    }

    switchMode() {
        // change mode
        this.rgbMode = !this.rgbMode;

        // change section
        this.rgbSection.style.display = this.rgbMode ? "block" : "none";
        this.cmykSection.style.display = this.rgbMode ? "none" : "block";
    }

    validateInput() {
        if (this.rgbMode) {
            // get input values parsed to int
            let red = parseInt(this.redInput.value);
            let green = parseInt(this.greenInput.value);
            let blue = parseInt(this.blueInput.value);

            // check that all value is not NaN and between 0 and 255
            return !isNaN(red) && red >= 0 && red <= 255 && !isNaN(green) && green >= 0 && green <= 255 && !isNaN(blue) && blue >= 0 && blue <= 255;
        } else {
            // get input values parsed to int
            let cyan = parseInt(this.cyanInput.value);
            let magenta = parseInt(this.magentaInput.value);
            let yellow = parseInt(this.yellowInput.value);
            let key = parseInt(this.keyInput.value);

            // check that all value is not NaN and between 0 and 100
            return !isNaN(cyan) && cyan >= 0 && cyan <= 100 && !isNaN(magenta) && magenta >= 0 && magenta <= 100 && !isNaN(yellow) && yellow >= 0 && yellow <= 100 && !isNaN(key) && key >= 0 && key <= 100;
        }
    }

    compareColors(input) {
        let target = [this.red, this.green, this.blue];
        let targetLab = Game.rgbToLab(target);
        let inputLab = Game.rgbToLab(input);

        return Game.deltaE(targetLab, inputLab);
    }
}