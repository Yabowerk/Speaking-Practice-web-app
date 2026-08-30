const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        const ffprobe = spawn("ffprobe", [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            filePath,
        ]);

        let output = "";
        ffprobe.stdout.on("data", (data) => {
            output += data.toString();
        });

        ffprobe.on("close", (code) => {
            if (code === 0) {
                resolve(parseFloat(output.trim()));
            } else {
                reject(new Error(`ffprobe exited with code ${code}`));
            }
        });

        ffprobe.on("error", reject);
    });
}

function convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
            "-y",
            "-fflags", "+genpts",
            "-i", inputPath,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            "-af", "aresample=async=1",
            outputPath,
        ]);

        let stderrOutput = "";
        ffmpeg.stderr.on("data", (data) => {
            stderrOutput += data.toString();
        });

        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve(outputPath);
            } else {
                console.error("ffmpeg stderr output:\n", stderrOutput);
                reject(new Error(`ffmpeg exited with code ${code}`));
            }
        });

        ffmpeg.on("error", reject);
    });
}

async function testAudioConversion() {
    // Pass audio file via argument, or default to any file in your uploads folder
    const inputFile = process.argv[2];

    if (!inputFile) {
        console.error("❌ Please provide an input audio file path.");
        console.log("Usage: node test-convert.js <path-to-audio-file>");
        process.exit(1);
    }

    if (!fs.existsSync(inputFile)) {
        console.error(`❌ File not found at path: ${inputFile}`);
        process.exit(1);
    }

    const outputWav = path.join(__dirname, "uploads/test_output.wav");

    console.log(`\n🎵 Input File: ${inputFile}`);
    console.log("⏳ Converting to 16kHz mono WAV...");

    try {
        const startTime = Date.now();
        await convertToWav(inputFile, outputWav);
        const duration = await getAudioDuration(outputWav);

        const inputStats = fs.statSync(inputFile);
        const outputStats = fs.statSync(outputWav);

        console.log("\n✅ Conversion Successful!");
        console.log("-----------------------------------------");
        console.log(`Original Size:  ${(inputStats.size / 1024).toFixed(2)} KB`);
        console.log(`Converted Size: ${(outputStats.size / 1024).toFixed(2)} KB`);
        console.log(`WAV Duration:   ${duration.toFixed(2)} seconds`);
        console.log(`Conversion Time:${Date.now() - startTime} ms`);
        console.log(`Saved File:     ${outputWav}`);
        console.log("-----------------------------------------");
        console.log("👉 Open 'test_output.wav' in VLC or Media Player to test audio playback quality.");

    } catch (err) {
        console.error("❌ Conversion failed:", err.message);
    }
}

testAudioConversion();