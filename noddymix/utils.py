"""
Description:
  Utility functions that come in handy through the project

Table Of Contents:
  - slugify:         slugify any given string
  - get_upload_path: determine a unique upload path for a given file
  - users_helper:    paginate the list of users
  - list_dedup:      dedup a list and preserve order of elements

Author: 
  Nnoduka Eruchalu
"""

from datetime import datetime
import os, re, unicodedata

#imports for pagination
from django.conf import settings
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger


def slugify(string):
    """
    Description: Slugify any given string with following rules:
                 - ASCII encoding
                 - Non-alphanumerics are replaced with hyphens
                 - groups of hyphens will be replaced with a single hyphen
                 - slugs cannot begin/end with hyphens.
    
    Arguments:   - string: string to get slugged version of
    Return:      ASCII slugified version of input string
        
    Author:      Nnoduka Eruchalu
    """
    s = unicode(string)
    # Get normal form 'NFKD' for the unicode version of passed string
    slug = unicodedata.normalize('NFKD', s)
    # Set result to use ASCII encoding
    slug = slug.encode('ascii', 'ignore').lower()
    # Replace all non-alphanumerics with hyphens '-', and strip() any hyphens
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')
    # finally, replace groups of hyphens with a single hyphen
    slug = re.sub(r'[-]+', '-', slug)
    return slug


def get_upload_path(instance, filename, root):
    """
    Description: Determine a unique upload path for a given file
    
    Arguments:   - instance: model instance where the file is being attached
                 - filename: filename that was originally given to the file
                 - root:     root folder to be prepended to file upload path.
                             Example value is 'photo/' or 'photo'  
    Return:      Unique filepath for given file, that's a subpath of `root`
            
    Author:      Nnoduka Eruchalu
    """
    name = filename.split('.')
    format = slugify(name[0])+"_"+ str(datetime.now().strftime("%Y%m%dT%H%M%S")) + "." + name[len(name)-1]
    return os.path.join(root, format)


def users_helper(request, users_list):
    """
    Description: Paginate a list of users
    
    Arguments:   - request:    HttpRequest object [might contain page number]
                 - users_list: List of user objects to be paginated      
    Return:      Dictionary of paginated user list context with following keys:
                 - users:     list of users that made it to current page
                 - curr_page: current page
                 - prev_page: previous page [1-indexed, and 0 if on first page]
                 - next_page: next page [1-indexed, and 0 if on last page]
                 - num_pages: total number of pages
        
    Author:      Nnoduka Eruchalu
    """
    paginator = Paginator(users_list, settings.USERS_PER_PAGE)
    
    page = request.GET.get('page')
    try:
        users = paginator.page(page)
    except PageNotAnInteger:
        # if page is not an integer, deliver first page.
        page = 1
        users = paginator.page(1)
    except EmptyPage:
        # if page is out of range (e.g. 999), deliver last page of results
        page = paginator.num_pages
        users = paginator.page(paginator.num_pages)
                
    if users.has_next():
        next_page_num = users.next_page_number()
    else:
        next_page_num = 0 # way of indicating no more pages... 1 index'd helped!
    
    if users.has_previous():
        prev_page_num = users.previous_page_number()
    else:
        prev_page_num = 0
    
    users = users.object_list
    return {
        'users':users,
        'curr_page':page,
        'prev_page':prev_page_num,
        'next_page':next_page_num,
        'num_pages':paginator.num_pages,
        }



def list_dedup(in_list):
    """    
    Description: Dedup a list and preserve order
          
    Arguments:   - in_list: list to have its duplicates removed
    Return:      Dedup'd version of passed list
        
    Author:      Nnoduka Eruchalu
    """
    seen = set()
    return [s for s in in_list if s not in seen and not seen.add(s)]
