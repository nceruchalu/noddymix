Ext.define('NoddyMix.view.playlist.TitleBar', {
    extend: 'Ext.TitleBar',
    xtype:'playlisttitlebar',
    
    requires: [               
        'Ext.Button'
    ],
    
    config: {
        cls: 'playlisttitlebar',
        maskOnOpen: true,
        docked: 'top',
        title: '<p class="title ellipsis">Playlist Name</p><p class="artist ellipsis">Owner</p>',
       
        items: [{
            itemId:'backButton',
            iconCls:'back',
            iconMask:true,
            ui:'plain',
            align:'left'
        }, {
            itemId:'menuButton',
            iconCls:'list2',
            iconMask:true,
            ui:'plain',
            align:'right'
        }, {
            itemId:'editDoneButton',
            text:'Done',
            ui:'plain',
            align:'right',
            hidden:true
        }]
    }
});