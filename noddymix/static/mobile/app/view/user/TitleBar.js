Ext.define('NoddyMix.view.user.TitleBar', {
    extend: 'Ext.TitleBar',
    xtype:'usertitlebar',

    requires: [               
        'Ext.Button'
    ],
    
    config: {
        maskOnOpen: true,
        docked: 'top',
        title: 'Followers',
        cls:'usertitlebar',
        
        items: [{
            itemId:'backButton',
            iconCls:'back',
            iconMask:true,
            ui:'plain',
            align:'left'
        }]
    }
});