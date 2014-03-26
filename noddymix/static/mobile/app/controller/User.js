/*
 * Description:
 *   This controller is for the user views
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.User', {
    extend: 'Ext.app.Controller',
    
    config: {
        refs: {
            usersList:'users',
            usersNone:'userCard #no-users',
            
            userDetail:'userdetail',
            summaryAvatar:'userdetail usersummary #avatar',
            summaryCover:'userdetail usersummary #cover',
            summaryName: 'userdetail usersummary #name',
            summaryPlaylists:'userdetail usersummary #playlists',
            summaryFollowers:'userdetail usersummary #followers',
            summaryFollowing:'userdetail usersummary #following',
            
            followButton: 'userdetail #followButton',
            userTitleBarPlaylists:'usertitlebar#usertitlebarplaylists',
            userTitleBarUsers:'usertitlebar#usertitlebarusers',
            userBackButton:'usertitlebar #backButton',
            
            activities:'activityCard',
            activitiesList:'activityCard #activities',
            activitiesNone:'activityCard #no-activity',
            activitiesPrivate: 'activityCard #private-activity'
        },
        control: {
            usersList: {
                fetchfirst:'fetchfirst',
                fetchnext:'fetchnext',
                itemtap:'tappedUser',
                disclose:'toggleFollowUser'
            },
            userDetail: {
                updateData:'updateUserData'
            },
            summaryPlaylists: {
                tap:'showPlaylistsPage'
            },
            summaryFollowers: {
                tap:'showFollowersPage'
            },
            summaryFollowing: {
                tap:'showFollowingPage'
            },
            followButton: {
                tap:'followButtonTapped'
            },
            userBackButton: {
                tap:'showUserPage'
            }
        }
    }, // end config
    
    launch: function(app) {
        this.mainController = app.getController('Main');
        this.utilsController = app.getController('Utils');
        
        Ext.getStore('Users').on({
            scope:this,
            load:this.onStoreLoad
        });
    },
    
    
    /* Description: Reload first page
     *
     * Arguments:   - plugin: Extended PullRefresh plugin
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    fetchfirst:function(plugin) {
        var store = this.getUsersList().getStore();
        var url = store.getProxy().getUrl();
        this.mainController.getUsers(url, 1);
        
        plugin.setViewState('loaded');
        if (plugin.getAutoSnapBack()) {
            plugin.snapBack();
        }
    },
    
    
    /* Description: Load next page
     *
     * Arguments:   - plugin: Extended ListPaging plugin
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    fetchnext:function(plugin) {
        plugin.setLoading(true);
        
        var store = this.getUsersList().getStore();
        var url = store.getProxy().getUrl();
        this.mainController.getUsers(url, store.currentPage+1);
        
        plugin.setLoading(false);
    },
    
    
    /* Description: Processing operations whenever records have been loaded into
     *              the Playlists Store.
     *              - check if to show button to load more users
     *              - if there are users to be displayed show them in a list,
     *                else show a message indicating no users.
     *
     * Arguments:   - store:      (Ext.data.Store) Users Store
     *              - records:    (Ext.data.Model[]) an array of records
     *              - successful: (Boolean) true if operation was successful
     *              - operation:  (Ext.data.Operation) associated operation
     *              - eOpts:      (Object) options object passed to Listener
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    onStoreLoad:function(store, records, successful, operation, eOpts) {
        this.utilsController.hideLoadMask(); // done with loading mask
        
        // can load more unless we have gotten all users available,
        var results = Ext.decode(operation.getResponse().responseText);
        
        if (results.next_page > 0) {
            this.mainController.usercard.removeCls('dont-load-more');
                        
        } else {
            this.mainController.usercard.addCls('dont-load-more');
        }
        
        // in the event that a new page was pulled when there were no
        // more pages, the store's current page will be wrong, and as such
        // the rendered indices would be off too. Fix that and refresh
        // rendered list.
        // *** this shouldn't happen anyways.
        if(store.currentPage != parseInt(results.curr_page)) {
            store.currentPage = parseInt(results.curr_page);
            this.getUsersList().refresh();
        }
                
        if(records.length > 0) {
            // if users loaded, show the list container
            this.getUsersList().show();
            this.getUsersNone().hide();
        } else {
            // if nothing loaded show the no-users message container
            this.getUsersList().hide();
            this.getUsersNone().show();
        }        
    },
    

    /* Description: on user tap (within list of users), load the user page
     *              for specific user.
     *
     * Arguments:   - usersList: (Ext.dataview.DataView) list of users
     *              - index:     (Number) index of the item tapped
     *              - target:    The element/DataItem tapped
     *              - record:    record associated with tapped item
     *              - e:         The event object
     *              - eOpts:     options object passed to Listener.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    tappedUser: function(usersList, index, target, record, e, eOpts) {
        this.mainController.showUserPage(record.data.id, record.data.name);
    },
    
    
    /* Description: Given a list of users, if already following a user then
     *              unfollow that user, else follow the user.
     *
     * Arguments:   - usersList: (Ext.dataview.DataView) list of users
     *              - record:    record associated with user to be (un)followed
     *              - target:    (HTMLElement) The element to be (un)followed
     *              - index:     (Number) index of the user to be (un)followed
     *              - event:     The event object
     *              - eOpts:     options object passed to Listener.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    toggleFollowUser: function(usersList, record, target, index, event, eOpts) {
        var url, maskMsg;
        var controller = this;
        
        if (record.data.following_status == 'following') {
            // if already following the user, then will be unfollowing
            url = this.utilsController.getUserUnfollowUrl(record.data.id);
            maskMsg = 'unfollowing';
        } else {
            // otherwise not following the user, so will be following
            url = this.utilsController.getUserFollowUrl(record.data.id);
            maskMsg = 'following';
        }
        // tell user that controller will be busy as it talks to server.
        this.utilsController.showLoadMask(maskMsg);
        Ext.Ajax.request({
            url:url,
            method:'POST',
            params:{csrfmiddlewaretoken:this.mainController.csrftoken},
            success: function(response) {
                var result =Ext.decode(response.responseText || '{}');
                //update following status
                record.set('following_status', result.status);
                
                // done with load mask
                controller.utilsController.hideLoadMask();
            },
            failure: function() {
                // done with load mask
                controller.utilsController.hideLoadMask();
            }
        });
                
        // prevent user item tap event
        event.stopEvent();
    },
    
    
    /* Description: While on a user's public profile page, if already following 
     *              the user then unfollow that user, else follow the user.
     *
     * Arguments:   - button: tapped Ext.Button object instance
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    followButtonTapped: function(button) {
        var url, maskMsg;
        var controller = this;
        
        if (button.getText() == 'following') {
            // if already following the user, then will be unfollowing
            url = this.utilsController.getUserUnfollowUrl(
                this.mainController.other_user_id);
            maskMsg = 'unfollowing';
        } else {
            // otherwise not following the user, so will be following
            url = this.utilsController.getUserFollowUrl(
                this.mainController.other_user_id);
            maskMsg = 'following';
        }
        
        // tell user that controller will be busy as it talks to server.
        this.utilsController.showLoadMask(maskMsg);
        Ext.Ajax.request({
            url:url,
            method:'POST',
            params:{csrfmiddlewaretoken:this.mainController.csrftoken},
            success: function(response) {
                var result =Ext.decode(response.responseText || '{}');
                //update following status
                button.setText(result.status);
                button.setCls(result.status);
                
                // done with load mask
                controller.utilsController.hideLoadMask();
            },
            failure: function() {
                // done with load mask
                controller.utilsController.hideLoadMask();
            }
        });
    },
    
    
    /* Description: Update user's public profile page with summary data,
     *              requesting user's following status, and user's activity
     *              if public.
     *
     * Arguments:   - data: object containing user's public profile data
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    updateUserData: function(data) {
        // update summary data
        this.getSummaryAvatar().setSrc(data.avatar_small);
        this.getSummaryCover().setSrc(data.cover_small);
        this.getSummaryName().setData({name:data.name});
        this.getSummaryPlaylists().setData({count: data.num_playlists});
        this.getSummaryFollowers().setData({count:data.num_followers});
        this.getSummaryFollowing().setData({count:data.num_following});
        
        // update follow button
        this.getFollowButton().setCls(data.following_status);
        this.getFollowButton().setText(data.following_status);
        
        // update activity data
        this.getActivitiesList().hide();
        this.getActivitiesNone().hide();
        this.getActivitiesPrivate().hide();
        this.getActivities().setHeight(65);
        
        if (data.activity_public == false) {
            // if activity is private, say so
            this.getActivitiesPrivate().show();
        } else if (data.activities.length == 0) {
            // if no activity, say so
            this.getActivitiesNone().show();
        } else {
            // there is activity so show it in list
            this.getActivitiesList().show();
            this.getActivitiesList().getStore().setData(data.activities);
            var listHeight = 62 * data.activities.length;
            this.getActivities().setHeight(listHeight);
            this.getActivitiesList().setHeight(listHeight);
        }
    },
    
    
    /* Description: Show user's public profile page in any direction.
     *
     * Arguments:   - direction: slide animation direction
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showUserPageHelper: function(direction) {
        var container = this.mainController.usercard.getParent().getParent();
        container.getLayout().setAnimation({type:'slide', direction:direction});
        container.setActiveItem('#userdetailcontainer');
    },
    
    
    /* Description: Show user's public profile page by sliding right.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showUserPage: function() {
        this.showUserPageHelper('right');
    },
    
    
    /* Description: Generate HTML to be used in title of a user's sub-page
     *              such as list of playlists, followers, followings.
     *
     * Arguments:   - text: string indicating of current sub-page.
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    genTitleHtml: function(text) {
        var title = '<p class="row1 ellipsis">'
            + this.mainController.other_user_name + '</p>'+
            '<p class="row2 ellipsis">'+text+'</p>';
        return title;
    },
    
    
    /* Description: Navigate to a user's "list of playlists" page from the
     *              user's public profile details page.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showPlaylistsPage: function() {
        var container = this.mainController.usercard.getParent().getParent();
        
        // get playlists
        this.mainController.getPlaylists(
            this.utilsController.getUserPlaylistsUrl(
                this.mainController.other_user_id));
        
        // show user's playlists page
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#playlistscontainer');
        
        // set titlebar appropriately
        this.getUserTitleBarPlaylists().setTitle(
            this.genTitleHtml('Playlists'));
    },
    
    
    /* Description: Navigate to a user's "list of followers" page from the 
     *              user's public profile details page.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showFollowersPage: function() {
        var container = this.mainController.usercard.getParent().getParent();
        
        // get users
        this.mainController.getUsers(
            this.utilsController.getUserFollowersUrl(
                this.mainController.other_user_id));
        
        // show user's followers page
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#userlistcontainer');
        
        // set titlebar appropriately
        this.getUserTitleBarUsers().setTitle(
            this.genTitleHtml('Followers'));
    },
    
    
    /* Description: Navigate to a user's "list of following" page from the 
     *              user's public profile details page.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showFollowingPage: function() {
        var container = this.mainController.usercard.getParent().getParent();
        
        // get users
        this.mainController.getUsers(
            this.utilsController.getUserFollowingUrl(
                this.mainController.other_user_id));
        
        // show user's following page
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#userlistcontainer');
        
        // set titlebar appropriately
        this.getUserTitleBarUsers().setTitle(
            this.genTitleHtml('Following'));
    }
});