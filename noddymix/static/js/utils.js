/* 
 * Description:
 *   Helper functions/definitions to be used by other noddyMix.com js modules.
 *
 * Author: 
 *   Nnoduka Eruchalu
 */
var DEBUG = (typeof DEBUG === 'undefined') ? false : DEBUG;

BASEURL = "http://noddymix.com";

NODE_PORT = '16637'

// base url of node.js server
if (DEBUG) {
    NODE_BASEURL = 'http://127.0.0.1'+':'+NODE_PORT;
} else {
    NODE_BASEURL = 'http://173.192.122.232'+':'+NODE_PORT;
}

// setup constants that serve as URL prefixes and suffixes
SONGVIEW_BASEURL = "/s/";
SONGVIEW_PLAY_APPENDURL = "play/"; 

PLAYLISTVIEW_BASEURL = "/p/";
PLAYLISTVIEW_TEMP_APPEND = "t/";
PLAYLISTVIEW_NEW_APPENDURL = 'new/';
PLAYLISTVIEW_ORDER_SONGS_APPENDURL = 'order/songs/';
PLAYLISTVIEW_ADD_SONGS_APPENDURL = 'add/songs/';
PLAYLISTVIEW_DELETE_SONGS_APPENDURL = 'delete/songs/';
PLAYLISTVIEW_RENAME_APPENDURL = 'rename/';
PLAYLISTVIEW_DELETE_APPENDURL = 'delete/';
PLAYLISTVIEW_LOCK_APPENDURL = 'lock/';
PLAYLISTVIEW_UNLOCK_APPENDURL = 'unlock/';
PLAYLISTVIEW_SUBSCRIBE_APPENDURL = 'subscribe/';
PLAYLISTVIEW_UNSUBSCRIBE_APPENDURL = 'unsubscribe/';

// max number of activities to show at a time
ACTIVITY_LIMIT = 50;


/* setup for 2 playlists, 1 active and 1 visible. Of course the same playlist
 * could be both active and visible
 * - active means currently playing music and controlled by #player
 * - visible means currently displayed in viewport
 * - activeModified: active queue's contents have been modified since it was
 *                   last setup
 */
var playlists = {0:{obj:null,url:null, num_pages:1}, 
                 1:{obj:null,url:null, num_pages:1}, 
                 activeIdx:1, visibleIdx:0, activeModified:false};


/* Description: Open popup window with a given location url. 
 *              Useful for sharing content on social media
 *
 * Arguments:   - location: URL to open in popup.
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function openPopupWindow (location) {
        window.open (location, "_blank",
                     "status=1,toolbar=0, location=0, menubar=0,directories=0,resizeable=0, width=700, height=350");
        }


/* Description: Add a list of songs to a playlist.
 *
 * Arguments:   - playlistId: ID of playlist
 *              - songIds:    list of ID numbers of songs to be added
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function addSongsToPlaylist(playlistId, songIds) {
    if (playlistId) {
        var tempPlaylist = $("[data-playlist-temp]").length;
        var url = getPlaylistViewUrl(playlistId, tempPlaylist) + 
            PLAYLISTVIEW_ADD_SONGS_APPENDURL;
        $.ajax({
            type: 'POST',
            url: url,
            data: {'songs':songIds,
                   csrfmiddlewaretoken:getCsrfToken()},
            success: function(data) {
                // get relative url of active playlist
                var activeURLRel = getURLRelPath(
                    playlists[playlists.activeIdx].url);
                // if active playlist's url is for the updated playlist,
                // then active playlist has been modified.
                if (activeURLRel==getPlaylistViewUrl(playlistId, tempPlaylist)){
                    playlists.activeModified = true;
                }
            },
            error: function(data) {},
            dataType: 'json'
        });
    }
}


/* Description: Delete a list of songs to a playlist.
 *
 * Arguments:   - playlistId: ID of playlist
 *              - songIds:    list of ID numbers of songs to be added
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function deleteSongsFromPlaylist(playlistId, songIds) {
    if (playlistId) {
        var tempPlaylist = $("[data-playlist-temp]").length;
        var url = getPlaylistViewUrl(playlistId, tempPlaylist) + 
            PLAYLISTVIEW_DELETE_SONGS_APPENDURL;
        $.ajax({
            type: 'POST',
            url: url,
            data: {'songs':songIds,
                   csrfmiddlewaretoken:getCsrfToken()},
            success: function(data) {},
            error: function(data) {},
            dataType: 'json'
        });
    }
}


/* Description: Add a list of songs to the client-managed Queue.
 *
 * Arguments:   - songIds:    list of ID numbers of songs to be added          
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function addSongsToQueue(songIds) {
    // cache a copy of the visible playlist objecs
    var original = playlists[playlists.visibleIdx].obj.original;
    
    // grab the items to be added from the visible playlist
    // add add each of these items in sequence to the end of the active playlist
    for(var i=0; i < songIds.length; i++) {
        for (var j=0; j < original.length; j++) {
            if(original[j].id == songIds[i]) {
                playlists[playlists.activeIdx].obj.add(original[j]);
                break;
            }
        }
    }
        
    // finally, indicate active playlist is modified
    playlists.activeModified = true;
}


/* Description: Delete songs from the Queue, while on the Queue page.
 *
 * Arguments:   None
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function deleteSongsFromQueue() {
    // queue is client-managed, so there is no corresponding server-side call.
    // Just indicate active playlist is modified
    playlists.activeModified = true;
}


/* Description: Get current playlist's Id
 *
 * Arguments:   None
 * Return:      id of current playlist
 *
 * Author:      Nnoduka Eruchalu
 */
function getCurrentPlaylistId() {
    return $(".left-col .content-nav li.active").data("playlist");
}


/* Description: Rename a particular playlist
 *
 * Arguments:   - playlistId: Id of playlist of interest
 *              - newPlaylistName: new name of playlist
 *              - playlistItem: HTML element of playlist in UI navigation pane.
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function renamePlaylist(playlistId, newPlaylistName, playlistItem) {
    if (playlistId) {
        var url = getPlaylistViewUrl(
            playlistId, $(playlistItem).data("playlist-temp")) + 
            PLAYLISTVIEW_RENAME_APPENDURL;
        $.ajax({
            type: 'POST',
            url: url,
            data: {'title':newPlaylistName,
                   csrfmiddlewaretoken:getCsrfToken()},
            success: function(data) {
                // update playlist item name in UI with actual value in db
                playlistItem.find('.name').text(data.title);
            },
            error: function(data) {},
            dataType: 'json'
        });
    }
}


/* Description: Delete a particular playlist
 *
 * Arguments:   - playlistId: Id of playlist of interest
 *              - playlistItem: HTML element of playlist in UI navigation pane.
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function deletePlaylist(playlistId, playlistItem) {
    if (playlistId) {
        var url = getPlaylistViewUrl(
            playlistId, $(playlistItem).data("playlist-temp")) + 
            PLAYLISTVIEW_DELETE_APPENDURL;
        $.ajax({
            type: 'POST',
            url: url,
            data: {csrfmiddlewaretoken:getCsrfToken()},
            success: function(data) {},
            error: function(data) {},
            dataType: 'json'
        });
    }
}



/* Description: Generate the relative URL path to view a particular playlist
 *
 * Arguments:   - playlistId:   id of playlist of interest
 *              - tempPlaylist: boolean indicating if playlist is temporary
 * Return:      URL string
 *
 * Author:      Nnoduka Eruchalu
 */
function getPlaylistViewUrl(playlistId, tempPlaylist) {
    return (PLAYLISTVIEW_BASEURL + 
            (tempPlaylist ? PLAYLISTVIEW_TEMP_APPEND : '' )+ 
            playlistId + "/");
}


/* Description: Generate relative URL path to view a particular song, i.e.
 *              no domain name.
 *
 * Arguments:   - songId: Id of song of interest
 * Return:      URL string
 *
 * Author:      Nnoduka Eruchalu
 */
function getSongViewUrl(songId) {
    return (SONGVIEW_BASEURL + songId + "/");
}


/* Description: Generate absolute URL to view a particular song.
 *
 * Arguments:   - songId: Id of song of interest
 * Return:      URL string
 *
 * Author:      Nnoduka Eruchalu
 */
function getSongViewFullUrl(songId) {
    return (BASEURL + getSongViewUrl(songId));
}


/* Description: Generate relative URL path to be used for logging a new
 *              play of a particular song.
 *
 * Arguments:   - songId: Id of song of interest
 * Return:      URL string
 *
 * Author:      Nnoduka Eruchalu
 */
function getSongPlayUrl(songId) {
    return (getSongViewUrl(songId) + SONGVIEW_PLAY_APPENDURL);
}


/* Description: save new order of songs on a playlist page 
 *
 * Arguments:   - sorted_ids: list of song ids in the desired order.
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function saveNewSongOrder(sorted_ids) {
    // ensure playlistIds are only integers. This means only work with user
    // defined playlists that the user owns
    var playlistId = parseInt(getCurrentPlaylistId());
    var tempPlaylist = $("[data-playlist-temp]").length;
    
    // get page of visible page. Remebmer sorting can only be done on the 
    // visible page
    var page = getURLParameter(playlists[playlists.visibleIdx].url, "page")
        || "1";
    
    if (playlistId) {
        var url = getPlaylistViewUrl(playlistId, tempPlaylist) + 
            PLAYLISTVIEW_ORDER_SONGS_APPENDURL;
        $.ajax({
            type: 'POST',
            url: url,
            data: {'songs':sorted_ids,
                   'page':parseInt(page),
                   csrfmiddlewaretoken:getCsrfToken()},
            success: function(data) {},
            error: function(data) {},
            dataType: 'json'
        });
    }
}

/* Description: Check if browser supports history api
 *              Will use this to load pages via ajax and update the browser 
 *              location urls
 *
 * Arguments:   None
 * Return:      Boolean
 *
 * Author:      Nnoduka Eruchalu
 */
function supportsHistoryApi() {
  return !!(window.history && history.pushState);
}


/* Description: update player so it shows the controller for the active playlist
 *
 * Arguments:   None
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function plUpdatePlayer() {
    // hide all players then show active player
    // observe that we are using the css visibilility property, so that the 
    // jPlayer modules can be swapped out properly
    $(playlists[1-playlists.activeIdx].obj.cssSelector.cssSelectorAncestor)
        .addClass("invisible");
    $(playlists[playlists.activeIdx].obj.cssSelector.cssSelectorAncestor)
        .removeClass("invisible");
}


/* Description: update viewport so it displays the visible playlist
 *
 * Arguments:   None
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function plUpdateSongs() {
    // hide all playlists from viewport then show visible playlist in viewport
    $(playlists[1-playlists.visibleIdx].obj.cssSelector.playlist).hide();     
    $(playlists[playlists.visibleIdx].obj.cssSelector.playlist).show();
}


/* Description:  make visible playlist now also active
 *
 * Arguments:   None
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function plVisibleIsActive() {
    // then make visible playlist the active
    playlists.activeIdx = playlists.visibleIdx;
    // active playlist has been updated so connect it to visible player
    plUpdatePlayer();
    // and indicate that it's content is fresh and hasnt had songs added/deleted
    playlists.activeModified = false;
}


/* Description:  make active playlist now also visible
 *
 * Arguments:   None
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function plActiveIsVisible() {
    playlists.visibleIdx = playlists.activeIdx;
    // visible playlist has been updated so show it in viewport
    plUpdateSongs();
}


/* Description: check if playlist object is active
 *
 * Arguments:   None
 * Return:      Boolean: true/false
 *
 * Author:      Nnoduka Eruchalu
 */
function plIsActiveObj(playlistObj) {
    return (playlistObj === playlists[playlists.activeIdx].obj)
}


/* Description: get the other playlist object when given 1 playlist object
 *
 * Arguments:   None
 * Return:      internal playlist object
 *
 * Author:      Nnoduka Eruchalu
 */
function plGetOtherObj(playlistObj) {
    return (plIsActiveObj(playlistObj) ? playlists[1-playlists.activeIdx].obj :
            playlists[playlists.activeIdx].obj);
}


/* Description: Get the value of a URL parameter
 *
 * Arguments:   - url: url of interest 
 *              - name: parameter name
 * Return:      value string
 *
 * Author:      Nnoduka Eruchalu
 */
function getURLParameter(url, name) {
    return decodeURIComponent(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,""])[1]
    );
}



/* Description: Get the relative path of an absolute URL
 *              src: https://gist.github.com/jlong/2428561
 *
 *               note that IE has the following quirks: 
 *               - doesn't include the leading slash
 *               - if url is given as just a querystring (e.g. ?page=1) it
 *                 returns a blank pathname as opposed to
 *                 window.location.pathname
 *
 * Arguments:   - url: url of interest 
 * Return:      URL string
 *
 * Author:      Nnoduka Eruchalu
 */
function getURLRelPath(url) {
    // handle undefined/null/NaN/0/false. 
    // Note that this truth check also catches empty string ("") but that's okay
    // because we use that as the default value
    if (!url) url = "";
    
    var parser = document.createElement('a');
    
    // handle IE quirk of not understanding querystring URLs
    url = (url.charAt(0) == "?") ? window.location.pathname + url : url;
    
    parser.href = url;
    var pathname = parser.pathname;
    
    // handle IE quirk of not including leading slash
    pathname = (pathname.charAt(0) == "/") ? pathname : ("/" + pathname);
    
    return pathname; 
}


/* Description: Get the query string part of a given URL, including the 
 *              question mark (?)
 *
 * Arguments:   - url: url of interest 
 * Return:      string representing query string, including the question mark(?)
 *
 * Author:      Nnoduka Eruchalu
 */
function getURLGetParams(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser.search;
}


/* Description: Check if url of given page is active playlist's url
 *
 * Arguments:   - playlistUrl: given page's url.
 * Return:      Boolean
 *
 * Author:      Nnoduka Eruchalu
 */
function plIsActiveUrl(playlistUrl) {
    // first get active page's url
    var activeUrl = playlists[playlists.activeIdx].url;
    
    // only bother with all this logic if there was indeed already activeUrl
    // there could be cases when this isn't the case, like starting from
    // the heavy rotation page and clicking into a playlist
    if (activeUrl !== null) {
        // get url page number, and if it doesn't exist assume page 1.
        var activeUrlPage = getURLParameter(activeUrl, "page") || "1"
        var playlistUrlPage = getURLParameter(playlistUrl, "page") || "1"
        
        // get relative urls without get parameters
        var activeUrlRel = getURLRelPath(activeUrl);
        var playlistUrlRel =  getURLRelPath(playlistUrl);
        
        // is there a search parameter on activeUrl?
        var isSearchParam = getURLParameter(activeUrl, "q") ? true : false;
        
        // so finally playlistUrl is equivalent to activeUrl if relative urls
        // and pages are equal, and this isn't a search page
        return ((activeUrlPage==playlistUrlPage) && 
                (activeUrlRel==playlistUrlRel) &&
                !isSearchPage(playlistUrl) && !isSearchParam);
    } else {
        // there was no active URL, so this playlistUrl is definitely 
        // not active playlist's URL
        return false;
    }
}


/* Description: get cookie component's value
 *              ref: https://docs.djangoproject.com/en/dev/ref/contrib/csrf/
 *
 * Arguments:   - name: cookie key of interest
 * Return:      string value
 *
 * Author:      Nnoduka Eruchalu
 */
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue=decodeURIComponent(cookie.substring(name.length+1));
                break;
            }
        }
    }
    return cookieValue;
}


/* Description: get CSRF token value from webpage.
 *
 * Arguments:   None
 * Return:      CSRF token string.
 *
 * Author:      Nnoduka Eruchalu
 */
function getCsrfToken() {
    return $("#csrftoken input[name='csrfmiddlewaretoken']").attr('value');
}


/* Description: get session id value.
 *
 * Arguments:   None
 * Return:      session id string.
 *
 * Author:      Nnoduka Eruchalu
 */
function getSessionId() {
    return getCookie('sessionid');
}


/* Description: Log a new play of a particular song by incrementing its
 *              play count.
 *
 * Arguments:   - songId: Id of song of interest
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function incSongPlayCount(songId) {
    $.ajax({
        type: 'POST',
        url: getSongPlayUrl(songId),
        data: {csrfmiddlewaretoken:getCsrfToken()},
        success: function(data) {
            // do nothing
        },
        error: function(data) {
            // nothing to do here
        },
        dataType: 'json'
    });
}


/* Description: Is given page a content page?
 *              i.e. a page that doesnt have songs but has other content
 *
 * Arguments:   - link: URL of page of interest
 * Return:      Boolean
 *
 * Author:      Nnoduka Eruchalu
 */
function isContentPage(link) {
    var relLink = getURLRelPath(link);
    // is this a top playlists page
    var isTopPlaylistsPage = relLink.match(/^\/top\/$/) ? true : false;
    // is this a favorites page
    var isFavoritesPage =  relLink.match(/^\/favorites\/$/) ? true : false;
    // is this a user-defined playlist subscribers page
    var isUDFPlaylistSubscribersPage = 
        relLink.match(/^\/p\/\d+\/subscribers\/$/) ? true : false;
    // is this a search-playlists page
    var isSearchPlaylistsPage = 
        relLink.match(/^\/search\/p\/$/) ? true : false;
    // is this a search-users page
    var isSearchUsersPage = relLink.match(/^\/search\/u\/$/) ? true : false;
    // is this a user's public profile or follower/following page?
     var isUserPage = 
        relLink.match(/^\/u\/\d+\//) ? true : false;
        
    return (isTopPlaylistsPage || isFavoritesPage || 
            isUDFPlaylistSubscribersPage ||  isSearchPlaylistsPage || 
            isSearchUsersPage || isUserPage);
}


/* Description: Is given page a search page?
 *
 * Arguments:   - link: URL of page of interest
 * Return:      Boolean
 *
 * Author:      Nnoduka Eruchalu
 */
function isSearchPage(link) {
    var relLink = getURLRelPath(link);
    return (relLink.match(/^\/search\//) ? true : false);
}


/* Description: add or update a querystring parameter
 *              source: http://stackoverflow.com/a/6021027
 *
 * Arguments:   - uri:   URL to be updated
 *              - key:   parameter key/name
 *              - value: parameter value
 * Return:      Boolean
 *
 * Author:      Nnoduka Eruchalu
 */
function updateQueryStringParameter(uri, key, value) {
  var re = new RegExp("([?|&])" + key + "=.*?(&|$)", "i");
  separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  }
  else {
    return uri + separator + key + "=" + value;
  }
}


/* Description: Share a url on Facebook with a given title.
 *
 * Arguments:   - url:   URL to share
 *              - title: title to use when sharing
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function facebookShare(url, title) {
    var location = "https://www.facebook.com/sharer.php?u="+
        encodeURIComponent(url) + "&t" + encodeURIComponent(title);
    openPopupWindow(location);
}


/* Description: Share a url on Twitter with a given title.
 *
 * Arguments:   - url:   URL to share
 *              - title: title to use when sharing
 * Return:      None
 *
 * Author:      Nnoduka Eruchalu
 */
function twitterShare(url, title) {
    var location = "http://twitter.com/share?text="+
        encodeURIComponent("#np "+ title.substring(0,90)) +
        "&via=noddymix&url=" + encodeURIComponent(url);
    openPopupWindow(location);
}