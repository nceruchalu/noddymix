Ext.define('NoddyMix.view.account.Settings', {
    extend:'Ext.Container',
    xtype:'accountsettings',
    
    requires: [
        'Ext.form.Panel',
        'Ext.form.FieldSet',
        'Ext.field.Checkbox',
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
            height:80,
            scrollable:false,
            items:[{
                xtype:'fieldset',
                
                items:[{
                    xtype:'checkboxfield',
                    itemId:'activity_public',
                    name:'activity_public',
                    label:'Activity is public',
                    labelWidth:'70%',
                    checked: true
                }]
            }]
        }, {
            xtype:'button',
            itemId:'submitButton',
            text:'Save',
            maxWidth:290,
            margin:'0 auto',
            height:40,
            ui:'action'
        }]
    }
})