# Create your views here.
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
import urllib, json

from noddymix.apps.activity.models import Activity
from noddymix.apps.account.models import User
from noddymix.apps.audio.models import Song

def setup_activity_json(activity):
    """
    Description: Convert an Activity instance to a json representation
    
    Arguments:   - activity: Activity instance under consideration
    Return:      dictionary with actvity properties as string-value keys:
                 - actor: full name of actor
                 - verb:  verb
                 - object: object's full name if a User or string representation
                 - target: target's full name if a User or string representation
                 - timesince: time passed since activity occured.
                 
    Author:      Nnoduka Eruchalu
    """
    obj = activity.object
    if obj != None: # if object is not None, then get exact type
        if type(obj) == User:
            obj = activity.object.get_full_name()
        else:
            obj = str(obj)
    
    target = activity.target
    if target != None: # if target is not None, then get exact type
        if type(target) == User:
            target = activity.target.get_full_name()
        else:
            target = str(target)
        
    activity_json = {
        'actor':activity.actor.get_full_name(),
        'verb':activity.verb,
        'object':obj,
        'target':target,
        'timesince':activity.timesince()}
    return activity_json


def setup_activities_json(activities):
    """
    Description: Convert a querset of activities into a list of activities
                 where each activity is a json-formatted dictionary
    
    Arguments:   - activities: A QuerySet of activities
    Return:      a list of json representations of the passed in activities
                 
    Author:      Nnoduka Eruchalu
    """
    activities_json = []
    for activity in activities:
        activities_json.append(setup_activity_json(activity))
    return activities_json


def activity(request, id):
    """
    Description: Render the html page of an activity.
                 Mobile requests will be redirected to the home page.
    
    Arguments:   - request: HttpRequest object
                 - id:      Id of Activity of interest
    Return:      HttpResponse object with activity page text
                 
    Author:      Nnoduka Eruchalu
    """
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    activity = get_object_or_404(Activity, id=id)
    return render_to_response('activity/activity.html',
                              {'activity':activity},
                              context_instance=RequestContext(request))


def activities_user(request, id):
    """
    Description: Render activities of a given user, where user is an actor.
                 Mobile requests will be redirected to the home page.
                 
    Arguments:   - request: HttpRequest object
                 - id:      Id of User of interest
    Return:      HttpResponse object with activities page text
    
    Todo:        Include activities when given user is the target
    Author:      Nnoduka Eruchalu
    """
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    user = get_object_or_404(User, id=id)
    return render_to_response('activity/activities.html',
                              {'activities':user.activities.all()},
                              context_instance=RequestContext(request))
    

@login_required
def delete(request, id):
    """
    delete activity
    Description: Delete specific activity object.
                 Should only be called via ajax and with a POST method
                 
    Arguments:   - request: HttpRequest object
                 - id:      Id of Activity to be deleted
    Return:      HttpResponse object with empty json data.
    
    Author:      Nnoduka Eruchalu
    """
    activity = get_object_or_404(Activity, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user==activity.actor):
        activity.delete()
        return HttpResponse(json.dumps({}), content_type="application/json")
    
    # shouldn't get this far
    raise Http404
