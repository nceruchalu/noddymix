Ext.define('NoddyMix.view.account.TitleBar', {
    extend: 'Ext.TitleBar',
    xtype:'accounttitlebar',
    
    requires: [               
        'Ext.Button'
    ],
    
    config: {
        maskOnOpen: true,
        docked: 'top',
        title: 'Followers',
        
        items: [{
            itemId:'backButton',
            iconCls:'back',
            iconMask:true,
            ui:'plain',
            align:'left'
        }]
    }
});