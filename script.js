const modal = {
    opened: "",

    init: function () {
        modal.clickHandler();
    },

    clickHandler: function () {
        $(document).on("click", "[data-open-modal]", function () {
            let target = $(this).data("target");
            modal.open(target);
            if (target == "options-modal") {
                options.init($(this).data("video-id"));
            }
        });
        $(document).on("click", "[data-close-modal]", function () {
            modal.close();
        })
    },

    close: function() {
        if (modal.opened == undefined || modal.opened === "") {
            return;
        }
        $("#" + modal.opened).removeClass("opened");
        $("body").removeClass("modal-opened");
        saveSongs();
    },

    open: function(name) {
        modal.opened = name;
        $("#" + name).addClass("opened");
        $("body").addClass("modal-opened");
    },
}

const options = {
    song: null,

    init: function(id) {
        options.song = getSongById(id);
        $("#favorite").attr("checked", options.song.favorite);
        $("#order").val(options.song.order);
        $("[data-song='video-id']").val(options.song.videoId);
        $("[data-song='name']").val(options.song.name);
        $("[data-song='artist']").val(options.song.artist);
        $("[data-song='album']").val(options.song.album);

        options.clickHandler();
    },

    clickHandler: function() {
        $("#remove").on("click", function() {
           let index = songs.indexOf(options.song);
           if (index != -1) {
               songs.splice(index, 1);
               $("[data-close-modal]").trigger("click");
               $("[data-sort].active").trigger("click");
           }
           
        });

        $("#options-modal .btn-submit").on("click", function () {
            let favorite = $("#favorite").prop("checked");
            let order = $("#order").val();
            let videoId = $("[data-song='video-id']").val();
            let name = $("[data-song='name']").val();
            let artist = $("[data-song='artist']").val();
            let album = $("[data-song='album']").val();

            if (videoId == undefined || videoId.length == 0) {
                displayMessage("error", "Please specify the videoId.");
                return;
            }
            if (name == undefined || name.length == 0) {
                displayMessage("error", "Please specify the name of the song.");
                return;
            }
            if (artist == undefined || artist.length == 0) {
                displayMessage("error", "Please specify the artist.");
                return;
            }
            if (isNaN(order) || order == undefined || order == null || order.length == 0) {
                order = "0";
            }

            options.song.favorite = favorite;
            options.song.order = parseInt(order);
            options.song.videoId = videoId;
            options.song.name = name;
            options.song.artist = artist;
            options.song.album = album;

            $("[data-close-modal]").trigger("click");
            $("[data-sort].active").trigger("click");
            saveSongs();

        });
    },
}

// MESSAGES FOR USER
let message = null;

function displayMessage(mode, message) {
    clearTimeout(message);
    $("#message").removeClass("hide");
    $("#message").html(message);
    $("#message").addClass(mode);
    $("#message").on("click", function(){
        $(this).addClass("hide");
    });
    message = setTimeout(function() {
        $("#message").addClass("hide");
    }, 5000);
    
}

// SONG MANAGEMENT
let songs = [];

function getSongs() {
    let stored = JSON.parse(localStorage.getItem("songs"));
    if (stored == null || stored == undefined) {
        return [];
    }
    return stored;
}

function getSongById(id) {
    let song = songs.filter(s => s.videoId == id);
    if (song.length == 0) {
        return null;
    }
    return song[0];
}

function saveSongs() {
    localStorage.setItem("songs", JSON.stringify(songs));
}

function byFavorite(songs) {
    return songs.filter(s => s.favorite === true);
}

function byOrder(songs) {
    return songs.sort(function(s1, s2) {
        return s1.order > s2.order;
    });
}

function byTimesPlayed(songs) {
    return songs.sort(function(s1, s2) {
        return s1.timesPlayed < s2.timesPlayed;
    });
}

function byLastPlayed(songs) {
    return songs.sort(function(s1, s2) {
        return s1.lastPlayed < s2.lastPlayed;
    });
}

function byName(songs) {
    return songs.sort(function(s1, s2) {
        return s1.name > s2.name;
    });
}


function getSongDom() {
    return $("#song-template").clone();
}

function songTemplate(song) {
    let tmpl = getSongDom();
    tmpl.removeAttr("id");
    tmpl.attr("data-video-id", song.videoId);
    tmpl.find(".artist").text(song.artist);
    tmpl.find(".name").text(song.name);
    tmpl.find(".album").text(song.album);
    tmpl.find(".length").text(song.length);
    tmpl.find(".play").attr("data-video-id", song.videoId);
    tmpl.find(".options").attr("data-video-id", song.videoId);

    $(".playlist-js").append(tmpl);
}

function displaySongs(songs) {
    songs.forEach(function(s) {
        songTemplate(s);
    });
    if (playerReady == true && playing) {
        $(".play[data-video-id='"+currentSong+"']").trigger("click");
    }
}

function clearSongs() {
    $(".playlist").html("");
}

function sortSongs(orderBy) {
    clearSongs();
    let sortedSongs = null;
    switch (orderBy) {
        case "favorites":
            sortedSongs = byFavorite(songs);
            break;
        case "most-played":
            sortedSongs = byTimesPlayed(songs);
            break;
        case "last-played":
            sortedSongs = byLastPlayed(songs);
            break;
        case "alphabetical":
            sortedSongs = byName(songs);
            break;
        default:
            sortedSongs = byOrder(songs);
    }
    displaySongs(sortedSongs);
}

function getNewOrder() {
    let highest = 0;
    songs.forEach(function(s) {
        if (s.order > highest) {
            highest = s.order;
        }
    });
    return highest;
}

function addNewSong() {
    let song = {
        artist: $("#artist").val(),
        name: $("#name").val(),
        album: $("#album").val(),
        length: "--:--",
        videoId: $("#video-id").val(),
        favorite: false,
        order: getNewOrder(),
        timesPlayed: 0,
        lastPlayed: null,
    }

    if (song.videoId == undefined || song.videoId.length == 0) {
        displayMessage("error", "Please specify the videoId.");
        return;
    }
    if (song.name == undefined || song.name.length == 0) {
        displayMessage("error", "Please specify the name of the song.");
        return;
    }
    if (song.artist == undefined || song.artist.length == 0) {
        displayMessage("error", "Please specify the artist.");
        return;
    }
    
    songs.push(song);
    $("#artist").val("");
    $("#name").val("");
    $("#album").val("");
    $("#video-id").val("");
    $("[data-close-modal]").trigger("click");
    $("[data-sort].active").trigger("click");
    displayMessage("success", song.artist + " - " + song.name + " added to the playlist.");
}



function clickHandlers() {
    $(".playlist").on("click", ".play", function() {
        $(".play").removeClass("hide");
        $(this).toggleClass("hide");
        $(".pause").addClass("hide");
        $(this).siblings(".pause").toggleClass("hide");
        playVideo($(this).data("video-id"));
    });

    $(".playlist").on("click", ".pause", function() {
        $(this).toggleClass("hide");
        $(this).siblings(".play").toggleClass("hide");
        pauseVideo();
    });

    $(".playlist").on("click", ".restart", function() {
        $(".play").removeClass("hide");
        $(this).siblings(".play").toggleClass("hide");
        $(".pause").addClass("hide");
        $(this).siblings(".pause").toggleClass("hide");
        playVideo($(this).siblings(".play").data("video-id"), true);
    });

    $("[data-sort]").on("click", function() {
        $("[data-sort]").removeClass("active");
        $(this).addClass("active");

        sortSongs($(this).data("sort"));
    });

    $("#add-song-modal .btn-submit").on("click", function() {
        addNewSong();
    });
}

// FORMAT SECONDS TO mm:ss
function formatDuration(seconds) {
    let date = new Date(null);
    date.setSeconds(seconds);
    return date.toISOString().substr(14, 5);
}

// YOUTUBE PLAYER
let player;
let playing = false;
let playerReady = false;
let currentSong = "";
let durationTimer = null;

function onYoutubeIframeAPIReady() {
    if (!playerReady) {
        player = new YT.Player("player", {
            events: {
                "onReady": onPlayerReady,
                "onStateChange": onPlayerStateChange
            }
        });
    }
}

function playVideo(videoId, forceBeginning) {
    const song = getSongById(videoId);
    if (song == null) {
        return;
    }
    song.timesPlayed = song.timesPlayed + 1;
    song.lastPlayed = new Date();
    saveSongs();

    if (forceBeginning === true) {
        currentSong = ""
    }
    //start new song
    if (playerReady && currentSong != videoId) {
        player.loadVideoById(videoId);
        let initialDuration = setInterval(function() {
            let duration = player.getDuration();
            console.log(duration);
            if (duration != undefined && duration > 0) {
                song.length = formatDuration(duration);
                saveSongs();
                $("[data-sort].active").trigger("click");
                clearInterval(initialDuration);
            }
        }, 10);
        
        if (forceBeginning === true) {
            player.seekTo(0.1, true);
        }
        playing = true;
        currentSong = videoId;
        clearInterval(durationTimer);
        durationTimer = setInterval(function() {
            let duration = player.getCurrentTime();
            $(".song[data-video-id='"+videoId+"'] .duration").text(formatDuration(duration));
        }, 1000);
    }
    // resume song
    else if (playerReady) {
        player.playVideo();
        playing = true;
    }
}

function pauseVideo() {
    player.pauseVideo();
    playing = false;
}

function stopVideo() {
    player.stopVideo();
    playing = false;
}

function onPlayerReady(event) {
    playerReady = true;
}

function onPlayerStateChange(event) {

}
// END PLAYER CODE


$(window).on("load", function() {
    clickHandlers();
    modal.init();
    songs = getSongs()
    $("[data-sort].active").trigger("click");
    onYoutubeIframeAPIReady();   
});
