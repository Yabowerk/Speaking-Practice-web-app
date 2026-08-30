const { spawn } = require("child_process");

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
            "-y",                       // Overwrite existing output
            "-fflags", "+genpts",       // Regenerate missing timestamps from WebM container
            "-i", inputPath,
            "-vn",                      // Ignore video streams if present
            "-acodec", "pcm_s16le",     // Explicitly encode standard 16-bit PCM WAV
            "-ar", "16000",             // Resample to 16kHz
            "-ac", "1",                 // Force mono stream
            "-af", "aresample=async=1", // Force asynchronous frame sync to stop stutter/pitch distortion
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

module.exports = { convertToWav, getAudioDuration };