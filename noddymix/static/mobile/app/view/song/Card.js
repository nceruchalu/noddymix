Ext.define('NoddyMix.view.song.Card', {
    extend: 'Ext.Container',
    xtype: 'songCard',
    
    requires: [
        'NoddyMix.view.song.List',
        'NoddyMix.view.audio.TitleBar'
    ],
    
    config: {
        layout: 'fit',
        maskOnOpen: true,
        items: [{
            xtype: 'songs',
            itemId: 'songlist'
        }, {
            xtype: 'container',
            itemId:'no-music',
            cls:'no-list-content-panel',
            styleHtmlContent:true,
            docked:'top',
            hidden:true,
            html:'<p>Sorry, No Music Here</p>'
        }, {
            xtype: 'audiotitlebar'
        }]
    }
});