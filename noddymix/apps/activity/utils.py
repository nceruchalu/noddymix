"""
Description:
  Utility functions associated with the activity app

Table Of Contents:
  - activity_handler: create activity instance on triggered by signal call
  
Author: 
  Nnoduka Eruchalu
"""

from django.template.loader import render_to_string
from django.conf import settings
import json, redis

def activity_handler(sender, **kwargs):
    """
    Description: Receiver function for activity signal. This callback creates an
                 Activity object instance and publishes its details to the redis
                 channel. This is start of the realtime activity stream pipeline
    
    Arguments:   - sender: signal sender
                 - **kwargs
    Return:      ASCII slugified version of input string
        
    Author:      Nnoduka Eruchalu
    """
    from noddymix.apps.activity.models import Activity
    
    kwargs.pop('signal', None)
    
    actor = sender
    verb = kwargs.pop('verb')
    object = kwargs.pop('object', None) 
    target = kwargs.pop('target', None)
    
    # Go through these hoops to ensure the database is only hit once
    if not object and not target:
        act = Activity.objects.create(actor=actor, verb=verb)
    elif not object and target:
        act = Activity.objects.create(actor=actor, verb=verb, target=target)
    elif object and not target:
        act = Activity.objects.create(actor=actor, verb=verb, object=object)
    else:
        act = Activity.objects.create(actor=actor, verb=verb, 
                                      object=object, target=target)
    
    # Activity instance created... so publish to redis channel if possible
    try:
        if actor.activity_public:
            # only publish to live stream if actor allows this
            pub = redis.StrictRedis(host=settings.REDIS_HOST, 
                                    port=settings.REDIS_PORT)
            activity_html = render_to_string("activity/activity.html", 
                                             {'activity':act, 
                                              'no_activity_time':True,
                                              'STATIC_URL':settings.STATIC_URL})
            pub.publish(
                settings.ACTIVITY_REDIS_CHANNEL,
                json.dumps({"room":actor.id, "data":activity_html}))
    
    except redis.exceptions.ConnectionError:
        pass
            
