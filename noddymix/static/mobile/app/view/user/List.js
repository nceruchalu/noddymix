Ext.define('NoddyMix.view.user.List', {
    extend: 'Ext.dataview.List',
    xtype: 'users',
    
    requires: [
        'NoddyMix.view.plugin.ListPaging',
        'NoddyMix.view.plugin.PullRefresh'
    ],
    
    config: {
        itemCls:'user',
        store:'Users',
        scrollable:true,
        itemTpl: new Ext.XTemplate(
            '<img src="{avatar}" width="33" height="33">',
            '<p class="name ellipsis">{name}</p>',
            '<div class="x-list-disclosure {following_status}"></div>'
        ),
        plugins: [{
            xclass: 'NoddyMix.view.plugin.PullRefresh',
            pluginId: 'pullrefresh',
            pullRefreshText:'Pull down to return to top...',
            releaseRefreshText:'Release to return to top...'
        }, {
            xclass: 'NoddyMix.view.plugin.ListPaging'
        }]
    }
});