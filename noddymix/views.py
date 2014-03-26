from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect, HttpResponse, Http404
from django.contrib.messages import get_messages
from django.middleware import csrf
from django.conf import settings

import noddymix.apps.audio.views as audio_views
import noddymix.apps.relationship.views as rlp_views
import json


def about(request):
    """
    Description: Render NoddyMix's about page.
    
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with rendered text of about page
        
    Author:      Nnoduka Eruchalu
    """
    from noddymix.apps.audio.models import Song
    from django.db.models import Sum
    
    # a mobile request will be redirected to the homepage
    if request.mobile:
        return HttpResponseRedirect('/')
    
    total_plays = Song.objects.all().aggregate(Sum('num_plays'))[
        'num_plays__sum']
    return render_to_response('about.html',
                              {'total_plays':"{:,}".format(total_plays)},
                              context_instance=RequestContext(request))


def opensearch(request):
    """
    Description: Serve opensearch.xml file
    
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse object with rendered opensearch.xml content 
      
    Author:      Nnoduka Eruchalu
    """
    return render_to_response('opensearch.xml',
                              context_instance=RequestContext(request),
                              content_type="application/xhtml+xml")


def status(request):
    """
    Description: Get the current user's status information via ajax only.
                 Expected use is by mobile app
                 
    Arguments:   - request: HttpRequest object
    Return:      json dictionary (over ajax) with following keys:
                 - auth_error:    boolean indicating error with authentication
                 - auth_msgs:     authentication error messages
                 - authenticated: boolean indicating user is authenticated
                 - username:      authenticated user's full name
                 - user_id:       authenticated user's id
                 - avatar:        authenticated user's avatar thumbnail
                 - song:          json repr. of song that app tried viewing
                 - user:          json repr. of user that app tried viewing
                 - playlist:      json repr. of playlist that app tried viewing
                 - csrftoken:     csrf token for POST requests
                 - playlists:     list of user's playlists (id & title), 
                                  regardless of authentication
                 
    Author:      Nnoduka Eruchalu
    """
    song = False
    user = False
    plist = False
    playlists=[]
    auth_error = False
    auth_msgs = False
    username = False
    avatar = False
    user_id = False
    
    # get authentication message
    if "auth_error" in request.session:
        auth_error = request.session["auth_error"]
        del request.session["auth_error"]
        messages = get_messages(request)
        auth_msgs = []
        for msg in messages:
            auth_msgs.append(msg.message)
    
    
    # user's initial requst was for a single song page, so get song data
    if "song_id" in request.session:
        id = request.session["song_id"]
        del request.session["song_id"]
        song = audio_views.get_song_json(id, request.mobile)
        
    # user's initial request was for a single user page, so get user data
    if "user_id" in request.session:
        id = request.session["user_id"]
        del request.session["user_id"]
        user = rlp_views.get_user_json(id, request)
        
     # playlist's initial request was for a single playlist page, so get data
    if "playlist_id" in request.session:
        id = request.session["playlist_id"]
        del request.session["playlist_id"]
        plist = audio_views.get_playlist_json(id, request)
        
    
    # need csrf token for future POSTs
    if 'csrftoken' not in request.COOKIES:
        csrftoken = csrf.get_token(request) 
    else:
        csrftoken = request.COOKIES['csrftoken']
        
    # get user's details & playlists
    if request.user.is_authenticated():
        authenticated = True
        username = request.user.get_full_name()
        user_id = request.user.id
        if request.user.avatar:
            avatar = request.user.avatar_thumbnail.url
        else:
            avatar = settings.STATIC_URL + "img/avatar_thumbnail.jpg"
        
        for playlist in request.user.playlists.all():
            playlists.append({'id':playlist.id, 'title':playlist.title})
        
    else:
        authenticated = False
        # get anonymous playlists
        # first ensure the playlists object exists
        audio_views.check_session_playlists(request)
        playlists_list_dict = request.session['playlists']
        for key, value in playlists_list_dict.iteritems():
            playlists.append({'id':value['id'], 'title':value['title']})
        

    if request.is_ajax():
        json_response = json.dumps({
                'auth_error':auth_error,
                'auth_msgs':auth_msgs,
                'authenticated':authenticated,
                'username':username,
                'user_id':user_id,
                'avatar':avatar,
                'song': song,
                'user': user,
                'playlist':plist,
                'csrftoken':csrftoken,
                'playlists':playlists
                })
        
        return HttpResponse(json_response, content_type="application/json")
        
    # coming this far isnt legit
    raise Http404
