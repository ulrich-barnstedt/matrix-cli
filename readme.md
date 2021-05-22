## matrix-cli

A Matrix-like CLI screensaver, written in JS (for usage with node.js).
The file index.js contains an example use case and can be used as-is.

### API

The file matrix.js provides the following class as per this example:

```js
const Matrix = require("./matrix.js");
const charset = require("./charset.json"); //the standard charset included in the repository

let matrix = new Matrix( // the values used here (except the charset) are equal to the default values
    charset, // the charset to use, any array of characters
    5, // the interval (ms) to draw at
    [0x41, 0xFF, 0x00], // the base color of the trails, any hex color
    true, // if the trails have a white colored head
    2, // the amount of spawn tries per frame
    12, // how long each trail is, in characters
);

matrix.draw(); // starting drawing on the terminal

setTimeout(() => {
    matrix.stop(); // stop drawning on the terminal
}, 10000);
```

### Screenshots

![Default color](https://i.imgur.com/3nywD7R.png)