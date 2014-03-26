/*
 * Description:
 *   This controller is for the song views
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.Song', {
    extend: 'Ext.app.Controller',
    
    requires: [
        'NoddyMix.view.song.Menu'
    ],
    
    config: {
        refs: {
            songsList:'songs',
            songDetail:'songDetail',
            audioTitleBar:'audiotitlebar',
            songDetailTitleBar: 'songDetail #titlebar',
            songDetailBackButton:'songDetail #backButton',
            songDetailMenuButton:'songDetail #menuButton',
            menuList: 'songmenu list'
        },
        control: {
            songsList: {
                fetchfirst:'fetchfirst',
                fetchnext:'fetchnext',
                disclose:'deleteSong'
            },
            
            audioTitleBar: {
                titlebartap:'showSongDetail'
            },
            
            songDetailBackButton: {
                tap: 'showSongList'
            },
            
            songDetailMenuButton: {
                tap: 'showSongMenu'
            },
            
            menuList: {
                itemtap: 'tappedSongMenuItem'
            }
        }
    }, // end config
    
    launch: function(app) {
        this.mainController = app.getController('Main');
        this.audioController = app.getController('Audio');
        this.utilsController = app.getController('Utils');
        this.playlistController = app.getController('Playlist');
        
        Ext.getStore('Songs').on({
            scope:this,
            load:this.onStoreLoad
        });
        Ext.getStore('SongsQueue').on({
            scope:this,
            load:this.onStoreLoad
        });
        
        this.songmenu = Ext.create('NoddyMix.view.song.Menu');
        // needs to be under viewport to call show() as showBy() isn't reliable
        Ext.Viewport.add(this.songmenu); 
        
        this.songmenuList = this.songmenu.getAt(0);
        // song menu data
        this.songmenuData = [
            {title:'Add to Playlist', iconCls:'add-to-list',
             id:'add-to-playlist'},
            {title: 'Share', iconCls:'link', id:'share-song'}
        ];
        
        // share sub-menu data
        this.songmenuShareData = [
            {title: 'Facebook', iconCls:'facebook', id:'facebook'},
            {title: 'Twitter', iconCls:'twitter', id:'twitter'}
        ];
    },
    
    
    /* Description: Reload first page
     *
     * Arguments:   - plugin: Extended PullRefresh plugin
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    fetchfirst:function(plugin) {
        var store = this.getSongsList().getStore();
        var url = store.getProxy().getUrl();
        this.mainController.plGetSongs(url, 1);
                
        plugin.setViewState('loaded');
        if (plugin.getAutoSnapBack()) {
            plugin.snapBack();
        }
    },
    
    
    /* Description: Load next page
     *
     * Arguments:   - plugin: Extended ListPaging plugin
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    fetchnext:function(plugin) {
        plugin.setLoading(true);
        
        var store = this.getSongsList().getStore();
        var url = store.getProxy().getUrl();
        this.mainController.plGetSongs(url, store.currentPage+1);
        
        plugin.setLoading(false);
        
    },
    
    
    /* Description: Processing operations whenever records have been loaded into
     *              the Songs Store.
     *              - check if to show button to load more songs
     *              - initiailize Song Card and audio player.
     *
     * Arguments:   - store:      (Ext.data.Store) Playlists Store
     *              - records:    (Ext.data.Model[]) an array of records
     *              - successful: (Boolean) true if operation was successful
     *              - operation:  (Ext.data.Operation) associated operation
     *              - eOpts:      (Object) options object passed to Listener
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    onStoreLoad:function(store, records, successful, operation, eOpts) {
        Ext.Viewport.unmask(); // done with loading mask
        
        // can load more unless we have gotten all music available,
        var results = Ext.decode(operation.getResponse().responseText); 
        
        if (results.next_page > 0) {
            this.mainController.songcard.removeCls('dont-load-more');
            this.mainController.playlists[
                this.mainController.playlists.visibleIdx].dontLoadMore = false;
        } else {
            this.mainController.songcard.addCls('dont-load-more');
            this.mainController.playlists[
                this.mainController.playlists.visibleIdx].dontLoadMore = true;
        }
        
        // in the event that a new page was pulled when there were no
        // more pages, the store's current page will be wrong, and as such
        // the rendered indices would be off too. Fix that and refresh
        // rendered list.
        // *** this shouldn't happen anyways.
        if(store.currentPage != parseInt(results.curr_page)) {
            store.currentPage = parseInt(results.curr_page);
            this.getSongsList().refresh();
        }
        
        this.audioController.initSongCard(records);
    },
    
    
    /* Description: Show container with a song's details: large poster, title,
     *              artist and dedicated audio controls.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSongDetail: function() {
        var container = this.mainController.songcard.getParent().getParent();
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#songdetailcontainer');
        
        // for some reason, if the title is long when going to this panel, 
        // it doesn't render right, so reset it 
        this.resetTitleBarTitle(this.getSongDetailTitleBar());
    },
    
    
    /* Description: Show container with list of songs.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSongList: function() {
        var container = this.mainController.songcard.getParent().getParent();
        container.getLayout().setAnimation({type:'slide', direction:'right'});
        container.setActiveItem('#songlistcontainer');
        
        // for some reason, if the title is long when going to this panel, 
        // it doesn't render right, so reset it 
        this.resetTitleBarTitle(this.getAudioTitleBar());
    },
    
    
    /* Description: Set a titlebar's title to its current title. 
     *              This might seem  odd but it comes in handy because if the
     *              titlebar's title is too long when activating the parent 
     *              container; In this case the titlebar's title doesn't render
     *              properly until it has been reset.
     *              
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    resetTitleBarTitle: function (titlebar) {
        // if titlebar's title is too long when activating parent container, it
        // doesnt render right, so reset it
        var title = titlebar.getTitle();
        titlebar.setTitle('');
        titlebar.setTitle(title);
    },
    
    
    /* Description: Show song titlebar's static menu
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSongMenu: function() {
        this.songmenuList.setStore('MenuItems');
        this.songmenuList.getStore().setData(this.songmenuData);
        this.songmenuList.setScrollable(false);
        this.songmenu.setHeight(41*this.songmenuData.length + 6);
        this.songmenu.show();//.showBy(this.getSongDetailMenuButton());
    },
    
    
    /* Description: Get currently selected/playing song record in Songs Store
     *
     * Arguments:   None
     * Return:      Record from Songs Store
     *
     * Author:      Nnoduka Eruchalu
     */
    getCurrentSong: function() {
        return (this.mainController.playlists[
            this.mainController.playlists.activeIdx]
                .store.getAt(this.audioController.index).data);
    },
    
    
    /* Description: Delete a song row/record from a given playlist
     *
     * Arguments:   - songList: (Ext.dataview.DataView) list of song items
     *              - record:   record associated with song to be deleted
     *              - target:   (HTMLElement) The element to be deleted
     *              - index:    (Number) index of the song to be deleted
     *              - event:    The event object
     *              - eOpts:    options object passed to Listener.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    deleteSong: function(songsList, record, target, index, event, eOpts) {
        var playlistStore = this.playlistController.getPlaylistsList()
            .getStore();
        var playlist = playlistStore.getAt(this.playlistController.index);
        var url = this.utilsController.getPlaylistViewUrl(
            playlist.data.id, !this.mainController.authenticated);
        
        var controller = this;
        Ext.Ajax.request({
            url:url +this.utilsController.PLAYLISTVIEW_DELETE_SONGS_APPENDURL,
            method:'POST',
            params:{
                'songs[]':[record.data.id],
                csrfmiddlewaretoken:this.mainController.csrftoken},
            success: function(response) {
                // reduce playlist's song count
                playlist.set('num_songs', (playlist.get('num_songs')-1))
                
                // if visible playlist is active playlist, and audio being
                // deleted is currently playing, pause it first
                if ((controller.mainController.playlists.visibleIdx ==
                     controller.mainController.playlists.activeIdx) && 
                    (index == controller.audioController.index)) {
                    controller.audioController.pause();
                }
                
                // delete record
                var store = controller.getSongsList().getStore();
                store.remove(record);
                
                // if visible playlist is active playlist, index and audio
                // playing might have to be updated
                if (controller.mainController.playlists.visibleIdx ==
                    controller.mainController.playlists.activeIdx) {
                    
                    // if there are still songs left on playlist
                    if (store.getCount()) {
                        
                        // if deleted song is currently playing 
                        //   if current index is less than song list length
                        //   then leave current index as is [it now points at
                        //   next song in playlist]. However if current index is
                        //   greater than or equal to song list length, update 
                        //   it to be the last song in playlist.
                        if (index == controller.audioController.index) {
                            controller.audioController.index = 
                                (index < store.getCount()) ?
                                controller.audioController.index :
                                (store.getCount() - 1);
                            controller.audioController.setSong();
                                                        
                            // if deleted song wasn't currently playing and is
                            // at lower index than current, decrement current
                            // index to account for a change in list size.
                        } else if (index < controller.audioController.index) {
                            controller.audioController.index -= 1;
                        }
                        
                        // there are no songs left on the playlist
                    } else {
                        // hide song's list and show no song's message
                        controller.audioController.hideSongsList();
                        // also clear out song details
                        var no_song = {
                            'title':'No Title',
                            'artist':'No Artist',
                            'poster':'img/art_mobile_thumbnail.jpg',
                            'poster_display':'img/art_display.jpg',
                            'mp3':false
                        }
                        controller.audioController.loadSong(no_song);
                    }                        
                    
                }
            }
        });
        
        // prevent song item tap event
        event.stopEvent();
    },
    
    
    /* Description: On song menu item tap, get current song and perform
     *              menu operation based on tapped item.
     *
     * Arguments:   - menuList: (Ext.dataview.DataView) list of menu items
     *              - index:    (Number) index of the item tapped
     *              - target:   The element/DataItem tapped
     *              - record:   record associated with tapped item
     *              - e:        The event object
     *              - eOpts:    options object passed to Listener.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    tappedSongMenuItem: function(menulist, index, target, record, e, eOpts) {
        this.songmenu.hide();
        var song = this.getCurrentSong();
        // get song url for sharing/copying
        var songUrl = this.utilsController.getSongViewFullUrl(song.id);
        
        // `main` menu
        if (record.data.id == "add-to-playlist") {
            // show `playlists` sub-menu so can pick which playlist to add to
            this.songmenuList.setStore('UserPlaylists');
            
            var num_playlists = this.songmenuList.getStore().getCount();
            if (num_playlists <= 4) {
                // if few playlists, then no need for menu to scroll
                this.songmenu.setHeight(num_playlists*41 + 6);
                this.songmenuList.setScrollable(false);
            } else {
                // if too many playlists, then create a scrollable menu
                this.songmenu.setHeight(180);
                this.songmenuList.setScrollable(true);
            }
            
            this.songmenu.show();//.showBy(this.getSongDetailMenuButton());
            
        } else if (record.data.id == "share-song") {
            // show social media share menu, the `share` sub-menu
            this.songmenuList.getStore().setData(this.songmenuShareData);
            this.songmenuList.setScrollable(false);
            this.songmenu.setHeight(41*this.songmenuShareData.length + 6);
            this.songmenu.show();//.showBy(this.getSongDetailMenuButton());
        
            
            // `share` sub-menu
        } else if (record.data.id == "facebook") { // share on facebook
            this.utilsController.facebookShare(songUrl, song.title);
            
        } else if (record.data.id == "twitter") { // share on twitter
            this.utilsController.twitterShare(
                songUrl, (song.title+'-'+song.artist));
            
            
            // `playlists` sub-menu
        } else if (typeof record.data.id === "number") {
            // get playlist id and add song id of song to be added
            var url = this.utilsController.getPlaylistViewUrl(
                record.data.id, !this.mainController.authenticated);
            
            // server expects you to submit a list of songs to add, so just
            // send over a single-element list. Also when jquery sends a list
            // via ajax it appends a set of square braces to the key, so mimic
            // that here as server expects it. So use `songs[]`.
            Ext.Ajax.request({
                url:url +this.utilsController.PLAYLISTVIEW_ADD_SONGS_APPENDURL,
                method:'POST',
                params:{
                    'songs[]':[song.id],
                     csrfmiddlewaretoken:this.mainController.csrftoken},
                 success: function(response) {
                     var result =Ext.decode(response.responseText || '{}');
                     
                     //update playlist song count if it exists
                     var playlistsStore = Ext.getStore('Playlists');
                     var plist = playlistsStore.getById(record.data.id);
                     if (plist) {
                         plist.set('num_songs', result.num_songs);
                     }
                 }
             });
        }
        
        
    }
});