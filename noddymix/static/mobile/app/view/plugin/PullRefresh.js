/*
 * Description: 
 *   Extension of PullRefresh plugin to fire `fetchfirst` event when user tries
 *   to refresh page... This is treated as an attempt to reload the first page
 *   of a paginated list.
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.view.plugin.PullRefresh', {
    extend: 'Ext.plugin.PullRefresh',
    
    /**
     * @private
     * Attempts to load the newest posts via the attached List's Store's Proxy
     */
    fetchLatest: function() {
        // handle this in a controller
        this.getParent().fireEvent('fetchfirst', this);
    }
});
