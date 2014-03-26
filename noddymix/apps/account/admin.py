from django.contrib import admin
from noddymix.apps.account.models import User
from django.contrib.auth.admin import UserAdmin 
from django.contrib.auth.forms import UserChangeForm
from django.utils.translation import ugettext_lazy as _

# import LogEntry to monitor the admin actions of admin users via the admin UI
from django.contrib.admin.models import LogEntry


def delete_selected_u(modeladmin, request, queryset):
    """
    Description: A version of the "deleted selected objects" action which calls 
                 the model's `delete()` method. This is needed because the 
                 default version uses `QuerySet.delete()`, which doesn't call 
                 the model's `delete()` method.
    
    Arguments:   - modeladmin: The User ModelAdmin
                 - request:    HttpRequest object representing current request
                 - queryset:   QuerySet of set of User objects selected by admin
    Return:      None
          
    Author:      Nnoduka Eruchalu
    """
    for obj in queryset:
        obj.delete()
delete_selected_u.short_description = "Delete selected users"


class MyUserChangeForm(UserChangeForm):
    """
    Description: NoddyMix's version of the user change form which update's the  
                 metadata specifying associated model to the custom User model
            
    Author:      Nnoduka Eruchalu
    """
    
    class Meta:
        model = User


class MyUserAdmin(UserAdmin):
    """
    Description: NoddyMix's version of the ModelAdmin associated with the User 
                 model. It is modified to work with the custom User model
    
    Functions:   - get_actions: disable some actions for this ModelAdmin
            
    Author:      Nnoduka Eruchalu
    """
    # use the custom "delete selected objects" action
    actions = [delete_selected_u]
    list_display =  ('username', 'email', 'first_name', 'last_name', 
                     'date_joined','is_staff')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Photos'), {'fields': ('avatar', 'cover')}),
        (_('Settings'), {'fields': ('activity_public',)}),
        (_('Statistics'), {'fields': ('num_playlists', 'num_followers',
                                      'num_following')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser',
                                       'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        )
    
    readonly_fields = ('avatar', 'cover',
                       'num_playlists', 'num_followers', 'num_following',)
        
    # changing the displayed fields via `fieldsets` requires updating the form
    form = MyUserChangeForm
    
    def get_actions(self, request):
        """
        Description: Permanently disable the default "deleted selected objects" 
                     action for this ModelAdmin
          
        Arguments:   - request: HttpRequest object representing current request
        Return:      Updated list of actions.
                    
        Author:      Nnoduka Eruchalu
        """
        actions = super(MyUserAdmin, self).get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions


class LogEntryAdmin(admin.ModelAdmin):
    """
    Description: Representation of the LogEntry model in the admin interface.
      
    Functions:   - has_add_permission:    prevent users from adding entries
                 - has_delete_permission: prevent users from deleting  entries
                 - change_view:           prevent users from directly visiting 
                                          a LogEntry object's change page.
                                          
    Author:      Nnoduka Eruchalu
    """
    
    list_display = ('action_time', 'user', 'content_type', 'object_id', 
                    'object_repr', 'action_flag', 'change_message')
    ordering = ('-action_time',)
    list_filter = ('action_time', 'content_type')
    actions = None # no bulk actions
    
    #we don't want people changing these historical records:
    readonly_fields = ('action_time', 'user', 'content_type', 'object_id', 
                    'object_repr', 'action_flag', 'change_message')
    
    def has_add_permission(self, request):
        """
        Description: Prevent users from adding object entries
          
        Arguments:   - request: HttpRequest object representing current request
        Return:      Boolean indicating if admin user's have add permissions.
        
        Author:      Nnoduka Eruchalu
        """
        return False
    
    def has_delete_permission(self, request, obj=None):
        """
        Description: Prevent users from deleting object entries
          
        Arguments:   - request: HttpRequest object representing current request
                     - obj:     Object to be deleted
        Return:      Boolean indicating if admin user's have delete permissions.
        
        Author:      Nnoduka Eruchalu
        """
        return False
    
    def __init__(self, *args, **kwargs):
        super(LogEntryAdmin, self).__init__(*args, **kwargs)
        # dont want users to be able to see links to modify LogEntry objects
        self.list_display_links = (None,)
        
    
    def change_view(self, request, object_id, form_url='', extra_context=None):
        """
        Description: Already prevented users from being able to see links to 
                     LogEntry object change_view pages (in __init__). This 
                     function prevents users from directly accessing the change 
                     view page. After all the URLs to admin UI's change view 
                     pages are pretty easy to figure out.
          
        Arguments:   - request:   HttpRequest object representingcurrent request
                     - object_id: id of object to be viewed on edit page
        Return:      Boolean indicating if admin user's have delete permissions.
                    
        Author:      Nnoduka Eruchalu
        """
        from django.core.urlresolvers import reverse
        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(reverse('admin:admin_logentry_changelist'))


#Register UserAdmin
admin.site.register(User, MyUserAdmin)

#Register LogEntryAdmin
admin.site.register(LogEntry, LogEntryAdmin)


