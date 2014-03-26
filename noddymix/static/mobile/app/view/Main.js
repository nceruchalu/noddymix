Ext.define('NoddyMix.view.Main', {
    extend: 'Ext.ux.slidenavigation.View',
    xtype: 'main',
    
    requires: [
        'Ext.Container',
        'Ext.MessageBox',
        'Ext.Panel',
        'Ext.Toolbar',
        'Ext.TitleBar',
        'Ext.field.Search',
        'Ext.form.Panel',
        'NoddyMix.view.audio.Audio',
        'NoddyMix.view.account.Login',
        'NoddyMix.view.account.Profile',
        'NoddyMix.view.account.TitleBar',
        'NoddyMix.view.account.Settings',
        'NoddyMix.view.RequestPanel',
        'NoddyMix.view.user.Detail',
        'NoddyMix.view.user.TitleBar',
        'NoddyMix.view.search.TitleBar'
    ],
    
    
    /**
     * Overwrite Callback function for when the container has finished being 
     * dragged.  This determines which direction to finish moving the container
     * based on its current position and velocity.
     */
    onContainerDragend: function(draggable, e, eOpts) {
        var velocity     = Math.abs(e.deltaX / e.deltaTime),
            listPosition = this.getListPosition(),
            direction    = (e.deltaX > 0) ? "right" : "left",
            offset       = Ext.clone(draggable.offset),
            threshold    = parseInt(this.config.list.minWidth * .45),
            thresholdLeft = parseInt(this.config.list.minWidth - threshold);
        
        if (listPosition == "right") {
            if (direction == "right")  {
                direction = "left";
            } else {
                direction = "right";
            }
        }
        
        switch (direction) {
        case "right":
            offset.x = (velocity > 0.75 || offset.x > threshold) ? 
                this.config.list.minWidth : 0;
            break;
        case "left":
            offset.x = (velocity > 0.75 || offset.x < thresholdLeft) ? 
                0 : this.config.list.minWidth;
            break;
        }
        
        this.fireEvent('dragend', this);
        
        this.moveContainer(this, offset.x);
    },
    
    
    /**
     *  @private
     *
     *  updated to add `id` as a field
     *
     *  Registers the model with Ext.ModelManager, if it hasn't been
     *  already, and returns the name of the model for use in the store.
     */
    getModel: function() {
        var model = 'SlideNavigationPanelItem',
            groups = this.config.groups;
        
        if (!Ext.ModelManager.get(model)) {
            Ext.define(model, {
                extend: 'Ext.data.Model',
                config: {
                    idProperty: 'index',
                    fields: [
                        'index', 'title', 'group', 'selected', 'id',
                        {
                            name: 'order',
                            defaultValue: 1
                        },{
                            name: 'groupOrder',
                            convert: function(value, record) {
                                // By default we group and order by group name.
                                group = record.get('group');
                                return groups[group] || group;
                            }
                        }
                    ]
                }
            });
        }
        
        return model;
    },
      
    
    config: {
        fullscreen: true,
        
        /**
         *  Any component within the container with an 'x-toolbar' class
         *  will be draggable.  To disable draggin all together, set this
         *  to false.
         */
        slideSelector: 'x-toolbar',
        
        /**
         *  Container must be dragged 10 pixels horizontally before allowing
         *  the underlying container to actually be dragged.
         *
         *  comment-out to disable container dragging
         */
        containerSlideDelay: 10,
        
        /**
         *  Time in milliseconds to animate the closing of the container
         *  after an item has been clicked on in the list.
         */
        selectSlideDuration: 200,
        
        /**
         *  Enable content masking when container is open.
         *    content masking means, the content wont be responsive e.g. content
         *    wont scroll when navigation menu is open.
         */
        itemMask: true,
        
        /**
         *  Define the default slide button config.  Any item that has
         *  a `slideButton` value that is either `true` or a button config
         *  will use these values at the default.
         */
        slideButtonDefaults: {
            selector: '#nav-toolbar', // parent element to add slide button to.
            iconMask: true,
            iconCls: 'list',
            ui:'plain'
        },
        
        /**
         *  This allows us to configure how the actual navigation list container
         *  looks.  Here I've added a custom search field and have modified the
         *  width.
         *
         *  The app's sole HTML5 audio element is also here. This way it is
         *  available to all pages.
         */
        list: {
            itemTpl: '<div>{title}</div>',
            maxDrag: 250,
            width: 250,
            itemHeight:25,
            items: [{
                xtype:'toolbar',
                docked: 'top',
                layout:'fit',
                items:[{
                    xtype:'formpanel',
                    height:'100%',
                    scrollable:false,
                    items:[{
                        xtype: 'searchfield',
                        placeHolder: 'Search',
                        margin:'0.5em auto'
                    }]
                }]
            }, {
                xtype: 'audio-noddymix'
            }]
        },
        
        /**
         *  Change this to 'right' to dock the navigation list to the right.
         */
        listPosition: 'left',
        
        /**
         *  Specify the group ordering
         */
        groups: {
            'Browse': 1,
            'Your Music': 2,
            'App': 3
        },
        
        /**
         *  These are the default values to apply to the items within the
         *  container.
         */
        defaults: {
            xtype: 'container',
            style: 'background: #fff;'
        },
        
        /**
         *  Specify the navigation items
         */
        items: [{
            title: 'New Releases',
            group: 'Browse',
            id:'newReleasesContainer',
            
            // Enable the slide button using the defaults defined above in
            // `slideButtonDefaults`.
            slideButton: true,
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            
            items: [{
                itemId:'songlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'New Releases',
                    docked: 'top'
                }]
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
        },{
            title: 'Heavy Rotation',
            group: 'Browse',
            id:'heavyRotationContainer',
            slideButton: true,
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            
            items: [{
                itemId:'songlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'Heavy Rotation',
                    docked: 'top'
                }]
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
            
        },{
            title: 'Top Playlists',
            group: 'Browse',
            id:'topPlaylistsContainer',
            slideButton: true,
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            items: [{
                itemId:'playlistscontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'Top Playlists',
                    docked: 'top'
                }]
            }, {
                itemId:'songlistcontainer',
                maskOnOpen:true
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
            
        },{
            title: 'Favorites',
            group: 'Your Music',
            id:'favoritesContainer',
            order: 0,
            slideButton: true,
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            items: [{
                itemId:'playlistscontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'Favorites',
                    docked: 'top'
                }]
            }, {
                itemId:'songlistcontainer',
                maskOnOpen:true
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
            
        },{
            title: 'Playlists',
            group: 'Your Music',
            id:'userPlaylistsContainer',
            order: 1,
            slideButton: true,
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            items: [{
                itemId:'playlistscontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'titlebar',
                    itemId:'nav-toolbar',
                    title: 'My Playlists',
                    docked: 'top',
                    items: [{
                        itemId: 'playlistCreateButton',
                        iconCls: 'plus',
                        iconMask:true,
                        ui:'plain',
                        align: 'right'
                    }]
                }]
            }, {
                itemId:'songlistcontainer',
                maskOnOpen:true
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
            
        },{
            title: 'History',
            group: 'Your Music',
            id: 'historyContainer',
            order: 2,
            slideButton: true,
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            
            items: [{
                itemId:'songlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'History',
                    docked: 'top'
                }]
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
                        
        },{
            title: 'Queue',
            group: 'Your Music',
            order: 3,
            slideButton: true,
            id:'queueContainer',
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            
            items: [{
                itemId:'songlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'Queue',
                    docked: 'top'
                }]
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
            
        },{
            title: 'Settings',
            group: 'App',
            slideButton: true,
            id: 'settingsContainer',
            order: 0,
            
            items: [{
                xtype: 'toolbar',
                itemId:'nav-toolbar',
                title: 'Settings',
                docked: 'top'
            },{
                itemId:'accountsettings',
                xtype:'accountsettings',
                maskOnOpen:true
            }]
        },{
            title: 'Request',
            group: 'App',
            slideButton: true,
            id: 'requestContainer',
            order: 1,

            items: [{
                xtype: 'toolbar',
                itemId:'nav-toolbar',
                title: 'Request',
                docked: 'top'
            },{
                itemId:'request',
                xtype:'requestpanel',
                maskOnOpen:true
            }]
        },{
            title: '<div class="avatar" style="background:url(http://static.noddymix.com.s3.amazonaws.com/img/avatar_thumbnail.jpg);"></div><div class="name">Username</div>',
            group: 'App',
            slideButton: true,
            id: 'profileContainer',
            order: 2,
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            
            items: [{
                itemId:'accountprofilecontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'Profile',
                    docked: 'top'
                },{
                    itemId:'accountprofile',
                    xtype:'accountprofile'
                }]
            }, {
                itemId:'userlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype:'accounttitlebar'
                }]
            }]
        },{
            title: 'Login',
            group: 'App',
            slideButton: true,
            id: 'loginContainer',
            order:3,
                        
            items: [{
                xtype: 'toolbar',
                itemId:'nav-toolbar',
                title: 'Login',
                docked: 'top'
            },{
                xtype:'accountlogin',
                maskOnOpen:true
            }]
        },{
            title: 'Logout',
            group: 'App',
            id: 'logoutContainer',
            order: 4,
            handler: function() {
                // perform logout instead of showing a container
                window.location.replace('/logout/'); 
            }
        },{
            title: 'Hidden User Page',
            id: 'hiddenUserContainer',
            group: 'App',
            slideButton: true,
            order: 5,
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            items: [{
                itemId:'userdetailcontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'User',
                    docked: 'top'
                },{
                    itemId:'userdetail',
                    xtype:'userdetail'
                }]
            }, {
                itemId:'userlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype:'usertitlebar',
                    itemId:'usertitlebarusers'
                }]
            }, {
                itemId:'playlistscontainer',
                maskOnOpen:true,
                items:[{
                    xtype:'usertitlebar',
                    itemId:'usertitlebarplaylists'
                }]
            }, {
                itemId:'songlistcontainer',
                maskOnOpen:true
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
        },{
            title: 'Hidden Song Page',
            id: 'hiddenSongContainer',
            group: 'App',
            slideButton: true,
            order: 6,
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            items: [{
                itemId:'songlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'Song',
                    docked: 'top'
                }]
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
        },{
            title: 'Hidden Playlist Page',
            id: 'hiddenPlaylistContainer',
            group: 'App',
            slideButton: true,
            order: 7,
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            items: [{
                itemId:'playlistscontainer',
                maskOnOpen:true,
                items:[{
                    xtype: 'toolbar',
                    itemId:'nav-toolbar',
                    title: 'Playlist',
                    docked: 'top'
                }]
            }, {
                itemId:'songlistcontainer',
                maskOnOpen:true
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }]
        },{
            title: 'Hidden Search Page',
            group: 'App',
            slideButton: true,
            id: 'hiddenSearchContainer',
            order:8,
            slideButton: true,
            
            layout: {
                type:'card',
                animation:{type:'slide', direction:'left'}
            },
            
            defaults: {
                layout:'fit'
            },
            
            items: [{
                itemId:'songlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype:'searchtitlebar',
                    itemId:'nav-toolbar',
                    id:'searchtitlebarsongs'
                }]
            }, {
                itemId:'songdetailcontainer',
                maskOnOpen:true
            }, {
                itemId:'playlistscontainer',
                maskOnOpen:true,
                items:[{
                    xtype:'searchtitlebar',
                    itemId:'nav-toolbar',
                    id:'searchtitlebarplaylists',
                    title:'<p class="row1 ellipsis">Search</p><p class="row2 ellipsis">Playlists</p>'
                }]
            }, {
                itemId:'userlistcontainer',
                maskOnOpen:true,
                items:[{
                    xtype:'searchtitlebar',
                    itemId:'nav-toolbar',
                    id:'searchtitlebarusers',
                    title:'<p class="row1 ellipsis">Search</p><p class="row2 ellipsis">Users</p>'
                }]
            }]
           
            
        },{
            title: 'Hidden Init Container',
            group: 'App',
            slideButton: true,
            id: 'hiddenInitContainer',
            order:3,
            selected:true, // this is the first page to be loaded
            items:{
                xtype:'container',
                styleHtmlContent: true,
                style:'background-color:#1b79d3;',
                html: '<div id="appSetupIndicator">'+
                    '    <div></div>'+
                    '    <div></div>'+
                    '    <div></div>'+
                    ' </div>'+
                    '<p id="appSetupMsg">Loading your data...</p>'
            }            
        }]/* end items:[]*/      
    }
});
