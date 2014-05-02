# Create your views here.
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.template.loader import render_to_string
from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings

from haystack.forms import SearchForm
from haystack.query import EmptySearchQuerySet, SearchQuerySet 
from noddymix.apps.audio.models import Song, Playlist
from noddymix.apps.account.models import User
from noddymix.apps.relationship.models import Following
from noddymix.apps.audio.views import songs_helper_json, playlists_helper, \
    setup_playlists_json
from noddymix.utils import users_helper, list_dedup
from noddymix.apps.relationship.views import setup_users_json

import json

def search_helper(request, searchqueryset, pagination_function):
    """
    Description: Helper function by searching
                 Based off haystack.views.basic_search()
                   
    Arguments:   - request:             HttpRequest object
                 - searchqueryset:      SearchQuerySet limited to a model by
                                        calling SearchQuerySet().models()
                 - pagination_function: Helper function for use in paginating
                                        the search results
    Return:      Dictionary with keys coming from pagination_function. Two
                 New keys will be added to it:
                 - query:      search query
                 - suggestion: backend-suggested search query
    
    Author:      Nnoduka Eruchalu
    """
    query = ''
    results = EmptySearchQuerySet()
    suggestion = False
    search_list = []
    
    if request.GET.get('q'):
        form = SearchForm(request.GET, searchqueryset=searchqueryset,
                          load_all=True)
        if form.is_valid():
            query = form.cleaned_data['q']
            results = form.search()
            # for odd reasons there are duplicates in the haystack results...
            search_list = list_dedup([r.object for r in results])
                                    
        if results.query.backend.include_spelling:
            suggestion = form.get_suggestion()
                        
    context = pagination_function(request, search_list)
    context['query'] = query
    context['suggestion'] = suggestion
    return context


def search(request):
    """
    Description: Search through Songs
                   
    Arguments:   - request: HttpRequest object with query in GET param `q`
    Return:      HttpResponse
    
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax():
        songs_json_dict = search_helper(request, SearchQuerySet().models(Song),
                                        songs_helper_json)
        if not request.mobile:
            songs_json_dict['header'] = render_to_string(
                'search/header.html',
                {'query':songs_json_dict['query'],
                 'suggestion':songs_json_dict['suggestion'],
                 'active_tab':'songs'},
                context_instance=RequestContext(request))
        json_response = json.dumps(songs_json_dict)
        return HttpResponse(json_response, content_type="application/json")
    
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    query = request.GET.get('q') or ''
    return render_to_response('search/search.html',
                              {'query':query},
                              context_instance=RequestContext(request))


def search_playlists(request):
    """
    Description: Search through Playlists
                   
    Arguments:   - request: HttpRequest object with query in GET param `q`
    Return:      HttpResponse
    
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax():
        playlists_context = search_helper(
            request, SearchQuerySet().models(Playlist), playlists_helper)
        
        if request.mobile:
            playlists_context['playlists'] = \
                setup_playlists_json(playlists_context['playlists'], request)
        
        else:
            playlists_context['content'] = render_to_string(
                'search/content_playlists.html',
                playlists_context,
                context_instance=RequestContext(request))
            del playlists_context['playlists']
        
        json_response = json.dumps(playlists_context)
        return HttpResponse(json_response, content_type="application/json")
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
       
    return render_to_response('headfoot.html',
                              context_instance=RequestContext(request))


def search_users(request):
    """
    Description: Search through Users
                   
    Arguments:   - request: HttpRequest object with query in GET param `q`
    Return:      HttpResponse
    
    Author:      Nnoduka Eruchalu
    """
    if request.is_ajax():
        template_context = search_helper(
            request, SearchQuerySet().models(User), users_helper)
        following_list = template_context['users']
        following_status = []
        for followed in following_list:
            following_status.append(
                Following.objects.is_following(request.user.id, followed))
        
        following = zip(following_list, following_status)
        
        if request.mobile:
            template_context['users'] = setup_users_json(request, following)
            
        else:
            template_context['users'] = following
            template_context['content'] = render_to_string(
                'search/content_users.html',
                template_context,
                context_instance=RequestContext(request))
            del template_context['users']
                
        json_response = json.dumps(template_context)
        return HttpResponse(json_response, content_type="application/json")
    
    # a mobile page shouldn't make a direct request here
    if request.mobile:
        return HttpResponseRedirect('/')
    
    return render_to_response('headfoot.html',
                              context_instance=RequestContext(request))
    
