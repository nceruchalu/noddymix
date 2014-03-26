Ext.define('NoddyMix.view.user.Detail', {
    extend:'Ext.Container',
    xtype:'userdetail',
    
    requires: [
        'NoddyMix.view.user.Summary',
        'Ext.Button',
        'NoddyMix.view.activity.Card'
    ],
    
    config: {
        maskOnOpen: true,
        cls:'userdetail',
        
        layout: {
            type:'vbox',
            align:'center'
        },
        defaults: {
            width:320
        },
        scrollable: {
            direction: 'vertical',
            directionLock: true
        },
        
        items: [{
            itemId:'usersummary',
            xtype:'usersummary'
        }, {
            layout: {
                type:'hbox',
                align:'center',
                pack:'end'
            },
            xtype:'container',
            items:[{
                itemId:'followButton',
                xtype:'button',
                iconMask:false,
                text:'following',
                width:90,
                margin:10,
                cls:'following'
            }]
        }, {
            itemId:'activitycard',
            xtype:'activityCard'
        }]
    }
});