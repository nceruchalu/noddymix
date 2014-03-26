Ext.define('NoddyMix.view.search.TitleBar', {
    extend: 'Ext.TitleBar',
    xtype:'searchtitlebar',
    
    requires: [               
        'Ext.Button'
    ],
    
    config: {
        docked: 'top',
        title: '<p class="row1 ellipsis">Search</p><p class="row2 ellipsis">Songs</p>',
        cls:'searchtitlebar',
        
        items: [{
            itemId:'menuButton',
            iconCls:'list2',
            iconMask:true,
            ui:'plain',
            align:'right'
        }]
    }
});