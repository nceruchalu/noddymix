Ext.define('NoddyMix.store.SongsQueue', {
    extend: 'Ext.data.Store',
    
    requires: ['NoddyMix.model.Song'],
    
    config: {
        model: 'NoddyMix.model.Song',
        proxy: {
            type: 'ajax',
            url : null,
            reader: {
                type: 'json',
                rootProperty: 'songs'
            }
        },
        pageSize:100,
        autoLoad: false
    }
});