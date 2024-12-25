// Global variables
let audioContext;
let mediaRecorder;
let chunks = [];
let recording = false;
let intervalId;
let keywordDetected = false;
let recordingStartTime;
const KEYWORD = "example"; // Change this to your keyword
const RECORDING_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

document.getElementById('startRecording').addEventListener('click', startRecording);
document.getElementById('stopRecording').addEventListener('click', stopRecording);

function startRecording() {
    if (!recording) {
        recording = true;
        document.getElementById('startRecording').disabled = true;
        document.getElementById('stopRecording').disabled = false;
        document.getElementById('status').innerText = "Recording...";
        chunks = [];
        recordingStartTime = new Date();

        // Create audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Request microphone access
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                let source = audioContext.createMediaStreamSource(stream);
                
                // Setup analyser for keyword detection
                //let analyser = audioContext.createAnalyser();
                //analyser.fftSize = 2048;
               // source.connect(analyser);

                // Begin recording with MediaRecorder
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = e => chunks.push(e.data);
                mediaRecorder.start();

                // Check for keyword every 50ms
                // Check for keyword every 50ms
                intervalId = setInterval(() => {
                    if (!keywordDetected) {
                        // Here you would implement your keyword detection logic. 
                        // For simplicity, we'll use annyang if available for voice recognition:
                        if (window.annyang && !annyang.isListening()) {
                            var commands = {
                                'donovan': function() {
                                    keywordDetected = true;
                                    console.log("Keyword detected!");
                                    clearInterval(intervalId); // Stop checking for keyword
                                    extendRecording();
                                    // Reload the page after 4 seconds
                                    setTimeout(function(){ 
                                        location.reload(); 
                                    }, 4000);
                                }
                            };
                            annyang.addCommands(commands); 
                            annyang.start();  // Start listening for voice commands
                        }
                    }
                }, 50);

                // Stop recording after 5 minutes if keyword not detected
                setTimeout(() => {
                    if (!keywordDetected) {
                        stopAndDownload();
                    }
                }, RECORDING_DURATION);
            })
            .catch(err => console.error('Error accessing microphone:', err));
    }
}

function extendRecording() {
    setTimeout(() => {
        stopAndDownload();
    }, RECORDING_DURATION);
}

function stopAndDownload() {
    if (mediaRecorder && recording) {
        mediaRecorder.stop();
        clearInterval(intervalId);
        recording = false;
        document.getElementById('startRecording').disabled = false;
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('status').innerText = "Stopped. Downloading...";

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            a.download = `recording_${recordingStartTime.toISOString()}.wav`;
            a.click();
            window.URL.revokeObjectURL(url);

            // Reset for next cycle
            keywordDetected = false;
            document.getElementById('status').innerText = "Ready to record again.";
            setTimeout(startRecording, 1000); // Wait a second before starting again
        };
    }
}

function stopRecording() {
    if (recording) {
        clearInterval(intervalId);
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        recording = false;
        document.getElementById('startRecording').disabled = false;
        document.getElementById('stopRecording').disabled = true;
        document.getElementById('status').innerText = "Stopped.";
    }
}