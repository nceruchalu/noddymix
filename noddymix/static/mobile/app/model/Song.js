/*
 * Description:
 *   Model representing a Song object
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.model.Song', {
    extend: 'Ext.data.Model',
    
    config: {
        fields: [
            // song title
            {name: 'title', type: 'string'},
            // artist name (including featured artists)
            {name: 'artist', type: 'string'},
            // album title
            {name: 'album', type: 'string'},
            // URL to song's mp3 file
            {name: 'mp3', type:'string'},
            // song ID
            {name:'id', type:'int'},
            // thumbnail-sized album art
            {name: 'poster', type:'string'},
            // displa-sized album art
            {name: 'poster_display', type:'string'},
            // song length in seconds
            {name:'length', type:'int'}
        ]
    }
});