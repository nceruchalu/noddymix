/*
 * Description:
 *   This controller is associated with user authentication and autheticated
 *   user profiles and settings.
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.Account', {
    extend:'Ext.app.Controller',
        
    config: {
        refs: {
            facebookLogin: 'accountlogin #facebook',
            twitterLogin: 'accountlogin #twitter',
            googleLogin: 'accountlogin #google',
            logout: 'accountprofile #logoutButton',
            
            profile:'accountprofile',
            
            summary:'accountsummary',
            summaryAvatar:'accountprofile accountsummary #avatar',
            summaryCover:'accountprofile accountsummary #cover',
            summaryName: 'accountprofile accountsummary #name',
            summaryPlaylists:'accountprofile accountsummary #playlists',
            summaryFollowers:'accountprofile accountsummary #followers',
            summaryFollowing:'accountprofile accountsummary #following',
            
            connectedAccounts:'accountprofile #connected-accounts',
            facebookToggle: 'accountprofile #facebook',
            twitterToggle: 'accountprofile #twitter',
            googleToggle: 'accountprofile #google',
            
            settings:'accountsettings',
            settingsForm:'accountsettings #form',
            settingsActivityPublic:'accountsettings #activity_public',
            settingsSubmit:'accountsettings #submitButton',
            
            accountTitleBar:'accounttitlebar',
            accountBackButton:'accounttitlebar #backButton'
        },
        
        control: {
            facebookLogin: {
                tap:'loginViaFacebook'
            },
            twitterLogin: {
                tap:'loginViaTwitter'
            },
            googleLogin: {
                tap:'loginViaGoogle'
            },
            logout: {
                tap:'doLogout'
            },
            profile: {
                updateData:'updateProfileData'
            },
            facebookToggle: {
                change: 'socialChanged'
            },
            twitterToggle: {
                change: 'socialChanged'
            },
            googleToggle: {
                change: 'socialChanged'
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
            settings: {
                updateData:'updateSettingsData'
            },
            settingsSubmit: {
                tap:'submitSettingsForm'
            },
            accountBackButton: {
                tap:'showProfilePage'
            }
        }
    },
    
    // called after the Application is launched
    launch: function(app) {
        this.utilsController = app.getController('Utils');
        this.mainController = app.getController('Main');
                
        // start off by assuming change events will be handled
        this.handleChange = true;
    },
     
    
    /*
     * Description: Navigate user to page for authentication with Facebook
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    loginViaFacebook: function() {
        window.location.replace('/login/facebook/'); 
    },
    
    
     /*
     * Description: Navigate user to page for authentication with Twitter
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    loginViaTwitter: function() {
        window.location.replace('/login/twitter/'); 
    },
    
    
    /*
     * Description: Navigate user to page for authentication with Google
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    loginViaGoogle: function() {
        window.location.replace('/login/google-oauth2/');
    },
    
    
    /*
     * Description: Navigate user to page for logout, regardless of login
     *              mechanism
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    doLogout: function() {
        window.location.replace('/logout/');
    },
    
    
    /*
     * Description: Update user's summary data, i.e. profile images and
     *              statistics (number of playlists, followers, followings)
     *
     * Arguments:   - data: object containing all summary data as properties
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    updateSummaryData: function(data) {
        this.getSummaryAvatar().setSrc(data.avatar_small);
        this.getSummaryCover().setSrc(data.cover_small);
        this.getSummaryName().setData({name:data.name});
        this.getSummaryPlaylists().setData({count: data.num_playlists});
        this.getSummaryFollowers().setData({count:data.num_followers});
        this.getSummaryFollowing().setData({count:data.num_following});
    },
    
    
    /*
     * Description: Update user's profile data data which consists of two parts:
     *              - summary data: profile images and statistics
     *              -connected social media accounts (twitter, facebook, google)
     *
     * Arguments:   -data: object containing summary data and connected accounts
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    updateProfileData: function(data) {
        // update user's images and statistics
        this.updateSummaryData(data);
        
        // update user's connected accounts
        // set social account ids, and prevent change event handlers from
        // responding to any changes about to happen
        this.handleChange = false;
        var facebook_data = this.getFacebookToggle().getData();
        var twitter_data = this.getTwitterToggle().getData();
        var google_data = this.getGoogleToggle().getData();
        
        facebook_data.id = data.facebook_id;
        twitter_data.id = data.twitter_id;
        google_data.id = data.google_id;
        
        this.getFacebookToggle().setData(facebook_data);
        this.getTwitterToggle().setData(twitter_data);
        this.getGoogleToggle().setData(google_data);
                
        if (data.facebook_id >= 0) {
            this.getFacebookToggle().setValue(1);
        } else {
            this.getFacebookToggle().setValue(0);
        }
        
        if (data.twitter_id >= 0) {
            this.getTwitterToggle().setValue(1);
        } else {
            this.getTwitterToggle().setValue(0);
        }
        
        if (data.google_id >= 0) {
            this.getGoogleToggle().setValue(1);
        } else {
            this.getGoogleToggle().setValue(0);
        }
        
        // now allow change event handlers respond to change events
        this.handleChange = true;
    },
    
    
    /*
     * Description: Callback when user touches slider to either connect or
     *              disconnect a social media account. Connecting simply means
     *              re-logging in via the selected account. Disconnecting
     *              requires redirecting the user to a special 'disconnect' URL.
     *
     * Arguments:   - field:    Ext.field.Toggle
     *              - slider:   Ext.slider.Toggle instance
     *              - thumb:    Ext.slider.Thumb instance
     *              - newValue: the new value of this thumb
     *                          1 means connect; 0 means disconnect
     *              - oldValue: old value of this thumb
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    socialChanged: function(field, slider, thumb, newValue, oldValue, eOpts) {
        var url;
        if (this.handleChange) {
            if (newValue == 1) {
                // if trying to associate the account, login
                url = '/login/' + field.getData().socialAuthUrl + '/';
            } else if (newValue == 0) {
                url = '/disconnect/'+field.getData().socialAuthUrl + '/' 
                    + field.getData().id + '/';
            }
            window.location.replace(url); 
        }
    },
    
    
    /*
     * Description: Show current user's playlists page
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showPlaylistsPage: function() {
        this.mainController.slideNavList.select(
            this.mainController.slideNavItemId['playlists']);
    },
    
    
    /*
     * Description: Callback when the user's settings are updated.
     *              Simply saves the value of the checkbox to make user's
     *              activity public
     *
     * Arguments:   - data: object with user's settings as properties
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    updateSettingsData: function(data) {
        this.getSettingsActivityPublic().setChecked(data.activity_public);
    },
    
    
    /*
     * Description: Save the user's settings server-side.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    submitSettingsForm: function() {
        var controller = this;
        
        // give user some feedback, via a load mask, that something is happening
        this.utilsController.showLoadMask("Submitting");
        this.getSettingsForm().submit({
            method:'POST',
            url:'/settings/',
            params:{
                csrfmiddlewaretoken:controller.mainController.csrftoken
            },
            success: function(form, result) { // result.success == true
                // done with load mask
                controller.utilsController.hideLoadMask();
                Ext.Msg.alert('Success', 'Settings updated', Ext.emptyFn);
            },
            failure: function(form, result) { // result.success != true
                // done with load mask
                controller.utilsController.hideLoadMask();
                Ext.Msg.alert('Failure', 'Settings not updated', Ext.emptyFn);
            }
        });
    },
    
    
    /*
     * Description: Show authenticated user's profile page
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    showProfilePage: function() {
        var container = this.mainController.usercard.getParent().getParent();
        container.getLayout().setAnimation({type:'slide', direction:'right'});
        container.setActiveItem('#accountprofilecontainer');
    },
    
    
    /*
     * Description: Show authenticated user's followers' page
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
                this.mainController.user_id));
        
        // show user page
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#userlistcontainer');
        
        // set titlebar appropriately
        this.getAccountTitleBar().setTitle('Followers');
    },
    
    
    /*
     * Description: Show authenticated user's followings' page
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
                this.mainController.user_id));
        
        // show user page
        container.getLayout().setAnimation({type:'slide', direction:'left'});
        container.setActiveItem('#userlistcontainer');
        
        // set titlebar appropriately
        this.getAccountTitleBar().setTitle('Following');
    }
})