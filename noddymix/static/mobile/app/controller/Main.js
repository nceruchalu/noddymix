/*
 * Description:
 *   This controller for the Main View.
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.Main', {
    extend: 'Ext.app.Controller',
    requires: [
        'NoddyMix.view.song.Card',
        'NoddyMix.view.song.Detail',
        'NoddyMix.view.playlist.Card',
        'NoddyMix.view.playlist.TitleBar',
        'NoddyMix.view.user.Card',
        'Ext.data.ArrayStore',
        'Ext.data.reader.Array'
    ],
    
    config: {
        refs: {
            slideNav: 'slidenavigationview',
            newReleasesContainer: '#newReleasesContainer',
            heavyRotationContainer: '#heavyRotationContainer',
            topPlaylistsContainer: '#topPlaylistsContainer',
            favoritesContainer: '#favoritesContainer',
            playlistsContainer: '#userPlaylistsContainer',
            historyContainer: 'slidenavigationview container[title="History"]',
            queueContainer: 'slidenavigationview container[title="Queue"]',
            settingsContainer: '#settingsContainer',
            profileContainer: '#profileContainer',
            hiddenUserContainer: '#hiddenUserContainer',
            hiddenSongContainer: '#hiddenSongContainer',
            hiddenPlaylistContainer: '#hiddenPlaylistContainer',
            hiddenSearchContainer: '#hiddenSearchContainer',
            hiddenInitContainer: '#hiddenInitContainer'
        },
        
        control: {
            slideNav: {
                open: function(nav, position, duration) {
                    // navigation menu opened
                },

                close: function(nav, position, duration) {
                    // navigation menu closed
                },
                
                select: function(nav, item, index) {
                   // navigation item selected
                },
                
                opened: function(nav) {
                    // container opened
                },
                
                closed: function(nav) {
                    // container closed
                },

                slideend: function(nav) {
                    // container slide end
                },

                slidestart: function(nav) {
                    // container slide start
                },

                dragstart: function(nav) {
                    // container drag start
                },

                dragend: function(nav) {
                    // container drag end
                }
            }, // end slideNav
            
            /**
             * The 'activate' and 'deactivate' events fires on the containers of
             * the slide navigation items, not the child elements 
             */
            newReleasesContainer: {
                deactivate: 'deactivateSongsPage',
                activate: 'activateNewReleases'
            },
            
            heavyRotationContainer: {
                deactivate: 'deactivateSongsPage',
                activate: 'activateHeavyRotation'
            },
            
            topPlaylistsContainer: {
                deactivate: 'deactivatePlaylistsPage',
                activate: 'activateTopPlaylists'
            },
            
            favoritesContainer: {
                deactivate: 'deactivateFavorites',
                activate: 'activateFavorites'
            },
            
            playlistsContainer: {
                deactivate: 'deactivatePlaylists',
                activate: 'activatePlaylists'
            },
            
            historyContainer: {
                deactivate: 'deactivateSongsPage',
                activate: 'activateHistory'
            },
            
            queueContainer: {
                deactivate: 'deactivateSongsPage',
                activate: 'activateQueue'
            },
            
            settingsContainer: {
                activate: 'getSettingsData'
            },
            
            profileContainer: {
                deactivate: 'deactivateProfile',
                activate:'activateProfile'
            },
            
            hiddenUserContainer: {
                deactivate: 'deactivateHiddenUser',
                activate:'activateHiddenUser'
            },
            hiddenSongContainer: {
                deactivate: 'deactivateSongsPage',
                activate:'activateHiddenSong'
            },
            hiddenPlaylistContainer: {
                deactivate: 'deactivatePlaylistsPage',
                activate: 'activatePlaylistsPageHelper'
            },
            hiddenSearchContainer: {
                deactivate: 'deactivateHiddenSearch',
                activate:'activateHiddenSearch'
            },
            hiddenInitContainer: {
                activate:'setupApp'
            }
        }
    },
    
    /* Description: Setup for 2 playlists, 1 active and 1 visible. Of course the
     *              same playlist could be both active and visible
     *                - active means currently playing music and controlled by 
     *                  audio element.
     *                - visible means currently displayed in viewport
     *                - activeModified: boolean indicating active queue's 
     *                  contents have been modified since setup
     *
     *              Create instances of containers that are share by many slide
     *              navigation containers.
     *
     *              Initialize object properties representing user, user auth.
     *              and parameters representing user page's being viewed
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    init: function() {
        // setup playlists
        this.playlists = {0:{store:Ext.getStore('Songs'), 
                             dontLoadmore:false}, 
                          1:{store:Ext.getStore('SongsQueue'), 
                             dontLoadMore:false},
                          activeIdx:1, visibleIdx:0, activeModified:false};
        this.initialPageLoad = true;
        
        // create instances of containers that are shared by many slide 
        // navigation containers.
        this.songcard = Ext.create('NoddyMix.view.song.Card');
        this.songdetail = Ext.create('NoddyMix.view.song.Detail');
        this.playlistcard = Ext.create('NoddyMix.view.playlist.Card');
        this.playlisttitlebar = Ext.create('NoddyMix.view.playlist.TitleBar');
        this.usercard = Ext.create('NoddyMix.view.user.Card');
                
        // dont assume user is authenticated until server says so.
        this.authenticated = false;
        this.user_id = false; // id of authenticated user
        
        this.other_user_id = false; // id of user page being viewed
        this.other_user_name = ''; // name of user page being viewed
    },
    
    // called after the Application is launched.
    launch: function(app) {
        // get references to controllers
        this.audioController = app.getController('Audio');
        this.utilsController = app.getController('Utils');
        this.playlistController = app.getController('Playlist');
        this.userController = app.getController('User');
        this.searchController = app.getController('Search');
        
        // Google Analytics Page Tracking
        var _gaq = _gaq || [];
        _gaq.push(['_setAccount', 'UA-31002986-1']);
        _gaq.push(['_trackPageview']);
    },
    
    
    /*
     * Description: Add relevant shared containers to a Songs Page
     *              - song.Card: container with list of songs and associated
     *                audio player controls.
     *              - song.Detail: container with details of song and associated
     *                audio player controls.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateSongsPageHelper: function(container) {
        container.getComponent('songlistcontainer').add(this.songcard);
        container.getComponent('songdetailcontainer').add(this.songdetail);
    },
    
    
    /*
     * Description: Remove shared containers from a Songs Page.
     *              In preparation for the next time this Songs Page is
     *              made active, make the container with songs list first to be
     *              seen.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    deactivateSongsPage: function(container) {
        container.setActiveItem('#songlistcontainer');
        container.getComponent('songlistcontainer').remove(this.songcard,
                                                           false);
        container.getComponent('songdetailcontainer').remove(this.songdetail, 
                                                             false);
    },
    
    
    /*
     * Description: Add relevant shared containers to a Playlists Page.
     *              - playlist.Card: container with list of playlists
     *              - playlist.TitleBar: titlebar of a playlist's info and 
     *                controls.
     *              - song.Card: container with list of songs and associated
     *                audio player controls.
     *              - song.Detail: container with details of song and associated
     *                audio player controls.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activatePlaylistsPageHelper: function(container) {
        container.getComponent('playlistscontainer').add(this.playlistcard);
        container.getComponent('songlistcontainer').add(this.playlisttitlebar);
        container.getComponent('songlistcontainer').add(this.songcard);
        container.getComponent('songdetailcontainer').add(this.songdetail);
    },
    
    
    /*
     * Description: Remove shared containers from a Playlists Page.
     *              In preparation for the next time this Playlists Page is
     *              made active, make the container with list of playlists 
     *              first to be seen.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    deactivatePlaylistsPage: function(container) {
        container.setActiveItem('#playlistscontainer');
        container.getComponent('playlistscontainer').remove(
            this.playlistcard, false);
        container.getComponent('songlistcontainer').remove(
            this.playlisttitlebar, false);
        container.getComponent('songlistcontainer').remove(
            this.songcard, false);
        container.getComponent('songdetailcontainer').remove(
            this.songdetail, false);
    },
    
    
    /*
     * Description: "New Releases" is a Songs Page, so set it up as one. Then
     *              get songs from the "New Releases" URL.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateNewReleases: function(container) {
        this.activateSongsPageHelper(container);
        this.plGetSongs('/');
    },
    
    
    /*
     * Description: "Heavy Rotation" is a Songs Page, so set it up as one. Then 
     *              get songs from the "Heavy Rotation" URL.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateHeavyRotation: function(container, newActiveItem, oldActiveItem) {
        this.activateSongsPageHelper(container);
        this.plGetSongs('/heavy/');
    },
    
    
    /*
     * Description: "Top Playlists" is a Playlists Page, so set it up as one. 
     *              Then get playlists from the "Top Playlists" URL.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateTopPlaylists: function(container) {
        this.activatePlaylistsPageHelper(container);
        this.getPlaylists('/top/');
    },
    
    
    /*
     * Description: "Favorites" is a Playlists Page, so deactivate it as one.
     *              However this page requires login, so ensure the shared 
     *              playlist.Card's login message is hidden in preparation for
     *              the next time this shared container is made active.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    deactivateFavorites: function(container) {
        this.deactivatePlaylistsPage(container);
        // always hide login instructions
        this.playlistcard.getComponent('login-instruction').hide();
    },
    
    
    /*
     * Description: "Favorites" is a Playlists Page, so set it up as one. Then
     *              get playlists from the "Favorites" URL. If current user is
     *              not authenticated, show login instructions.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Assumptions: shared playlist.card's login-instruction is hidden by 
     *              default.
     *
     * Author:      Nnoduka Eruchalu
     */
    activateFavorites: function(container) {
        this.activatePlaylistsPageHelper(container);
        if (!this.authenticated) {
            // if not authenticated then show login instructions
            this.playlistcard.getComponent('login-instruction').show();
        }
        this.getPlaylists('/favorites/');
    },
    
    
    /*
     * Description: "Playlists" is a Playlists Page, so deactivate it as one.
     *              These playlists are owned by the current user and as such
     *              can be edited, so always end editing mode of a playlist's
     *              list of songs.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    deactivatePlaylists: function(container) {
        this.deactivatePlaylistsPage(container);
        this.playlistController.endEdit();
    },
    
    
    /*
     * Description: "Playlists" is a Playlists Page, so set it up as one. Then
     *              get playlists from the "Playlists" URL. 
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activatePlaylists: function(container) {
        this.activatePlaylistsPageHelper(container);
        this.getPlaylists('/playlists/');
    },
    
    
    /*
     * Description: "History" is a Songs Page, so set it up as one. Then 
     *              get songs from the "History" URL.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateHistory: function(container) {
        this.activateSongsPageHelper(container);
        this.plGetSongs('/history/');
    },
    
    
    /*
     * Description: "Queue" is a Songs Page, so set it up as one. The queue of
     *              currently playing songs are contained in the active internal
     *              playlist, so make that visible. Be sure the UI hides the
     *              option to load more queue songs. There is no more to load in
     *              the queue; What you see is what you get.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateQueue: function(container) {
        this.activateSongsPageHelper(container);
        
        this.plActiveIsVisible();
        this.audioController.initSongCard(
            this.playlists[this.playlists.visibleIdx].store.getRange());
        this.songcard.addCls('dont-load-more');
    },
    
    
    /*
     * Description: Get an authenticated user's settings and update the settings
     *              page with the retrieved data.       
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    getSettingsData: function(container) {
        // use load mask to indicate to user that controller is busy.
        this.utilsController.showLoadMask();
        var controller = this;
        Ext.Ajax.request({
            url:'/settings/',
            method:'GET',
            success: function(response) {
                var result = Ext.decode(response.responseText || '{}');
                // update settings page
                container.down("accountsettings").fireEvent(
                    'updateData', result);
                
                // done with load mask
                controller.utilsController.hideLoadMask();
            },
            failure: function() {
                // done with load mask
                controller.utilsController.hideLoadMask();
            }
        });
    },
    
    
    /*
     * Description: Remove shared containers from the authenticated user's
     *              Profile Page.
     *              In preparation for the next time this Profile Page is
     *              made active, make the profile information page first to be
     *              seen.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    deactivateProfile: function(container) {
        container.setActiveItem('#accountprofilecontainer');
        container.getComponent('userlistcontainer').remove(
            this.usercard, false);
    },
    
    
    /*
     * Description: Add relevant shared containers to authenticated user's 
     *              Profile page.
     *              - user.Card: container with list of users.
     *
     *              Then populate profile with user's profile data.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateProfile: function(container) {
        container.getComponent('userlistcontainer').add(this.usercard);
        this.getProfileData(container);
    },
    
    
    /*
     * Description: Remove shared containers from a user's public profile page.
     *              Since a user's public profile page will also contain public
     *              playlists, deactivate this container as a Playlists Page.
     *              In preparation for the next time this hidden User Page is
     *              made active, make the user detail container the first one
     *              that's seen.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    deactivateHiddenUser: function(container) {
        container.getComponent('userlistcontainer').remove(
            this.usercard, false);
        this.deactivatePlaylistsPage(container);
        container.setActiveItem('#userdetailcontainer');
    },
    
    
    /*
     * Description: Add relevant shared containers to a hidden page used for
     *              any user's public profile page (as viewed by others).
     *              - user.Card: container with list of users.
     *
     *              Since a user's public profile page will also contain public
     *              playlists, activate this container as a Playlists Page.
     *             
     *              Then populate user's public profile with user's data.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateHiddenUser: function(container) {
        container.getComponent('userlistcontainer').add(this.usercard);
        this.activatePlaylistsPageHelper(container);
        this.getUserData(container, this.other_user_id);
    },
    
    
    /*
     * Description: The Hidden Song page is used when a user tries to view a 
     *              specific song URL. This is effectively a Songs Page with
     *              just 1 song in the list of songs, so activate this container
     *              as a Songs Page.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateHiddenSong: function(container) {
        this.activateSongsPageHelper(container);
    },
    
    
    /*
     * Description: Remove shared containers from the hidden search results
     *              page. Also set container with list of songs as first to be
     *              seen, in preparation for next time this page is made active.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    deactivateHiddenSearch: function(container) {
        // ensure playlists titlebar becomes visible again
        this.playlisttitlebar.show();
        
        this.deactivatePlaylistsPage(container);
        container.getComponent('userlistcontainer').remove(
             this.usercard, false);
        container.setActiveItem('#songlistcontainer');
    },
    
    
    /*
     * Description: Add relevant shared containers to the hidden Search Results
     *              Page. These shared are those common to Playlist Pages and 
     *              Song Pages. In addition to these is the container with a
     *              list of users (user.List).
     *              Remember that shared controllers used by Songs Pages are a
     *              subset of those used by Playlists Pages.
     *              
     *              The search results will default to showing the song results.
     *              So make the song list container first to be seen and then 
     *              get the songs that are retrieved via this search query.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    activateHiddenSearch: function(container) {
        this.activatePlaylistsPageHelper(container);
        container.getComponent('userlistcontainer').add(this.usercard);
        container.setActiveItem('#songlistcontainer');
        this.searchController.showSongsPageTitleBar();
        
        this.plGetSongs('/search/?q='+this.searchController.query);
    },
    
    
    /*
     * Description: Initialize this mobile web-app.
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    setupApp: function(container) {
        
        // slide navigation dataview object
        this.slideNavList = this.getSlideNav().getAt(0).listItems[0].dataview;
        
        // get indices of slide navigation list elements
        var slideNavListStore = this.slideNavList.getStore();
        this.slideNavItemId = {
            // browse
            'newReleases':slideNavListStore.findExact(
                'id', 'newReleasesContainer'),
            'heavyRotation':slideNavListStore.findExact(
                'id', 'heavyRotationContainer'),
            'topPlaylists':slideNavListStore.findExact(
                'id', 'topPlaylistsContainer'),
            
            // your music
            'favorites':slideNavListStore.findExact('id', 'favoritesContainer'),
            'playlists':slideNavListStore.findExact(
                'id', 'userPlaylistsContainer'),
            'history':slideNavListStore.findExact('id', 'historyContainer'),
            'queue':slideNavListStore.findExact('id', 'queueContainer'),
            
            // app
            'settings':slideNavListStore.findExact('id', 'settingsContainer'),
            'profile':slideNavListStore.findExact('id', 'profileContainer'),
            'login':slideNavListStore.findExact('id', 'loginContainer'),
            'logout':slideNavListStore.findExact('id', 'logoutContainer'),
            
            // hidden pages
            'hiddenUser':slideNavListStore.findExact(
                'id', 'hiddenUserContainer'),
            'hiddenSong':slideNavListStore.findExact(
                'id', 'hiddenSongContainer'),
            'hiddenPlaylist':slideNavListStore.findExact(
                'id', 'hiddenPlaylistContainer'),
            'hiddenSearch':slideNavListStore.findExact(
                'id', 'hiddenSearchContainer'),
            'hiddenInit':slideNavListStore.findExact(
                'id', 'hiddenInitContainer')
        }
        
        // hide all hidden pages
        this.slideNavList.getItemAt(this.slideNavItemId['hiddenUser']).hide();
        this.slideNavList.getItemAt(this.slideNavItemId['hiddenSong']).hide();
        this.slideNavList.getItemAt(
            this.slideNavItemId['hiddenPlaylist']).hide();
        this.slideNavList.getItemAt(this.slideNavItemId['hiddenSearch']).hide();
        this.slideNavList.getItemAt(this.slideNavItemId['hiddenInit']).hide();
        
        
        /* Assumes all stores have been setup with their onStoreLoad callbacks.
         * This will be important in the event a single song/playlist/user that
         * needs to be loaded right away.
         */
        var controller = this;
        Ext.Viewport.mask({xtype: 'loadmask', message: 'Loading...'});
        Ext.Ajax.request({
            url:'/status/',
            method:'GET',
            success: function(response) {
                var result = Ext.decode(response.responseText || '{}');
                
                // save csrftoken ... will need this for POSTs
                controller.csrftoken = result.csrftoken;
                
                // save user's playlists
                Ext.getStore('UserPlaylists').setData(result.playlists);
                
                                
                if (result.authenticated) {
                    // if user is authenticated, setup account-related
                    // navigation list elements to show Profile summary
                    var titleHtml='<div class="avatar" style="background:url(\''
                        + result.avatar +'\');"></div><div class="name">'
                        + result.username + '</div>';
                    controller.slideNavList.getStore().findRecord(
                        'id','profileContainer').set('title', titleHtml);
                    
                    // indicate that user isn't authenticated
                    controller.authenticated = true;
                    controller.user_id = result.user_id;
                                                            
                    // hide the login nav list item
                    controller.slideNavList.getItemAt(
                        controller.slideNavItemId['login']).hide();
                    
                } else {
                    // if user isnt authenticated
                    // hide the settings, profile and logout nav list items
                    controller.slideNavList.getItemAt(
                        controller.slideNavItemId['settings']).hide();
                    controller.slideNavList.getItemAt(
                        controller.slideNavItemId['profile']).hide();
                    controller.slideNavList.getItemAt(
                        controller.slideNavItemId['logout']).hide();
                }
                
                // done, so hide load mask
                Ext.Viewport.unmask();
                                
                // handle authentication errors
                // handle authentication errors
                if (result.auth_error && (result.auth_msgs.length>0)) {
                    Ext.Msg.alert('Authentication Error!',
                                  result.auth_msgs[0],
                                  Ext.emptyFn);
                }
                
                
                // **ideally, these wouldn't make another call to the server,
                // and would just load store data directly, but then this
                // would have to call the onStoreLoad routines in other
                // controllers, which gets tricky. For now, it's easier
                // to just hit server again.
                // **TODO: fix this
                
                if (result.song) {
                    // if a song page is requested, load the hidden song data
                    // and page
                    controller.plGetSongs("/s/"+result.song.id+"/");
                    controller.slideNavList.select(
                        controller.slideNavItemId['hiddenSong']);
                    
                } else if (result.playlist) {
                    // if a playlist page is requested, load the hidden playlist
                    // page and data.
                    controller.playlistcard.getComponent('playlists')
                        .getStore().setData(result.playlist);
                    controller.slideNavList.select(
                        controller.slideNavItemId['hiddenPlaylist']);
                
                } else if (result.user) {
                    // if a user page is requested, load the hidden user
                    // page and data.
                    controller.showUserPage(
                        result.user.id, result.user.user_name);
                    
                } else {
                    // no special page loaded, so go to new releases
                    
                    controller.slideNavList.select(
                        controller.slideNavItemId['newReleases']);
                }
            },
            
            failure: function() {
                Ext.Viewport.unmask();
            }
        });
    },
    
    
    /*
     * Description: Get an authenticated user's profile data  and update the 
     *              profile page with the retrieved data.    
     *
     * Arguments:   - container: navigation view container
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    getProfileData: function(container) {
        this.utilsController.showLoadMask();
        var controller = this;
        Ext.Ajax.request({
            url:'/profile/',
            method:'GET',
            success: function(response) {
                 var result = Ext.decode(response.responseText || '{}');
                // update profile page
                container.down("accountprofile").fireEvent(
                    'updateData', result);
                
                // done with load mask
                controller.utilsController.hideLoadMask();
            },
            failure: function() {
                // done with load mask
                controller.utilsController.hideLoadMask();
            }
        });
    },
    
    
    /*
     * Description: Get any user's public profile data  and update the 
     *              user's public profile page with the retrieved data.    
     *
     * Arguments:   - container: navigation view container
     *              - user_id:   id of user whose public profile is to be viewed
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    getUserData: function(container, user_id) {
        Ext.Viewport.mask({xtype: 'loadmask', message: 'Loading...'});
        var controller = this;
        Ext.Ajax.request({
            url:this.utilsController.getUserViewUrl(user_id),
            method:'GET',
            success: function(response) {
                 var result = Ext.decode(response.responseText || '{}');
                // update profile page
                container.down("userdetail").fireEvent(
                    'updateData', result);
                
                Ext.Viewport.unmask(); // done with loading mask
            },
            failure: function() {
                Ext.Viewport.unmask(); // done with loading mask
            }
        });
    },
    
    
    /*
     * Description: Show public profile page of a given user..    
     *
     * Arguments:   - user_id:   id of user whose public profile is to be viewed
     *              - user_name: username of same user of interest.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showUserPage: function(user_id, user_name) {
        this.other_user_id = user_id;
        this.other_user_name = user_name;
        
        var hiddenUserContainer = this.usercard.up('#hiddenUserContainer');
        if (hiddenUserContainer) {
            // if already in the user page container, then simply reload the
            // data on the detail panel
                        
            // show user page and populate data
            this.userController.showUserPageHelper('left');
            this.getUserData(hiddenUserContainer, user_id);
            
        } else {
            // else select to the user details page
            this.slideNavList.select(this.slideNavItemId['hiddenUser']);
        }
    },
    
    
    /*
     * Description: Show Hidden Search Results page  
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSearchPage: function() {
        var hiddenSearchContainer = this.songcard.up('#hiddenSearchContainer');
        if (hiddenSearchContainer) {
            // if already in the search page container, simply reload the data
            // on the detail panel
            
            // close slide navigation view
            this.getSlideNav().closeContainer();
            
            // show search panel and update songs
            this.searchController.showSongsPage();
            this.plGetSongs('/search/?q='+this.searchController.query);
            
        } else {
            // else select to the search page
            this.slideNavList.select(this.slideNavItemId['hiddenSearch']);
        }
    },
    
    
    /* ----------------------------------------------------------------------- *
     *  Helper Functions for manipulating the two internal playlists
     * ----------------------------------------------------------------------- *
     */
    /*
     * Description: Check if URL of a given playlist page's URL is active 
     *              playlist's URL.
     *
     * Arguments:   - playlistUrl:     URL of given playlist
     *              - playlistUrlPage: page of given playlist
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    plIsActiveUrl: function(playlistUrl, playlistUrlPage) {
        // first get active page's url
        var activeUrl = this.playlists[this.playlists.activeIdx].store.getProxy().getUrl();
        // get url page numbers, and if it doesn't exist assume page 1.
        var activeUrlPage = 
            this.playlists[this.playlists.activeIdx].store.currentPage || 1;
        playlistUrlPage = playlistUrlPage || 1;
        
        // is this a search url?
        var isSearchPage = (this.utilsController.getURLRelPath(playlistUrl)
                            == "/search/");
        // is there a search parameter on activeUrl?
        var isSearchParam = this.utilsController.getURLParameter(activeUrl, "q")
            ? true : false;
        
        // so finally playlistUrl is equivalent to activeUrl if urls and pages
        // are equal, and this isn't a search page
        return ((activeUrlPage==playlistUrlPage) && (activeUrl==playlistUrl) &&
               !isSearchPage && !isSearchParam);
    },
    
    
    /*
     * Description: Make visible playlist the active playlist.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    plVisibleIsActive: function() {
        // then make visible playlist the active
        this.playlists.activeIdx = this.playlists.visibleIdx;
    },
    
    
    /*
     * Description: Make active playlist the visible playlist. After this, set
     *              store of list of songs in shared song.Card container.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    plActiveIsVisible: function() {
        this.playlists.visibleIdx = this.playlists.activeIdx;
        // visible playlist has been updated so show it in viewport
        this.plUpdateSongs();
        // and now select appropriate song if it's available
        var store = this.audioController.getSongsList().getStore();
        if (store.getCount()) {
            this.audioController.getSongsList().select(
                this.audioController.index);
        }
    },
    
    
    /*
     * Description: Update shared song.Card container so it uses visible 
     *              playlist to populate list of songs in container.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    plUpdateSongs: function() {
        this.songcard.getComponent('songlist').setStore(
            this.playlists[this.playlists.visibleIdx].store);
    },
    
    
    /*
     * Description: Get songs at a given url and page
     *
     * Arguments:   - url: URL to get songs from
     *              - page: [optional] page number to use with provided URL.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    plGetSongs: function(url, page) {
        Ext.Viewport.mask({xtype: 'loadmask', message: 'Loading...'});
        
        // page defaults to 1 if not provided
        page = page || 1;
        
        // if url and page to navigate to match active store, then just load
        // the active page and move on
        if (this.plIsActiveUrl(url, page)) {
            this.plActiveIsVisible();
            this.audioController.initSongCard(
                this.playlists[this.playlists.visibleIdx].store.getRange());
            
            if (this.playlists[this.playlists.visibleIdx].dontLoadMore) {
                this.songcard.addCls('dont-load-more');
            } else {
                this.songcard.removeCls('dont-load-more');
            }
            
            Ext.Viewport.unmask(); // done with loading mask
            return
        }
        
        // determine appropriate visible playlist
        this.playlists.visibleIdx = 1 - this.playlists.activeIdx;
        // load songs in visible playlist's store
        this.playlists[this.playlists.visibleIdx].store.getProxy().setUrl(url);
        this.playlists[this.playlists.visibleIdx].store.loadPage(page);
        // update viewport to show visible playlist
        this.plUpdateSongs();
        // on initial page load, visible playlist is active.
        if (this.initialPageLoad == true) {
            this.initialPageLoad = false;
            this.plVisibleIsActive();
        }
    },
    
    
    /*
     * Description: Get playlists at a given url and page
     *
     * Arguments:   - url: URL to get playlists from
     *              - page: [optional] page number to use with provided URL.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    getPlaylists: function(url, page) {
        this.utilsController.showLoadMask();
        
        // page defaults to 1 if not provided
        page = page || 1;
        var store =  this.playlistcard.getComponent('playlists').getStore();
        store.getProxy().setUrl(url);
        store.loadPage(page);
    },
    
    
    /*
     * Description: Get users at a given url and page
     *
     * Arguments:   - url: URL to get users from
     *              - page: [optional] page number to use with provided URL.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    getUsers: function(url, page) {
        this.utilsController.showLoadMask();
        
        // page defaults to 1 if not provided
        page = page || 1;
        var store =  this.usercard.getComponent('users').getStore();
        store.getProxy().setUrl(url);
        store.loadPage(page);
    }
});