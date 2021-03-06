function HTMLActuator() {
    this.tileContainer = document.querySelector(".tile-container");
    this.scoreContainer = document.querySelector(".score-container");
    this.bestContainer = document.querySelector(".best-container");
    this.messageContainer = document.querySelector(".game-message");
    this.elapsedTimeDiv = document.getElementById('elapsedTime');
    this.gameMode = document.getElementById('gameMode');
    this.timerDiv = document.getElementById("timer");
    this.score = 0;
    this.intervalId = 0;
}

HTMLActuator.prototype.clearAgainsTimeMode = function () {
    var timer = document.getElementById("timer");
    clearInterval(this.intervalId);
    timer.innerHTML = '';
};

HTMLActuator.prototype.actuate = function (grid, metadata) {
    var self = this;

    window.requestAnimationFrame(function () {
        if (!(metadata.gameMode == "againstTime" && metadata.terminated == true)) {
            self.clearContainer(self.tileContainer);

            grid.cells.forEach(function (column) {
                column.forEach(function (cell) {
                    if (cell) {
                        self.addTile(cell);
                    }
                });
            });
        }
        self.updateScore(metadata.score);
        self.updateBestScore(metadata.bestScore);

        if (metadata.terminated) {
            if (metadata.over) {
                self.message(false, metadata); // You lose
            } else if (metadata.won) {
                self.message(true, metadata); // You win!
            }
        }
    });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
    this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function (container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
};

HTMLActuator.prototype.addTile = function (tile) {
    var self = this;

    var wrapper = document.createElement("div");
    var inner = document.createElement("div");
    var position = tile.previousPosition || {x: tile.x, y: tile.y};
    var positionClass = this.positionClass(position);

    // We can't use classlist because it somehow glitches when replacing classes
    var classes = ["tile", "tile-" + tile.value, positionClass];

    if (tile.value > 2048) classes.push("tile-super");

    this.applyClasses(wrapper, classes);

    inner.classList.add("tile-inner");
    inner.textContent = tile.value;

    if (tile.previousPosition) {
        // Make sure that the tile gets rendered in the previous position first
        window.requestAnimationFrame(function () {
            classes[2] = self.positionClass({x: tile.x, y: tile.y});
            self.applyClasses(wrapper, classes); // Update the position
        });
    } else if (tile.mergedFrom) {
        classes.push("tile-merged");
        this.applyClasses(wrapper, classes);

        // Render the tiles that merged
        tile.mergedFrom.forEach(function (merged) {
            self.addTile(merged);
        });
    } else {
        classes.push("tile-new");
        this.applyClasses(wrapper, classes);
    }

    // Add the inner part of the tile to the wrapper
    wrapper.appendChild(inner);

    // Put the tile on the board
    this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function (element, classes) {
    element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function (position) {
    return {x: position.x + 1, y: position.y + 1};
};

HTMLActuator.prototype.positionClass = function (position) {
    position = this.normalizePosition(position);
    return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function (score) {
    this.clearContainer(this.scoreContainer);

    var difference = score - this.score;
    this.score = score;

    this.scoreContainer.textContent = this.score;

    if (difference > 0) {
        var addition = document.createElement("div");
        addition.classList.add("score-addition");
        addition.textContent = "+" + difference;

        this.scoreContainer.appendChild(addition);
    }
};

HTMLActuator.prototype.updateBestScore = function (bestScore) {
    this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function (won, metadata) {
    var type = won ? "game-won" : "game-over";
    var message = won ? "You win!" : "Game over!";

    this.messageContainer.classList.add(type);
    this.messageContainer.getElementsByTagName("p")[0].textContent = message;
    if (metadata.gameMode == "normalGame") {
        this.gameMode.className = "hide";
        this.elapsedTimeDiv.className = "show";
        this.elapsedTimeDiv.innerHTML = "Game Mode: Normal Game <br> Score: " + metadata.score + " points<br> Elapsed Time: "
            + metadata.elapsedTime + " seconds";
    } else {
        this.elapsedTimeDiv.className = "hide";
        this.gameMode.className = "show";
        this.gameMode.innerHTML = "Game Mode: Against Time <br> Score: " + metadata.score + " points";
    }
};

HTMLActuator.prototype.clearMessage = function () {
    // IE only takes one value to remove at a time.
    this.messageContainer.classList.remove("game-won");
    this.messageContainer.classList.remove("game-over");
};
