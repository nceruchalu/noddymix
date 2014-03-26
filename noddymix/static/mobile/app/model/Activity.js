/*
 * Description:
 *   Model representing a user's Activity
 *
 * Reference:
 *   Atom Activity Streams 1.0 spec:
 *   http://activitystrea.ms/specs/atom/1.0/
 * 
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.model.Activity', {
    extend: 'Ext.data.Model',
    
    config: {
        fields: [
            // object that performed the activity
            {name: 'actor', type:'string'},
            // verb phrase that identifies the action of the activity
            {name: 'verb', type: 'string'},
            // object linked to the action itself
            {name: 'object', type: 'string'},
            // object to which the activity was performed
            {name: 'target', type:'string'},
            // time passed since action occured
            {name: 'timesince', type:'string'}
        ]
    }
});