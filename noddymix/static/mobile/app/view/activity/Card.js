Ext.define('NoddyMix.view.activity.Card', {
    extend: 'Ext.Container',
    xtype: 'activityCard',
    
    requires: [
        'NoddyMix.view.activity.List'
    ],
    
    config: {
        layout: 'fit',
        maskOnOpen: true,
        items: [{
            xtype: 'activities',
            itemId: 'activities'
        }, {
            xtype: 'container',
            itemId:'no-activity',
            cls:'no-list-content-panel',
            styleHtmlContent:true,
            docked:'top',
            hidden:true,
            height:65,
            html:'<p>No activity yet</p>'
        }, {
            xtype: 'container',
            itemId:'private-activity',
            cls:'no-list-content-panel',
            styleHtmlContent:true,
            docked:'top',
            hidden:true,
            height:65,
            html:'<p>Activity is private</p>'
        }]
    }
})