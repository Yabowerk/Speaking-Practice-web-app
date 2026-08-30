const { convertToWav } = require("./convert");

convertToWav("uploads/tes.mp3", "uploads/tes.wav")
    .then((outputPath) => {
        console.log("Success! Converted file at:", outputPath);
    })
    .catch((err) => {
        console.error("Conversion failed:", err);
    });