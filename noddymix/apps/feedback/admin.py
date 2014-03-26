from django.contrib import admin
from noddymix.apps.feedback.models import Feedback
from noddymix.apps.feedback.forms import FeedbackForm

class FeedbackAdmin(admin.ModelAdmin):
    """
    Description: Representation of Feedback model in admin interface
                 with a custom form
            
    Author:      Nnoduka Eruchalu
    """
    form = FeedbackForm

admin.site.register(Feedback, FeedbackAdmin)
