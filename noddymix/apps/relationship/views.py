from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponseRedirect, HttpResponse
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
from django.conf import settings
import json

from noddymix.apps.account.models import User
from noddymix.apps.relationship.models import Following
from noddymix.apps.activity import activity
from noddymix.utils import users_helper

def setup_user_json(request, user, is_following):
    """
    Description: Convert a User object to a json-formatted representation
                 
    Arguments:   - request:      HttpRequest object
                 - user:         User object instance of interest
                 - is_following: Is request.user is following user?
    Return:      Dictionary representation of Song object with keys:
                 - id:               user's id in db
                 - name:             user's full name
                 - avatar:           url to user's avatar image
                 - following_status: 'following'/'follow' based off is_following
                                      
    Author:      Nnoduka Eruchalu
    """
    if user.avatar:
        avatar = user.avatar_thumbnail.url
    else:
        avatar = settings.STATIC_URL+"img/avatar_thumbnail.jpg"
        
    if (request.user.is_authenticated()) and (request.user != user):
        following_status = 'following' if is_following else 'follow'
    else:
        following_status = 'hidden'
        
    user_json = {'id':user.id,
                 'name':user.get_full_name(),
                 'avatar':avatar,
                 'following_status':following_status}
    
    return user_json
    

def setup_users_json(request, users_followings):
    """
    Description: Parse a list of user_following objects into a list of json
                 representations for each user.
                 
    Arguments:   - request:         HttpRequst object
                 - user_followings: List of objects where each has the format:
                                    (<User>, <boolean is_following status>)
    Return:      list of user representation dictionaries.
    
    Author:      Nnoduka Eruchalu
    """
    users_json = []
    for user, is_following in users_followings:
        users_json.append(setup_user_json(request, user, is_following))
    return users_json


def get_user_json(id, request):
    """
    Description: get user data in json format where user is indicated by id. 
                  If user doesnt exist, return false
    
    Arguments:   - id:      id of User object
                 - request: HttpRequest object
                 - is_mobile: True/False for if this is a mobile request
    Return:      JSON-formatted user representation or False (if no user)
                 
    Author:      Nnoduka Eruchalu
    """
    try:
        user = User.objects.get(id=id)
        # is requesting user currently following profile?
        is_following = Following.objects.is_following(
            request.user.id,user)
        user_json = setup_user_json(request, user, is_following)
    except User.DoesNotExist:
        user_json = False
    
    return user_json


# Create your views here.
def followers(request, id):
    """
    Description:  Show a user's followers where each follower is marked with
                  status that indicates its relationship with request.user
                  or not.
                                               
    Arguments:   - request: HttpRequest object
                 - id:      id of User under consideration
    Return:      HttpResponse object
                                  
    Author:      Nnoduka Eruchalu
    """
    user = get_object_or_404(User, id=id)
    
    if request.is_ajax():
        # is requesting user currently following profile?
        user_following_status = Following.objects.is_following(
            request.user.id,user)
    
        # users that follow this user
        followers_all = user.followers.all().order_by('-id')
        template_context = users_helper(request, followers_all)
        followers_list = [u.follower for u in template_context['users']]
        followers_status = []
        for follower in followers_list:
            followers_status.append(
                Following.objects.is_following(request.user.id, follower))
        
        followers = zip(followers_list, followers_status)
        del template_context['users']
        
        if request.mobile:
            template_context['users'] = setup_users_json(request, followers)
        
        else:
            template_context['content'] = render_to_string(
                'relationship/content.html',
                {'profile':user,
                 'profile_following':user_following_status,
                 'users':followers,
                 'active_tab':'followers'},
                context_instance=RequestContext(request))
        
        json_response = json.dumps(template_context)
        return HttpResponse(json_response, content_type="application/json")
    
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('headfoot.html',
                              context_instance=RequestContext(request))


def following(request, id):
    """
    Description:  Show a user's followings where each following user is marked
                  status that indicates its relationship with request.user
                                               
    Arguments:   - request: HttpRequest object
                 - id:      id of User under consideration
    Return:      HttpResponse object
    
    Author:      Nnoduka Eruchalu
    """
    user = get_object_or_404(User, id=id)
    
    if request.is_ajax():
        # is requesting user currently following profile?
        user_following_status = Following.objects.is_following(
            request.user.id,user)
    
        # users that this user is following
        followings_all = user.following.all().order_by('-id')
        template_context = users_helper(request, followings_all)
        following_list = [u.followed for u in template_context['users']]
        following_status = []
        for followed in following_list:
            following_status.append(
                Following.objects.is_following(request.user.id, followed))
        
        following = zip(following_list, following_status)
        del template_context['users']
                
        if request.mobile:
            template_context['users'] = setup_users_json(request, following)
            
        else:
            template_context['content'] = render_to_string(
                'relationship/content.html',
                {'profile':user,
                 'profile_following':user_following_status,
                 'users':following,
                 'active_tab':'following'},
                context_instance=RequestContext(request))
                
        json_response = json.dumps(template_context)
        return HttpResponse(json_response, content_type="application/json")
    
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
        
    return render_to_response('headfoot.html',
                              context_instance=RequestContext(request))


@login_required
def follow(request, id):
    """
    Description:  Follow a user if authenticated and not trying to follow
                  yourself.
                                               
    Arguments:   - request: HttpRequest object
                 - id:      id of User under consideration
    Return:      HttpResponse object
    
    Author:      Nnoduka Eruchalu
    """
    other_user = get_object_or_404(User, id=id)
        
    # only follow another user
    if (request.method=="POST") and (request.user != other_user):
        Following.objects.follow(request.user, other_user)
        # log this activity
        activity.send(request.user, verb="followed", target=other_user)
    
    if request.is_ajax():
        json_response = json.dumps({
                'status': 'following' if Following.objects.is_following(request.user.id, other_user) else 'follow',
                })
        return HttpResponse(json_response, content_type="application/json")
    
    # if not an ajax call then redirect to page of user to be followed
    return HttpResponseRedirect(reverse("userpage", args=[id]))
    
   


@login_required
def unfollow(request, id):
    """
    Description:  Follow a user if authenticated and not trying to unfollow
                  yourself.
                                               
    Arguments:   - request: HttpRequest object
                 - id:      id of User under consideration
    Return:      HttpResponse object
    
    Author:      Nnoduka Eruchalu
    """
    other_user = get_object_or_404(User, id=id)
    
    # only unfollow another user
    if (request.method=="POST") and (request.user != other_user):
        Following.objects.unfollow(request.user, other_user)
        
    if request.is_ajax():
        # when this function is done return following status
        json_response = json.dumps({
                'status': 'following' if Following.objects.is_following(request.user.id, other_user) else 'follow',
                })
        return HttpResponse(json_response, content_type="application/json")
            
    # if not an ajax call then redirect to page of user to be unfollowed
    return HttpResponseRedirect(reverse("userpage", args=[id]))
