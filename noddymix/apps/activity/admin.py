from django.contrib import admin
from noddymix.apps.activity.models import Activity


class ActivityAdmin(admin.ModelAdmin):
    """
    Description: ModelAdmin associated with the Activity model.
    
    Author:      Nnoduka Eruchalu
    """
    
    date_hierarchy = 'date_added'
    list_display = ('__unicode__', 'actor', 'verb', 'object', 'target',)
    list_filter = ('date_added',)

admin.site.register(Activity, ActivityAdmin)
