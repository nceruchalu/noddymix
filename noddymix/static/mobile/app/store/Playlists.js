Ext.define('NoddyMix.store.Playlists', {
    extend: 'Ext.data.Store',
    
    requires: ['NoddyMix.model.Playlist'],
    
    config: {
        model: 'NoddyMix.model.Playlist',
        proxy: {
            type: 'ajax',
            url : '/',
            reader: {
                type: 'json',
                rootProperty: 'playlists'
            }
        },
        pageSize:36,
        autoLoad: false
    }
});