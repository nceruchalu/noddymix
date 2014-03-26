Ext.define('NoddyMix.store.MenuItems', {
    extend: 'Ext.data.Store',
    
    requires: ['NoddyMix.model.MenuItem'],
    
    config: {
        model: 'NoddyMix.model.MenuItem'
    }
});