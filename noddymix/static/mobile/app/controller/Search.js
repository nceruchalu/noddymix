/*
 * Description:
 *   This controller is for the search views
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.Search', {
    extend: 'Ext.app.Controller',
    
    requires: [
        'NoddyMix.view.search.Menu'
    ],
    
    config: {
        refs: {
            searchTitleBarSongs:'searchtitlebar#searchtitlebarsongs',
            searchTitleBarPlaylists:'searchtitlebar#searchtitlebarplaylists',
            searchTitleBarUsers:'searchtitlebar#searchtitlebarusers',
            
            searchSongsMenuButton:'#searchtitlebarsongs #menuButton',
            searchPlaylistsMenuButton:'#searchtitlebarplaylists #menuButton',
            searchUsersMenuButton:'#searchtitlebarusers #menuButton',
            
            menuList: 'searchmenu list',
            searchfield: 'searchfield'
        },
        control: {
            searchSongsMenuButton: {
                tap:'showSearchMenuSongs'
            },
            searchPlaylistsMenuButton: {
                tap:'showSearchMenuPlaylists'
            },
            searchUsersMenuButton: {
                tap:'showSearchMenuUsers'
            },
            
            menuList: {
                itemtap:'tappedSearchMenuItem'
            },
            searchfield: {
                action:'searchFieldAction'
            }
        }
    }, // end config
    
    launch: function(app) {
        this.mainController = app.getController('Main');
        this.utilsController = app.getController('Utils');
        
        this.query = '';
                
        // search menu data
        this.searchmenuData = [
            {title: 'Search Songs',iconCls: 'search',id:'search-songs'},
            {title: 'Search Playlists',iconCls: 'search',id:'search-playlists'},
            {title: 'Search Users',iconCls: 'search',id:'search-users'}
        ];
        this.searchmenuDataLookup = {};
        for (var i = 0, len = this.searchmenuData.length; i < len; i++) {
            this.searchmenuDataLookup[this.searchmenuData[i].id] = 
                this.searchmenuData[i];
        }
        
        this.searchmenu = Ext.create('NoddyMix.view.search.Menu');
        // needs to be under viewport to call show();
        Ext.Viewport.add(this.searchmenu); 
        
        this.searchmenuList = this.searchmenu.getAt(0);
    },
    
    
    /*
     * Description: Get search query and show search result page.
     *              status.
     *
     * Arguments:   - searchfield: Search field
     *              - event: the key event object
     *              - eOpts: options passed to Listener
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    searchFieldAction:function(searchfield, event, eOpts) {
        this.query = searchfield.getValue(); // get query
        this.mainController.showSearchPage();
    },
    
    
    /*
     * Description: Show titlebar on song search results page.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSongsPageTitleBar: function() {
        this.getSearchTitleBarSongs().show(); 
        this.mainController.playlisttitlebar.hide();
    },
    
    
    /*
     * Description: Hide titlebar on song search results page.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    hideSongsPageTitleBar: function() {
        this.getSearchTitleBarSongs().hide(); 
        this.mainController.playlisttitlebar.show();
    },
    
    
    /*
     * Description: Show songs returned by song search query along with
     *              corresponding titlebar.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSongsPage: function() {
        var container = this.mainController.songcard.getParent().getParent();
        container.getLayout().setAnimation({type:'slide', direction:'right'});
        container.setActiveItem('#songlistcontainer');
        this.showSongsPageTitleBar(); // show songs search titlebar
    },
    
    
    /*
     * Description: Show playlists returned by playlist search query.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showPlaylistsPage: function() {
        var container = this.mainController.songcard.getParent().getParent();
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#playlistscontainer');
    },
    
    
    /*
     * Description: Show users returned by user search query
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showUsersPage: function() {
        var container = this.mainController.songcard.getParent().getParent();
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#userlistcontainer');
    },
    
    
    /*
     * Description: Show search menu when already viewing songs search results.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSearchMenuSongs: function() {
        this.showSearchMenu('songs');
    },
    
    
    /*
     * Description: Show search menu when already viewing playlists search 
     *              results.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSearchMenuPlaylists: function() {
        this.showSearchMenu('playlists');
    },
    
    
    /*
     * Description: Show search menu when already viewing users search 
     *              results.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSearchMenuUsers: function() {
        this.showSearchMenu('users');
    },
    
    
    /*
     * Description: Show search menu when already viewing a particular type of
     *              search results.
     *
     * Arguments:   pageType: type of search results. Possible values:
     *                        'songs', 'playlists', 'users'
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showSearchMenu: function(pageType) {
        var data = [];
        
        // show links to search pages other than current
        if (pageType == 'songs') {
            data.push(this.searchmenuDataLookup['search-playlists']);
            data.push(this.searchmenuDataLookup['search-users']);
        } else if (pageType == 'playlists') {
            data.push(this.searchmenuDataLookup['search-songs']);
            data.push(this.searchmenuDataLookup['search-users']);
        } else if (pageType == 'users') {
            data.push(this.searchmenuDataLookup['search-songs']);
            data.push(this.searchmenuDataLookup['search-playlists']);
        }
        
        // finally setup and show search menu
        this.searchmenuList.getStore().setData(data);
        this.searchmenu.setHeight(41*data.length + 6);
        // showBy doesn't always work and it messes up a lot
        this.searchmenu.show();//.showBy(this.getSearchMenuButton());
    },
    
    
    /*
     * Description: Change search query type based on selected search menu item.
     *              This also involves changing type of search results page.
     *
     * Arguments:   - menuList: (Ext.dataview.DataView) list of menu items
     *              - index:    Number) index of the item tapped
     *              - target:   The element/DataItem tapped
     *              - record:   record associated with tapped item
     *              - e:        The event object
     *              - eOpts:    options object passed to Listener.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    tappedSearchMenuItem: function(menulist, index, target, record, e, eOpts) {
        this.searchmenu.hide();
        aa = this;
        
        // `main` list
        if (record.data.id == 'search-songs') {
            this.showSongsPageTitleBar();
            this.showSongsPage();
            this.mainController.plGetSongs('/search/?q='+this.query);
                        
        } else if (record.data.id == 'search-playlists') {
            this.hideSongsPageTitleBar();
            this.showPlaylistsPage();
            this.mainController.getPlaylists('/search/p/?q='+this.query);
            
            
        } else if (record.data.id == 'search-users') {
            this.hideSongsPageTitleBar();
            this.showUsersPage();
            this.mainController.getUsers('/search/u/?q='+this.query);
        }
    }
});