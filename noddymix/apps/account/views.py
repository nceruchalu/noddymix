# Create your views here.
from django.shortcuts import render_to_response, get_object_or_404
from django.http import HttpResponseRedirect, Http404, HttpResponse
from django.core.urlresolvers import reverse
from django.template import RequestContext
from django.contrib.auth.decorators import login_required
from django.core.files.storage import default_storage
from django.template.loader import render_to_string
from django.contrib import messages
from django.conf import settings

from noddymix.apps.account.models import User
from noddymix.apps.account.forms import UserSettingsForm, UploadAvatarForm, \
    UploadCoverForm
from noddymix.apps.relationship.models import Following
from noddymix.apps.audio.models import Playlist
from noddymix.apps.audio.views import playlists_helper
from noddymix.apps.activity.views import setup_activities_json
from social_auth.context_processors import social_auth_by_name_backends

import json


def get_session_settings(request):
    """    
    Description: Get settings from request session for anonymous user.
                 If a setting isn't already set, then create settings that 
                 default to the same defaults an authenticated user gets
       
                 sample usage:
                   form= UserSettingsForm(initial=get_session_settings(request))
                   
    Arguments:   - request: HttpRequest object
    Return:      None 
    
    Notes:       No anonymous user settings yet, but this will be used when
                 authenticated users have settings to autoplay playlists 
                 (autoplay_playlist) and/or songs (autoplay_songpage)
          
    Author:      Nnoduka Eruchalu
    """
     # for an anonymous user, create settings if not already recorded
     # use the same default settings an authenticated user gets.
     # settings are saved in the session object -- don't want to clutter
     # db with this.
    if 'settings' not in request.session:
        # if settings not already recorded, set defaults
        request.session['settings'] = {
            'autoplay_playlist':User._meta.get_field_by_name(
                'autoplay_playlist')[0].default,
            'autoplay_songpage':User._meta.get_field_by_name(
                'autoplay_songpage')[0].default
            }
        # request.session hasn't been directly modified, so force a session save
        request.session.modified = True
            
    return request.session['settings']
            

def set_session_settings(request, settings):
    """                 
    Description: Set anonymous user's settings in request.session
                 This is careful to ensure a settings object exists before
                 updating it.
                 
                 sample usage:
                   # for an anonymous user, update the session data
                   form = UserSettingsForm(request.POST)
                   if form.is_valid():
                       set_session_settings(
                           request, 
                           {'autoplay_playlist':
                                form.cleaned_data['autoplay_playlist'],
                            'autoplay_songpage':
                                form.cleaned_data['autoplay_songpage']
                            })
                   
    Arguments:   - request:  HttpRequest object
                 - settings: settings to be saved
    Return:      None 
    
    Notes:       No anonymous user settings yet, but this will be used when
                 authenticated users have settings to autoplay playlists 
                 (autoplay_playlist) and/or songs (autoplay_songpage)
          
    Author:      Nnoduka Eruchalu
    """
    # first ensure the settings object exists
    get_session_settings(request)
    # then update the settings
    request.session['settings'].update(settings)
    # request.session hasn't been directly modified, so force a session save
    request.session.modified = True


def user_summary_data(user):
    """
    Description: Get 'mobile context' summary data for a given user
                 
    Arguments:   - user instance
    Return:      dictionary representing user's summary data with keys:
                 - avatar_small:   avatar for mobile user-page
                 - cover_small:    cover photo for mobile user-page
                 - num_playlists:  user's number of playlists
                 - num_followers:  how many are following this user?
                 - num_followings: how many is this user following?
              
    Author:      Nnoduka Eruchalu
    """
    # get avatar if available, else use default
    if user.avatar:
        avatar_small = user.avatar_mobile_small.url
    else:
        avatar_small = settings.STATIC_URL + "img/avatar_mobile_small.jpg"
        
    # get cover photo if available, else use default
    if user.cover:
        cover_small = user.cover_small.url
    else:
        cover_small = settings.STATIC_URL + "img/cover_small.jpg" 
    
    data = {'avatar_small':avatar_small,
            'cover_small':cover_small,
            'name':user.get_full_name(),
            'num_playlists':user.num_playlists,
            'num_followers':user.num_followers,
            'num_following':user.num_following
            }
    
    return data


@login_required
def profile(request):
    """
    Description: Render authenticated user's profile
                                  
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with user profile data
              
    Author:      Nnoduka Eruchalu
    """
    # get social authentication data
    soc_auth = social_auth_by_name_backends(request)['social_auth']
    
    if request.is_ajax():
        # only a mobile page will request via ajax
        # get profile summary data
        data = user_summary_data(request.user)
        
        # Record ids for each of this user's connected social accounts.
        # An unconnected social account will be marked with an invalid id of -1
        data['twitter_id'] = soc_auth['twitter'].id if \
            soc_auth['twitter'] else -1,
        data['facebook_id'] = soc_auth['facebook'].id if \
            soc_auth['facebook'] else -1,
        data['google_id'] = soc_auth['google-oauth2'].id if \
            soc_auth['google-oauth2'] else -1
        
        json_response = json.dumps(data)
        return HttpResponse(json_response, content_type="application/json")
    
    # a mobile request will be redirected to the homepage
    if request.mobile:
        return HttpResponseRedirect('/')
    
    # Django templates don't like dictionary keys with hyphens so copy
    # 'google-oauth2' into a new key, 'google'.
    soc_auth['google'] = soc_auth['google-oauth2']
    return render_to_response('account/profile.html',
                              {'soc_auth':soc_auth,
                               'avatarform':UploadAvatarForm(),
                               'coverform':UploadCoverForm()},
                              context_instance=RequestContext(request))


def loginerror(request):
    """
    Description: Login Error view.
                 Redirect authenticated desktop users to their profile, and 
                 anonymous desktop users to the login page.
                 Mobile users will have authentication errors logged in session
                 
    Arguments:   - request: HttpRequest object
    Return:      None
              
    Author:      Nnoduka Eruchalu
    """
    # if a mobile user has authentication issues, log it and redirect to 
    # homepage
    if request.mobile:
        request.session["auth_error"] = True
        return HttpResponseRedirect('/')
                
    # if desktop user is logged in, redirect to profile page, else to login page
    if request.user.is_authenticated():
        return HttpResponseRedirect(reverse('profile'))
    else:
        return HttpResponseRedirect(reverse('login'))


def login(request):
    """
    Description: Login view.
                 Authenticated desktop users are redirected to their profiles.
                 Unauthenticated desktop users are shown the login page.
                 Mobile users are redirected to their homepage
                 
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with redirection or login page text
              
    Author:      Nnoduka Eruchalu
    """
    # if on a mobile device. Go to web app homepage, and handle this there.
    if request.mobile:
        return HttpResponseRedirect('/')
    
    # if user is already logged in, redirect to profile page
    if request.user.is_authenticated():
        return HttpResponseRedirect(reverse('profile'))
    return render_to_response('account/login.html',
                              context_instance=RequestContext(request))    


@login_required
def settingspage(request):
    """
    Description: User Settings view
                 - Form submissions will be validated
                 - Mobile GET requests will get a dictionary of user's settings
                   if via ajax, else redirect to the homepage
                 - Desktop GET requests will get a settings page populated with
                   user's settings.
                 
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with redirection or page text
              
    Author:      Nnoduka Eruchalu
    """
    # on a form submission
    if request.method == 'POST':
        form = UserSettingsForm(request.POST, 
                                instance=request.user)
        # validate form
        if form.is_valid():
            form.save()
            # if a mobile page, return success
            if request.mobile and request.is_ajax():
                json_response = json.dumps({'success':True})
                return HttpResponse(json_response, 
                                    content_type="application/json")
            # on a desktop, so reload this page via a GET
            return HttpResponseRedirect(reverse('settings'))
    
    # on a GET request (i.e., initial page load)
    else:
        # if a mobile page, return the form data
        if request.mobile:
            if request.is_ajax():
                json_response = json.dumps({
                        'activity_public':request.user.activity_public
                        })
                return HttpResponse(json_response, 
                                    content_type="application/json")
            else:
                # a mobile page shouldn't make a non-ajax GET request here
                return HttpResponseRedirect('/')
            
        form = UserSettingsForm(instance=request.user)
    
    # mobile requests that get to this point in the code were POSTs (form
    # submissions) that failed.
    if request.mobile and request.is_ajax():
        json_response = json.dumps({'success':False})
        return HttpResponse(json_response, content_type="application/json")
        
    return render_to_response('account/settings.html',
                              {'form':form},
                              context_instance=RequestContext(request))


def userpage(request, id):
    """
    Description: Show a user's public profile page and playlists
                 - a mobile device cannot make a non-ajax request for this page
                 - a desktop's non-ajax request returns a page that calls back
                   via ajax.
                 - mobile ajax request gets user's summary data and activities
                 - desktop ajax request gets user's playlists.
                 
    Arguments:   - request: HttpRequest object
                 - id:      Id of user under consideration
    Return:      HttpResponse object with redirection or page text
              
    Author:      Nnoduka Eruchalu
    """
    user = get_object_or_404(User, id=id)
    
    if request.is_ajax():
        # is requesting user currently following profile?
        user_following_status = Following.objects.is_following(
            request.user.id,user)
        
        if request.mobile:
            # get summary data
            data = user_summary_data(user)
            
            # get following data
            if (request.user.is_authenticated()) and (request.user != user):
                following_status = 'following' if user_following_status \
                    else 'follow'
            else:
                following_status = 'hidden'
            data['following_status'] = following_status
            
            # get user's activities
            activities = user.activities.all()[:settings.ACTIVITY_LIMIT]
            data['activities'] = setup_activities_json(activities)
            data['activity_public'] = user.activity_public
                        
            json_response = json.dumps(data)
        
        else:
            # get user's playlists
            playlists_list = Playlist.objects.filter(owner=user)
            playlists_context = playlists_helper(request, playlists_list)
            playlists_context['content'] = render_to_string(
                'account/content.html',
                {'playlists':playlists_context['playlists'],
                 'profile':user,
                 'profile_following':user_following_status},
                context_instance=RequestContext(request))
            del playlists_context['playlists']
            
            json_response = json.dumps(playlists_context)
        
        return HttpResponse(json_response, content_type="application/json")
    
    
    # if on a mobile device. Go to web app homepage, and handle this there.
    if request.mobile:
        request.session["user_id"] = id
        return HttpResponseRedirect('/')
            
    return render_to_response('headfoot.html',
                              context_instance=RequestContext(request))


@login_required
def editavatar(request):
    """
    Description: Edit user's avatar via a form POST. 
                 Validate form and log success or error message to be displayed
                 on next profile page load.
                 
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with redirection to profile page.
              
    Author:      Nnoduka Eruchalu
    """
    if request.method == 'POST':
        form = UploadAvatarForm(request.POST, request.FILES, 
                                instance=request.user)
        if form.is_valid():
            form.save() # save new file data
            messages.add_message(
                request, messages.SUCCESS, "image successfully uploaded")
        else:
            try:
                error_msg = form['avatar'].errors[0]
            except:
                error_msg = "image upload error"
            messages.add_message(request, messages.ERROR, error_msg)
        return HttpResponseRedirect(reverse('profile'))
    
    # shouldn't get this far
    raise Http404


@login_required
def editcover(request):
    """
    Description: Edit user's cover photo via a form POST. 
                 Validate form and log success or error message to be displayed
                 on next profile page load.
                 
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with redirection to profile page.
              
    Author:      Nnoduka Eruchalu
    """
    if request.method == 'POST':
        form = UploadCoverForm(request.POST, request.FILES, 
                               instance=request.user)
        if form.is_valid():
            form.save() # save new file data
            messages.add_message(
                request, messages.SUCCESS, "image successfully uploaded")
        else:
            try:
                error_msg = form['cover'].errors[0]
            except:
                error_msg = "image upload error"
            messages.add_message(request, messages.ERROR, error_msg)
        return HttpResponseRedirect(reverse('profile'))
        
    # shouldn't get this far
    raise Http404


@login_required
def deleteavatar(request):
    """
    Description: Delete user's avatar and delete files on storage backend.
                 
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with redirection to profile page.
              
    Author:      Nnoduka Eruchalu
    """
    if request.method == 'POST':
        request.user.delete_avatar_files(request.user)
        return HttpResponseRedirect(reverse('profile'))
    
    # shouldn't get this far
    raise Http404


@login_required
def deletecover(request):
    """
    Description: Delete user's cover photo and delete files on storage backend.
                 
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with redirection to profile page.
              
    Author:      Nnoduka Eruchalu
    """
    if request.method == 'POST':
        request.user.delete_cover_files(request.user)
        return HttpResponseRedirect(reverse('profile'))
    
    # shouldn't get this far
    raise Http404
