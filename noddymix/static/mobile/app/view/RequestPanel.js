Ext.define('NoddyMix.view.RequestPanel', {
    extend:'Ext.Container',
    xtype:'requestpanel',
    
    requires: [
        'Ext.form.Panel',
        'Ext.form.FieldSet',
        'Ext.field.Select', 
        'Ext.field.Email',
        'Ext.Button'
    ],
    
    config: {
        maskOnOpen: true,
        scrollable:{
            direction:'vertical',
            directionLock:true
        },
        layout: {
            type:'vbox',
            align:'stretch',
            pack: 'start'
        },
        
        items: [{
            xtype: 'formpanel',
            itemId: 'form',
            height:350,
            scrollable:false,
            items:[{
                xtype:'fieldset',
                title: 'Feedback Form',
                instructions: '* means required field',
                defaults: {
                    required: true,
                    labelAlign: 'left',
                    labelWidth: '30%',
                    clearIcon:true
                },
                items:[{
                    xtype: 'selectfield',
                    options: [
                        {text: 'Song request', value: 'Song Request'},
                        {text: 'General', value: 'General'},
                        {text: 'Copyright Infringement', 
                         value: 'Copyright Infringement'}
                    ],
                    name:'subject',
                    label:'Subject'
                },{
                    xtype:'textareafield',
                    name:'body',
                    label:'Body',
                    maxRows:6,
                    maxLength:990,
                    placeHolder:'leave your message here'
                },{
                    xtype:'emailfield',
                    name:'email',
                    label:'Email',
                    required:false,
                    placeHolder:'you@example.com'
                }]
            }]
        }, {
            xtype:'button',
            itemId:'submitButton',
            text:'Submit',
            maxWidth:290,
            margin:'0 auto',
            height:40,
            ui:'action'
        }]
    }
})