Ext.define('NoddyMix.view.audio.Toolbar', {
    extend: 'Ext.Toolbar',
    
    xtype: 'audiotoolbar',
    
    config: {
        cls: 'audiotoolbar',
        docked: 'bottom',
        layout: {
            type: 'hbox',
            pack: 'center',
            align:'center'
        },
        height:70,
            
        defaults: {
            iconMask:true,
            ui:'plain',
            xtype:'button',
            flex:1
        },
        
        items:[{
            itemId:'audioLoop',
            iconCls:'loop'
        }, {
            itemId:'audioPrev',
            iconCls:'prev'
        }, {
            itemId: 'audioPlay',
            iconCls: 'play'
        }, {
            itemId: 'audioPause',
            iconCls: 'pause',
            hidden:true
        }, {
            itemId: 'audioNext',
            iconCls: 'next'
        }, {
            itemId:'audioShuffle',
            iconCls:'shuffle'
        }]
    }
});