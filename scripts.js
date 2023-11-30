import { Paper, Rock, Scissor } from "./players.js";
import rps from "./database/index.js";

window.addEventListener("load", async function () {
  await rps.init();
  const battleContainer = document.getElementById("battleContainer");
  const ctx = battleContainer.getContext("2d");
  battleContainer.width = 650;
  battleContainer.height = 650;
  let game = new Game(battleContainer.width, battleContainer.height);

  // https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
  const scale = (num, in_min, in_max, out_min, out_max) => {
    return ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  };

  const startButton = document.getElementById("startBtn");
  const range = document.getElementById("range");
  const label = document.getElementById("rangeLabel");
  const rangeStyle = window.getComputedStyle(range);
  label.style.left = `${
    5 * (rangeStyle.width / 20) - 40 + scale(5, 1, 20, 10, -10)
  }px`;

  range.addEventListener("input", (e) => {
    const value = +e.target.value;
    const label = e.target.nextElementSibling;
    const rangeWidth = getComputedStyle(e.target).getPropertyValue("width");
    const labelWidth = getComputedStyle(label).getPropertyValue("width");
    // remove px
    const numWidth = +rangeWidth.substring(0, rangeWidth.length - 2);
    const numLabelWidth = +labelWidth.substring(0, labelWidth.length - 2);
    const max = +e.target.max;
    const min = +e.target.min;
    const left =
      value * (numWidth / max) -
      numLabelWidth / 2 +
      scale(value, min, max, 10, -10);
    label.style.left = `${left}px`;
    label.innerHTML = value;
  });

  range.addEventListener("change", (e) => {
    const numberOfEachObjects = +e.target.value;
    drawElementsOnCanvas(numberOfEachObjects);
  });

  startButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (!game.isRunning) {
      if (game.papers.length == 0) drawElementsOnCanvas(5);
      game.run();
      animate();
      startButton.setAttribute("disabled", true);
      range.setAttribute("disabled", true);
    }
  });
  function drawElementsOnCanvas(nbr) {
    ctx.clearRect(0, 0, battleContainer.width, battleContainer.height);
    game.reset(nbr);
    for (let i = 0; i < nbr; i++) {
      game.addPaper();
      game.addRock();
      game.addScissors();
    }
    game.draw(ctx);
  }
  function animate() {
    if (game.hasWinner) {
      handleFinishedBattle();
      return;
    }
    ctx.clearRect(0, 0, battleContainer.width, battleContainer.height);
    game.update();
    game.draw(ctx);
    game.checkForWinner();
    requestAnimationFrame(animate);
  }

  function handleFinishedBattle() {
    ctx.textAlign = "center";
    ctx.font = '40pt "Courier New", Courier, monospace';
    ctx.fillStyle = "#faf0e6";
    ctx.fillText(
      `${game.theWinner} win`,
      game.width * 0.5,
      game.height * 0.5 - 20
    );
    rpc.update(game.theWinner.toLowerCase());
    updateStatistics();
    game = new Game(game.width, game.height);
    startButton.removeAttribute("disabled");
    range.removeAttribute("disabled");
  }

  function updateStatistics() {
    const statistics = rpc.get();
    const rocks = (statistics.rocks * 100) / statistics.total;
    const papers = (statistics.papers * 100) / statistics.total;
    const scissors = (statistics.scissors * 100) / statistics.total;
    document.getElementById("w-rocks").innerHTML =
      Math.round(rocks * 100) / 100 + "%";
    document.getElementById("w-papers").innerHTML =
      Math.round(papers * 100) / 100 + "%";
    document.getElementById("w-scissors").innerHTML =
      Math.round(scissors * 100) / 100 + "%";
  }
  var updateStatInterval = setInterval(fnUpdateStatInterval, 10);
  function fnUpdateStatInterval() {
    if (rpc.db) {
      updateStatistics();
      clearInterval(updateStatInterval);
    }
  }
});

class Game {
  constructor(width, height) {
    this.isRunning = false;
    this.hasWinner = false;
    this.theWinner = "";
    this.width = width;
    this.height = height;
    this.cellSize = 16;
    this.gridSize = this.width / this.cellSize;
    this.numberOfEachObjects = 0;
    this.papers = [];
    this.rocks = [];
    this.scissors = [];
    this.occupiedCells = [];
  }

  run() {
    this.isRunning = true;
  }

  reset(nbr) {
    this.numberOfEachObjects = nbr;
    this.papers = [];
    this.rocks = [];
    this.scissors = [];
    this.occupiedCells = [];
  }

  update() {
    this.checkCollision();
    this.papers.forEach(async (paper) => {
      paper.update();
    });
    this.rocks.forEach(async (rock) => {
      rock.update();
    });
    this.scissors.forEach(async (scissors) => {
      scissors.update();
    });
  }

  draw(context) {
    this.papers.forEach((paper) => {
      paper.draw(context);
    });
    this.rocks.forEach((rock) => {
      rock.draw(context);
    });
    this.scissors.forEach((scissors) => {
      scissors.draw(context);
    });
  }

  addPaper() {
    const coordinates = this.getRandomCoordinates();
    this.papers.push(new Paper(this, coordinates.x, coordinates.y));
  }

  addRock() {
    const coordinates = this.getRandomCoordinates();
    this.rocks.push(new Rock(this, coordinates.x, coordinates.y));
  }

  addScissors() {
    const coordinates = this.getRandomCoordinates();
    this.scissors.push(new Scissor(this, coordinates.x, coordinates.y));
  }

  getRandomCoordinates() {
    let randomCoord, x, y;
    do {
      x = Math.floor(Math.random() * this.width);
      y = Math.floor(Math.random() * this.height);
      x = x > this.width - this.cellSize ? this.width - this.cellSize : x;
      y = y > this.height - this.cellSize ? this.height - this.cellSize : y;
      randomCoord = `${x}${y}`;
    } while (this.occupiedCells.includes(randomCoord));

    this.occupiedCells.push(randomCoord);
    return { x, y };
  }

  checkCollision() {
    //Collision between paper and rock

    for (let i = 0; i < this.papers.length; i++) {
      let paperX = this.papers[i].position.x;
      let paperY = this.papers[i].position.y;
      for (let j = 0; j < this.rocks.length; j++) {
        let rockX = this.rocks[j].position.x;
        let rockY = this.rocks[j].position.y;
        if (
          rockX < paperX + this.cellSize &&
          rockX + this.cellSize > paperX &&
          rockY < paperY + this.cellSize &&
          rockY + this.cellSize > paperY
        ) {
          this.papers.push(new Paper(this, rockX, rockY));
          this.rocks.splice(j, 1);
        }
      }
    }

    //Collision between paper and scissors
    for (let i = 0; i < this.scissors.length; i++) {
      let scissorX = this.scissors[i].position.x;
      let scissorY = this.scissors[i].position.y;
      for (let j = 0; j < this.papers.length; j++) {
        let paperX = this.papers[j].position.x;
        let paperY = this.papers[j].position.y;
        if (
          paperX < scissorX + this.cellSize &&
          paperX + this.cellSize > scissorX &&
          paperY < scissorY + this.cellSize &&
          paperY + this.cellSize > scissorY
        ) {
          this.scissors.push(new Scissor(this, paperX, paperY));
          this.papers.splice(j, 1);
        }
      }
    }

    //Collision between scissors and rock

    for (let i = 0; i < this.rocks.length; i++) {
      let rockX = this.rocks[i].position.x;
      let rockY = this.rocks[i].position.y;
      for (let j = 0; j < this.scissors.length; j++) {
        let scissorX = this.scissors[j].position.x;
        let scissorY = this.scissors[j].position.y;
        if (
          scissorX < rockX + this.cellSize &&
          scissorX + this.cellSize > rockX &&
          scissorY < rockY + this.cellSize &&
          scissorY + this.cellSize > rockY
        ) {
          this.rocks.push(new Rock(this, scissorX, scissorY));
          this.scissors.splice(j, 1);
        }
      }
    }
  }

  checkForWinner() {
    if (
      this.papers.length == this.numberOfEachObjects * 3 ||
      this.rocks.length == this.numberOfEachObjects * 3 ||
      this.scissors.length == this.numberOfEachObjects * 3
    ) {
      let winner;
      if (this.papers.length > 0) {
        this.theWinner = "Papers";
        winner = this.papers;
      } else if (this.rocks.length > 0) {
        this.theWinner = "Rocks";
        winner = this.rocks;
      } else {
        this.theWinner = "Scissors";
        winner = this.scissors;
      }
      let everyObjIsAtInitialPosition = winner.every((obj) =>
        obj.compareWithInitialPosition()
      );
      if (everyObjIsAtInitialPosition) {
        this.hasWinner = true;
        this.isRunning = false;
      }
    }
  }
}
