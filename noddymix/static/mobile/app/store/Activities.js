Ext.define('NoddyMix.store.Activities', {
    extend: 'Ext.data.Store',
    
    requires: ['NoddyMix.model.Activity'],
    
    config: {
        model: 'NoddyMix.model.Activity',
        proxy: {
            type: 'ajax',
            url : '/',
            reader: {
                type: 'json',
                rootProperty: 'activities'
            }
        },
        pageSize:20,
        autoLoad: false
    }
});