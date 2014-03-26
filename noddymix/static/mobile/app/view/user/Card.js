Ext.define('NoddyMix.view.user.Card', {
    extend: 'Ext.Container',
    xtype: 'userCard',
    
    requires: [
        'NoddyMix.view.user.List'
    ],
    
    config: {
        layout:'fit',
        maskOnOpen:true,
        items:[{
            xtype:'users',
            itemId:'users',
            cls:'users'
        }, {
            xtype:'container',
            itemId:'no-users',
            cls:'no-list-content-panel',
            styleHtmlContent:true,
            docked:'top',
            hidden:true,
            html:'<p>Sorry, No Users Here</p>'
        }]
    }
});
    