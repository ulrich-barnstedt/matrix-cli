const chalk = require("chalk");

function random (min, max) {
    return Math.floor(Math.random() * ((max + 1) - min) + min);
}

class ColorMod {
    static gradient (color, total, at) {
        let intensity = 1 - (at / total);
        return color.map(num => num * intensity);
    }

    static toHex (array) {
        return "#" + array.map(num => Math.floor(num).toString(16).padStart(2, "0")).join("");
    }
}

class CharGenerator {
    constructor (charset) {
        this.charset = charset;
    }

    get () {
        return this.charset[random(0, this.charset.length - 1)];
    }
}

class ScreenBuffer {
    constructor (size) {
        this.size = size;
        this.buffer = Array.from({ length: this.size.x }, () => new Array(this.size.y).fill(" "));
        this.lastBuffer = undefined;
    }

    moveCursor (x, y) {
        process.stdout.write('\u001B' + "[" + (y+1) + ";" + (x+1) + "H");
    }

    diff (newBuffer, oldBuffer) {
        return newBuffer.map((column, x) => {
            return column.map((char, y) => {
                if (char === oldBuffer[x][y]) return -1; else return char;
            })
        })
    }

    render () {
        let toRender;
        if (this.lastBuffer === undefined) {
            toRender = this.buffer;
        } else {
            toRender = this.diff(this.buffer, this.lastBuffer);
        }

        for (let y = 0; y < this.size.y; y++) {
            for (let x = 0; x < this.size.x; x++) {
                if (toRender[x][y] !== -1) {
                    this.moveCursor(x, y);
                    process.stdout.write(this.buffer[x][y]);
                }
            }
        }

        this.lastBuffer = this.buffer.map(column => [ ...column ]);
    }
}

class ColumnTracker {
    constructor (screenBuffer, index, startWhite, baseColor, charsetGenerator, trailLength, size) {
        this.at = 0;
        this.screenBuffer = screenBuffer;
        this.index = index;
        this.startWhite = startWhite;
        this.baseColor = baseColor;
        this.charsetGenerator = charsetGenerator;
        this.trailLength = trailLength;
        this.size = size;

        this.length = this.startWhite ? this.trailLength + 1 : this.trailLength;
    }

    move () {
        this.at++;
    }

    draw () {
        let startingIndex = this.startWhite ? this.at - 1 : this.at;
        let buffer = Array(this.size.y).fill(" ");

        if (this.startWhite) {
            buffer[this.at] = chalk.hex("#FFFFFF")(this.charsetGenerator.get());
        }

        for (let i = startingIndex; i > -1 && i > startingIndex - this.trailLength; i--) {
            buffer[i] = chalk.hex(
                ColorMod.toHex(
                    ColorMod.gradient(
                        this.baseColor,
                        this.trailLength,
                        this.startWhite ?  this.at - i - 1 : this.at - i
                    )
                )
            )(this.charsetGenerator.get());
        }

        this.screenBuffer.buffer[this.index] = buffer;
    }
}

module.exports = class {
    constructor (charset, delay = 5, baseColor = [0x41, 0xFF, 0x00], startWhite = true, spawnTries = 2, trailLength = 12) {
        this.charsetGenerator = new CharGenerator(charset);
        this.delay = delay;
        this.baseColor = baseColor;
        this.startWhite = startWhite;
        this.spawnTries = spawnTries;
        this.trailLength = trailLength;

        this.size = {
            y : process.stdout.rows,
            x : process.stdout.columns
        }
        this.columns = Array(this.size.x).fill(undefined);
        this.screenBuffer = new ScreenBuffer(this.size);
    }

    draw () {
        this.interval = setInterval(() => {
            this.removeOffScreen();
            this.fillGaps();

            this.render();
        }, this.delay);
    }

    stop () {
        clearInterval(this.interval);
    }

    removeOffScreen () {
        this.columns.forEach((column, index) => {
            if (column === undefined) return;
            if (column.at - column.length > this.size.y) {
                this.columns[index] = undefined;
            }
        })
    }

    fillGaps () {
        for (let i = 0; i < this.spawnTries; i++) {
            let index = random(0, this.size.x - 1);

            if (this.columns[index] === undefined) {
                this.columns[index] = new ColumnTracker(this.screenBuffer, index, this.startWhite, this.baseColor, this.charsetGenerator, this.trailLength, this.size);
            }
        }
    }

    render () {
        this.columns.forEach((column) => {
            if (column === undefined) return;

            column.draw();
            column.move();
        })

        this.screenBuffer.render();
    }
}