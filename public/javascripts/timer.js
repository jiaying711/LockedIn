let totalSeconds = 0;
let originalDurationMinutes = 0;
let intervalId;
let paused = false;

// ACHIEVEMENT RELATED: Tracks timer completion
function onTimerComplete(durationInMinutes) {
    // Send completion data to backend
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', '/achievements/timer-complete');
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.onload = () => {
        if (xhttp.status === 200) {
            console.log(`Timer completion recorded! (${durationInMinutes} minutes)`);
        } else {
            console.log('Failed to record timer completion - user not logged in?');
        }
    };
    xhttp.onerror = () => {
        console.log('Network error recording timer completion');
    };
    xhttp.send(JSON.stringify({ duration: durationInMinutes }));
}

function sanitizeInput(value) {
    // if last letter is not a number, remove it
    if (isNaN(value.slice(-1))) {
        return value.slice(0, -1);
    }
    return value;
}

function updateInput() {
    setTimeout(() => {
        // get the input values
        var seconds = document.querySelector("#seconds");
        var minutes = document.querySelector("#minutes");
        var hours = document.querySelector("#hours");

        seconds.value = sanitizeInput(seconds.value);
        minutes.value = sanitizeInput(minutes.value);
        hours.value = sanitizeInput(hours.value);

        // check if the input values are valid
        if (seconds.value >= 60) { seconds.value = 59; }
        if (minutes.value >= 60) { minutes.value = 59; }
        if (hours.value >= 99) { hours.value = 99; }

        // check if the input values are negative
        if (hours.value < 0) { hours.value = 0; }
        if (minutes.value < 0) { minutes.value = 0; }
        if (seconds.value < 0) { seconds.value = 0; }

        // pad the input values to 2 digits
        seconds.value = seconds.value.padStart(2, '0');
        minutes.value = minutes.value.padStart(2, '0');
        hours.value = hours.value.padStart(2, '0');

        // if the input values are greater than 2 digits, slice the last 2 digits
        if (hours.value.toString().length >= 2) {
            hours.value = hours.value.toString().slice(-2);
        }

        if (minutes.value.toString().length >= 2) {
            minutes.value = minutes.value.toString().slice(-2);
        }

        if (seconds.value.toString().length >= 2) {
            seconds.value = seconds.value.toString().slice(-2);
        }

        // update the total seconds
        totalSeconds = hours.value * 3600 + minutes.value * 60 + seconds.value;
    }, 10);
}

function formatTime(seconds) {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secsRemain = String(seconds % 60).padStart(2, '0');
    console.log(hrs, mins, secsRemain);
    return [hrs, mins, secsRemain];
}

function updateDisplay() {
    const [hours, minutes, seconds] = formatTime(totalSeconds);
    document.getElementById('hours_display').textContent = hours;
    document.getElementById('minutes_display').textContent = minutes;
    document.getElementById('seconds_display').textContent = seconds;
}

function startTimer() {
    const h = parseInt(document.getElementById('hours').value, 10) || 0;
    const m = parseInt(document.getElementById('minutes').value, 10) || 0;
    const s = parseInt(document.getElementById('seconds').value, 10) || 0;

    totalSeconds = h * 3600 + m * 60 + s;

    // store original duration for achievement tracking
    originalDurationMinutes = Math.floor(totalSeconds / 60);

    updateDisplay();

    if (totalSeconds > 0) {
        document.getElementById('pauseTimer').disabled = false;
        document.getElementById('resumeTimer').disabled = true;

        intervalId = setInterval(() => {
            if (!paused && totalSeconds > 0) {
                totalSeconds--;
                updateDisplay();

                if (totalSeconds === 0) {
                    clearInterval(intervalId);
                    alert("Time's up!");

                    // track timer completion for achievements
                    onTimerComplete(originalDurationMinutes);
                }
            }
        }, 1000);
    }
}

function pauseTimer() {
    paused = true;
    document.getElementById('pauseTimer').disabled = true;
    document.getElementById('resumeTimer').disabled = false;
}

function resumeTimer() {
    paused = false;
    document.getElementById('pauseTimer').disabled = false;
    document.getElementById('resumeTimer').disabled = true;
}

function resetTimer() {
    clearInterval(intervalId);
    // need clear interval or pause and resume buttons will be weird on reset
    totalSeconds = 0;
    originalDurationMinutes = 0; // Reset original duration
    paused = false;
    updateDisplay();

    document.getElementById('hours').value = '';
    document.getElementById('minutes').value = '';
    document.getElementById('seconds').value = '';

    document.getElementById('pauseTimer').disabled = true;
    document.getElementById('resumeTimer').disabled = true;
}