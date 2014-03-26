/*
 * Description: 
 *   Extension of ListPaging plugin to fire `fetchnext` event when user tries
 *   to load next page.
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.view.plugin.ListPaging', {
    extend: 'Ext.plugin.ListPaging',
    
    /**
     * @private
     */
    loadNextPage: function() {
        // handle this in a controller
        this.getList().fireEvent('fetchnext', this);
    }
});
