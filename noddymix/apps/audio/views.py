# Create your views here.
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.template.loader import render_to_string
import urllib, json

from noddymix.apps.audio.models import Song, Playlist, Playlist_Songs, Album, \
    SongPlay, SongRank
from noddymix.apps.account.models import User
from noddymix.apps.relationship.models import Following
from noddymix.apps.activity.models import Activity
from noddymix.apps.activity import activity
from noddymix.utils import users_helper, list_dedup

#imports for pagination
from django.conf import settings
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

import copy


def check_session_playlists(request):
    """
    Description: Check that an anonymous user's temporary playlists are logged 
                 in the  session. If playlists aren't already being logged then
                 create an empty collection of playlists.
                   
    Arguments:   - request: HttpRequest object
    Return:      None 
    
    Author:      Nnoduka Eruchalu
    """
    if 'playlists' not in request.session:
        # if no playlists already created, create container
        request.session['playlists'] = {
            }
        # request.session hasn't been directly modified, so force a session save
        request.session.modified = True
    

def get_session_playlist(request, id):
    """
    Description: Get anonymous user's temporary playlist with specific id
    
    Arguments:   - request: HttpRequest object
                 - id:      id of anonymous user's temporary playlist
    Return:      Dictionary representation of playlist with keys:
                 - id:          (int) playlist id
                 - title:       (str) playlist title string
                 - songs:       (list) list of ids of playlist's songs
                 - num_songs:   (int) number of songs in playlist
                 - cover_album: (int) id of Album object representing playlist
    
    Author:      Nnoduka Eruchalu
    """
    # make id the right type
    id = int(id)
    
    # first ensure the playlists object exists
    check_session_playlists(request)
    
    # now get playlist object
    playlist = None
    if id in request.session['playlists']:
        playlist = request.session['playlists'][id]
    return playlist


def create_session_playlist(request, title=None):
    """
    Description: Create a new temporary playlist for an anonymous user and 
                 return it.
                 - Playlist id is  either 1 (for first playlist) or +1 of max.
                   id (if other playlists exist).
                 - Playlist title is provided title or default title.
                 - Playlist will start out with no songs and consequently no
                   cover album.
                     
    Arguments:   - request: HttpRequest object
                 - title:   Playlist's title, optional.
    Return:      Dictionary representation of playlist with keys:
                 - id:          (int) playlist id
                 - title:       (str) playlist title string
                 - songs:       (list) list of ids of playlist's songs
                 - num_songs:   (int) number of songs in playlist
                 - cover_album: (int) id of Album object representing playlist
    
    Author:      Nnoduka Eruchalu
    """
    # first ensure the playlists object exists
    check_session_playlists(request)
            
    try:
        # the new playlist's id is 1 up from last playlist's id
        id=max(request.session['playlists'].keys())+1
    except ValueError:
        # if however the user has no other playlists, place this at index 1
        id=1
        
    # get default playlist title
    playlist_title = Playlist._meta.get_field_by_name('title')[0].default
    
    # get submitted title if present
    if title:
        max_length = Playlist._meta.get_field_by_name('title')[0].max_length
        new_title = title.strip()[:max_length]
        if len(new_title) >= 1:
            playlist_title = new_title
    
    # now create a default playlist
    request.session['playlists'][id] = {
        'id':id,
        'title':playlist_title,
        'songs':[],
        'num_songs':0,
        'cover_album':None
        }
    
    # request.session hasn't been directly modified, so force a session save
    request.session.modified = True
    
    return request.session['playlists'][id]


def save_session_playlist(request, playlist):
    """
    Description: Update anonymous user's temporary playlist with new version of
                 passed in playlist. If the playlist doesn't already exist in
                 user's collection, this will be an add.
                 
    Arguments:   - request:  HttpRequest object
                 - playlist: temporary playlist object
    Return:      None
    
    Author:      Nnoduka Eruchalu
    """
    # first ensure the temporary playlists container object exists
    check_session_playlists(request)
    # then update/add the playlist
    request.session['playlists'].update({playlist['id']:playlist})
    # refresh the songs count
    request.session['playlists'][playlist['id']]['num_songs'] = \
        len(playlist['songs'])
    # and finally update cover album
    try:
        playlist['cover_album'] = \
            Song.objects.get(id=playlist['songs'][0]).album.id
    except IndexError:
        playlist['cover_album'] = None
    
    # request.session hasn't been directly modified, so force a session save
    request.session.modified = True


def check_session_history(request):
    """
    Description: Check that the user's play history is logged in the session
                 
    Arguments:   - request:  HttpRequest object
    Return:      None
    
    Author:      Nnoduka Eruchalu
    """
    if 'history' not in request.session:
        # if no history already logged, create container
        request.session['history'] = []
        # request.session hasn't been directly modified, so force a session save
        request.session.modified = True


def get_session_history(request):
    """
    Description: Get the song ids of songs in play history
                 
    Arguments:   - request:  HttpRequest object
    Return:      list of song ids
    
    Author:      Nnoduka Eruchalu
    """
    # first ensure the history exists
    check_session_history(request)
    return list_dedup(request.session['history'])[:settings.SONGS_PER_PAGE]


def update_session_history(request, song):
    """
    Description: Update the given session object's history with the id of a song
                 that has just been played
                 
    Arguments:   - request:  HttpRequest object
                 - song:     id of song to add to history
    Return:      None
    
    Author:      Nnoduka Eruchalu
    """
    # first ensure the history exists
    check_session_history(request)
    # then update the history with new song (id) addition
    request.session['history'].insert(0, song)
    request.session['history'] = \
        request.session['history'][:settings.SONGS_PER_PAGE]


def get_song_artists(song):
    """
    Description: Construct a string of primary artists and featured artists for
                 a Song object instance
                 
    Arguments:   - song: Song object instance
    Return:      str of primary artist and possibly featured artists
    
    Author:      Nnoduka Eruchalu
    """
    # get primary artist's name
    artist = song.artist.name
    
    # add featured artists to artist string (if they exist)
    first_feature = True
    for feature in song.featuring.all():
        if first_feature:
            artist += ' ft.'
        else:
            artist += ','
        first_feature = False
        artist += ' '+feature.name
    
    # return artists string
    return artist


def setup_song_json(song, is_mobile):
    """
    Description: Convert a Song object to a json representation for music player
                 
    Arguments:   - song: Song object instance
                 - is_mobile: is request coming from a mobile device?
    Return:      Dictionary representation of Song object with keys:
                 - title:          song title
                 - artist:         song artist
                 - album:          song album title
                 - mp3:            url to mp3 file
                 - id:             song's id in db
                 - poster:         album art's thumbnail-size image
                 - poster_display: album art's display-size image
    
    Author:      Nnoduka Eruchalu
    """
    # converts %2F to / (remember already slugged)
    mp3 = urllib.unquote(song.mp3.url)
    artist = get_song_artists(song)
            
    song_json = {'title':song.title.capitalize(),
                 'artist':artist.capitalize(),
                 'album':song.album.title.capitalize(),
                 'mp3':mp3,
                 'id':song.id}
    
    if song.album and song.album.art:
        # song has album art, so extract appropriate posters based on device
        if is_mobile:
            poster = urllib.unquote(song.album.art_mobile_thumbnail.url)
            poster_display = urllib.unquote(song.album.art_display.url)
        else:
            poster = urllib.unquote(song.album.art_thumbnail.url)
            poster_display = urllib.unquote(song.album.art.url)    
        
    else:
        # song doesn't have album art, so use default posters based on device
        if is_mobile:
             poster = settings.STATIC_URL+ 'img/art_mobile_thumbnail.jpg'
        else:
            poster = settings.STATIC_URL+ 'img/art_thumbnail.jpg'
            
        poster_display = settings.STATIC_URL+ 'img/art_display.jpg'
    
    # setup song poster images
    song_json['poster'] = poster
    song_json['poster_display'] = poster_display
        
    if is_mobile:
        song_json['length'] = song.length
    
    return song_json


def setup_songs_json(songs, is_mobile):
    """
    Description: Parse a QuerySet of Songs into a list of json representations
                 for each song.
                 
    Arguments:   - songs: QuerySet of Song objects
                 - is_mobile: is request coming from a mobile device?
    Return:      list of song representation dictionaries.
    
    Author:      Nnoduka Eruchalu
    """
    songs_json = []
    for song in songs:
        songs_json.append(setup_song_json(song, is_mobile))
    return songs_json


def songs_helper_json(request, songs_list):
    """
    Description: Paginate a list of Song objects and generate the properly
                 formatted response object
                 
    Arguments:   - request:    HttpRequest object
                 - songs_list: list of Song objects
    Return:      Dictionary with following keys:
                 - songs: JSON-formatted representation of Song objects that
                          made it to current page
                 - curr_page: current page
                 - prev_page: previous page [1-indexed, and 0 if on first page]
                 - next_page: next page [1-indexed, and 0 if on last page]
                 - num_pages: total number of pages
                 
    Author:      Nnoduka Eruchalu
    """
    paginator = Paginator(songs_list, settings.SONGS_PER_PAGE)
    
    page = request.GET.get('page')
    try:
        songs = paginator.page(page)
        page = int(page)
    except PageNotAnInteger:
        # if page is not an integer, deliver first page.
        page = 1
        songs = paginator.page(1)
    except EmptyPage:
        # if page is out of range (e.g. 999), deliver last page of results
        page = paginator.num_pages
        songs = paginator.page(paginator.num_pages)
                
    if songs.has_next():
        next_page_num = songs.next_page_number()
    else:
        next_page_num = 0 # way of indicating no more pages... 1 index'd helped!
    
    if songs.has_previous():
        prev_page_num = songs.previous_page_number()
    else:
        prev_page_num = 0
    
    songs = songs.object_list
    songs_json = setup_songs_json(songs, request.mobile)
    return {
        'songs':songs_json,
        'curr_page':page,
        'prev_page':prev_page_num,
        'next_page':next_page_num,
        'num_pages':paginator.num_pages,
        }


def songs_helper(request, songs_list):
    """
    Description: Paginate a list of Song objects, generate the properly
                 formatted response object and return it as a json HttpResponse
                 - see songs_helper_json
                 
    Arguments:   - request:    HttpRequest object
                 - songs_list: list of Song objects
    Return:      HttpResponse with json data
                 
    Author:      Nnoduka Eruchalu
    """
    songs_json_dict = songs_helper_json(request, songs_list)
    
    json_response = json.dumps(songs_json_dict)
    return HttpResponse(json_response, content_type="application/json")


def get_song_json(id, is_mobile):
    """
    Description: get song data in json format where song is indicated by id. 
                  If song doesnt exist, return false
    
    Arguments:   - id: id of Song object
                 - is_mobile: True/False for if this is a mobile request
    Return:      JSON-formatted song representation or False (if no song)
                 
    Author:      Nnoduka Eruchalu
    """
    try:
        song = Song.objects.get(id=id)
        song_json = setup_song_json(song, is_mobile)
    except Song.DoesNotExist:
        song_json = False
    
    return song_json


def playlists_helper(request, playlists_list):
    """
    Description: Paginate a list of Playlist objects and generate the properly
                 formatted response object
                 
    Arguments:   - request:    HttpRequest object
                 - songs_list: list of Playlist objects
    Return:      Dictionary with following keys:
                 - playlists: Playlist objects that made it to current page
                 - curr_page: current page
                 - prev_page: previous page [1-indexed, and 0 if on first page]
                 - next_page: next page [1-indexed, and 0 if on last page]
                 - num_pages: total number of pages
                 
    Author:      Nnoduka Eruchalu
    """
    paginator = Paginator(playlists_list, settings.PLAYLISTS_PER_PAGE)
    
    page = request.GET.get('page')
    try:
        playlists = paginator.page(page)
    except PageNotAnInteger:
        # if page is not an integer, deliver first page.
        page = 1
        playlists = paginator.page(1)
    except EmptyPage:
        # if page is out of range (e.g. 999), deliver last page of results
        page = paginator.num_pages
        playlists = paginator.page(paginator.num_pages)
                
    if playlists.has_next():
        next_page_num = playlists.next_page_number()
    else:
        next_page_num = 0 # way of indicating no more pages... 1 index'd helped!
    
    if playlists.has_previous():
        prev_page_num = playlists.previous_page_number()
    else:
        prev_page_num = 0
    
    playlists = playlists.object_list
    return {
        'playlists':playlists,
        'curr_page':page,
        'prev_page':prev_page_num,
        'next_page':next_page_num,
        'num_pages':paginator.num_pages,
        }


def setup_playlists_json(playlists, request):
    """
    parse a list of playlists into the format expected by a mobile client
    escription: Parse a QuerySet of Playlists into a list of json-formatted
               representations for each Playlist object.
                 
    Arguments:   - songs: QuerySet of Playlist objects
                 - request: HttpRequest object.
    Return:      list of playlist representation dictionaries.
    
    Author:      Nnoduka Eruchalu
    """
    playlists_json = []
    for playlist in playlists:
        playlists_json.append(setup_playlist_json(playlist, request))
    return playlists_json


def setup_playlist_json(playlist, request):
    """
    Description: Convert a Playlist object to a json representation for a mobile
                 client.
                 
    Arguments:   - playlist: Playlist object instance
                 - request:  HttpRequest object
    Return:      Dictionary representation of Song object with keys:
                 - id:          Playlist Id in db
                 - title:       Playlist title
                 - num_songs:   number of songs in Playlist
                 - cover_album: url of playlist's cover album art
                 - owner:       full name of Playlist's owner
                 - owner_id:    id of Playlist's owner in User model
                 - subscribed:  is request's user subscribed to this playlist?
                 - is_public:   is playlist made public by owner?
    
    Author:      Nnoduka Eruchalu
    """
    subscribed = False # start by assuming requesting user isn't subscribed
    
    # subscription and public/private status only apply to authenticated users
    if request.user.is_authenticated():
        if (request.user != playlist.owner):
            # subscription status only applies to users that dont own playlist
            if (playlist in request.user.subscriptions.all()):
                subscribed = True
    
        
    playlist_json = {
        'id':playlist.id,
        'num_songs':playlist.num_songs,
        'title':playlist.title,
        'owner':playlist.owner.get_full_name(),
        'owner_id':playlist.owner.id,
        'subscribed':subscribed,
        'is_public':playlist.is_public
        }
            
    if playlist.cover_album and playlist.cover_album.art:
        # top song has album art, so extract appropriate cover album art
        cover_album = urllib.unquote(playlist.cover_album.art_mobile_small.url)
    else:
        # top song doesn't have album art, so use default cover album art
        cover_album = settings.STATIC_URL+ 'img/art_mobile_small.jpg'
    # setup playlist cover album art
    playlist_json['cover_album'] = cover_album
        
    return playlist_json


def get_playlist_json(id, request):
    """
    Description: get playlist data in json format where playlist is indicated by
                 id. If song doesnt exist, return false
    
    Arguments:   - id:      id of Playlist object
                 - request: HttpRequest object
    Return:      JSON-formatted playlist representation or False (if it doesn't
                 exist)
                 
    Author:      Nnoduka Eruchalu
    """
    try:
        playlist = Playlist.objects.get(id=id)
        playlist_json = setup_playlist_json(playlist, request)
    except Playlist.DoesNotExist:
        playlist_json = False
    
    return playlist_json


def setup_session_playlist_json(playlist_original):
    """
    Description: Convert an anonymous user's temporary playlist object to a json
                 representation for a mobile client
    
    Arguments:   - playlist_original: temporary playlist object
    Return:      JSON-formatted temporary playlist dictionary with keys:
                 - id:          (int) playlist id
                 - title:       (str) playlist title string
                 - num_songs:   (int) number of songs in playlist
                 - cover_album: (str) url to cover album image.
                 # following keys are provided for parity with
                 # setup_playlist_json() but are blanked out
                 - owner:       None [anonymous user]
                 - owner_id:    None [anonymous user]
                 - subscribed:  None [temporary playlists always private]
                 - is_public:   None [temporary playlists always private]
                                  
    Author:      Nnoduka Eruchalu
    """
    # dont want to override passed in playlist
    playlist = copy.copy(playlist_original)

    del playlist["songs"]
    
    # get the cover album's art
    try:
        cover_album= Album.objects.get(id=playlist['cover_album'])
    except:
        cover_album = None
    
    if cover_album and cover_album.art:
        # top song has album art, so extract appropriate cover album art
        cover_album = urllib.unquote(cover_album.art_mobile_small.url)
    else:
        # top song doesn't have album art, so use default cover album art
        cover_album = settings.STATIC_URL+ 'img/art_mobile_small.jpg'
        
    playlist['cover_album'] = cover_album
    
    # set defaults for missing playlist json fields
    playlist['owner'] = None
    playlist['owner_id'] = None
    playlist['subscribed'] = None
    playlist['is_public'] = None
    
    return playlist


def new_releases(request):
    """
    Description: NoddyMix Homepage
                 For ajax request respond with a paginated list of
                 JSON-formatted song representations.
                 For non-ajax request return with either the desktop or mobile
                 home page text.
    
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """    
    if request.is_ajax():
        songs_list = Song.objects.all().order_by('-date_added')
        return songs_helper(request, songs_list)
    
    if request.mobile:
        return render_to_response('index.html')
    
    return render_to_response('audio/new_releases.html',
                              context_instance=RequestContext(request))


def heavy_rotation(request):
    """
    Description: Heavy rotation songs: i.e. top played songs over the last few
                 days.
                 
                 A mobile page will be redirected to the homepage
    
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax():
        # use select_related('song') so as to only hit the database when getting
        # the SongRank objects
        songs_list = [songrank.song for songrank in
                      SongRank.objects.select_related('song').all()
                      .order_by('-score')[:settings.SONGS_PER_PAGE]]
        return songs_helper(request, songs_list)
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('audio/heavy_rotation.html',
                              context_instance=RequestContext(request))


def top_playlists(request):
    """
    Description: Top Playlists: i.e. playlists with the most subscribers
                 If two playlists are tied for subscribers count, then that 
                 with more songs get priority
    
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    playlists_list = Playlist.objects.all().order_by('-num_subscribers',
                                                     '-num_songs')
    playlists_context = playlists_helper(request, playlists_list)
    
    if request.is_ajax():
        if request.mobile:
            playlists_context['playlists'] = \
                setup_playlists_json(playlists_context['playlists'], request)
        
        else:
            playlists_context['content'] = render_to_string(
                'audio/content_top_playlists.html',
                playlists_context,
                context_instance=RequestContext(request))
            del playlists_context['playlists']
        
        json_response = json.dumps(playlists_context)
        return HttpResponse(json_response, content_type="application/json")
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('audio/top_playlists.html',
                              context_instance=RequestContext(request))


def favorites(request):
    """
    Description: Favorites: i.e. an authenticated user's public playlist
                 subscriptions
                 
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    if request.user.is_authenticated():
        playlists_list = request.user.subscriptions.filter(is_public=True).order_by('title', '-num_songs')
    else:
        playlists_list = [] 
    playlists_context = playlists_helper(request, playlists_list)
    
    if request.is_ajax():
        if request.mobile:
            playlists_context['playlists'] = \
                setup_playlists_json(playlists_context['playlists'], request)
        
        else:
            playlists_context['content'] = render_to_string(
                'audio/content_favorites.html',
                playlists_context,
                context_instance=RequestContext(request))
            del playlists_context['playlists']
        
        json_response = json.dumps(playlists_context)
        return HttpResponse(json_response, content_type="application/json")
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('audio/favorites.html',
                              context_instance=RequestContext(request))


def playlists(request):
    """
    Description: Get a user's playlists data via ajax for a mobile device,
                             
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax() and request.mobile:
        
        if request.user.is_authenticated():
            # handle authenticated users
            playlists_list = Playlist.objects.filter(owner=request.user).order_by('-date_added')
            playlists_context = playlists_helper(request, playlists_list)
            playlists_context['playlists'] = \
                setup_playlists_json(playlists_context['playlists'], request)
            
        else:
            # handle anonymous users
            # first ensure the playlists object exists
            check_session_playlists(request)
            playlists_list_dict = request.session['playlists']
            playlists_list = []
            for key, value in playlists_list_dict.iteritems():
                playlist_json = copy.copy(value)
                playlist_json = setup_session_playlist_json(playlist_json)
                playlists_list.append(playlist_json)
                
            playlists_context = playlists_helper(request, playlists_list)
        
        json_response = json.dumps(playlists_context)
        return HttpResponse(json_response, content_type="application/json")
        
    # only get here if not mobile or not ajax
    raise Http404
    

def history(request):
    """
    Description: History: i.e. a user's recently played songs
                 For authenticated users this is in the Activity table
                 For anonymous users this is in request.session
                             
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax():
        if request.user.is_authenticated():
            # for logged in users get from Activity table
            play_activities = Activity.objects.filter(
                actor=request.user, verb="played")[:settings.SONGS_PER_PAGE]
            songs_list = [a.target for a in play_activities]
            # mysql cant do SELECT DISTINCT ON, so do this:
            songs_list = list_dedup(songs_list)
        else:
            # for anonymous users, history in session
            session_history = get_session_history(request)
            songs_list = Song.objects.filter(id__in=session_history)
            # __in doesn't maintain the order of playlist['songs'] so fix that
            songs_list = list(songs_list)
            songs_list.sort(key=lambda song: session_history.index(song.id))
        return songs_helper(request, songs_list)        
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('audio/history.html',
                              context_instance=RequestContext(request))


def queue(request):
    """
    Description: Queue page. 
                 The queue is tracked on the client-side so this function always
                 returns an empty list
                             
    Arguments:   - request: HttpRequest object
    Return:      HttpResponse with empty song page/data
                                  
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax():
        songs_list = Song.objects.none()
        return songs_helper(request, songs_list)
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('audio/queue.html',
                              context_instance=RequestContext(request))


def userplaylists(request, id):
    """
    Description: Return a user's playlists to a mobile device
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of User whose playlists are desired
    Return:      HttpResponse json data
                                  
    Author:      Nnoduka Eruchalu
    """
    user = get_object_or_404(User, id=id)
    
    if request.is_ajax():
        # only a mobile page will call this
        playlists_list = Playlist.objects.filter(owner=user)
        playlists_context = playlists_helper(request, playlists_list)
        playlists_context['playlists'] = \
            setup_playlists_json(playlists_context['playlists'], request)
        
        json_response = json.dumps(playlists_context)
        return HttpResponse(json_response, content_type="application/json")
    
    # shouldn't get this far
    raise Http404


def song(request, id):
    """
    Description:  Show a specific-song page.
                  If this request came in from a mobile device, log it then
                  redirect user to homepage. The mobile app will know to get
                  this data via another ajax call.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of desired song
    Return:      HttpResponse 
                                  
    Author:      Nnoduka Eruchalu
    """
    # check for song object to throw a 404 early on (if necessary)
    song = get_object_or_404(Song, id=id)
    if request.is_ajax():
        return songs_helper(request, [song])
    
    # if on a mobile device go to web app and handle this there
    if request.mobile:
        request.session["song_id"] = id
        return HttpResponseRedirect('/')

    # grab the ogimage for sharing on facebook
    if song.album and song.album.art:
        ogimage = song.album.art.url
    else:
        ogimage = settings.STATIC_URL+ 'img/art_display.jpg'
                
    return render_to_response('audio/song.html',
                              {'ogimage':ogimage,
                               'title':song.title+'-'+get_song_artists(song)},
                              context_instance=RequestContext(request))


def song_play(request, id):
    """
    Description: Callback for handling a song being played.
                 Increments play count for that song.
                 Has to be an ajax and POST request
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of song being played
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax() and (request.method=="POST"):
        song = get_object_or_404(Song, id=id)
        song.num_plays += 1
        song.save()
        
        # account for this song play
        SongPlay.objects.create(song=song)
        
        # log this activity in the activity streams
        if request.user.is_authenticated():
            activity.send(request.user, verb="played", target=song)
        else:
            update_session_history(request, song.id)
        return HttpResponse(json.dumps({}), content_type="application/json")
            
    # this can only be called via ajax
    raise Http404

    
def playlist(request, id):
    """
    Description:  Show a specific user-created playlist
                  If this request came in from a mobile device, log it then
                  redirect user to homepage. The mobile app will know to get
                  this data via another ajax call.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of desired playlist
    Return:      HttpResponse 
                                  
    Author:      Nnoduka Eruchalu
    """
    # check for playlist object to throw a 404 early on (if necessary)
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax():
        if playlist.is_public or (playlist.owner==request.user):
            songs_list = playlist.songs.all().order_by(
                "playlist_songs", "-date_added")
        else:
            songs_list = []
        
        # get song details dictionary
        songs_json_dict = songs_helper_json(request, songs_list)
        songs_json_dict['header'] = render_to_string(
            'audio/header_playlist.html',
            {'playlist':playlist,
             'active_tab':'songs'},
            context_instance=RequestContext(request))
                
        json_response = json.dumps(songs_json_dict)
        return HttpResponse(json_response, content_type="application/json")
    
    
    # if on a mobile device go to web app and handle this there
    if request.mobile:
        request.session["playlist_id"] = id
        return HttpResponseRedirect('/')
    
    
    # grab the ogimage for sharing on facebook
    if playlist.cover_album and playlist.cover_album.art:
        ogimage = playlist.cover_album.art.url
    else:
        ogimage = settings.STATIC_URL+ 'img/art_display.jpg'
    
    return render_to_response('audio/playlist.html',
                              {'playlist':playlist,
                               'ogimage':ogimage},
                              context_instance=RequestContext(request))


def playlist_details_json(request, id):
    """
    Description: This is a hidden routine that returns a playlist's details in 
                 JSON. It will only ever be called by external python scripts.
                 I added this to be able to write scripts that download all
                 songs on a playlist
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist under consideration
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    # check for playlist object to throw a 404 early on (if necessary)
    playlist = get_object_or_404(Playlist, id=id)
    
    songs_list = playlist.songs.all().order_by("playlist_songs", "-date_added")
            
    # get song details dictionary
    songs_json_dict = songs_helper_json(request, songs_list)
    songs_json_dict['title'] = playlist.title
                    
    json_response = json.dumps(songs_json_dict)
    return HttpResponse(json_response, content_type="application/json")



def playlist_temp(request, id):
    """
    Description: Show a specific Anonymous User's temporary playlist
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of anonymous user's temp playlist
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_session_playlist(request, id)
    if not playlist:
        raise Http404
    
    # get the cover album's art
    try:
        cover_album= Album.objects.get(id=playlist['cover_album'])
    except:
        cover_album = None
    
    if request.is_ajax():
        # grab the actual song objects
        songs_list = Song.objects.filter(id__in=playlist['songs'])
        # __in doesn't maintain the order of playlist['songs'] so fix that
        songs_list = list(songs_list)
        songs_list.sort(key=lambda song: playlist['songs'].index(song.id))
        
        # get song details dictionary
        songs_json_dict = songs_helper_json(request, songs_list)
        songs_json_dict['header'] = render_to_string(
            'audio/header_playlist_temp.html',
            {'playlist':playlist,
             'cover_album':cover_album},
            context_instance=RequestContext(request))
                
        json_response = json.dumps(songs_json_dict)
        return HttpResponse(json_response, content_type="application/json")
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('audio/playlist_temp.html',
                              {'playlist':playlist,
                               'cover_album':cover_album},
                              context_instance=RequestContext(request))


@login_required
def playlist_new(request):
    """
    Description: Create new playlist for an authenticated user and return its
                 id and title, so that the UI can have this info without a page
                 refresh. For this reason, this function expects to be called
                 via ajax only.
                             
    Arguments:   - request: HttpRequest object
    Return:      JSON HttpResponse with new playlist's id and title.
                                  
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax() and (request.method=="POST"):
        title = request.POST.get('title', None)
        
        # get default playlist title
        playlist_title = Playlist._meta.get_field_by_name('title')[0].default
        # get submitted title if present
        if title:
            max_length = Playlist._meta.get_field_by_name('title')[0].max_length
            new_title = title.strip()[:max_length]
            if len(new_title) >= 1:
                playlist_title = new_title
        
        new_playlist = Playlist.objects.create(owner=request.user,
                                               title=playlist_title)
        # log this activity
        activity.send(request.user, verb="created", target=new_playlist)
        
        # create response for user
        if request.mobile:
            playlist_json = setup_playlist_json(new_playlist, request)
        else:
            playlist_json = {
                'id':new_playlist.id,
                'title':new_playlist.title
                }
        
        json_response = json.dumps(playlist_json)
        return HttpResponse(json_response, content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


def playlist_temp_new(request):
    """
    Description: Create new temp. playlist for an anonymous user and return its
                 id and title, so that the UI can have this info without a page
                 refresh. For this reason, this function expects to be called
                 via ajax only.
                             
    Arguments:   - request: HttpRequest object
    Return:      JSON HttpResponse with new temp. playlist's id and title.
                                  
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax() and (request.method=="POST"):
        new_title = request.POST.get('title', None)
        new_playlist = create_session_playlist(request, new_title)
        if request.mobile:
            playlist_json = setup_session_playlist_json(new_playlist)
        
        else:
            playlist_json = {
                'id':new_playlist['id'],
                'title':new_playlist['title']
                }
        
        json_response = json.dumps(playlist_json)
        return HttpResponse(json_response, content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


@login_required
def playlist_order_songs(request, id):
    """
    Description: Reorder the songs in a playlist to match the given order of
                 song ids (in a POST parameter). When ordering keep the 
                 current page in mind.
                 Only an authenticated user that owns the playlist can actually
                 reorder songs.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to be re-ordered
    Return:      JSON HttpResponse with empty data
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user==playlist.owner):
        # get string list of song ids
        songs =  request.POST.getlist('songs[]')
        # convert this to integer list
        songs = map(int, songs)
        
        # get page of results
        page = request.POST.get('page')
        try:
            page = int(page)
        except ValueError:
            page = 1
        
        # get playlist_songs m2m intermediary object for this playlist
        playlist_songs = Playlist_Songs.objects.filter(
            playlist=playlist).order_by('order')
        
        # get the `order` offset for the songs to be sorted
        order_offset = 0
        if page > 1:
            try:
                order_offset = \
                    playlist_songs[settings.SONGS_PER_PAGE*(page-1)-1].order \
                    + 1;
            except IndexError:
                pass
        
        # now limit the intermediary page object to the songs to be sorted
        playlist_songs = playlist_songs.filter(song_id__in=songs)
        # loop through them, and update the `order` to the index in the received
        # songs array
        for playlist_song in playlist_songs:
            try:
                # when saving the order keep in mind that playlists could be
                # paginated
                playlist_song.order = songs.index(playlist_song.song.id) + \
                    order_offset
                playlist_song.save()
            except ValueError:
                pass
                
        # in the event that songs were deleted, refresh playlist
        playlist.save()
        
        return HttpResponse(json.dumps({}), content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


def playlist_temp_order_songs(request, id):
    """
    Description: Reorder the songs in a temporary playlist to match the given 
                 order of song ids (in a POST parameter). When ordering keep the
                 current page in mind.
                 Only an anonymous user that owns the playlist can actually
                 reorder songs.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to be re-ordered
    Return:      JSON HttpResponse with empty data
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_session_playlist(request, id)
    if not playlist:
        raise Http404
        
    if request.is_ajax() and (request.method=="POST"):
        # get string list of song ids
        songs =  request.POST.getlist('songs[]')
        # convert this to integer list
        songs = map(int, songs)
        
        # get page of results
        page = request.POST.get('page')
        try:
            page = int(page)
        except ValueError:
            page = 1
        
        if page >= 1:
            # replace the songs on this page with the sorted list of songs
            playlist['songs'] = \
                playlist['songs'][:settings.SONGS_PER_PAGE*(page-1)] + songs + \
                playlist['songs'][settings.SONGS_PER_PAGE*page:]
            # refresh playlist
            save_session_playlist(request, playlist)
            
                    
        return HttpResponse(json.dumps({}), content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


@login_required
def playlist_add_songs(request, id):
    """
    Description: Add the specified songs (via song id's in a POST param) to the
                 specified playlist. This method prevents duplicates by not
                 re-adding songs that are already in the playlist
                 Only an authenticated user that owns the playlist can actually
                 add new songs.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to to have songs added
    Return:      JSON HttpResponse with data on number of songs in playlist
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user==playlist.owner):
        # get string list of song ids
        songs =  request.POST.getlist('songs[]')
        # convert this to integer list
        songs = map(int, songs)
        # now loop through and create these songs if necessary
        for song in songs:        
            Playlist_Songs.objects.get_or_create(
                playlist=playlist, song_id=song)
        
        # and now refresh playlist
        playlist.save()
        # log this activity
        if len(songs)==1:
            activity.send(request.user, verb="added",
                          object=Song.objects.get(id=songs[0]), target=playlist)
        else:
            activity.send(request.user, verb="updated", target=playlist)
        
                
        return HttpResponse(json.dumps({'num_songs':playlist.num_songs}), 
                            content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


def playlist_temp_add_songs(request, id):
    """
    Description: Add the specified songs (via song id's in a POST param) to the
                 specified temp. playlist. This method prevents duplicates by
                 not re-adding songs that are already in the playlist
                 Only an anonymous user that owns the playlist can actually
                 add new songs.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of temp. playlist to to have songs added
    Return:      JSON HttpResponse with data on number of songs in playlist
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_session_playlist(request, id)
    if not playlist:
        raise Http404
        
    if request.is_ajax() and (request.method=="POST"):
        # get string list of song ids
        songs =  request.POST.getlist('songs[]')
        # convert this to integer list
        songs = map(int, songs)
        # save this song list
        playlist['songs'].extend(s for s in songs if s not in playlist['songs'])
        # and save playlist
        save_session_playlist(request, playlist)
        
        return HttpResponse(json.dumps({'num_songs':playlist['num_songs']}), 
                            content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


@login_required
def playlist_delete_songs(request, id):
    """
    Description: Delete the specified songs (via song id's in a POST param) from
                 the specified playlist. 
                 Only an authenticated user that owns the playlist can actually
                 delete songs.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to to have songs deleted
    Return:      JSON HttpResponse with data on number of songs in playlist
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user==playlist.owner):
        # get string list of song ids
        songs =  request.POST.getlist('songs[]')
        # convert this to integer list
        songs = map(int, songs)
                
        # get playlist_songs to delete for this playlist
        playlist_songs = Playlist_Songs.objects.filter(
            playlist=playlist, song_id__in=songs)
        # delete these songs
        playlist_songs.delete()
        # and now refresh playlist
        playlist.save()

        return HttpResponse(json.dumps({'num_songs':playlist.num_songs}), 
                            content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


def playlist_temp_delete_songs(request, id):
    """
    Description: Delete the specified songs (via song id's in a POST param) from
                 the specified temporary playlist. 
                 Only an anonymous user that owns the playlist can actually
                 delete songs.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of temporary playlist to to have songs deleted
    Return:      JSON HttpResponse with data on number of songs in playlist
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_session_playlist(request, id)
    if not playlist:
        raise Http404
        
    if request.is_ajax() and (request.method=="POST"):
        # get string list of song ids
        songs =  request.POST.getlist('songs[]')
        # convert this to integer list
        songs = map(int, songs)
        playlist['songs'] = [s for s in playlist['songs'] if s not in songs]
        # and save playlist
        save_session_playlist(request, playlist)
        return HttpResponse(json.dumps({'num_songs':playlist['num_songs']}), 
                            content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


@login_required
def playlist_rename(request, id):
    """
    Description: Rename a playlist's title. The provided new title will be
                 cleaned and normalized.
                 Only an authenticated user that owns the playlist can actually
                 rename it.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to be renamed
    Return:      JSON HttpResponse with accepted new title.
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user==playlist.owner):
        max_length = Playlist._meta.get_field_by_name('title')[0].max_length
        new_title = request.POST.get('title').strip()[:max_length]
        original_title = playlist.title
        if len(new_title) >= 1:
            # only save new title if it actually has content
            try:
                playlist.title = new_title
                playlist.save()
            except:
                # if that failed, then reset playlist title because
                # this has to be returned
                playlist.title = original_title
        
        json_response = json.dumps({
            'title':playlist.title
            })
        return HttpResponse(json_response, content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


def playlist_temp_rename(request, id):
    """
    Description: Rename a temporary playlist's title. The provided new title 
                 will be cleaned and normalized to follow same rules as regular
                 playlists.
                 Only an anonymous user that owns the playlist can actually
                 rename it.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to to be renmaed
    Return:      JSON HttpResponse with accepted new title.
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_session_playlist(request, id)
    if not playlist:
        raise Http404
    
    if request.is_ajax() and (request.method=="POST"):
        max_length = Playlist._meta.get_field_by_name('title')[0].max_length
        new_title = request.POST.get('title').strip()[:max_length]
        if len(new_title) >= 1:
            playlist['title'] = new_title
            save_session_playlist(request, playlist)
            
        json_response = json.dumps({
                'title':new_title
                })
        return HttpResponse(json_response, content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


@login_required
def playlist_delete(request, id):
    """
    Description: Delete a playlist
                 Only an authenticated user that owns the playlist can do this.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to be deleted
    Return:      JSON HttpResponse with empty data
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user==playlist.owner):
        playlist.delete()
        return HttpResponse(json.dumps({}), content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


def playlist_temp_delete(request, id):
    """
    Description: Delete a temporary playlist
                 Only an anonymous user that owns the playlist can do this.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to be deleted
    Return:      JSON HttpResponse with empty data
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_session_playlist(request, id)
    if not playlist:
        raise Http404
    if request.is_ajax() and (request.method=="POST"):
        del request.session['playlists'][playlist['id']]
        request.session.modified = True
        return HttpResponse(json.dumps({}), content_type="application/json")


@login_required
def playlist_lock(request, id):
    """
    Description: Make a playlist private
                 Only an authenticated user that owns the playlist can do this.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to be locked
    Return:      JSON HttpResponse with status of 'private'
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user==playlist.owner):
        playlist.is_public = False
        playlist.save()
        json_response = json.dumps({
                'status': 'public' if playlist.is_public else 'private',
                })
        return HttpResponse(json_response, content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


@login_required
def playlist_unlock(request, id):
    """
    Description: Make a playlist public
                 Only an authenticated user that owns the playlist can do this.
                 This view function expects all calls to be ajax and POSTs.
                             
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist to be unlocked
    Return:      JSON HttpResponse with status of 'public'
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user==playlist.owner):
        playlist.is_public = True
        playlist.save()
        json_response = json.dumps({
                'status': 'public' if playlist.is_public else 'private',
                })
        return HttpResponse(json_response, content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


def playlist_subscribers(request, id):
    """
    Description: Get the subscribers of a given playlist.
                 Each of these subscribers is a user, so if request.user is
                 authenticated, append the 'following' status to it. This way
                 the UI can show a button to either follow or unfollow a button
                                 
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist of interest
    Return:      HttpResponse
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
            
    if request.is_ajax():
        # subscribers with information on if this user is following them
        subscribers_all = playlist.subscribers.all()
        template_context = users_helper(request, subscribers_all)
        following_list = template_context['users']
        following_status = []
        for followed in following_list:
            following_status.append(
                Following.objects.is_following(request.user.id, followed))
        
        following = zip(following_list, following_status)
        del template_context['users']
        
        template_context['content'] = render_to_string(
            'audio/content_subscribers.html',
            {'users':following,
             'playlist':playlist},
            context_instance=RequestContext(request))
                
        json_response = json.dumps(template_context)
        return HttpResponse(json_response, content_type="application/json")
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('headfoot.html',
                              context_instance=RequestContext(request))


@login_required
def playlist_subscribe(request, id):
    """
    Description: Subscribe request.user to a playlist if user doesn't own
                 playlist.
                 All calls to this expected to be Ajax and POSTs.
                                 
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist of interest
    Return:      JSON HttpResponse with status of 'subscribed'
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user!=playlist.owner):
        playlist.subscribers.add(request.user)
        playlist.save()
        json_response = json.dumps({
                'status': 'subscribed',
                })
        # log this activity
        activity.send(request.user, verb="favorited", target=playlist)        
        return HttpResponse(json_response, content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


@login_required
def playlist_unsubscribe(request, id):
    """
    Description: Unubscribe request.user from a playlist if user doesn't own
                 playlist.
                 All calls to this expected to be Ajax and POSTs.
                                 
    Arguments:   - request: HttpRequest object
                 - id:      id of playlist of interest
    Return:      JSON HttpResponse with status of 'subscribe' which indicates
                 user not current subscribed.
                                  
    Author:      Nnoduka Eruchalu
    """
    playlist = get_object_or_404(Playlist, id=id)
    
    if request.is_ajax() and (request.method=="POST") and \
            (request.user!=playlist.owner):
        playlist.subscribers.remove(request.user)
        playlist.save()
        json_response = json.dumps({
                'status': 'subscribe',
                })
        return HttpResponse(json_response, content_type="application/json")
    
    # coming this far isnt legit
    raise Http404


