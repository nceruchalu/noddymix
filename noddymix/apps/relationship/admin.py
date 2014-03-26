from django.contrib import admin
from noddymix.apps.relationship.models import Following


def delete_selected_f(modeladmin, request, queryset):
    """
    Description: A version of the "deleted selected objects" action which calls 
                 the Following model's `delete()` method. This is needed 
                 because the default version uses `QuerySet.delete()`, which
                 doesn't call the model's `delete()` method.
    
    Arguments:   - modeladmin: The Following ModelAdmin
                 - request:    HttpRequest object representing current request
                 - queryset:   QuerySet of set of Song objects selected by user.
    Return:      None
          
    Author:      Nnoduka Eruchalu
    """
    for obj in queryset:
        obj.delete()
delete_selected_f.short_description = "Delete selected followings"


class FollowingAdmin(admin.ModelAdmin):
    """
    Description: Representation of the Following model in the admin interface.
    
    Functions:   - get_actions: disable some actions for this ModelAdmin
                                              
    Author:      Nnoduka Eruchalu
    """
     
    actions = [delete_selected_f]
    
    def get_actions(self, request):
        """
        Description: Permanently disable the default "deleted selected objects" 
                     action for this ModelAdmin
          
        Arguments:   - request: HttpRequest object representing current request
        Return:      Updated list of actions.
                    
        Author:      Nnoduka Eruchalu
        """
        actions = super(FollowingAdmin, self).get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
    

admin.site.register(Following, FollowingAdmin)
