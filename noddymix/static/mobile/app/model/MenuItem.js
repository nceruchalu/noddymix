/*
 * Description:
 *   Model representing any item in a menu
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.model.MenuItem', {
    extend: 'Ext.data.Model',
    
    config: {
        fields: [
            // menu item's text string
            {name: 'title', type: 'string'},
            // css class for menu item's icon
            {name: 'iconCls', type: 'string'},
            // menu item's unique identifier string (within its menu)
            {name:'id', type:'string'}
        ]
    }
});