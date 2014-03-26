/*
 * Description:
 *   Model representing a User object
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.model.User', {
    extend: 'Ext.data.Model',
    
    config: {
        fields: [
            // user's id
            {name:'id', type:'int'},
            // user's full name
            {name: 'name', type:'string'},
            // URL of user's avatar image
            {name: 'avatar', type:'string'},
            // string representation of whether  app user is following user
            {name: 'following_status', type:'string'}
        ]
    }
});