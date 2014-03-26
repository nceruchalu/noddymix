/*
 * Description:
 *   Playlist Object for the jPlayer Plugin
 *   Based off of Mark J Panaghiston's jPlayerPlaylist 2.3.0
 *
 * Requires:
 *   - jQuery 1.7.0+
 *   - jPlayer 2.3.0+
 *
 * Author:
 *   Nnoduka Eruchalu
 */
(function($, undefined) {
    /* Constructor function for the playlist class
     *   uiSels  = object representing css selectors for player UI
     *   sList  = array of songs to initialize playlist with
     *   jConfs = array of jPlayer configurations
     */
    jPlayerPlaylist = function(uiSels, sList, jConfs) {
        var playlistObj = this;    // the playlist object
        this.current = 0;          // the index of current song being played
        
        this.removing = false;     // not currently removing a song
        this.shuffled = false;     // playlist doesn't start out shuffled
        // song-looping should be disabled by default, but since 
        // jPlayer.event.ready fires once before the ready event for each 
        // player, setup the system into a `loopList` state, so that after the 
        // 2 repeat events [remember it is 1 per player], the system starts off
        // in an `initial state`
        this.loopOnSong = false; this.loop = true;
        
        
        // overwrite playlist obj's default css Selectors for playlist UI
        this.cssSelector = $.extend({}, this._cssSelector, uiSels);
        
        // combine playlist obj's options, key bindings for next and prev, and
        // passed-in jPlayer configs 
        // note that this is a deep copy.
        this.options = $.extend(true, {
            keyBindings: {
                next: {
                    key:39, // RIGHT
                    fn: function(f) {
                        var waspaused = f.status.paused;
                        playlistObj.next();
                        if(waspaused) {f.pause();}
                    }
                },
                previous: {
                    key: 37, // LEFT
                    fn: function(f) {
                        var waspaused = f.status.paused;
                        playlistObj.previous();
                        if(waspaused) {f.pause();}
                    }
                },
                // extend default volume keycode events to duplicate events
                // across both players.
                muted: {
		    key: 8, // backspace
		    fn: function(f) {
			f._muted(!f.options.muted);
                        var other_f= $(plGetOtherObj(playlistObj).cssSelector
                                       .jPlayer).data('jPlayer');
                        other_f._muted(!other_f.options.muted);
		    }
		},
		volumeUp: {
		    key: 38, // UP
		    fn: function(f) {
			f.volume(f.options.volume + 0.1);
                        var other_f= $(plGetOtherObj(playlistObj).cssSelector
                                       .jPlayer).data('jPlayer');
                        other_f.volume(other_f.options.volume + 0.1);
                    }
		},
		volumeDown: {
		    key: 40, // DOWN
		    fn: function(f) {
			f.volume(f.options.volume - 0.1);
                        var other_f= $(plGetOtherObj(playlistObj).cssSelector
                                       .jPlayer).data('jPlayer');
                        other_f.volume(other_f.options.volume - 0.1);
                    }
		}
            }
        }, this._options, jConfs);
        
        this.playlist = [];        // current playlist state starts out empty
        this.original = [];        // original playlist also is empty
        this._initPlaylist(sList); // populate internal playlist with song list
        
        // identify the playlist-specific [non-jPlayer] css selectors
        this.cssSelector.title      = this.cssSelector.cssSelectorAncestor + 
            " .plTitle";
        this.cssSelector.artist      = this.cssSelector.cssSelectorAncestor + 
            " .plArtist";
        this.cssSelector.next       = this.cssSelector.cssSelectorAncestor + 
            " .plForwards";
        this.cssSelector.previous   = this.cssSelector.cssSelectorAncestor + 
            " .plBackwards";
        this.cssSelector.shuffle    = this.cssSelector.cssSelectorAncestor + 
            " .plShuffle";
        this.cssSelector.shuffleOff = this.cssSelector.cssSelectorAncestor + 
            " .plShuffleOff";
        this.cssSelector.albumArt = this.cssSelector.cssSelectorAncestor + 
            " .plCover";
        // progress bar
        this.cssSelector.progress = this.cssSelector.cssSelectorAncestor + 
            " .plTimeRemain";
        // volume bar
        this.cssSelector.volume = this.cssSelector.cssSelectorAncestor + 
            " .plVolumeRemain";
        // volume text
        this.cssSelector.volumeText = this.cssSelector.cssSelectorAncestor + 
            " .plVol";
        this.cssSelector.repeatButtons = 
            this.cssSelector.cssSelectorAncestor + " " + 
            this.options.cssSelector.repeat+
            ", " + this.cssSelector.cssSelectorAncestor + " " + 
            this.options.cssSelector.repeatOff;
        
        // update cssSelectorAncestor with most accurate value
        this.options.cssSelectorAncestor = this.cssSelector.cssSelectorAncestor;
        
        
        /* setup the control sliders
         * ---------------------------
         */
        // create the progress slider control
        $(this.cssSelector.progress).slider({
            animate:"fast",
            max:   100,
            range: "min",
            step:  0.1,
            value: 60,
            slide: function(event, ui) {
                var sp = $(playlistObj.cssSelector.jPlayer)
                    .data('jPlayer').status.seekPercent;
                if(sp>0) {
                    // move the play-head to the value and factor in the seek %
                    $(playlistObj.cssSelector.jPlayer).jPlayer(
                        "playHead", ui.value * (100/sp));
                } else {
                    // create a timeout to reset this slider to 0.
                    setTimeout(
                        function() {
                            $(playlistObj.cssSelector.progress).slider(
                                "option", "value", 0)},
                        0);
                }
            }
        });
    
        // create the volume control slider
        $(this.cssSelector.volume).slider({
            animate:"fast",
            max:1,
            range:"min",
            step:0.01,
            value: playlistObj.options.volume,
            slide: function(event, ui) {
                $(playlistObj.cssSelector.jPlayer)
                    .jPlayer("option", "muted", false);
                $(playlistObj.cssSelector.jPlayer)
                    .jPlayer("option", "volume", ui.value);
                
                // duplicate volume events on other player
                $(plGetOtherObj(playlistObj).cssSelector.jPlayer)
                    .jPlayer("option", "muted", false);
                $(plGetOtherObj(playlistObj).cssSelector.jPlayer)
                    .jPlayer("option", "volume", ui.value);
            }
        });
        
        // stop slider arrow key events
        $(".ui-slider-handle").unbind('keydown');
        
        
        
        // ovewrite jPlayer's default repeat event handler
        // note that clicks on the GUI repeat/repeat-off buttons, toggles the
        // jPlayer loop option and generates a repeat event.
        // so when repeat has been clicked, jPlayer.options.loop is true
        // and when repeatOff has been clicked, jPlayer.options.loop is false
        // so the idea is this, clicks should follow this sequence:
        // initial: loopOnSong = false, loop = false
        // loopList: loopOnSong = false, loop = true
        // loopSong: loopOnSong = true,  loop = false
        // next click: back to initial
        this.options.repeat = function(event) {
            // other player object for duplication
            var otherObj = plGetOtherObj(playlistObj);
            
            // if in intial state, go to loopList state
            if((playlistObj.loopOnSong ==false) && (playlistObj.loop ==false)) {
                playlistObj.loopOnSong = false; playlistObj.loop = true;
                $(playlistObj.cssSelector.repeatButtons)
                    .removeClass("loopSong").addClass("loopList");
                
                // duplicate to other player
                otherObj.loopOnSong = false; otherObj.loop = true;
                $(otherObj.cssSelector.repeatButtons)
                    .removeClass("loopSong").addClass("loopList");
                                 
                
                // else if in loopList state, go to loopSong state
            } else if(
                (playlistObj.loopOnSong ==false) && (playlistObj.loop ==true)) {
                playlistObj.loopOnSong = true; playlistObj.loop = false;
                $(playlistObj.cssSelector.repeatButtons)
                    .addClass("loopSong").removeClass("loopList");
                
                // duplicate to other player
                otherObj.loopOnSong = true; otherObj.loop = false;
                $(otherObj.cssSelector.repeatButtons)
                    .addClass("loopSong").removeClass("loopList");
                
                
                // else must be in loopSong state, so go to initial state
            } else {
                playlistObj.loopOnSong = false; playlistObj.loop = false;
                $(playlistObj.cssSelector.repeatButtons)
                    .removeClass("loopSong").removeClass("loopList");
                
                // duplicate to other player
                otherObj.loopOnSong = false; otherObj.loop = false;
                $(otherObj.cssSelector.repeatButtons)
                    .removeClass("loopSong").removeClass("loopList");
                
            }
        };
        
        // when jPlayer is ready, initialize plugin and UI
        $(this.cssSelector.jPlayer).bind($.jPlayer.event.ready, function() {
            playlistObj._init();
        });
        
        // when a song ends, go to next song
        $(this.cssSelector.jPlayer).bind($.jPlayer.event.ended, function() {
            playlistObj.next();
        });
        
        // when song starts playing, pause all other jplayer instances
        // and indicate that currently selected song is playing
        $(this.cssSelector.jPlayer).bind($.jPlayer.event.play, function() {
            $(this).jPlayer("pauseOthers");
            $(playlistObj.cssSelector.playlist)
                .find(".now-playing").removeClass("active");
            $(playlistObj.cssSelector.playlist)
                .find("."+playlistObj.options.playlistOptions.currentItemClass)
                .find(".now-playing").addClass("active");
        });
        // when song is paused, indicate song isn't playing
        $(this.cssSelector.jPlayer).bind($.jPlayer.event.pause, function() {
            $(playlistObj.cssSelector.playlist)
                .find(".now-playing").removeClass("active");
        });
        
        
        // on volume change, update volume text and move slider
        $(this.cssSelector.jPlayer).bind(
            $.jPlayer.event.volumechange, function(event) {
                // update volume text
                var curVol = parseInt(event.jPlayer.options.volume * 100);
                $(playlistObj.cssSelector.volumeText).text(curVol);
                
                // move volume slider
                if(event.jPlayer.options.muted) {
		    $(playlistObj.cssSelector.volume).slider(
                        "option", "value", 0);
                } else {
		    $(playlistObj.cssSelector.volume).slider(
                        "option", "value", event.jPlayer.options.volume);
                }
            });               
        
        // on time update, move progress bar
        $(this.cssSelector.jPlayer).bind(
            $.jPlayer.event.timeupdate, function(event) {
                $(playlistObj.cssSelector.progress).slider(
                    "option","value", 
                    event.jPlayer.status.currentPercentAbsolute);
            });
        
        
        
        // on previous-button click, go to previous song and unfocus the element
        $(this.cssSelector.previous).click(function() {
            playlistObj.previous();
            $(this).blur();
            return false;
        });
        
        // on next-button click, go to next song and unfocus the element
        $(this.cssSelector.next).click(function() {
            playlistObj.next();
            $(this).blur();
            return false;
        });
        
        // on shuffle-button click, shuffle playlist
        $(this.cssSelector.shuffle).click(function() {
            playlistObj.shuffle(true);
            return false;
        });
        
        // on shuffleOff-button click, undo playlist shuffle, and hide button
        $(this.cssSelector.shuffleOff).click(function() {
            playlistObj.shuffle(false);
            return false;
        }).hide();
        
        // clear out song list items in playlist's UI
        $(this.cssSelector.playlist + " ul").empty();  
        
        // create future event handlers for song items in playlist
        this._createItemHandlers();
        
        // finally start the jPlayer media player
        $(this.cssSelector.jPlayer).jPlayer(this.options);
        
        
        
    }; /* end jPlayerPlaylist constructor function */
    
    
    jPlayerPlaylist.prototype = {      /* setup playlist object's prototype */
        // default cssSelector object
        _cssSelector: {
            jPlayer: "#jplayer",             // jplayer element
            cssSelectorAncestor: "#player",  // music player element
            playlist: ".plPlaylist"           // playlist container
        },
        
        // default playlist options
        _options: {
            playlistOptions: {
                autoPlay: false,             // auto-play song as playlist loads
                loopOnPrevious: true,        // reverse-wrap: first to last song
                shuffleOnLoop: false,        // shuffle playlist when wrapping 
                enableRemoveControls: false, // show rem. from playlist buttons
                displayTime: 0,              // speed to show all playlist songs
                addTime: "fast",             // speed of adding song to playlist
                removeTime: "fast",          // speed of removing playlist song
                shuffleTime: "slow",         // speed to show shuffled playlist
                itemClass: "playlist-item",  // class of song details element
                menuItemClass: "playlist-menu", // context-menu class
                currentItemClass: "playlist-current",// currently selected song
                itemIdAttr: "data-id"        // attribute that holds song id
            }
        },
        
        /* use this function to get/set playlist options
         * key is a string
         */
        option: function(key, value) {
            // if only first argument, then this is a get operation
            if (value === undefined)
                return this.options.playlistOptions[key];
            
            // if here, then this is a set operation
            this.options.playlistOptions[key] = value;
            return this;
        },
        
        /* initialize the playlist object by refreshing song list in UI.
         * After refresh, autoplay or select, the current song.
         */
        _init: function() {
            var plistObj = this;
            this._refresh(function() {
                plistObj.options.playlistOptions.autoPlay ? 
                    plistObj.play(plistObj.current) :
                    plistObj.select(plistObj.current);
            });
        },
        
        /* initialize the playlist representation with the given song list.
         * set current song to first song in song list. Indicate not currently
         * removing a song, and playlist currently not shuffled
         */
        _initPlaylist: function(sList) {
            this.current = 0;                          // start with first song
            this.removing = this.shuffled = false;     // not removing/shuffled
            this.original = $.extend(true, [], sList); // set original song list
            this._originalPlaylist();
        },
        
        /* deep copy original playlist into current playlist representation
         * of song list.
         */
        _originalPlaylist: function() {
            var plistObj = this;
            this.playlist = [];
            $.each(this.original, function(i) {
                plistObj.playlist[i] = plistObj.original[i];
            });
        },
        
        /* deep copy current playlist representation of song list into original
         * playlist
         */
        _currentPlaylist: function() {
            var plistObj = this;
            this.original = [];
            $.each(this.playlist, function(i) {
                plistObj.original[i] = plistObj.playlist[i];
            });
        },
        
        /* refresh song list in UI and call the passed in callback function
         */
        _refresh: function(callback) {
            var plistObj = this;
            if(callback && !$.isFunction(callback)) {
                // clear out playlist in UI
                $(this.cssSelector.playlist + " ul").empty();
                
                // for each song/item in the internal playlist
                // create the UI list item and attach to UI's <ul> element
                $.each(this.playlist, function(i) {
                    $(plistObj.cssSelector.playlist + " ul").append(
                        plistObj._createListItem(plistObj.playlist[i]));
                });
                                
                // now that songs are loaded in UI, update playlist controls
                this._updateControls();
                
            } else {
                // time to destroy UI playlist should be equal to time to show 
                // UI's song list
                var displayTime = 
                    $(this.cssSelector.playlist + " ul").children().length ? 
                    this.options.playlistOptions.displayTime : 0;
                
                // hide current UI songlist with a speed of displayTime
                // then clear out the UI's songlist, and for each item in
                // internal representation of playlist create the UI list item
                // and attach to the UI's <ul> element.
                $(this.cssSelector.playlist + " ul").slideUp(
                    displayTime, function() {
                        var uiList = $(this);
                        $(this).empty();
                        $.each(plistObj.playlist, function(i) {
                            uiList.append(
                                plistObj._createListItem(plistObj.playlist[i]));
                        });
                        // now songs are loaded in UI, update playlist controls
                        plistObj._updateControls();
                        // call callback
                        $.isFunction(callback) && callback();
                        
                        // and finally show playlist
                        plistObj.playlist.length ? 
                            $(this).slideDown(displayTime) :
                            $(this).show();
                    })
            }
        },
        
        /* create representation of song in the UI
         */
        _createListItem: function(song) {
            var plistObj = this;
            // song representation as <li> in ui
            var songUI = "<li "+this.options.playlistOptions.itemIdAttr
                +"='"+song.id+"'><div>";
            
            songUI += '<div class="row-actions primary">'
                + '     <span class="icon handle" title="drag to add"></span>'
                +'      <span class="icon now-playing"></span></div>'
            
            songUI += "<a href='javascript:;' class='" + 
                this.options.playlistOptions.itemClass + "' >";
            songUI += "<span class='plTitle'>"+song.title+"</span>";
            songUI += "<span class='plArtist'>"+song.artist+"</span>";
            songUI += "<span class='plAlbum'>"+song.album+"</span>";
            songUI += "</a>";
            
            // context menu handle
            songUI += "<a class='"+ this.options.playlistOptions.menuItemClass +
                " icon' href='javascript:;'></a>";
            
            return songUI += "</div></li>";
        },
        
        /* create handlers for future song items in UI
         */
        _createItemHandlers: function() {
            var plistObj = this;
            
            // generate a context menu on right-click
            $(this.cssSelector.playlist)
                .off("contextmenu", "li")
                .on("contextmenu", "li", function(event) {
                    return plistObj._showContextMenu(event, $(this));
                   
                });
            $(this.cssSelector.playlist)
                .off("click", ".playlist-menu")
                .on("click", ".playlist-menu", function(event) {
                    return plistObj._showContextMenu(event, $(this).parent().parent());
                   
                });
            
            // play a song on double-click
            $(this.cssSelector.playlist)
                .off("dblclick", "a."+this.options.playlistOptions.itemClass)
                .on("dblclick",  "a."+this.options.playlistOptions.itemClass,
                    function() {
                        // make double-clicked visible playlist active if it
                        // isn't already
                        plVisibleIsActive();
                        
                        // song li item requires going up two levels to get idx
                        // a.itemClass -> div -> li
                        var songIdx = $(this).parent().parent().index();
                        
                        // (re)start playing the now selected song
                        plistObj.play(songIdx);
                        
                        $(this).blur();
                        return false;
                    });
            
            // select a song item on click combined with <shift>, <ctrl>
            // and <cmd> keys
            $(this.cssSelector.playlist)
                .off("click", "li")
                .on("click", "li", function(event) {
                    plistObj._selectItem(event, this);
                });
            
            // enable draggable & sortable functionality
            $(this.cssSelector.playlist + " ul").sortable({
                cursor:"move",
                delay: 150,   // prevents accidental drag when trying to select
                revert: 0,    // go to new positions immediately
                zIndex: 9000, // dragged item needs to go over #player 
                opacity: 0.4,
                cursorAt:{left:8, top:16}, // always drag from handle
                
                helper: function (event, item) {
                    // if item being dragged wasn't already selected, select it
                    // and deselect siblings
                    if(!item.hasClass('selected')) {
                        item.addClass('selected')
                            .siblings().removeClass('selected');
                    }
                    
                    // clone the selected items into an array
                    var elements = item.parent().children('.selected').clone();
                    
                    // add a property to `item` called `multidrag` that contains
                    // the selected items, then remove the selected items from
                    // the source list
                    item.data('multidrag', elements)
                        .siblings('.selected').remove();
                    
                    // refresh sortable items, since list is modified.
                    $(this).sortable("refresh");
                                        
                    // create helper, the visual of dragged list element(s) 
                    var helper = $('<li/>')
                    return helper.append(elements);
                },
                
                stop: function(event, ui) {
                    // now we access those items we stored in `item`s data
                    var elements = ui.item.data('multidrag');
                    
                    // `elements` now contains the originally selected items
                    // (the dragged items)
                    // Finally, insert the selected items after the `item`, then
                    // remove the `item` since it is a duplicate of one of the
                    // dragged/selected items.
                    ui.item.after(elements).remove();
                    
                    // save the rearranged IDs.
                    // could also use .map(Number) which uses 0 for blanks, ""
                    // note that parseInt() uses NaN for blanks, ""
                    var sortedUI = $(this).sortable(
                        "toArray", 
                        {attribute: plistObj.options.playlistOptions.itemIdAttr}
                    ).map(function(val, idx, obj) { return parseInt(val)});
                    
                    // arrange the current playlist representation to match the
                    // rearranged song IDs.
                    plistObj.playlist.sort(function(a,b) {
                        return (sortedUI.indexOf(a.id) -sortedUI.indexOf(b.id));
                    });
                    
                    // clone current playlist representation into original
                    // representation
                    plistObj._currentPlaylist();
                    
                    // update UI's currently selected song index
                    plistObj.current = $(plistObj.cssSelector.playlist)
                        .find("." + 
                              plistObj.options.playlistOptions.currentItemClass)
                        .index();
                    
                    // and finally save this new song ordering server side
                    saveNewSongOrder(sortedUI);
                }
            });
            
        },
        
        /* update following playlist controls: 
         * - shuffle
         */
        _updateControls: function() {
            // if playlist is shuffled then show shuffleOff and hide shuffle
            // else do the reverse
            this.shuffled ? ($(this.cssSelector.shuffleOff).show(), 
                             $(this.cssSelector.shuffle).hide()) :
                ($(this.cssSelector.shuffleOff).hide(), 
                 $(this.cssSelector.shuffle).show());
        },
        
        /* mark a single song-row in the UI as being currently playing/loaded
         * song
         */
        _highlight: function(idx) {
            var plistObj = this;
            // if playlist has songs and index was given, then remove class
            // with current playlist class, and put it on given song row.
            if(this.playlist.length && (idx !== undefined)) {
                // remove "current" class from all playlist songs
                $(this.cssSelector.playlist)
                    .find("."+this.options.playlistOptions.currentItemClass)
                    .removeClass(this.options.playlistOptions.currentItemClass);
                
                // add "current" class to song with specified index
                $(this.cssSelector.playlist + " li:nth-child(" + (idx+1) +")")
                    .addClass(this.options.playlistOptions.currentItemClass);
                
                //update player title, artist, cover-URL
                $(this.cssSelector.title).html(this.playlist[idx].title);
                $(this.cssSelector.artist).html(this.playlist[idx].artist);
                $(this.cssSelector.albumArt).attr(
                    "href", this.playlist[idx].poster_display);
                
            }
        },
        
        /* set playlist with a new song list
         */
        setPlaylist: function(sList) {
            this._initPlaylist(sList);
            this._init();
        },
        
        /* add song to the playlist
         */
        add: function(song, playNow) {
            $(this.cssSelector.playlist + " ul")
                .append(this._createListItem(song))
                .find("li:last-child").hide()
                .slideDown(this.options.playlistOptions.addTime);
            this._updateControls();
            this.original.push(song);
            this.playlist.push(song);
            playNow ? this.play(this.playlist.length-1) :
                1 === this.original.length && this.select(0);
        },
        
        /* remove song from the playlist
         * 0-based index
         * return true/false for success
         */
        remove: function(songIdx) {
            var plistObj = this;
            
            // if no song index argument is passed, remove entire playlist
            if (songIdx === undefined) {
                this._initPlaylist([]);
                this._refresh(function() {
                    $(plistObj.cssSelector.jPlayer).jPlayer("clearMedia");
                });
                return true;
            }
            
            // will only be removing 1 song, so...
            // convert relative (negative) indices to absolute indices
            songIdx =(songIdx<0) ? (plistObj.original.length+songIdx) : songIdx;
            
            // now remove actual song if it's index is valid
            if((songIdx >= 0) && (songIdx < this.playlist.length)) {
                // remove exact song in UI
                $(this.cssSelector.playlist +" li:nth-child(" +(songIdx+1) +")")
                    .remove(); 
                
                // if playlist is currently shuffled, loop through
                // original list till you find song to be removed
                if(plistObj.shuffled) {
                    var song = plistObj.playlist[songIdx];
                    $.each(plistObj.original, function(i) {
                        if(plistObj.original[i] === song) {
                            plistObj.original.splice(i, 1);
                            return false;
                        }
                    });
                    
                } else {
                    // playlist isn't shuffled, so song to remove is at
                    // same index in original song list
                    plistObj.original.splice(songIdx, 1);
                }
                
                // remove song in the internal playlist representation
                plistObj.playlist.splice(songIdx, 1);
                
                // there are still songs left on the playlist
                if (plistObj.original.length) {
                    
                    // if deleted song is currently playing
                    //   if current index is less than song list length
                    //   then leave current index as is [it now points
                    //   at next song in playlist]. However if currrent index
                    //   is greater than or equal to song list length,
                    //   update it to be last song in song list
                    //   now highlight new song selection.
                    if (songIdx === plistObj.current) {
                        plistObj.current = 
                            (songIdx < plistObj.original.length) ?
                            plistObj.current :
                            (plistObj.original.length - 1);
                        plistObj.select(plistObj.current);
                        
                        // if deleted song wasn't currently playing and
                        // it was at a lower index than current, decrement
                        // current's index to account for a change in
                        // list size.
                    } else if (songIdx < plistObj.current) {
                        plistObj.current--;
                    }
                    
                    // there are no songs left on the playlist
                } else {
                    //  clear all media currently tied to jPlayer
                    $(plistObj.cssSelector.jPlayer).jPlayer(
                        "clearMedia");
                    // current song is 'first song' as there are none
                    plistObj.current = 0;
                    // nothing to shuffle so shuffled state is off
                    plistObj.shuffled = false;
                    // now update UI controls not handled by jPlayer
                    plistObj._updateControls();
                    // now update metadata in player
                    //update player artist, title
                    $(this.cssSelector.artist).html('No Artist');
                    $(this.cssSelector.title).html('No Title');
                }
                
            } // done checking for valid index and removing song
        },
        
        /* select a song in the UI
         */
        select: function(songIdx) {
            // convert relative (negative) indices to absolute indices
            songIdx = (songIdx <0) ? (this.original.length + songIdx) : songIdx;
            
            // if 0-based song index is valid then proceed
            if((songIdx >= 0) && (songIdx < this.playlist.length)) {
                this.current = songIdx;              // update current song
                this._highlight(songIdx);            // highlight song-row in UI
                $(this.cssSelector.jPlayer).jPlayer( // set media appropriately
                    "setMedia", this.playlist[this.current])
                
                // if invalid song index, then set current song to first in list
            } else {
                this.current = 0;
            }
        },
        
        /* play a song in the UI
         */
        play: function(songIdx) {
            // convert relative (negative) indices to absolute indices
            songIdx = (songIdx <0) ? (this.original.length + songIdx) : songIdx;
            
            // if 0-based song index is valid then proceed
            if((songIdx >= 0) && (songIdx < this.playlist.length)) {
                this.select(songIdx);                       // select song at
                $(this.cssSelector.jPlayer).jPlayer("play") // index and play it
                incSongPlayCount(this.playlist[songIdx].id);// INC play count
               
                // if song index wasn't given then play currently selected song
            } else if(songIdx === undefined) {
                $(this.cssSelector.jPlayer).jPlayer("play"); 
            }
        },
        
        /* pause a song
         */
        pause: function() {
            $(this.cssSelector.jPlayer).jPlayer("pause"); 
        },
        
        /* next song in playlist
         */
        next: function() {
            // if stuck looping on a song, play current song and return
            if(this.loopOnSong) {
                this.play(this.current);
                return;
            }
                        
            // not looping on 1 song so...
            // increment current index and wrap around if necessary
            var i =(this.current+1) < this.playlist.length ? this.current+1 : 0;
            
            // if playlist looping is enabled
            if (this.loop) {
                // if next wrapped around (index now 0), playlist is shuffled,
                // shuffle on loop option is enabled, and the playlist has more 
                // than 1 song then shuffle playlist and play
                if((i === 0) && this.shuffled && 
                   this.options.playlistOptions.shuffleOnLoop && 
                   (this.playlist.length > 1)) {
                    this.shuffle(true, true);
                    
                    // next didnt wrap around so just play 
                } else {
                    this.play(i);
                }
                
                // if playlist looping isn't enabled then only play if next song
                //  index didn't wrap around, i.e. non-zero
            } else if (i > 0) {
                this.play(i);
            }
        },
        
        /* previous song in playlist 
         */
        previous: function() {
            // if current play time is > 2s or if stuck looping on a song, 
            // restart current song and return
            if(($(this.cssSelector.jPlayer).data('jPlayer').status.currentTime 
                > 2) || this.loopOnSong) {
                this.play(this.current);
                return;
            }
            
            // not looping on 1 song so...
            // decrement current index and wrap around if necessary
            var i = (this.current-1) >= 0 ? 
                this.current-1 : 
                this.playlist.length-1;
                        
            // play song at proposed index in one of the following conditions:
            // 1. index reverse-wrapped and looping and loop on reverse-wrap
            //    are enabled
            // 2. index didnt wrap
            if((this.loop && this.options.playlistOptions.loopOnPrevious) || 
               (i < this.playlist.length-1)) {
                this.play(i);
            }
        },
        
        /* shuffle playlist
         */
        shuffle: function(forceShuffle, playNow) {
            var plistObj = this;
            // if force shuffle isn't passed in, then toggle. So force action
            // will be opposite of if already shuffled
            if(forceShuffle === undefined) forceShuffle = !this.shuffled;
            
            // if want to force a shuffle or want to force an unshuffle and
            // playlist is already shuffled
            if(forceShuffle || (this.shuffled ==true)) {
                $(this.cssSelector.playlist + " ul").slideUp(
                    this.options.playlistOptions.shuffleTime, function () {
                        // if to shuffle, then use a random sort function
                        if (plistObj.shuffled = forceShuffle) {
                            plistObj.playlist.sort(function() {
                                return 0.5 - Math.random();
                            });
                            // if to unshuffle, reset playlist with original
                            // song list
                        } else {
                            plistObj._originalPlaylist();
                        }
                        
                        // refresh UI rendering of playlist
                        plistObj.refresh(true);
                        
                        // if required to play now or already playing, then play
                        // first item in (un)shuffled playlist else just select
                        if(playNow || !$(plistObj.cssSelector.jPlayer).data(
                            'jPlayer').status.paused) {
                            plistObj.play(0);
                        } else {
                            plistObj.select(0);
                        }
                        
                        // then finally show newly (un)shuffled playlist
                        $(this).slideDown(
                            plistObj.options.playlistOptions.shuffleTime);
                    });
            }
        },
        
        /* select list UI list item (and others if the <shift>/<ctrl> keys are
         * held down.
         */
        _selectItem: function(event, listItem) {
            var listItem = $(listItem);
            
                        
            // if <ctrl>/<cmd> key is pressed, toggle the selected status
            if(event.ctrlKey || event.metaKey) {
                listItem.toggleClass('selected');
                                
                // else if <shift> key and other selected elements, 
                // select this item and other items between this and last
                // selected/unselected item.
            } else if(event.shiftKey && listItem.siblings('.selected').length) {
                var currSelectItem = listItem.index();
                var start = Math.min(currSelectItem,this.lastSelectItem);
                var rangeSize = Math.abs(currSelectItem -this.lastSelectItem)+1;
                $(this.cssSelector.playlist).find(
                    "li:" + ((start == 0) ? "" : ("gt("+(start-1)+"):")) +
                        "lt("+rangeSize+")").addClass("selected");
                
                // in the case of just a mouse click deselect all others
                // and select this
            } else {
                listItem.addClass('selected')
                    .siblings().removeClass('selected');
            }
                        
            // update last selected song-list item
            this.lastSelectItem = listItem.index();
        },
        
        /* show playlist item's context menu
         * event = right-click event
         * listItem = song list element
         */
        _showContextMenu: function (event, listItem) {
            var plistObj = this;
                        
            // if right-clicked list item isn't selected, select it and deselect
            // others
            if(!listItem.hasClass('selected')) {
                listItem.addClass('selected')
                    .siblings().removeClass('selected');
            }
            
            // details of right-clicked song
            var song = this.playlist[listItem.index()];
            
            // grab all selected songs
            var allSelectedSongs = listItem.parent().children('.selected');
                        
            // array of Ids of all selected songs
            var songIds = [];
            $.each(allSelectedSongs, function(idx, item) {
                songIds.push($(item).data("id"));
            });
                        
            // setup context menu buttons
            var buttons = [
                {   // play song that was right-clicked on
                    title: 'Play',
                    cssClass: 'play',
                    args: listItem,
                    callback: function(elem) {
                        // make double-clicked visible playlist active if it
                        // isn't already
                        plVisibleIsActive();
                        
                        // play song which was right-clicked on
                        plistObj.play(elem.index());
                    }
                },
                {   // add selected songs to play-queue
                    title: 'Queue',
                    cssClass: 'queue',
                    args: songIds,
                    callback: function(songs) {
                        // add all selected songs to play-queue
                        addSongsToQueue(songs);
                    }
                },
                {   // add selected songs to playlist
                    title: 'Add to playlist',
                    cssClass:'add-to-playlist',
                    args: songIds,
                    callback: function(songs) {
                        // do nothing here, sublist does grunt work
                    },
                    sublist: function() {
                        // generate a sublist that shows all playlists
                        var menu = $('<ul id="contextmenu-sublist" '+
                                     'class="scrollbar" />');
                        // get all playlist items in navigation
                        var playlistItems = $(".content-nav.playlists li");
                        
                        // and use them to create the sublist's list items
                        $.each(playlistItems, function(idx, item) {
                            var name = $(item).find(".name").text(); 
                            var id = $(item).data("playlist");
                            var menuItem = 
                                $("<li data-playlist='" + id 
                                  + "' class='ellipsis'/>").text(name);
                            
                            // attach item's callback
                            menuItem.click(function() {
                                addSongsToPlaylist(
                                    $(this).data("playlist"), songIds);
                            });
                            
                            // finally append item to sublist
                            menuItem.appendTo(menu);
                        });
                                                
                        // finally, return context menu sublist
                        return menu;
                    }
                },
                {   // share song which was right-clicked on
                    title: 'Share',
                    cssClass: 'share',
                    args: song,
                    callback: function(song) {
                        //do nothing here, sublist does grunt work
                    },
                    sublist: function() {
                         // generate a sublist for all sharing-platforms
                        var menu = $('<ul id="contextmenu-sublist" '+
                                     'class="scrollbar" />');
                        
                        // get song url for sharing/copying
                        var songUrl = getSongViewFullUrl(song.id);
                                                    
                        // holder for the different items
                        var menuItem;
                        
                        // FACEBOOK
                        menuItem = $("<li class='ellipsis'>Facebook</li>")
                            .click(function() {
                                facebookShare(songUrl, song.title);
                            })
                            .appendTo(menu);
                        
                        // TWITTER
                        menuItem = $("<li class='ellipsis'>Twitter</li>")
                            .click(function() {
                                twitterShare(
                                    songUrl, (song.title+'-'+song.artist));
                            })
                            .appendTo(menu);
                        
                        // COPY URL
                        menuItem = $("<li class='ellipsis'>Copy URL</li>")
                            .click(function() {
                                window.open(songUrl);
                            })
                            .appendTo(menu);
                        
                        // finally, return context menu sublist
                        return menu;
                    }
                },
                {   // view song that was right-clicked on
                    title: 'View',
                    cssClass: 'view',
                    args: song,
                    callback: function(song) {
                        // view song page in new window
                        window.open(getSongViewFullUrl(song.id))
                    }
                }
            ];
            
            // buttons that can only be accessed from a playlist page
            var playlistPageButtons = [
                {   // delete selected songs
                    title: 'Delete',
                    cssClass: 'delete',
                    args: allSelectedSongs,
                    callback: function(selectedSongs) {
                        // generate songIds and UI indexes of selected songs
                        var songIds = [], songIdxs = [];
                        $.each(selectedSongs, function(idx, item) {
                            songIds.push($(item).data("id"));
                            songIdxs.push($(item).index());
                        });
                        
                        // get current playlist id/name and delete from there
                        var playlist = getCurrentPlaylistId();
                        // if playlist is the play queue then ...
                        if (playlist === "queue") {
                            deleteSongsFromQueue();
                            // else playlist is user defined
                        } else {
                            deleteSongsFromPlaylist(parseInt(playlist),songIds);
                        }
                        
                        // now remove from UI. It is important to remove from
                        // the end, because indexes of later items change if u
                        // remove from the top
                        for (var i = songIdxs.length-1; i >= 0; i--) {
                            plistObj.remove(songIdxs[i]);
                        }
                    }
                }
            ];
            
            
            // if on a playlist page, then load in the playlistpage buttons
            if(getCurrentPlaylistId()) {
                buttons = $.merge(buttons, playlistPageButtons);
            }
            
            
            // finally show context menu
            showContextMenu(buttons, event.pageX, event.pageY);
            
            // prevent default context menu
            return false;
        }
        
    } /* end playlist object's prototype */
    
})(jQuery);
