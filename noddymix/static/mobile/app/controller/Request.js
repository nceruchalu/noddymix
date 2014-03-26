/*
 * Description:
 *   This controller is for the RequestPanel view
 *
 * Author:
 *   Nnoduka Eruchalu
 */
Ext.define('NoddyMix.controller.Request', {
    extend:'Ext.app.Controller',
        
    config: {
        refs: {
            requestForm:'requestpanel #form',
            requestSubmit:'requestpanel #submitButton'
        },
        
        control: {
            requestSubmit: {
                tap:'submitRequestForm'
            }
        }
    },
    
    // called after the Application is launched.
    launch: function(app) {
        this.utilsController = app.getController('Utils');
        this.mainController = app.getController('Main');
    },
    
    
    /*
     * Description: Submit request form to server and inform user of success
     *              status.
     *
     * Arguments:   None
     * Return:      None
     *
     * Author:      Nnoduka Eruchalu
     */
    submitRequestForm: function() {
        var controller = this;
        
        // inform user that controller is working via a load mask.
        this.utilsController.showLoadMask("Submitting");
        this.getRequestForm().submit({
            method:'POST',
            url:'/request/',
            params:{
                csrfmiddlewaretoken:controller.mainController.csrftoken
            },
            success: function(form, result) { // result.success == true
                // done with load mask
                controller.utilsController.hideLoadMask();
                controller.getRequestForm().reset();
                Ext.Msg.alert('Success', 'Request submitted', Ext.emptyFn);
            },
            failure: function(form, result) { // result.success != true
                // done with load mask
                controller.utilsController.hideLoadMask();
                Ext.Msg.alert('Failure', 'Request not submitted', Ext.emptyFn);
            }
        });
    }
})