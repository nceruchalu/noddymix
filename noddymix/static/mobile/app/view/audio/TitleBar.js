Ext.define('NoddyMix.view.audio.TitleBar', {
    extend: 'Ext.TitleBar',
    xtype:'audiotitlebar',
    
    requires: ['Ext.Container',
               'Ext.Img',
               'Ext.Button'],
    
    config: {
        cls: 'audiotitlebar',
        docked: 'bottom',
        title: '<p class="title ellipsis">No title</p><p class="artist ellipsis">No artist</p>',
       
        items: [{
            xtype:'image',
            itemId: 'audioPoster',
            src:'http://static.noddymix.com.s3.amazonaws.com/img/art_mobile_thumbnail.jpg',
            width:39,
            height:39,
            align: 'left'
        }, {
            itemId: 'audioPlay',
            iconCls: 'play',
            iconMask:true,
            ui:'plain',
            align:'right'
        }, {
            itemId: 'audioPause',
            iconCls: 'pause',
            iconMask:true,
            ui:'plain',
            align:'right',
            hidden:true
        }]
        
    },
    
    // need an initializer to force a 'tap' event for a titlebar
    initialize:function() {
        this.callParent();
        
        this.on({
            scope:this,
            element:'element',
            tap:function() {this.fireEvent("titlebartap");}
        })
    }
});