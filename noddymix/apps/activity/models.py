"""
Description: 
  activity app model

References:
  - Atom Activity Streams 1.0 spec:
    + http://activitystrea.ms/specs/atom/1.0/
  - model based off:
    + https://github.com/justquick/django-activity-stream [great but bloated]
    + https://github.com/paulosman/django-activity

Author:
  Nnoduka Eruchalu
"""

from django.db import models

from noddymix.apps.account.models import User
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.core.urlresolvers import reverse
from datetime import datetime

from noddymix.apps.activity.signals import activity
from noddymix.apps.activity.utils import activity_handler


# Create your models here.

class Activity(models.Model):
    """
    Description:
      Activity describes an actor acting out a verb (on an optional object) 
      (to an optional target)
      Nomenclature based on http://activitystrea.ms/specs/atom/1.0/
          `actor`:  the object that performed the activity
          `verb`:   the verb phrase that identifies the action of the activity
          `object`: the object linked to the action itself
          `target`: the object to which the activity was performed
    
      Generalized Format:
          <actor <verb> <time>
          <actor <verb> <target> <time>
          <actor <verb> <object> <target> <time>
    
      Examples:
          <nceruchalu> <created a playlist> <1 minute ago>
          <nkemka> <followed> <drkems> <2 days ago>
          <drkems> <added> <song:kukere> to <playlist:1> <2 hours ago>
        
      Unicode Representation (`Title` in spec):
          nceruchalu created a playlist 1 minute ago
          nkemka followed drkems 2 days ago
          drkems added kukere to playlist:1 2 hours ago
        
      HTML Representation (`Summary` in spec):
          <a href="/u/9/">drkems</a> added <a href="/s/11/">kukere</a> to 
            <a href="/p/11/">1</a> 2 hours ago
    
    Author: Nnoduka Eruchalu
    """
    # actor
    actor = models.ForeignKey(User, related_name="activities")
    
    # verb
    verb = models.CharField(max_length=255)
    
    # object
    object_content_type = models.ForeignKey(ContentType, related_name='object',
                                            blank=True, null=True)
    object_id = models.PositiveIntegerField(blank=True, null=True)
    object = generic.GenericForeignKey('object_content_type', 'object_id')
    
    # target
    target_content_type = models.ForeignKey(ContentType, related_name='target',
                                            blank=True, null=True)
    target_id = models.PositiveIntegerField(blank=True, null=True)
    target = generic.GenericForeignKey('target_content_type', 'target_id')
    
    # time
    date_added = models.DateTimeField(default=datetime.now)
    
    class Meta:
        ordering=('-date_added',)
    
    
    def __unicode__(self):
        ctx = {
            'actor': self.actor,
            'verb': self.verb,
            'object': self.object,
            'target': self.target,
            'timesince': self.timesince()
        }
        if self.target:
            # if there is a <target>, then there might also be an <object>
            if self.object:
                # if there is a <target> and an <object>
                return u'%(actor)s %(verb)s %(object)s to %(target)s %(timesince)s ago' % ctx
            # if there is a <target> and no <object>
            return u'%(actor)s %(verb)s %(target)s %(timesince)s ago' % ctx
        
        if self.object:
            # if there isn't a <target> but there is an <object>
            return u'%(actor)s %(verb)s %(object)s %(timesince)s ago' % ctx
        
        # if there isn't a <target> and there isn't an <object>
        return u'%(actor)s %(verb)s %(timesince)s ago' % ctx
    
    
    def timesince(self, now=None):
        """
        Description: Get time since this activity instance was created.
                     Effectively a shortcut for django.utils.timesince.timesince
                   
        Arguments:   - now: datetime.datetime instance to start time comparison
        Return:     (str) nicely formatted time e.g. "10 minutes"
        
        Author:      Nnoduka Eruchalu
        """
        from django.utils.timesince import timesince as timesince_
        return timesince_(self.date_added, now)
    
    
    def actor_url(self):
        """
        Description: Get the URL to the user view for the actor.
                   
        Arguments:   None
        Return:      URL of `actor` object
        
        Author:      Nnoduka Eruchalu
        """
        return self.actor.get_absolute_url() if self.actor else None
        
    
    def target_url(self):
        """
        Description: Get the URL to the view for the target.
                   
        Arguments:   None
        Return:      URL of `target` object
        
        Author:      Nnoduka Eruchalu
        """
        return self.target.get_absolute_url() if self.target else None
        
    
    def object_url(self):
        """
        Description: Get the URL to the view for the object.
                   
        Arguments:   None
        Return:      URL of `object` object
        
        Author:      Nnoduka Eruchalu
        """
        return self.object.get_absolute_url() if self.object else None


# connect the signal
activity.connect(activity_handler, dispatch_uid="noddymix.apps.activity.models")
