Ext.define('NoddyMix.view.playlist.List', {
    extend: 'Ext.dataview.List',
    xtype: 'playlists',
    
    requires: [
        'NoddyMix.view.plugin.ListPaging',
        'NoddyMix.view.plugin.PullRefresh'
    ],
        
    config: {
        itemCls: 'playlist',
        store:'Playlists',
        scrollable: true,
        itemTpl: new Ext.XTemplate(
            '<img src="{cover_album}" width="70" height="70">',
            '<div class="details">',
            '  <p class="title ellipsis">{title}</p>',
            '  <p class="owner ellipsis">By: ',
            '    <tpl if="owner_id !== null">{owner}',
            '    <tpl else>Anonymous. Login to save</tpl>',
            '  </p>',
            '  <p class="count ellipsis">{num_songs}',
            '   <tpl if="num_songs == 1">song',
            '   <tpl else>songs</tpl>',
            '  </p>',
            '</div>'
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