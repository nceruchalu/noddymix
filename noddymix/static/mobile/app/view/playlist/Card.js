Ext.define('NoddyMix.view.playlist.Card', {
    extend: 'Ext.Container',
    xtype: 'playlistCard',
    
    requires: [
        'NoddyMix.view.playlist.List'
    ],
    
    config: {
        layout: 'fit',
        maskOnOpen: true,
        items: [{
            xtype: 'playlists',
            itemId: 'playlists',
            cls:'playlists'
        }, {
            xtype: 'container',
            itemId:'no-playlists',
            cls:'no-list-content-panel',
            styleHtmlContent:true,
            docked:'top',
            hidden:true,
            height:45,
            html:'<p>Sorry, No Playlists Here</p>'
        }, {
            xtype: 'container',
            itemId:'login-instruction',
            cls:'no-list-content-panel',
            styleHtmlContent:true,
            docked:'top',
            hidden:true,
            height:65,
            html:'<p><span class="highlight">Login</span> to view your subscriptions</p>'
        }]
    },
    
    initialize: function() {
        // initialize parent
        this.callParent(arguments);
        var loginInstr = this.getComponent('login-instruction');
        
        loginInstr.element.on ({
            scope: loginInstr,
            tap: function (e, t) {
                loginInstr.fireEvent ('containerTap');
            }
      });
            
    }
});