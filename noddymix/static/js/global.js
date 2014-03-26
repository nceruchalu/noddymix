/*
 * Description:
 *   Module which initializes the desktop user's javascript environment.
 *   It is effectively the `main` module.
 *
 * Author:
 *   Nnoduka Eruchalu
 */
$(document).ready(function(){ // container for entire script
    var initialPageLoad = true; // page just loaded;
    
    var curr_page = 1; // start on page 1
    var prev_page = 0; // no previous page
    var next_page = 0; // no next page
    var num_pages = 1; // assume only 1 page
    
    
    // get content for current url and page
    function getContentCurrPage(url) {
        // if url is supplied use it, else construct it yourself
        // by determining the active url and using current page number
        url = url || ($(".content-nav li.active a").attr("href") + 
                      '?page='+curr_page);
        
        // indicate to user that this might take some time
        $("#page-loading").show();
        
        // now actually pull content
        $.ajax({
            type:'GET',
            url:url,
            success:function(data) {
                // show content
                $(".middle-col").prepend(data.content);
                                
                // no visible playlist, but update viewport to show visible
                // playlist, and clear it out
                playlists.visibleIdx = 1-playlists.activeIdx;
                plUpdateSongs();
                $(playlists[playlists.visibleIdx].obj.cssSelector.playlist + " ul").empty();
                // on initial page load, visible playlist is active
                if (initialPageLoad == true) {
                    initialPageLoad = false;
                    plVisibleIsActive();
                }
                                                               
                // get pagination parameters
                curr_page = parseInt(data.curr_page);
                prev_page = parseInt(data.prev_page);
                next_page = parseInt(data.next_page);
                num_pages = parseInt(data.num_pages); // update
                paginate();
                
                // finally done... user can proceed
                $("#page-loading").hide();
            },
            error: function(data) {
                num_pages = 0; // no pages
                paginate();
            },
            dataType:'json',
            cache:false // ensures forward/back buttons work properly
        });
        
    }
    
    
    // get songs for current url and page
    function getSongCurrPage(url, headerpage) {
        // if url is supplied use it, else construct it yourself
        // by determining the active url and using current page number
        var url = url || ($(".content-nav li.active a").attr("href") + 
                      '?page='+curr_page);
        
        // by default, assume this is not for a page with a 'fancy' header
        var headerpage = headerpage || false;
        
        // indicate to user that this might take some time
        $("#page-loading").show();
        
        // now actually pull content
        $.ajax({
            type:'GET',
            url:url,
            success:function(data) {
                // if this is a header page, update the page header
                if (headerpage) {
                    $(".middle-col").prepend(data.header);
                    if (plIsActiveUrl(url) && !playlists.activeModified) {
                        // if on a playlist page, and new link is for active 
                        // queue then don't set playlist songs
                        plActiveIsVisible();
                        paginateByUrl(
                            url, playlists[playlists.visibleIdx].num_pages);
                        $("#page-loading").hide();
                        return;
                    }
                }
                
                // determine appropriate visible playlist
                playlists.visibleIdx = 1-playlists.activeIdx;
                // update url for visible playlist
                playlists[playlists.visibleIdx].url = url;
                // and update num pages for visible playlist
                playlists[playlists.visibleIdx].num_pages = 
                    parseInt(data.num_pages); 
                // and update viewport to show visible playlist
                plUpdateSongs();
                // on initial page load, visible playlist is active
                if (initialPageLoad == true) {
                    initialPageLoad = false;
                    plVisibleIsActive();
                }
                                
                
                // save received songs in visible playlist
                playlists[playlists.visibleIdx].obj.setPlaylist(data.songs);
                               
                // get pagination parameters
                curr_page = parseInt(data.curr_page);
                prev_page = parseInt(data.prev_page);
                next_page = parseInt(data.next_page);
                num_pages = parseInt(data.num_pages); // update
                paginate();
                
                // finally done... user can proceed
                $("#page-loading").hide();
            },
            error: function(data) {
                num_pages = 0; // no pages
                paginate();
            },
            dataType:'json',
            cache:false // ensures forward/back buttons work properly
        });
    }
    
    
    /* update pagination element
     */
    function paginate() { 
        if (num_pages <= 1) {
            // if there aren't multiple pages, hide pagination
            $(".digg_pagination").hide();
            
        } else {
            // if there are however multiple (>=2) pages, show pagination
            $(".digg_pagination").show();
            // start with placing the buttons for previous and next page
            $(".digg_pagination").html(
                '<a href="?page='+(prev_page ? prev_page : 1)+
                    '" class="previous_page">&larr; Previous</a>'+
                    '<a href="?page='+(next_page ? next_page : num_pages)+
                    '" rel="next" class="next_page">Next &rarr;</a>');
            
            // loop through all possible pages
            var page_index, page_url;
            var start_i = Math.max(1, curr_page-5);
            var stop_i = Math.min(num_pages, start_i+9);
            if ((stop_i-start_i) < 10) {
                start_i -= (9 - (+stop_i-start_i));
                start_i = Math.max(1, start_i);
            }
            var page_get_params = getURLGetParams($(location).attr('href'));
            for (var i=start_i; i<=stop_i; i++) {
                page_url =updateQueryStringParameter(page_get_params,"page",i); 
                page_index= '<a href="'+page_url+'"' + 
                    ((i==curr_page) ? 'class="current">':'>') +
                    i + '</a>'
                $(".digg_pagination .next_page").before(page_index);
            }
            
            // if no next page then disable corresponding button
            if (next_page == 0) {
                $(".digg_pagination .next_page").addClass("disabled")
                    .click(function() {return false;}); 
            }
            
            // if no previous page then disable corresponding button
            if (prev_page == 0) {
                $(".digg_pagination .previous_page").addClass("disabled")
                    .click(function() {return false;}); 
            }
            // add class that permits for using history API
            $(".digg_pagination a").addClass('history');
        }    // end else [multiple pages, >=2]
    } // end paginate();
    
    
    /* run a pagination operation on a page with given url and num_pages
     * call this when page number has changed but num_pages hasn't
     */
    function paginateByUrl(url, n_pages) {
        curr_page = parseInt(getURLParameter(url, "page")) || 1;
        next_page = (curr_page+1>num_pages) ? 0 : curr_page+1;
        prev_page = curr_page-1;
        num_pages = n_pages;
        paginate();
    }
    
    
    /* process URL for history api's pushstate and popstate
     */
    function processHistoryLink(link) {
        // move active content-nav indicator
        $(".content-nav li.active").removeClass("active");
        
        var relLink = getURLRelPath(link);
        $(".content-nav [href='"+relLink+"']").parent("li")
            .addClass("active");
        
        // is this a user-defined playlist page? they look different...
        var isUDFPlaylistPage = relLink.match(/^\/p\/\d+\/$/) ? true : false;
        // is this a temporary playlist
         var isTempPlaylistPage = relLink.match(/^\/p\/t\/\d+\/$/) ?true :false;
        // is this a search results page
        var onSearchPage = isSearchPage(link);
        
        // first reset page title (incase we were on a playlist on song page)
        document.title = 'NoddyMix';
                
        // pages are either:
        // - regular song pages whose headers are already on page.
        // - isHeaderPage: song pages that grab headers via ajax
        // - isContentPage: pages that have no songs but do have content
        var isHeaderPage = isUDFPlaylistPage || isTempPlaylistPage 
            || onSearchPage;
        
        
        // remove page headers, in preparation for updating them
        $(".middle-col .page-heading").remove();
        $(".middle-col #page-summary, .middle-col #page-nav").remove();
        
        // remove page content, in preparation for updating it
        $("#page-content").remove();
        
        
        if(onSearchPage) {
            // if this is a search page, then update the searchbar
            $("#id_q").val(getURLParameter(link,"q"));
        } else {
            // if this isn't a search page, then clear the searchbar
            $("#id_q").val("");
        }
        
        if(isContentPage(link)) {
            // update page content
            $(".playlist-header").hide();
            getContentCurrPage(link);
            return;
        }
        
        // if here, then we know pages have headers that need to show
        $(".playlist-header").show();
        if(!isHeaderPage) {
            // update page-heading for a page that doesn't get it's heading
            // via ajax
            $(".middle-col").prepend(
                '<p class="page-heading">'+
                    $.trim($(".content-nav li.active").text()+'</p>'));
        }
        
        // get content for new page
        if(isHeaderPage) {
            // if on a page with ajax headers, grab content for a new page.
            // this will also update the page heading
            getSongCurrPage(link, true);
            
        } else if (getURLRelPath(link) == "/queue/"){
            // if on the queue page, then again just show active playlist
            plActiveIsVisible();
            $(".digg_pagination").hide();
            
        } else if(plIsActiveUrl(link) && !playlists.activeModified) {
            // if songs to pull are already in active queue and it hasn't been
            // changed since it was setup, then just show active playlist
            plActiveIsVisible();
            paginateByUrl(link, playlists[playlists.visibleIdx].num_pages);
            
        } else {
            // else pull songs from server
            getSongCurrPage(link);
        }
    }
    
    
    /* apply history api functionality to pagination buttons and 
     * content navigation links
     */
    function setupHistoryClicks() {
        $("#content>.left-col, #content>.middle-col, #player1, #player2")
            .off("click", "a.history")
            .on("click", "a.history", function(event){
                // get all pagination links, and if not disabled get songs for
                // current page
                if(!$(this).hasClass("disabled")) {
                    var link = $(this).attr("href");
                    processHistoryLink(link);
                    history.pushState(null, null, link);
                }
                return false;
            });
        
        
        /* make searches more dynamic
         * ---------------------------
         */
        $("#search_bar").submit(function() {
            // on search action, get search query
            var query = $("#id_q").val().trim();
            if (query) { // only do something on actual query
                var link = $(this).attr("action")+"?q="+query;
                processHistoryLink(link);
                history.pushState(null, null, link);
            }
            return false;
        });
    }
    

    
    /* activate tooltips 
     * ----------------------
     */
    $("[title]").tipsy({gravity: $.fn.tipsy.autoNS});
    
    
    /* active live feed expander/collapser
     * ---------------------
     */
    $(".right-col .feed-expander").click(function(){
        $("#content").removeClass("collapsed-feed");
    });
    $(".right-col .feed-collapser").click(function(){
        $("#content").addClass("collapsed-feed");
    });
    
    
    /* profile connect social accounts toggle buttons
     * ---------------------
     * move toggle slider switch before going to clicked url
     */
    $('#connected-accounts .toggle').on('click', function () {
        $(this).find('.toggle_inner').toggleClass('on');
    })
    
    
    /* follow/unfollow a user
     * ----------------------
     */
    // unfollow a user if already following
    $(".middle-col").off("click",".btn.ajax.following")
        .on("click", ".btn.ajax.following",function() {
            var btn = $(this);
            $.ajax({
                type: 'POST',
                url: "/u/"+btn.data("id")+"/unfollow/",
                data: {csrfmiddlewaretoken:getCsrfToken()},
                success: function(data) {
                    btn.removeClass('following').addClass(data.status);
                },
                error: function(data) {
                    // nothing to do here
                },
                dataType: 'json'
            });
        });
    
    // follow a user if not already following
    $(".middle-col").off("click", ".btn.ajax.follow")
        .on("click", ".btn.ajax.follow", function() {
            var btn = $(this);
            $.ajax({
                type: 'POST',
                url: "/u/"+btn.data("id")+"/follow/",
                data: {csrfmiddlewaretoken:getCsrfToken()},
                success: function(data) {
                    btn.removeClass('follow').addClass(data.status);
                },
                error: function(data) {
                    // nothing to do here
                },
                dataType: 'json'
            });
        });
    
    
    /* make a playlist private/public
     * ----------------------
     */
    // if a playlist is public, make it private
    $(".middle-col").off("click", "#page-summary .btn.public")
        .on("click", "#page-summary .btn.public", function() {
            var btn = $(this);
            $.ajax({
                type: 'POST',
                url: getPlaylistViewUrl(btn.data("id")) +
                    PLAYLISTVIEW_LOCK_APPENDURL,
                data: {csrfmiddlewaretoken:getCsrfToken()},
                success: function(data) {
                    btn.removeClass('public').addClass(data.status);
                },
                error: function(data) {},
                dataType: 'json'
            });
        });
    // if a playlist is private, make it public
    $(".middle-col").off("click", "#page-summary .btn.private")
        .on("click", "#page-summary .btn.private", function() {
            var btn = $(this);
            $.ajax({
                type: 'POST',
                url: getPlaylistViewUrl(btn.data("id")) +
                    PLAYLISTVIEW_UNLOCK_APPENDURL,
                data: {csrfmiddlewaretoken:getCsrfToken()},
                success: function(data) {
                    btn.removeClass('private').addClass(data.status);
                },
                error: function(data) {},
                dataType: 'json'
            });
        });
    
    
    /* subscribe to/unsubscribe from a playlist
     * ----------------------
     */
    // subscribe to a playlist
    $(".middle-col").off("click", "#page-summary .btn.subscribe")
        .on("click", "#page-summary .btn.subscribe", function() {
            var btn = $(this);
            $.ajax({
                type: 'POST',
                url: getPlaylistViewUrl(btn.data("id")) +
                    PLAYLISTVIEW_SUBSCRIBE_APPENDURL,
                data: {csrfmiddlewaretoken:getCsrfToken()},
                success: function(data) {
                    btn.removeClass('subscribe').addClass(data.status);
                },
                error: function(data) {},
                dataType: 'json'
            });
        });
    // unsubscribe from a playlist
    $(".middle-col").off("click", "#page-summary .btn.subscribed")
        .on("click", "#page-summary .btn.subscribed", function() {
            var btn = $(this);
            $.ajax({
                type: 'POST',
                url: getPlaylistViewUrl(btn.data("id")) +
                    PLAYLISTVIEW_UNSUBSCRIBE_APPENDURL,
                data: {csrfmiddlewaretoken:getCsrfToken()},
                success: function(data) {
                    btn.removeClass('subscribed').addClass(data.status);
                },
                error: function(data) {},
                dataType: 'json'
            });
        });
    
    
    /* remove django-messages after some time
     * ---------------------
     */
    setTimeout(function() {
        $('.messagelist').slideUp(300, 
                                  function() {$(this).remove();})
    }, 3000);
    
    
    /* edit avatar & cover photo
     * ---------------------
     */
    // on click of the edit icon, show file dialog by creating click event
    // on file input
    $(".icon.edit-photo").click(function() {
        $(this).siblings("form.edit-photo").find('input[type="file"]').click();
    });
    // when user selects a file, the file input's value will change. If a file
    // was selected then there will be a value
    $('form.edit-photo input[type="file"]').change(function() {
        if($(this).val()) {
            // if a file was selected, submit form
            $(this).siblings('input[type="submit"]').click();
            // indicate to user that this might take some time
            $("#page-loading").show();
        }
    });
    
    
    /* delete avatar & cover photo
     * ---------------------
     */
    // on click of delete icon, show custom confirmation box
    $('.icon.delete-photo').click(function() {
        var submit_button = $(this).siblings('form.delete-photo')
            .find('input[type="submit"]');
        
        // apprise confirmation box options
        var options = {
            // animation speed
            animation: 200,
            // override browser navigation when Apprise is open
            override: false,
            // actual buttons in confirmation box
	    buttons: { 
                cancel: {
                    text: 'No',
                    className: 'blue',
                    action: function() {  // Callback function
		        Apprise('close');
                    }   
                },
                confirm: {
                    text: 'Yes',          // Button text
                    className: 'red',     // Custom class name(s)
                    action: function() {  
		        Apprise('close'); 
                        // submit delete-form
                        submit_button.click();
                        // indicate to user that this might take some time
                        $("#page-loading").show();
                    }
		}    
	    },
        };
        // apprise confirmation box text
        var text = 'Are you sure you want to delete photo?';
        // now call custom-alert (confirmation) box
        Apprise(text, options);
    });
    
    
    
    /* setup ability to drop songs unto playlist navigation list
     * ---------------------------
     */
    var droppableOptions = {
        hoverClass: "drop-hover", // droppable's class on hover of draggable
        tolerance: "pointer",     // register droppable hover on pointer overlap
        drop: function(event, ui) {
            // array of dragged and dropped <li>s
            var droppedItems = ui.draggable.data('multidrag');
            
            // array of song IDs of dropped elements
            var droppedIds = [];
            
            // for each dropped <li>, push it's song ID into droppedIds.
            $.each(droppedItems, function(idx, item) {
                droppedIds.push($(item).data("id"));
            });
            
            // get id/name of playlist on which songs were dropped
            var playlist = $(this).data("playlist");
            // if playlist is the play queue then ...
            if (playlist === "queue") {
                addSongsToQueue(droppedIds);
                // else playlist is user defined
            } else {
                addSongsToPlaylist(playlist,droppedIds);
            }
        }
    };
    
    $(".droppable").droppable(droppableOptions);
    
    
    /* setup playlist navigation context menus
     * ---------------------------
     */
    // edit playlist item in left column's navigation menu
    function editPlaylistNav (elem) {
        var input = $('<input type="text" />')
            .addClass('rename')
            .val($.trim(elem.find('.name').text()))
            .blur(function(event) {
                elem.find('.name').show();
                input.remove();
            })
            .keyup(function(event) {
                switch(event.keyCode) {
                case 13: // <RETURN>
                    renamePlaylist(elem.data("playlist"), 
                                   input.val(), elem);
                    elem.find('.name').text(input.val());
                    $(this).blur();
                    break;
                case 27: // ESC
                    $(this).blur();
                    break;
                }
                event.stopPropagation();
            });
        elem.find('.name').hide();
        elem.append(input);
        input.focus().select();
    }
    function showPlaylistNavContextMenu(event, listItem) {
        // context menu options/buttons
        var buttons = [
            {   // Rename the right-clicked playlist
                title: 'Rename',
                cssClass: 'rename',
                args: listItem,
                callback: editPlaylistNav
            },
            {   // delete the right-clicked playlist
                title: 'Delete',
                cssClass: 'delete',
                args: listItem,
                callback: function(elem) {
                    // apprise confirmation box options
                    var options = {
                        // animation speed
                        animation: 200,
                        // override browser navigation when Apprise is open
                        override: false,
                        // actual buttons in confirmation box
	                buttons: { 
                            cancel: {
                                text: 'No',
                                className: 'blue',
                                action: function() {  // Callback function
		                    Apprise('close');
                                }   
                            },
                            confirm: {
                                text: 'Yes',          // Button text
                                className: 'red',     // Custom class name(s)
                                action: function() {  // Callback function
		                    Apprise('close'); 
                                    // remove server-side and from UI
                                    deletePlaylist(elem.data("playlist"), elem);
                                    elem.remove();
                                }                     // end Callback function
		            }                         // end confirm
	                },
                    };
                    // apprise confirmation box text
                    var text = 'Are you sure you want to delete '+
                        '<span class="bold-text">"'+
                        $.trim(elem.find('.name').text()) + '"</span>?';
                    // now call custom-alert (confirmation) box
                    Apprise(text, options);
                }
            }
        ];
        
        // finally show context menu
        showContextMenu(buttons, event.pageX, event.pageY);
        
        // prevent default context menu
        return false;
    }
    
    $(".content-nav.playlists").off("contextmenu", "li")
        .on("contextmenu", "li", function(event) {
            return showPlaylistNavContextMenu(event, $(this));
        });
    
    
    /* create new playlist in left column
     * ---------------------------
     */
    $("#content .left-col a.new-playlist").click(function(){
        // is this for a temporary playlist?
        var tempPlaylist = $(this).data("playlist-temp");
        var url = PLAYLISTVIEW_BASEURL + 
            (tempPlaylist ? PLAYLISTVIEW_TEMP_APPEND : '' ) + 
            PLAYLISTVIEW_NEW_APPENDURL;
        $.ajax({
            type: 'POST',
            url: url,
            data: {csrfmiddlewaretoken:getCsrfToken()},
            success: function(data) {
                // generate html entity
                var playlistItem = 
                    $('<li class="droppable" data-playlist="">' +
                      '  <span class="indicator icon"></span>' +
                      '  <a class="name history" href="' + 
                      getPlaylistViewUrl(data.id, tempPlaylist) +
                      '">'+data.title+'</a></li>');
                // will be able to drop playlist songs unto this new playlist
                playlistItem.droppable(droppableOptions);
                // set playlist id in the data object
                playlistItem.data("playlist",data.id);
                // if playlist item is temporary, indicate this:
                if (tempPlaylist)
                    playlistItem.data("playlist-temp",1);
                // new playlist is now at top of playlist navigation list
                $(".content-nav.playlists").prepend(playlistItem);
                // give user a chance to edit new playlist name
                editPlaylistNav(playlistItem);
            },
            error: function(data) {},
            dataType: 'json'
        });
        
        
        
        return false;
    });
    
    
    /* socket.io functionality [for live feed]
     * ---------------------------
     */
    // only attempt this if socket.io.js was successfully downloaded
    if(typeof io !== 'undefined') {
        var socket = io.connect(NODE_BASEURL + '/feed')
        socket.on('connect', function() {
            // on connection to the nodejs server, subscribe to followings for
            // feed updates. Server needs unique identifier, so use sessionid
            socket.emit('subscribe', {sessionid:getSessionId()});
        });
        socket.on('feedupdate', function(message) {
            // get activity update
            activity_update = $("<li>"+message+"</li>");
            // put at the top of the activity feed
            $("ul.activity-feed").prepend(activity_update);
            // limit the total number of visible activities
            $(".activity-feed").find("li:gt("+(ACTIVITY_LIMIT-1)+")").remove();
        });
    }
    
    /* actions specific to music pages
     * ---------------------------
     */
    if ($(".player").length > 0) {
        
        /* setup HTML5 history api clicks
         * ----------------------
         */
        if(supportsHistoryApi()) {
            // if browser supports history api, attach click event handlers
            setupHistoryClicks();
            // and click event handlers for navigation elements
            
            // and you will need to add the appropriate handler for
            // faking "moving backwards"
            $(window).off("popstate")
                .on("popstate", function(e) {
                    // some browsers (i.e. Chrome) throw a "popstate" event on 
                    // pageload. Ignore such events.
                    if(!initialPageLoad) { 
                        link = $(location).attr('href');
                        processHistoryLink(link);
                    }
                });
        }
        
    
        /* setup playlists
         * ---------------------------
         */
        var jPlayerConfs = {                     // jPlayer configs
	    swfPath: "/js/Jplayer.swf",
	    supplied: "mp3",                     // noddymix only uses mp3
            solution: "flash, html",             // flash is higher priority
            size: {width:"60px", height:"60px",  // cover art size
                   cssClass:"plPoster" },
            volume: 0.8,                         // default volume
            wmode:" window",                     // so Firefox 3.6 works
            cssSelectorAncestor:"#player",
            cssSelector: {                       // cssSelector for jPlayer
                play: ".plPlay",
                pause: ".plPause",
                seekBar: ".plLoad",
                playBar: ".plTimeRemain .ul-slider-range",
                mute: ".plMute", 
                unmute: ".plUnMute", 
                volumeBar: ".plVolume",
                volumeBarValue: ".plVolumeRemain .ul-slider-range",
                volumeMax: ".plLoud",
                currentTime: ".plTime .time_dur",
                duration: ".plTime .time_rem",
                repeat: ".plLoop",
                repeatOff: ".plLoopOff"
                },
            keyEnabled: true                     // enable keyboard controls
        };
        // start with no songs on both playlists. observe that they have
        // different player, jPlayer, and playlist elements
        playlists[0].obj = new jPlayerPlaylist({
	    jPlayer: "#jplayer1",                // jplayer element
	    cssSelectorAncestor: "#player1",     // music player element
            playlist: "#playlist1"
        }, [], jPlayerConfs);
        playlists[1].obj = new jPlayerPlaylist({
	    jPlayer: "#jplayer2",                // jplayer element
	    cssSelectorAncestor: "#player2",     // music player element
            playlist: "#playlist2"
        }, [], jPlayerConfs);
        
        
        // get actual songs for this page
        
        
        var pageUrl = $(location).attr("href");
        if(isContentPage(pageUrl)) {
            // if this is a content page, update appropriately
            $(".playlist-header").hide();
            getContentCurrPage(pageUrl);
        } else {
            // else get actual songs for this page
            getSongCurrPage(pageUrl);
        }
        
    }   // end actions specific specific to music pages
    
    
}); // end container for entire script
