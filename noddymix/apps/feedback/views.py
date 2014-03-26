# Create your views here.
from django.shortcuts import render_to_response
from django.http import HttpResponseRedirect, HttpResponse
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.contrib import messages
from django.core.mail import EmailMessage
from django.conf import settings

from noddymix.apps.feedback.forms import FeedbackForm

import json

def feedback(request):
    """
    Description: Display and process feedback form. 
                   
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse
    
    Author:      Nnoduka Eruchalu
    """
    # on a form submission
    if request.method == 'POST':
        form = FeedbackForm(request.POST)
        if form.is_valid():
            form.save()
            
            # email admins
            cd = form.cleaned_data
            body = "Subject: "+cd['subject']+"\nEmail: "+cd['email']+\
                "\n\nMessage:\n"+cd['body']
            subject = "email from noddymix.com request form"
            email = EmailMessage(subject, body, settings.DEFAULT_FROM_EMAIL,
                                 ["request@noddymix.com"],
                                 headers={'Reply-To':cd['email']})
            # email sending only works if on production server
            if settings.DEBUG:
                print body
            else:
                email.send(fail_silently=True)
            
            # if a mobile page, return success
            if request.mobile and request.is_ajax():
                json_response = json.dumps({'success':True})
                return HttpResponse(json_response, 
                                    content_type="application/json")
            else:
                # desktop page
                messages.add_message(
                    request, messages.SUCCESS,"Feedback successfully submitted")
                return HttpResponseRedirect(reverse('feedback'))     
    
    # on page load
    else:
        # a mobile page shouldn't make a direct request here
        if request.mobile:
            return HttpResponseRedirect('/')
        
        # a desktop page should get a blank form
        form = FeedbackForm()
        
    # mobile requests will only get here if the form was invalid
    if request.mobile and request.is_ajax():
        json_response = json.dumps({'success':False})
        return HttpResponse(json_response, content_type="application/json")
    
    return render_to_response('feedback/feedback.html',
                              {'form':form},
                              context_instance=RequestContext(request))
