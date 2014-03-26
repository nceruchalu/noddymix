Ext.define('NoddyMix.store.Users', {
    extend: 'Ext.data.Store',
    
    requires: ['NoddyMix.model.User'],
    
    config: {
        model: 'NoddyMix.model.User',
        proxy: {
            type: 'ajax',
            url : '/',
            reader: {
                type: 'json',
                rootProperty: 'users'
            }
        },
        pageSize:50,
        autoLoad: false
    }
});