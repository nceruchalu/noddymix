Ext.define('NoddyMix.view.account.Profile', {
    extend:'Ext.Container',
    xtype:'accountprofile',
    
    requires: [
        'NoddyMix.view.account.Summary',
        'Ext.field.Toggle'
    ],
    
    config: {
        maskOnOpen: true,
        cls:'accountprofile',
        
        layout: {
            type:'vbox',
            align:'center'
        },
        defaults: {
            width:320
        },
        scrollable: {
            direction: 'vertical',
            directionLock: true
        },
        
        items: [{
            itemId:'accountsummary',
            xtype:'accountsummary'
        }, {
            xtype:'container',
            itemId:'connected-accounts',
            cls:'connected-accounts',
            items:[{
                xtype:'panel',
                styleHtmlContent:true,
                cls:'instructions',
                html:'<p>Connected Accounts</p>'
            }, {
                xtype:'fieldset',
                items:[{
                    itemId:'facebook',
                    xtype: 'togglefield',
                    data: {id:-1,  socialAuthUrl:'facebook'},
                    html:'<div class="label"><span class="icon facebook">'+
                        '</span><span>Facebook</span></div>',
                    labelWidth: '80%'
                }, {
                    itemId:'twitter',
                    xtype: 'togglefield',
                    data: {id:-1, socialAuthUrl:'twitter'},
                    html:'<div class="label"><span class="icon twitter"></span>'+
                        '<span>Twitter</span></div>',
                    labelWidth: '80%'
                }, {
                    itemId:'google',
                    xtype: 'togglefield',
                    data: {id:-1, socialAuthUrl:'google-oauth2'},
                    html:'<div class="label"><span class="icon google"></span>'+
                        '<span>Google</span></div>',
                    labelWidth: '80%'
                }]
            }]
        }, {
            xtype:'button',
            ui:'decline',
            itemId:'logoutButton',
            margin:'0 auto',
            maxWidth:290,
            height:40,
            text:'Logout'
        }]
    }
})