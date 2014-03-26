/*
 * Description:
 *   This controller for the Playlist Views.
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.Playlist', {
    extend: 'Ext.app.Controller',
    
    requires: [
        'NoddyMix.view.playlist.Menu'
    ],
    
    config: {
        refs: {
            playlistsList:'playlists',
            playlistsNone:'playlistCard #no-playlists',
            playlistsLoginPrompt:'playlistCard #login-instruction',
            playlistsBackButton:'playlisttitlebar #backButton',
            playlistsMenuButton:'playlisttitlebar #menuButton',
            playlistsEditDoneButton:'playlisttitlebar #editDoneButton',
            playlistTitleBar:'playlisttitlebar',
            menuList: 'playlistmenu list',
            playlistCreateButton:'titlebar #playlistCreateButton'
        },
        control: {
            playlistsList: {
                fetchfirst:'fetchfirst',
                fetchnext:'fetchnext',
                itemtap:'tappedPlaylist'
            },
            playlistsBackButton: {
                tap:'showPlaylistsList'
            },
            playlistCreateButton: {
                tap: 'playlistCreate'
            },
            playlistsMenuButton: {
                tap:'showPlaylistMenu'
            },
            playlistsEditDoneButton: {
                tap:'endEdit'
            },
            menuList: {
                itemtap:'tappedPlaylistMenuItem'
            }, 
            playlistsLoginPrompt: {
                containerTap:'showLoginPage'
            }
        }
    }, // end config
    
    // called after the Application is launched.
    launch: function(app) {
        this.mainController = app.getController('Main');
        this.utilsController = app.getController('Utils');
        
        Ext.getStore('Playlists').on({
            scope:this,
            load:this.onStoreLoad
        });
                
        // playlist menu data
        this.playlistmenuData = [
            {title: 'Subscribe',iconCls: 'checkmark',id:'subscribe'},
            {title: 'Unsubscribe',iconCls: 'cancel',id:'unsubscribe'},
            {title: 'Login to Favorite', iconCls:'checkmark', id:'login-to-sub'},
            
            {title: 'Owner', iconCls:'smiley', id:'owner'},
            {title: 'Login to Save', iconCls:'smiley', id:'login-to-save'},
            {title: 'Share', iconCls:'link', id:'share'},
            
            {title: 'Make Private',iconCls: 'locked',id:'make-private'},
            {title: 'Make Public',iconCls: 'unlocked',id:'make-public'},
            {title: 'Rename',iconCls: 'text',id:'rename'},
            {title: 'Edit Songs',iconCls: 'pencil',id:'edit'},
            {title: 'Delete', iconCls:'blocked', id:'delete'}
        ];
        this.playlistmenuDataLookup = {};
        for (var i = 0, len = this.playlistmenuData.length; i < len; i++) {
            this.playlistmenuDataLookup[this.playlistmenuData[i].id] = 
                this.playlistmenuData[i];
        }
        
        // share sub-menu data
        this.playlistmenuShareData = [
            {title: 'Facebook', iconCls:'facebook', id:'facebook'},
            {title: 'Twitter', iconCls:'twitter', id:'twitter'}
        ];
                
        this.index = 0; // index of currently selected playlist item
        
        this.playlistmenu = Ext.create('NoddyMix.view.playlist.Menu');
        // needs to be under viewport to call show();
        Ext.Viewport.add(this.playlistmenu); 
        
        this.playlistmenuList = this.playlistmenu.getAt(0);
                
    },
    
    
    /* Description: Reload first page
     *
     * Arguments:   - plugin: Extended PullRefresh plugin
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    fetchfirst:function(plugin) {
        var store = this.getPlaylistsList().getStore();
        var url = store.getProxy().getUrl();
        this.mainController.getPlaylists(url, 1);
        
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
        
        var store = this.getPlaylistsList().getStore();
        var url = store.getProxy().getUrl();
        this.mainController.getPlaylists(url, store.currentPage+1);
        
        plugin.setLoading(false);
        
    },
    
    
    /* Description: Processing operations whenever records have been loaded into
     *              the Playlists Store.
     *              - check if to show button to load more playlists
     *              - if there are playlists to be displayed show them in a 
     *                list, else show a message indicating no playlists.
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
        this.utilsController.hideLoadMask(); // done with loading mask
        
        // can load more unless we have gotten all playlists available,
        var results = Ext.decode(operation.getResponse().responseText); 
        
        if (results.next_page > 0) {
            this.mainController.playlistcard.removeCls('dont-load-more');
                        
        } else {
            this.mainController.playlistcard.addCls('dont-load-more');
        }
        
        // in the event that a new page was pulled when there were no
        // more pages, the store's current page will be wrong, and as such
        // the rendered indices would be off too. Fix that and refresh
        // rendered list.
        // *** this shouldn't happen anyways.
        if(store.currentPage != parseInt(results.curr_page)) {
            store.currentPage = parseInt(results.curr_page);
            this.getPlaylistsList().refresh();
        }
                
        if(records.length > 0) {
            // if playlists loaded, show the list container
            this.getPlaylistsList().show();
            this.getPlaylistsNone().hide();
        } else {
            // if nothing loaded show the no-playlists message container
            this.getPlaylistsList().hide();
            this.getPlaylistsNone().show();
        }
    },
    
    
    /* Description: Update playlist titlebar with playlist name and owner name.
     *
     * Arguments:   - record: Playlist store record.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    updatePlaylistTitleBar: function (record) {
        var ownerText = (record.data.owner_id !== null) ? record.data.owner : 
            'Anonymous (You)';
        this.getPlaylistTitleBar().setTitle(
            '<p class="title ellipsis">'+record.data.title +
                '</p><p class="artist ellipsis">'+ownerText+'</p>');
    },
    
    
    /* Description: On playlist tap (within list of playlists), load up
     *              playlist's songs, set songlist container to be active
     *              and update playlist's titlebar appropriately.
     *
     * Arguments:   - playlistsList: (Ext.dataview.DataView) list of playlists
     *              - index:         (Number) index of the item tapped
     *              - target:        The element/DataItem tapped
     *              - record:        record associated with tapped item
     *              - e:             The event object
     *              - eOpts:         options object passed to Listener.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    tappedPlaylist: function(playlistsList, index, target, record, e, eOpts) {
        this.utilsController.showLoadMask();
        
        // on playlist tap, load up playlist's songs
        var container =this.mainController.playlistcard.getParent().getParent();
        var tempPlaylist = (record.data.owner_id === null) ? true : false;
        var url = this.utilsController.getPlaylistViewUrl(
            record.data.id, tempPlaylist);
        
        this.mainController.plGetSongs(url);
        
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#songlistcontainer');
        
        // set playlist's titlebar appropriately
        this.updatePlaylistTitleBar(record);
                        
        // update selected item index
        this.index = index;
    },
    
    
    /* Description: Show container with list of playlists.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showPlaylistsList: function() {
        var container = this.mainController.songcard.getParent().getParent();
        container.getLayout().setAnimation({type:'slide', direction:'right'});
        container.setActiveItem('#playlistscontainer');
        
        // incase the last playlist was in edit mode, stop that
        this.endEdit();
    },
    
    
    /* Description: Show app's login page.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showLoginPage: function() {
        this.mainController.slideNavList.select(
            this.mainController.slideNavItemId['login']);
    },
    
    
    /* Description: Create a playlist, perpetual or temporary depending on if 
     *              user is authenticated or not. Created playlist will be added
     *              to Playlists Store.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    playlistCreate: function() {
        // is this a temporary playlist?
        var tempPlaylist = !this.mainController.authenticated;
        var url = this.utilsController.PLAYLISTVIEW_BASEURL + 
            (tempPlaylist ? this.utilsController.PLAYLISTVIEW_TEMP_APPEND : '')+
            this.utilsController.PLAYLISTVIEW_NEW_APPENDURL;
                
        var controller = this;
        Ext.Msg.prompt(
            "Create", 
            "Please enter new playlist name",
            function(buttonId, value, opt) {
                var newPlaylistName = value.trim();
                
                // only create a new playlist if a name was provided
                if(newPlaylistName) {
                    controller.utilsController.showLoadMask('Creating...');
                    Ext.Ajax.request({
                        url:url,
                        method:'POST',
                        params:{csrfmiddlewaretoken:
                                controller.mainController.csrftoken,
                                title:newPlaylistName},
                        success: function(response) {
                            var data =Ext.decode(response.responseText || '{}');
                            // save playlist data in appropriate stores
                            controller.getPlaylistsList().getStore()
                                .insert(0, data);
                            Ext.getStore('UserPlaylists').insert(0, data);
                            
                            // and ensure playlist lists show
                            controller.getPlaylistsNone().hide();
                            controller.getPlaylistsList().show();
                            
                            // done with load mask
                            controller.utilsController.hideLoadMask();
                        },
                        failure: function() {
                            // done with load mask
                            controller.utilsController.hideLoadMask();
                        }
                    });
                }
            }
        );
    },
    
    
    /* Description: Show playlist titlebar's menu. The menu buttons depend on
     *              - the user's authentication status
     *              - user's subscription to playlist
     *              - playlist public/private status
     *              - if user owns playlist, then can rename, edit, delete it.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showPlaylistMenu: function() {
        // get current playlist item
        var currPlaylist = this.getPlaylistsList().getStore()
            .getAt(this.index).data;
        var onOwnersPlaylist = false;
                
        // now select what data items to show:
        var data = [];
        // most playlist actions require authentication
        if (this.mainController.authenticated) {
            
            if (this.mainController.user_id != currPlaylist.owner_id) {
                // if user doesnt own playlist then either subscribe/unsubscribe
                if (currPlaylist.subscribed) {
                    data.push(this.playlistmenuDataLookup["unsubscribe"]);
                } else {
                    data.push(this.playlistmenuDataLookup["subscribe"]);
                }

            } else {
                // if playlist is public, provide option to make private, and
                // vice-versa
                if (currPlaylist.is_public) {
                    data.push(this.playlistmenuDataLookup["make-private"]);
                } else {
                    data.push(this.playlistmenuDataLookup["make-public"]);
                }
                
                // if user owns playlist then show rename and delete options
                data.push(this.playlistmenuDataLookup["rename"]);
                data.push(this.playlistmenuDataLookup["edit"]);
                data.push(this.playlistmenuDataLookup["delete"]);
                onOwnersPlaylist = true;
            }
            
        } else {
            // if user is logged out ...
            if (currPlaylist.owner_id === null) {
                // and is on a temp playlist, prompt to login and save
                data.push(this.playlistmenuDataLookup["login-to-save"]);
                // user cleary on a personal playlist so show rename and delete
                data.push(this.playlistmenuDataLookup["rename"]);
                data.push(this.playlistmenuDataLookup["edit"]);
                data.push(this.playlistmenuDataLookup["delete"]);
                
            } else {
                //  and on some else's playlist, prompt to login and subscribe
                data.push(this.playlistmenuDataLookup["login-to-sub"]);
            }
        }
        
        
        // if playlist is not temporary, then can possibly link to owner's
        // page and share playlist.
        if (currPlaylist.owner_id !== null) {
            // always provide an option to go to playlist owner's page if owner
            // is not current use
            if (!onOwnersPlaylist) {
                // first update playlistmenuData with name of owner
                this.playlistmenuDataLookup["owner"].title = currPlaylist.owner;
                data.push(this.playlistmenuDataLookup["owner"]);
            }
            
            // share playlist
            data.push(this.playlistmenuDataLookup["share"]);
        }
        
        // finally setup and show playlist menu
        this.playlistmenuList.setStore('MenuItems');
        this.playlistmenuList.getStore().setData(data);
        this.playlistmenuList.setScrollable(false);
        this.playlistmenu.setHeight(41*data.length + 6);
        // showBy doesn't always work and it messes up a lot
        this.playlistmenu.show();//.showBy(this.getPlaylistsMenuButton());
    },
    
    
    /* Description: Start playlist editing mode:
     *              - show delete buttons beside each song by adding a CSS class
     *              - replace playlist's menu with Edit Done button.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    startEdit: function() {
        this.mainController.songcard.addCls('edit');
        this.getPlaylistsMenuButton().hide();
        this.getPlaylistsEditDoneButton().show();
    },
    
    
    /* Description: End playlist editing mode.
     *              - remove delete buttons beside each song by removing a CSS 
     *                class
     *              - replace playlist's Edit Done button with the playlist menu
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    endEdit: function() {
        this.mainController.songcard.removeCls('edit');
        this.getPlaylistsEditDoneButton().hide();
        this.getPlaylistsMenuButton().show();
    },
    
    
    /* Description: On playlist menu item tap, get current playlist and perform
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
    tappedPlaylistMenuItem:function(menulist, index, target, record, e, eOpts) {
        this.playlistmenu.hide();
        
        // get current playlist item
        var playlistStore = this.getPlaylistsList().getStore();
        var playlist = playlistStore.getAt(this.index);
        var url = this.utilsController.getPlaylistViewUrl(playlist.data.id);
        var url_temp = this.utilsController.getPlaylistViewUrl(
            playlist.data.id, !this.mainController.authenticated);
        
        // get playlist url for sharing
        var playlistUrl = this.utilsController.getPlaylistViewFullUrl(
            playlist.data.id);
                
               
        // `main` menu
        if (record.data.id == "unsubscribe") {
            // unsubscribe authenticated user from playlist
            Ext.Ajax.request({
                url:url+this.utilsController.PLAYLISTVIEW_UNSUBSCRIBE_APPENDURL,
                method:'POST',
                params:{csrfmiddlewaretoken:this.mainController.csrftoken},
                success: function(response) {
                    playlist.set('subscribed', false);
                }
            });
                        
        } else if (record.data.id == "subscribe") {
            // subscribe user to playlist
            Ext.Ajax.request({
                url:url +this.utilsController.PLAYLISTVIEW_SUBSCRIBE_APPENDURL,
                method:'POST',
                params:{csrfmiddlewaretoken:this.mainController.csrftoken},
                success: function(response) {
                    playlist.set('subscribed', true);
                }
            });
            
        } else if (record.data.id == "make-private") {
            // make playlist private
            Ext.Ajax.request({
                url:url + this.utilsController.PLAYLISTVIEW_LOCK_APPENDURL,
                method:'POST',
                params:{csrfmiddlewaretoken:this.mainController.csrftoken},
                success: function(response) {
                    playlist.set('is_public', false);
                }
            });
        
        } else if (record.data.id == "make-public") {  
            // make playlist public
            Ext.Ajax.request({
                url:url + this.utilsController.PLAYLISTVIEW_UNLOCK_APPENDURL,
                method:'POST',
                params:{csrfmiddlewaretoken:this.mainController.csrftoken},
                success: function(response) {
                    playlist.set('is_public', true);
                }
            });
            
        } else if (record.data.id == "rename") {
            // show message box to rename playlist
            var controller = this;
            Ext.Msg.prompt(
                "Rename", 
                "Please enter new playlist name",
                function(buttonId, value, opt) {
                    var newPlaylistName = value.trim();
                    if (newPlaylistName) {           
                        controller.utilsController.showLoadMask('Renaming...');
                        Ext.Ajax.request({
                            url:url_temp + controller.utilsController.PLAYLISTVIEW_RENAME_APPENDURL,
                            method:'POST',
                            params:{
                                title:newPlaylistName,
                                csrfmiddlewaretoken:
                                controller.mainController.csrftoken},
                            success: function(response) {
                                var data =Ext.decode(
                                    response.responseText || '{}');
                                // update playlist record name with actual db
                                // value
                                playlist.set('title', data.title);
                                // update current playlist page title
                                controller.updatePlaylistTitleBar(playlist);
                                
                                // update userPlaylist store name too!
                                Ext.getStore('UserPlaylists')
                                    .getById(playlist.data.id)
                                    .set('title', data.title);
                                
                                // done with load mask
                                controller.utilsController.hideLoadMask();
                            }, 
                            failure: function() {
                                // done with load mask
                                controller.utilsController.hideLoadMask();
                            }
                        });
                    }
                }
            );
            
        } else if (record.data.id == "edit") {
            // start editing playlist
            this.startEdit();
            
        } else if (record.data.id == "delete") {
            // delete playlist
            var controller = this;
            Ext.Msg.confirm(
                "Confirmation", 
                'Are you sure you want to delete "'+playlist.data.title+'"?', 
                function(buttonId, value, opt) {
                    if (buttonId == "yes") {
                        // if delete is confirmed
                        Ext.Ajax.request({
                            url:url_temp + controller.utilsController.PLAYLISTVIEW_DELETE_APPENDURL,
                            method:'POST',
                            params:{csrfmiddlewaretoken:
                                    controller.mainController.csrftoken},
                            success: function(response) {
                                // delete playlist record from stores
                                playlistStore.removeAt(controller.index);
                                
                                var uPlistRec = Ext.getStore('UserPlaylists')
                                    .getById(playlist.data.id);
                                Ext.getStore('UserPlaylists').remove(uPlistRec);
                                
                                // if playlist index is less than playlist store
                                // count then leave index as is [it now points 
                                // at next playlist]. However if current index 
                                // is greater than or equal to play list length,
                                // update it to be the last playlist in store.
                                controller.index = (controller.index < 
                                                    playlistStore.getCount()) ?
                                    controller.index : 
                                    (playlistStore.getCount() - 1);
                                // if < 0 set to 0
                                controller.index = (controller.index < 0) ? 0 :
                                    controller.index;
                                
                                // if there is now no playlist on playlists page
                                // show appropriate messaging
                                if (playlistStore.getCount() == 0) {
                                    controller.getPlaylistsNone().show();
                                    controller.getPlaylistsList().hide();
                                }
                                
                                // now show playlists list
                                controller.showPlaylistsList();
                            }
                        });
                    }
                });
            
        } else if (record.data.id == "owner") {
            // go to user page of playlist owner.
            this.mainController.showUserPage(
                playlist.data.owner_id, playlist.data.owner);
                        
        } else if ((record.data.id == "login-to-save") || 
                   (record.data.id == "login-to-sub")) {
            // user isn't authenticated but wants to save/subscribe to playlist
            // so take to login page
            this.showLoginPage();
            
        } else if (record.data.id == "share") {
            // show social media share menu, the `share` sub-menu
            this.playlistmenuList.getStore()
                .setData(this.playlistmenuShareData);
            this.playlistmenu.setHeight(41*this.playlistmenuShareData.length+6);
            this.playlistmenu.show();
        
            
            // `share` sub-menu
        } else if (record.data.id == "facebook") { // share on facebook
            this.utilsController.facebookShare(
                playlistUrl, playlist.data.title);
                        
        } else if (record.data.id == "twitter") { // share on twitter
            this.utilsController.twitterShare(
                playlistUrl, (playlist.data.title+'-'+playlist.data.owner));
                       
        }
        
        
    }
});