Ext.define('NoddyMix.view.song.Detail', {
    extend: 'Ext.Container',
    xtype: 'songDetail',
    
    requires:[
        'Ext.TitleBar',
        'Ext.Img',
        'NoddyMix.view.audio.Toolbar'
    ],

    config: {
        maskOnOpen: true,
        cls:'songdetail',
        style: 'background:#50636B;',
        layout: {
            type:'vbox',
            align:'center'
        },
        scrollable: {
            direction: 'vertical',
            directionLock: true
        },
        items: [{
            xtype: 'titlebar',
            itemId:'titlebar',
            title: '<p class="title ellipsis">No title</p><p class="artist ellipsis">No artist</p>',
            docked: 'top',
            items: [{
                itemId:'backButton',
                iconCls:'back',
                iconMask:true,
                ui:'plain',
                align:'left'
            }, {
                itemId:'menuButton',
                iconCls:'list2',
                iconMask:true,
                ui:'plain',
                align:'right'
            }]
            
        }, {
            xtype:'image',
            itemId: 'audioPoster',
            cls:'reflectBelow',
            src:'http://static.noddymix.com.s3.amazonaws.com/img/art_display.jpg',
            width:320,
            height:320
        
        }, {
            xtype:'container',
            cls:'progressbar-container',
            docked:'bottom',
            height:3,
            
            items:[{
                xtype:'component',
                itemId:'progressbar',
                cls:'progressbar',
                height:3,
                width:'0%'
            }]
        }, {
            xtype:'audiotoolbar'
        }]
    }
});