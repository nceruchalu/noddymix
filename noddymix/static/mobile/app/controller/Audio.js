/*
 * Description:
 *   This controller is associated with audio player controls, song lists and
 *   song details pages.
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.Audio', {
    extend: 'Ext.app.Controller',
    
    config: {
        refs: {
            audio:'audio-noddymix',
            audioToolbar:'audiotoolbar',
            audioTitleBar:'audiotitlebar',
            songDetailTitleBar: 'songDetail titlebar',
            
            audioLoop:'audiotoolbar #audioLoop',
            audioPrev:'audiotoolbar #audioPrev',
            audioPlay:'audiotoolbar #audioPlay',
            audioPause:'audiotoolbar #audioPause',
            audioNext:'audiotoolbar #audioNext',
            audioShuffle:'audiotoolbar #audioShuffle',
            
            audioTitlePlay:'audiotitlebar #audioPlay',
            audioTitlePause:'audiotitlebar #audioPause',
            
            audioTitlePoster:'audiotitlebar #audioPoster',
            songDetailPoster: 'songDetail #audioPoster',
            audioProgressBar: 'songDetail #progressbar',
            
            songsList:'songs',
            songsNone:'songCard #no-music',
            songDetail:'songDetail'
        },
        control: {
            audio: Ext.os.is.Android ? {
                ended:'next',       // this event only fires if not looping
                playing:  'playing'
            } : { 
                ended:'next',       // this event only fires if not looping
                timeupdate: 'timeUpdate',
                playing:  'playing' // iOS needs this to track play count
            },
            
             audioTitlePlay: {
                tap:'play'
            },
             audioTitlePause: {
                tap:'pause'
            },
            
            audioLoop:{
                tap:'loop'
            },
            audioPrev: {
                tap:'prev'
            },
            audioPlay: {
                tap:'play'
            },
            audioPause: {
                tap:'pause'
            },
            audioNext: {
                tap:'next'
            },
            audioShuffle: {
                tap:'shuffle'
            },
            songsList: {
                itemtap:'tappedSong'
            }
        }
    }, // end config
    
    // called after the Application is launched.
    launch: function(app) {
        this.mainController = app.getController('Main');
        this.utilsController = app.getController('Utils');
        
        this.isLooping = false; // is audio player currently looping?
        this.isShuffled = false; // use a shuffled playlist?
        
        this.index = 0; // initialize since it's used by external module (Song)
    },
    
    
    /*
     * Description: Show pause/play button depending on if audio is playing or 
     *              not.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    pickPlayOrPause: function() {
        if (this.getAudio().isPlaying()) {
            this.showPauseButton();
        } else {
            this.showPlayButton();
        }
    },
    
    
    /*
     * Description: Show play button and as a result hide the pause button on
     *              both song detail and song list pages, which ever is 
     *              available
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showPlayButton: function() {
        if(this.getAudioToolbar()) {
            this.getAudioPause().hide();
            this.getAudioPlay().show();
        }
        
        if(this.getAudioTitleBar()) {
            this.getAudioTitlePause().hide();
            this.getAudioTitlePlay().show();
        }
    },
    
    
    /*
     * Description: Show pause button and as a result hide the play button on
     *              both song detail and song list pages, which ever is 
     *              available
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showPauseButton: function() {
        if(this.getAudioToolbar()) {
            this.getAudioPlay().hide();
            this.getAudioPause().show();
        }
        if(this.getAudioTitleBar()) {
            this.getAudioTitlePlay().hide();
            this.getAudioTitlePause().show();
        }
    },
    
    
    /*
     * Description: Check if music player is playing by checking the play button
     *              is hidden.
     *
     * Arguments:   None
     * Return:      Boolean: true or false
     *
     * Author:      Nnoduka Eruchalu
     */
    isPlaying: function() {
        return ((this.getAudioToolbar() && this.getAudioPlay().isHidden()) || 
                (this.getAudioTitleBar() && 
                 this.getAudioTitlePlay().isHidden()));
    },
    
    
    /*
     * Description: Check if music player is paused by checking the pause button
     *              is hidden.
     *
     * Arguments:   None
     * Return:      Boolean: true or false
     *
     * Author:      Nnoduka Eruchalu
     */
    isPaused: function() {
        return ((this.getAudioToolbar() && this.getAudioPause().isHidden()) || 
                (this.getAudioTitleBar() && 
                 this.getAudioTitlePause().isHidden()));
    },
    
    
    /*
     * Description: Show list of songs and hide the message that states no songs
     *              are present in the list.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSongsList: function() {
        (this.getAudioToolbar() && this.getAudioToolbar().show());
        (this.getAudioTitleBar() && this.getAudioTitleBar().show());
        this.getSongsList().show();
        this.getSongsNone().hide();
    },
    
    
    /*
     * Description: Hide list of songs and show the message that states no songs
     *              are present in the list.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    hideSongsList: function() {
        (this.getAudioToolbar() && this.getAudioToolbar().hide());
        (this.getAudioTitleBar() && this.getAudioTitleBar().hide());
        this.getSongsList().hide();
        this.getSongsNone().show();
    },
    
    
    /*
     * Description: Initialize the Song Card which contains the list of songs.
     *              If there are song records then show the list, else hide it.
     *              The first time songs are being added to this Song Card, the
     *              first in the list will be selected,
     *
     * Arguments:   - records: an array of `Songs` store records.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    initSongCard: function(records) {
        if (records.length > 0) {
            // if there are actually songs, show the audio toolbar and 
            // song list. Also hide the message for no songs present
            this.showSongsList();
                        
            if (!this.getAudio().getUrl()) {
                // if no song is loaded, then this is just starting out, so
                // perform inits like select one and load it up.
                this.index = 0;
                this.play_time = 0;
                this.isLoaded = false; // Android needs to know this
                                
                this.getSongsList().select(this.index);
                this.loadSong(records[0].data);
                                
                this.pickPlayOrPause();
                
                // make this visible song list the active one
                this.mainController.plVisibleIsActive();
            }
            
            
        } else {
            // no songs, so hide audio player and audio list, and show message
            // for no songs present
            this.hideSongsList();
        }
    },
    
    
    /*
     * Description: Loop the audio player, by toggling the loop flag for the
     *              audio player.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    loop: function() { 
        if (this.isLooping) {              // if looping turn it off and restore
            this.getAudio().setLoop(false);// default css
            this.isLooping = false;
            this.mainController.songdetail.removeCls("is-looping");
            this.mainController.songcard.removeCls("is-looping");
        } else {                          // else turn on and use special css
            this.getAudio().setLoop(true);
            this.isLooping = true;
            this.mainController.songdetail.addCls("is-looping");
            this.mainController.songcard.addCls("is-looping");
        }
    },
    
    
    /*
     * Description: Go to previous song with following logic:
     *              - if looping then will be restarting this song
     *              - if song list is shuffled then pick a random song
     *              - if neither looping nor shuffled, then indeed pick last
     *                played song.
     *              - on iOS (and non-Android) devices start playing new song if
     *                within 2 seconds from start of current song. If past the
     *                2s mar, simply restart current song. This mimics the
     *                functionality on iTunes/iPod.
     *              - on Android devices always start playing newly picked song 
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    prev: function() {
        
        if(this.isLooping) {
            // if looping, keep stay where you are.
            
        } else if (this.isShuffled) {
            // if shuffled, get random song from play queue
            this.index = this.randomIndex();
            
        } else {
            // if not looping or shuffled, decrement index with wrap-around
                        
            if (Ext.os.is.Android) {
                // would be nice to only change index if within first few
                // seconds... but thats hard with autoplay on for Android
                this.index -= 1; 
                
            } else {
                // for iOS update index only if within the 2 secs mark
                if (this.play_time < 2) {
                    this.index -= 1; 
                } else {
                    // if past 2secs, simply restart this song ... note that
                    // if you pause, then play like done at the end of this
                    // routine this wont work. So simply setSong and return.
                    this.setSong();
                    return;
                }
            }

            if (this.index < 0) { // if too small, wrap around
                this.index = this.mainController.playlists[
                    this.mainController.playlists.activeIdx].store.getCount()-1;
            }
        }
        
        // for some reason, when song is loading, you can't set song. You have
        // to pause first, then set song. After this, play song if audio was
        // already playing
        var wasPlaying = this.isPlaying();
        this.pause(false);
        this.setSong();
        if (wasPlaying) {
            this.play(false);
        }
    },
    
    
    /*
     * Description: Play currently loaded song. 
     *              Optionally hide play button and show pause button.
     *
     * Arguments:   - change_button: [optional] boolean to hide play button and
     *                               show pause button. Defaults to `true`.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    play: function(change_button) { 
        // change play/pause button by default
        change_button = typeof change_button !== 'undefined' ? 
            change_button : true;
                
        if ((Ext.os.is.Android) && (!this.isLoaded)) return;
        if (change_button) {
            this.showPauseButton();
        }
        this.getAudio().play();
    },
    
    
    /*
     * Description: Pause currently loaded song. 
     *              Optionally show play button and hide pause button.
     *
     * Arguments:   - change_button: [optional] boolean to show play button and
     *                               hide pause button. Defaults to `true`.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    pause: function(change_button) { // pause music, hide pause, show play
        // change play/pause button by default
        change_button = typeof change_button !== 'undefined' ? 
            change_button : true;
        
        if ((Ext.os.is.Android) && (!this.isLoaded)) return;
        this.getAudio().pause(); 
        if (change_button) {
            this.showPlayButton();
        }
    },
    
    
    /*
     * Description: The 'playing' HTML5 audio event is fired for two reasons:
     *              - Android needed autoplay enabled to work on Android 2.3
     *              - iOS and Android use this to track play count.
     *              If song is being played after loading for the first time,
     *              inform the server that one more play has been logged against
     *              this song.
     *              To handle the autoplay on Android, if the app is actually
     *              paused, then force a pause of this song.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    playing:function() {
        if (!this.isLoaded) {
            // if song is being played after loading for first time, 
            // increment song play count
            var song = this.getCurrentSong();
            this.utilsController.incSongPlayCount(song.id);
        }
        
        this.isLoaded = true;
        if (this.isPaused()) { // dont play if user paused!
            this.pause();
        } 
    },
    
    
    /*
     * Description: Go to next song with following logic:
     *              - if looping then will simply be restarting this song.
     *              - if song list is shuffled then play a random song
     *              - if neither looping nor shuffled, then indeed play next
     *                song in the list.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    next: function() {
        
        if(this.isLooping) {
            // if looping, keep stay where you are.
        
        } else if (this.isShuffled) {
            // if shuffled, get random song from play queue
            this.index = this.randomIndex();
        
        } else {
            // if not looping or shuffled, increment index with wrap-around
            this.index += 1; 
            if (this.index >= this.mainController.playlists[
                this.mainController.playlists.activeIdx].store.getCount()) {
                this.index = 0; // if too big, wrap around
            }
        }
        
        // for some reason, when song is loading, you can't set song. You have
        // to pause first, then set song. After this, play song if audio was
        // already playing
        var wasPlaying = this.isPlaying();
        this.pause(false);
        this.setSong();
        if (wasPlaying) {
            this.play(false);
        }
    },
    
    
    /*
     * Description: Shuffle the current list of songs on the Song Card by
     *              toggling the shuffle flag.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    shuffle: function() { 
        if (this.isShuffled) {
            this.isShuffled = false;
            this.mainController.songdetail.removeCls("is-shuffled");
            this.mainController.songcard.removeCls("is-shuffled");
        } else {
            this.isShuffled = true;
            this.mainController.songdetail.addCls("is-shuffled");
            this.mainController.songcard.addCls("is-shuffled");
        }
    },
    
    
    /*
     * Description: Get a random index from the active playlist's store.
     *              Call this when in shuffle mode and navigating the song list.
     *
     * Arguments:   None
     * Return:      (integer) randomly selected index
     *
     * Author:      Nnoduka Eruchalu
     */
    randomIndex: function() {
        var num_songs = this.mainController.playlists[
            this.mainController.playlists.activeIdx].store.getCount();
        return Math.floor(Math.random()*(num_songs-1));
    },
    
    
    /*
     * Description: Select a song, visually highlight it and load it up for 
     *              playing.
     *              If user was already playing a song, then this newly
     *              selected song will have to start off playing too.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    setSong: function() {
        // clear out any song
        this.getAudio().stop();
                
        if (this.mainController.playlists.activeIdx == 
            this.mainController.playlists.visibleIdx) {
            // if visible playlist is the active playlist, show song selection.
            this.getSongsList().select(this.index, false, true);
        }
        
        this.isLoaded = false; // Android needs this
        this.loadSong(this.mainController.playlists[this.mainController.playlists.activeIdx].store.getAt(this.index).data);
        
        this.play_time = 0;
        if ((!Ext.os.is.Android) && (this.isPlaying())) { 
            // only play on iOS if user is already playing!	
            this.play();
        }
    },
    
        
    /*
     * Description: Load a song and its metadata into the audio bar on Song Card
     *              and Song Details Card.
     *
     * Arguments:   - song: song object with metadata contained in properties
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    loadSong: function(song) {
        var titleHtml = '<p class="title ellipsis">'+song.title +
            '</p><p class="artist ellipsis">'+song.artist+'</p>';
        if (this.getAudioTitleBar()) {
            this.getAudioTitlePoster().setSrc(song.poster);
            this.getAudioTitleBar().setTitle(titleHtml);
        }
        if (this.getSongDetail()) {
            this.getSongDetailPoster().setSrc(song.poster_display);
            this.getSongDetailTitleBar().setTitle(titleHtml);
        }
        this.getAudioProgressBar().setWidth('0%');
        this.getAudio().setUrl(song.mp3);
    },
    
    
    /*
     * Description: Callback on tapping a song in the list of songs on Song Card
     *
     * Arguments:   - songslist: list of songs (Ext.dataview.DataView)
     *              - index:     index of the item tapped
     *              - target:    element of DataItem tapped
     *              - record:    Song store record associated with tapped item
     *              - e:         the event object, Ext.EventObject
     *              - eOpts:     the options passed to listener
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    tappedSong: function(songslist, index, target, record, e, eOpts) {
        var onActiveQueue = (this.mainController.playlists.activeIdx == 
                             this.mainController.playlists.visibleIdx);
        
        var audio = this.getAudio();
        
        // on song tap, set visible playlist to active
        this.mainController.plVisibleIsActive();
        
        if ((index == this.index) && onActiveQueue) {
            if (this.isPlaying()) {
                // if tapped a song that is currently playing pause it
                this.pause();  
                
            } else {
                // if tapped a song that is currently paused, continue playing
                this.play();
            }
            
        } else {
            // else a new song is to be played
            // for some reason, when song is loading, you can't set song.
            // You have to pause first, then set song.
            this.pause(false);
            
            if (audio.isPlaying()) { // might still need this for Android
                audio.stop();
            }
            this.index = index;
            // for tracking song play counts
            this.isLoaded = false; // do this for setSong, so do it here too
            if (Ext.os.is.Android) {
                this.showPauseButton();   // force music to play
                this.loadSong(record.data);
            } else {
                this.loadSong(record.data);
                this.play_time = 0;
                this.play();
            }
        }
    },
    
    
    /*
     * Description: Update progress bar in this Callback on change in song play 
     *              time. Called every 15 to 250ms, so we aren't always in this
     *              function, but it is a short function regardless.
     *
     * Arguments:   - audio: audio player
     *              - time:  current time, in seconds
     *              - eOpts: options passed to listener
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    timeUpdate: function(audio, time, eOpts) {
        // log play time
        this.play_time = time;
        
        // update progressbar
        var currentSong = this.mainController.playlists[
            this.mainController.playlists.activeIdx].store.getAt(this.index);
        
        // if there is actually a song, (could have been deleted)
        if (currentSong) {
            var progress = (time/currentSong.data.length)*100;
            this.getAudioProgressBar().setWidth(String(progress)+'%');
        }
    },
    
    
    /*
     * Description: Get currently selected/playing song.
     *
     * Arguments:   None
     * Return:      Song Store record.
     *
     * Author:      Nnoduka Eruchalu
     */
    getCurrentSong: function() {
        return (this.mainController.playlists[
            this.mainController.playlists.activeIdx]
                .store.getAt(this.index).data);
    }
});