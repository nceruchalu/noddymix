Ext.define('NoddyMix.view.account.Summary', {
    extend:'Ext.Container',
    xtype:'accountsummary',
    
    requires: [
        'Ext.Img',
        'Ext.Panel',
        'Ext.Button'
    ],
    
    config: {
        cls:'accountsummary',
        
        layout: {
            type:'vbox',
            align:'center'
        },
        defaults: {
            width:320
        },
        items: [{
            xtype:'image',
            itemId: 'cover',
            src:'http://static.noddymix.com.s3.amazonaws.com/img/cover_small.jpg',
            cls:'blur',
            width:320,
            height:181
        
        }, {
            xtype:'panel',
            styleHtmlContent:true,
            itemId:'name',
            cls:'username',
            data:{name:'Username'},
            tpl:'<p class="text ellipsis">{name}</p>'
        }, {
            xtype:'container',
            height:50,
            cls:'statistics',
            layout: {
                type: 'hbox',
                align: 'stretch',
                pack: 'center'
            },
            defaults:{
                xtype:'button',
                width:72
            },
            items:[{
                xtype:'image',
                cls:'avatar',
                itemId:'avatar',
                src:'http://static.noddymix.com.s3.amazonaws.com/img/avatar_mobile_small.jpg',
                width:100,
                height:100
            }, {
                itemId:'playlists',
                data: {count:0},
                tpl:'<p class="count ellipsis">{count}</p><p class="name ellipsis">Playlists</p>'
            }, {
                itemId:'followers',
                data: {count:0},
                tpl:'<p class="count ellipsis">{count}</p><p class="name ellipsis">Followers</p>'
            }, {
                itemId:'following',
                cls:'last-nav-item',
                data: {count:0},
                tpl:'<p class="count ellipsis">{count}</p><p class="name ellipsis">Following</p>'
            }]
        }]
    }
})