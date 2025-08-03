console.log("Hello World");
// Global Scopes
let audio = new Audio();
let currentSong = null;
let isPlaying = false;
let currentIndex = -1;
let currFolder;

//converts time into minute:second
function formatTime(seconds) {
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    if (secs < 10) secs = '0' + secs;
    return `${mins}:${secs}`;
}


async function getSongs(folder) {
    currFolder = folder
    let a = await fetch(`http://127.0.0.1:5500/${folder}/`);
    let res = await a.text();

    let div = document.createElement('div');
    div.innerHTML = res;
    let as = div.querySelectorAll("a");

    songs = [];
    for (let i = 0; i < as.length; i++) {
        const element = as[i];

        if (element.href.endsWith('.mp3')) {
            let fileName = decodeURIComponent(element.href.split('/').pop());
            songs.push(fileName);
        }
    }
    // Get the list of all the songs
    console.log(songs);
    playMusic(songs[0], true)

    let songUl = document.querySelector('.songList ul');
    for (const song of songs) {
        songUl.innerHTML += `
            <li data-filename="${song}">
                <img class="invert" src="resources/music.svg" alt="">
                <div class="info">
                   <div>${song.replace('.mp3', '').replace(/[-_]?(\d+)?kbps/gi, '').trim()}</div>
                    <div>Archit</div>
                </div>
                <div class="playNow">
                    <span>Play Now</span>
                    <img class="invert" src="resources/play.svg" style="height: 30px; width: 30px;">
                </div>
            </li>
        `;
    }

    // Handle song clicks
    Array.from(document.querySelectorAll('.songList li')).forEach(e => {
        e.addEventListener('click', () => {
            const track = e.getAttribute('data-filename');
            console.log("Playing:", track);
            playMusic(track);
        });
    });
}

const playMusic = (track, pause = false) => {
    audio.src = `/${currFolder}/` + track;
    // Remove active class from all songs
    document.querySelectorAll('.songList li').forEach(li => li.classList.remove('active-song'));

    // Highlight current song
    let currentLi = Array.from(document.querySelectorAll('.songList li')).find(li =>
        li.getAttribute('data-filename') === track
    );
    if (currentLi) currentLi.classList.add('active-song');

    if (!pause) {
        audio.play()
        document.querySelector('.play').src = 'resources/pause.svg';


    }

    isPlaying = true;
    currentIndex = songs.indexOf(track);
    currentSong = audio;
    document.querySelector('.songInfo').innerHTML = `
  <img src="resources/music.svg" style="width:35px; height:35px; filter:invert(1); margin-right:10px; vertical-align:middle;">
  ${track.replace(/\.mp3$/i, '')}
`;
    document.querySelector('.firstTime').innerHTML = '00:00'
    document.querySelector('.lastTime').innerHTML = '00:00'


    // When metadata is loaded, update duration
    audio.addEventListener('loadedmetadata', () => {
        document.querySelector('.lastTime').innerHTML = formatTime(audio.duration);
    });
};

async function main() {

    // Handle play/pause toggle
    const play = document.querySelector('.play');
    play.addEventListener('click', () => {
        if (!currentSong) return;

        if (isPlaying) {
            currentSong.pause();
            play.src = 'resources/play.svg';
        } else {
            currentSong.play();
            play.src = 'resources/pause.svg';
        }
        isPlaying = !isPlaying;
    });

    // pause by pressing space
    document.addEventListener('keydown', (e) => {
        console.log('key')
        e.preventDefault()
        if (e.keyCode === 32) {

            if (!currentSong) return;

            if (isPlaying) {
                currentSong.pause();
                play.src = 'resources/play.svg';
            } else {
                currentSong.play();
                play.src = 'resources/pause.svg';
            }
            isPlaying = !isPlaying;
        }
    }
    );
    // Handle Duration of Song 
   audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration) && audio.duration > 0) {
        const currentPercent = (audio.currentTime / audio.duration) * 100;
        document.querySelector('.firstTime').innerHTML = formatTime(audio.currentTime);
        document.querySelector('.lastTime').innerHTML = formatTime(audio.duration);
        document.querySelector('.circle').style.left = currentPercent + '%';
        document.querySelector('.progress').style.width = currentPercent + '%';
    }
});

    //Handle Seekbar
    let seekbar = document.querySelector('.seekBar');
    seekbar.addEventListener('click', (e) => {
        const rect = seekbar.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;

        if (!isNaN(audio.duration)) {
            audio.currentTime = (percent / 100) * audio.duration;
            document.querySelector('.circle').style.left = percent + '%';
            document.querySelector('.progress').style.width = percent + '%';
        }
    });
    
    // Next & Previous
    // Next
    document.querySelector('.next').addEventListener('click', () => {
        if (songs.length === 0) return;
        currentIndex = (currentIndex + 1) % songs.length;
        playMusic(songs[currentIndex]);
    });
    audio.addEventListener('ended', ()=> {
         if (songs.length === 0) return;
        currentIndex = (currentIndex + 1) % songs.length;
        playMusic(songs[currentIndex]);
    })

    // Previous
    document.querySelector('.prev').addEventListener('click', () => {
        if (songs.length === 0) return;
        currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        playMusic(songs[currentIndex]);
    });

    // Volume
    function updateVolumeBarUI() {
        const val = volumeSlider.value * 100;
        volumeSlider.style.background = `linear-gradient(to right, white 0%, white ${val}%, rgba(255,255,255,0.3) ${val}%, rgba(255,255,255,0.3) 100%)`;
    }

    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value;
        updateVolumeBarUI();

        if (audio.volume === 0) {
            volumeIcon.src = 'resources/mute.svg';
        } else {
            volumeIcon.src = 'resources/volume.svg';
        }
    });

    volumeIcon.addEventListener('click', () => {
        if (audio.volume > 0) {
            audio.volume = 0;
            volumeSlider.value = 0;
            volumeIcon.src = 'resources/mute.svg';
        } else {
            audio.volume = 0.5;
            volumeSlider.value = 0.5;
            volumeIcon.src = 'resources/volume.svg';
        }
        updateVolumeBarUI();
    });

    // Set UI on initial load
    updateVolumeBarUI();


    // Handle Card Clicks

    Array.from(document.querySelectorAll('.card')).forEach((e) => {
        e.addEventListener('click', async (item) => {
            // Clear old list BEFORE fetching new songs
            let songUl = document.querySelector('.songList ul');
            songUl.innerHTML = "";

            // fetch song from that Folder
            await getSongs(`Songs/${item.currentTarget.dataset.folder}`);
                        
            // auto-play first song
             if (songs.length > 0) {
            playMusic(songs[0]); // You can choose to auto play or just highlight
        }
        });

        // Automatically trigger first card click on load
        const firstCard = document.querySelector('.card');
        if (firstCard) {
            firstCard.click();
        }
    });


}
main();
