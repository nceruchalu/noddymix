/*
 * Description:
 *   Model representing a Playlist object
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.model.Playlist', {
    extend: 'Ext.data.Model',
    
    config: {
        fields: [
            // playlist id
            {name:'id', type:'int'},
            // URL of playlist's cover album image
            {name: 'cover_album', type:'string'},
            // number of songs in playlist
            {name: 'num_songs', type:'int'},
            // playlist title
            {name: 'title', type: 'string'},
            // playlist owner name
            {name: 'owner', type: 'string'},
            // playlist owner's user id
            {name: 'owner_id', type:'int'},
            // is playlist public?
            {name: 'is_public', type: 'boolean'},
            // is current app user subscribed to this playlist?
            {name: 'subscribed', type: 'boolean'}
        ]
    }
});