/*
 * Description:
 *   Controller which has utility functions
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.Utils', {
    extend: 'Ext.app.Controller',
    
    requires: [
        'Ext.LoadMask'
    ],
    
    // called after the Application is launched.
    launch: function(app) {
        // setup constants that serve as URL prefixes and suffixes
        this.BASEURL = "http://noddymix.com";
        
        this.SONGVIEW_BASEURL = "/s/";
        this.SONGVIEW_PLAY_APPENDURL = "play/"; 
        
        this.PLAYLISTVIEW_BASEURL = "/p/";
        this.PLAYLISTVIEW_TEMP_APPEND = "t/";
        this.PLAYLISTVIEW_NEW_APPENDURL = 'new/';
        this.PLAYLISTVIEW_ORDER_SONGS_APPENDURL = 'order/songs/';
        this.PLAYLISTVIEW_ADD_SONGS_APPENDURL = 'add/songs/';
        this.PLAYLISTVIEW_DELETE_SONGS_APPENDURL = 'delete/songs/';
        this.PLAYLISTVIEW_RENAME_APPENDURL = 'rename/';
        this.PLAYLISTVIEW_DELETE_APPENDURL = 'delete/';
        this.PLAYLISTVIEW_LOCK_APPENDURL = 'lock/';
        this.PLAYLISTVIEW_UNLOCK_APPENDURL = 'unlock/';
        this.PLAYLISTVIEW_SUBSCRIBE_APPENDURL = 'subscribe/';
        this.PLAYLISTVIEW_UNSUBSCRIBE_APPENDURL = 'unsubscribe/';
        
        this.USERVIEW_BASEURL = "/u/";
        this.USERVIEW_PLAYLISTS_APPENDURL = "playlists/";
        this.USERVIEW_FOLLOWERS_APPENDURL = "followers/";
        this.USERVIEW_FOLLOWING_APPENDURL = "following/";
        this.USERVIEW_FOLLOW_APPENDURL = "follow/";
        this.USERVIEW_UNFOLLOW_APPENDURL = "unfollow/";
        
        this.mainController = app.getController('Main');
    },
    
    
    /* Description: Generate relative URL path to view a particular song, i.e.
     *              no domain name.
     *
     * Arguments:   - songId: Id of song of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getSongViewUrl: function(songId) {
        return (this.SONGVIEW_BASEURL + songId + "/");
    },
    
    
    /* Description: Generate absolute URL to view a particular song.
     *
     * Arguments:   - songId: Id of song of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getSongViewFullUrl: function(songId) {
        return (this.BASEURL + this.getSongViewUrl(songId));
    },
    
    
    /* Description: Generate relative URL path to be used for logging a new
     *              play of a particular song.
     *
     * Arguments:   - songId: Id of song of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getSongPlayUrl: function(songId) {
        return (this.getSongViewUrl(songId) + this.SONGVIEW_PLAY_APPENDURL);
    },
    
    
    /* Description: Log a new play of a particular song by incrementing its
     *              play count.
     *
     * Arguments:   - songId: Id of song of interest
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    incSongPlayCount: function(songId) {
        Ext.Ajax.request({
            url:this.getSongPlayUrl(songId),
            method:'POST',
            params:{csrfmiddlewaretoken:this.mainController.csrftoken},
            success: function(response) {
                // d nothing
            }, 
            failure: function() {
                // do nothing
            }
        });
    },
    
    
    /* Description: Generate the relative URL path to view a particular playlist
     *
     * Arguments:   - playlistId:   id of playlist of interest
     *              - tempPlaylist: boolean indicating if playlist is temporary
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getPlaylistViewUrl: function(playlistId, tempPlaylist) {
        return (this.PLAYLISTVIEW_BASEURL + 
                (tempPlaylist ? this.PLAYLISTVIEW_TEMP_APPEND : '' )+ 
                playlistId + "/");
    },
    
    
    /* Description: Generate the absolute URL to view a particular persistent 
     *              playlist, i.e. playlist owned by authenticated user.
     *
     * Arguments:   - playlistId:   id of playlist of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getPlaylistViewFullUrl: function(playlistId) {
        return (this.BASEURL + this.getPlaylistViewUrl(playlistId));
    },
    
    
    /* Description: Share a url on Facebook with a given title.
     *
     * Arguments:   - url:   URL to share
     *              - title: title to use when sharing
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    facebookShare: function(url, title) {
        var location = "https://www.facebook.com/sharer.php?u="+
            encodeURIComponent(url) + "&t" + encodeURIComponent(title);
        window.open(location, "_blank");
    },
    
    
    /* Description: Share a url on Twitter with a given title.
     *
     * Arguments:   - url:   URL to share
     *              - title: title to use when sharing
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    twitterShare: function(url, title) {
        var location = "http://twitter.com/share?text="+
            encodeURIComponent("#np " + title.substring(0,90)) +
            "&via=noddymix&url=" + encodeURIComponent(url);
        window.open (location, "_blank");
    },
    
    
    /* Description: Show a load mask as a way of informing the user that app is
     *              working on something.
     *
     * Arguments:   - msg: [optional] message to use in the load mask. 
     *                     Defaults to "Loading..."
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showLoadMask: function(msg) {
        msg = msg || "Loading...";
        Ext.Viewport.mask({xtype: 'loadmask', message: msg});
    },
    
    
    /* Description: hide load mask
     *
     * Arguments:   - msg: message to use in the load mask
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    hideLoadMask: function() {
        Ext.Viewport.unmask();
    },
    
    
    /* Description: Generate relative URL path to view a particular user
     *
     * Arguments:   - userId: Id of user of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getUserViewUrl: function(userId) {
        return (this.USERVIEW_BASEURL + userId + "/");
    },
    
    
    /* Description: Generate relative URL path to view playlists owned by a
     *              particular user.
     *
     * Arguments:   - userId: Id of user of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getUserPlaylistsUrl: function(userId) {
        return (this.getUserViewUrl(userId) +this.USERVIEW_PLAYLISTS_APPENDURL);
    },
    
    
    /* Description: Generate relative URL path to view followers of a
     *              particular user.
     *
     * Arguments:   - userId: Id of user of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getUserFollowersUrl: function(userId) {
        return (this.getUserViewUrl(userId) +this.USERVIEW_FOLLOWERS_APPENDURL);
    },
    
    
    /* Description: Generate relative URL path to view followings of a
     *              particular user.
     *
     * Arguments:   - userId: Id of user of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getUserFollowingUrl: function(userId) {
        return (this.getUserViewUrl(userId) +this.USERVIEW_FOLLOWING_APPENDURL);
    },
    
    
    /* Description: Generate relative URL path to request a `follow` action on
     *              a particular user.
     *
     * Arguments:   - userId: Id of user of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getUserFollowUrl: function(userId) {
        return (this.getUserViewUrl(userId) +this.USERVIEW_FOLLOW_APPENDURL);
    },
    
    
    /* Description: Generate relative URL path to request an `unfollow` action
     *              on a particular user.
     *
     * Arguments:   - userId: Id of user of interest
     * Return:      URL string
     *
     * Author:      Nnoduka Eruchalu
     */
    getUserUnfollowUrl: function(userId) {
        return (this.getUserViewUrl(userId) +this.USERVIEW_UNFOLLOW_APPENDURL);
    },
    
    
    /* Description: Get the value of a URL parameter
     *
     * Arguments:   - url: url of interest 
     *              - name: parameter name
     * Return:      value string
     *
     * Author:      Nnoduka Eruchalu
     */
    getURLParameter: function(url, name) {
        return decodeURIComponent(
            (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,""])[1]
        );
    },
    
    
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
    getURLRelPath: function(url) {
        // handle undefined/null/NaN/0/false. 
        // Note that this truth check also catches empty string ("") but that's
        // okay because we use that as the default value
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
});