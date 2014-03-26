/*
 * Description:
 *   Model representing a summary of current app user's playlists. 
 *   This is used for the menu of playlists when trying to add a song to one of
 *   your playlists.
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.model.UserPlaylist', {
    extend: 'Ext.data.Model',
    
    config: {
        fields: [
            // playlist id
            {name:'id', type:'int'},
            // playlist title
            {name: 'title', type: 'string'}
        ]
    }
});