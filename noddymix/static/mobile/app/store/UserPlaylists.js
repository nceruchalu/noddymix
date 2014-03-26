Ext.define('NoddyMix.store.UserPlaylists', {
    extend: 'Ext.data.Store',
    
    requires: ['NoddyMix.model.UserPlaylist'],
    
    config: {
        model: 'NoddyMix.model.UserPlaylist',
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