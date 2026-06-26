// 1. Grab all the HTML elements we need to interact with
const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

const audio = document.getElementById('audio');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const title = document.getElementById('title');
const artist = document.getElementById('artist');
const cover = document.getElementById('cover');

// NEW: Volume Dom Elements
const volumeSlider = document.getElementById('volume-slider');
const volumeIcon = document.getElementById('volume-icon');

// 2. Define our music library (Array of objects)
// NOTE: For your portfolio, add actual .mp3 files to a "music" folder 
// and update these paths.
const songs = [
    {
        name: 'song1', // File name (e.g., song1.mp3)
        displayName: 'Winning Speech',
        artist: 'Karan Aujla',
        cover: 'image1.jpg'
    },
    {
        name: 'song2',
        displayName: '5-7',
        artist: 'Karan Aujla',
        cover: 'image2.jpg'
    },
    {
        name: 'song3',
        displayName: 'Blinding Lights',
        artist: 'The Weeknd',
        cover: 'image3.jpg'
    }

];

// Keep track of which song is currently playing
let songIndex = 0;

// 3. Load the initial song into the DOM
loadSong(songs[songIndex]);

// Function to update the DOM with the song details
function loadSong(song) {
    title.innerText = song.displayName;
    artist.innerText = song.artist;
    // Assuming audio files are in a 'music' folder and images are URLs or local files
    audio.src = `music/${song.name}.mp3`;
    cover.src = song.cover;
}

// 4. Core Play/Pause Functions
function playSong() {
    musicContainer.classList.add('play'); // Adds class to spin the record
    playBtn.querySelector('i.fas').classList.remove('fa-play'); // Change icon to pause
    playBtn.querySelector('i.fas').classList.add('fa-pause');
    audio.play(); // Built-in HTML5 audio function
}

function pauseSong() {
    musicContainer.classList.remove('play'); // Stops the record spin
    playBtn.querySelector('i.fas').classList.add('fa-play'); // Change icon back to play
    playBtn.querySelector('i.fas').classList.remove('fa-pause');
    audio.pause(); // Built-in HTML5 audio function
}

// 5. Navigation Functions (Previous and Next)
function prevSong() {
    songIndex--;
    // If we go below 0, loop back to the last song in the array
    if (songIndex < 0) {
        songIndex = songs.length - 1;
    }
    loadSong(songs[songIndex]);
    playSong();
}

function nextSong() {
    songIndex++;
    // If we reach the end of the list, loop back to the first song
    if (songIndex > songs.length - 1) {
        songIndex = 0;
    }
    loadSong(songs[songIndex]);
    playSong();
}

// 6. Progress Bar Functions
function updateProgress(e) {
    // Destructure duration and currentTime from the audio element's event
    const { duration, currentTime } = e.srcElement;
    // Calculate percentage
    const progressPercent = (currentTime / duration) * 100;
    // Update CSS width
    progress.style.width = `${progressPercent}%`;
}

// Allow user to click anywhere on the progress bar to skip to that part of the song
function setProgress(e) {
    const width = this.clientWidth; // Total width of the progress bar container
    const clickX = e.offsetX; // Where the user clicked
    const duration = audio.duration; // Total length of the song

    // Calculate the new time and set the audio to that time
    audio.currentTime = (clickX / width) * duration;
}

// NEW: Function to manage changing the volume
function changeVolume(e) {
    // The range slider gives a value from 0 to 100.
    // The HTML5 audio element's volume setting requires a value between 0.0 and 1.0.
    // So, we divide the current slider value by 100.
    const volumeValue = e.target.value / 100;
    audio.volume = volumeValue;

    // Premium touch: Dynamically swap FontAwesome classes based on sound level thresholds
    if (volumeValue === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volumeValue < 0.4) {
        volumeIcon.className = 'fas fa-volume-down'; // Quieter sound icon
    } else {
        volumeIcon.className = 'fas fa-volume-up';  // Louder sound icon
    }
}

// 7. Event Listeners (Connecting the UI clicks to our JS logic)
playBtn.addEventListener('click', () => {
    // Check if the 'play' class is currently on the container
    const isPlaying = musicContainer.classList.contains('play');

    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

// Change song events
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// Audio element events
audio.addEventListener('timeupdate', updateProgress); // Fires continuously as song plays
progressContainer.addEventListener('click', setProgress); // User clicks progress bar

// Automatically play the next song when the current one ends
audio.addEventListener('ended', nextSong);

// NEW: Listening for real-time adjustments on the volume range slider. 
// We use the 'input' event instead of 'change' so it updates smoothly while sliding.
volumeSlider.addEventListener('input', changeVolume);