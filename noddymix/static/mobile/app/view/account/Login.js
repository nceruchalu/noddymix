Ext.define('NoddyMix.view.account.Login', {
    extend:'Ext.Container',
    xtype: 'accountlogin',
    
    requires: [
        'Ext.Button',
        'Ext.Panel'
    ],
    
    config: {
        maskOnOpen: true,
        
        cls:'accountlogin',
        
        layout: 'vbox',
        scrollable:true,
        
        defaults:{
            xtype:'container',
            layout: {
                type : 'hbox',
                align: 'center',
                pack: 'center'
            },
            defaults:{
                xtype:'button',
                iconMask:true,
                iconAlign:'center',
                margin:7,
                height:124,
                width:124
            }
        },
        
        items: [{
            xtype:'panel',
            styleHtmlContent:true,
            cls:'instructions',
            html:'<p>Select one of the following options to login to NoddyMix</p>'
        }, {
            items:[{
                itemId:'facebook',
                iconCls:'facebook2',
                text:'Facebook'
            }, {
                itemId:'twitter',
                iconCls:'twitter2',
                text:'Twitter'
            }]
        }, {
            items:[{
                itemId:'google',
                iconCls:'googleplus',
                text:'Google'
            }]
        }]
    }
});