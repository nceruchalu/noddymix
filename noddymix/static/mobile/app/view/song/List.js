Ext.define('NoddyMix.view.song.List', {
    extend: 'Ext.dataview.List',
    xtype: 'songs',
    
    requires: [
        'NoddyMix.view.plugin.ListPaging',
        'NoddyMix.view.plugin.PullRefresh'
    ],
    
    // can use {xindex} in tpl
    prepareData: function(data, index, record) {
        if(Ext.isObject(data)) {
            var store = this.getStore();
            data.xindex = ((store.currentPage-1)*store.getPageSize()) +index +1;
        }
        return data;
    },
    
    config: {
        itemCls: 'song',
        store:'Songs',
        scrollable: true,
        itemTpl: new Ext.XTemplate(
            '<p class="title ellipsis">',
            '  <span class="idx">{xindex}.</span> {title}</p>',
            '<p class="time">{[this.getTime(values.length)]}</p>',
            {
                // member functions:
                getTime: function(sec) {
                    var min = Math.floor(sec/60);
                    var secs = sec % 60;
                    if (secs < 10) secs = "0"+secs;
                    return min + ':' + secs;
                }
            }
        ),
        onItemDisclosure:true,
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