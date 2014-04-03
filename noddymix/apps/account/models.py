from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.core.urlresolvers import reverse
from django.conf import settings

from imagekit.models import ImageSpecField
from imagekit.processors import SmartResize, Adjust
from noddymix.utils import get_upload_path


# Create your models here.

# HELPER FUNCTIONS
def get_avatar_path(instance, filename):
    return get_upload_path(instance, filename, 'img/a/')

def get_cover_path(instance, filename):
    return get_upload_path(instance, filename, 'img/c/')


class User(AbstractUser):
    """
    Description: Extended User class
                 
                 There are two approaches to extending Django's User class:
                 - A related model that had a 1:1 rlp with 
                   django.contrib.auth.models.User
                   + This has the caveat of extra joins to get user profile
                 - Subclass django.contrib.auth.models.AbstractUser
                   This is more efficient, but less modular
      
                 I choose to go for option 2 because I want speed
            
    Author:      Nnoduka Eruchalu
    """
    
    # avatar
    avatar = models.ImageField(upload_to=get_avatar_path, blank=True)
    
    # imagekit spec for avatar shown on desktop view of profile page
    avatar_small = ImageSpecField(
        source='avatar',
        processors=[SmartResize(width=66, height=66),
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    # imagekit spec for avatar shown in mobile app's slide-navigation menu
    avatar_thumbnail = ImageSpecField(
        source='avatar',
        processors=[SmartResize(width=33, height=33),
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    # imagekit spec for avatar shown on mobile view of profile page
    avatar_mobile_small = ImageSpecField(
        source='avatar',
        processors=[SmartResize(width=100, height=100),
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    
    # cover photo
    cover = models.ImageField(upload_to=get_cover_path, blank=True)
    
    # imagekit spec. for mobile version of cover photo (shown on profile page)
    cover_small = ImageSpecField(
        source='cover',
        processors=[SmartResize(width=330, height=181), 
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    
    # this is used for tracking avatar/cover changes
    # ref: http://stackoverflow.com/a/1793323
    __original_avatar = None
    __original_cover = None
    
    
    # settings: make user's activity public
    activity_public = models.BooleanField(
        default=True, verbose_name="activity is public")
    
        
    # keep these stats here so wont have to run count() queries each time
    # we want to display this infomration on a user's profile page
    num_playlists = models.IntegerField(default=0,
                                        verbose_name="number of playlists")
    num_followers = models.IntegerField(default=0,
                                        verbose_name="number of followers") 
    num_following = models.IntegerField(default=0,
                                        verbose_name="number following") 

    def get_account_name(self):
        """
        Description: Get a first name to identify user by
                     If there is a valid first name then use that,
                     Otherwise use a default
    
        Arguments:   None
        Return:      (str) representation of user's first name
          
        Author:      Nnoduka Eruchalu
        """
        return self.first_name or 'Account'
    
    
    def get_full_name(self):
        """
        Description: Get user's full name
                     If there is a valid full name then use that,
                     Otherwise use the username [prepended with an '@']
    
        Arguments:   None
        Return:      (str) user's full name
          
        Author:      Nnoduka Eruchalu
        """
        return (super(User, self).get_full_name() or ('@'+self.username))
    
    
    def __unicode__(self):
        """
        Description: Override the representation of users to use full names.
        
        Arguments:   None
        Return:      (str) user's full name
          
        Author:      Nnoduka Eruchalu
        """
        return self.get_full_name()
        
        
    def delete_avatar_files(self, instance):
        """
        Description: Delete a user's avatar files in storage
                     - First delete the user's ImageCacheFiles on storage
                       The reason this must happen first is that deleting source
                       file deletes the associated ImageCacheFile references but
                       not the actual ImageCacheFiles in storage.
                     - Next delete source file (this also performs a delete on
                       the storage backend)
        
        
        Arguments:   - instance: User object instance to have files deleted
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        # get avatar_thumbnail location and delete it
        instance.avatar_thumbnail.storage.delete(instance.avatar_thumbnail.name)
        # do same for avatar_small
        instance.avatar_small.storage.delete(instance.avatar_small.name)
        # delete avatar
        instance.avatar.delete()


    def delete_cover_files(self, instance):
        """
        Description: Delete a user's cover photo files on django storage
                     - First delete the user's cover_small on storage
                       The reason this must happen first is that deleting the 
                       source file (cover) deletes the associated ImageCacheFile
                       reference (cover_small) but not the actual file in 
                       storage.
                     - Next delete cover photo (this also performs a delete on 
                       the storage backend)
                
        Arguments:   - instance: User object instance to have files deleted
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        # get cover_small location and delete it
        instance.cover_small.storage.delete(instance.cover_small.name)
        # delete cover
        instance.cover.delete()
    
    
    def __init__(self, *args, **kwargs):
        super(User, self).__init__(*args, **kwargs)
        self.__original_avatar = self.avatar
        self.__original_cover = self.cover
        
        
    def get_absolute_url(self):
        return reverse('userpage', args=[self.id])
    
    
    def get_recent_activities(self):
        """
        Description: Get recent activities of other user's that this user is 
                     following.
                     Recent defined as the last `ACTIVITY_LIMIT` to have been
                     logged.
                
        Arguments:   - instance: User object instance to have files deleted
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        from noddymix.apps.activity.models import Activity
        
        activities = []
        # can only pull activities for followings that make this public
        followings = [rlp.followed for rlp in self.following.all() \
                          if rlp.followed.activity_public]
        
        """
        # alternative algorithm that works
        for rlp in followings:
            activities.extend(rlp.followed.activities.all())
            if len(activities) > settings.ACTIVITY_LIMIT:
                break
        
        return activities[:settings.ACTIVITY_LIMIT]
        """
        activities = Activity.objects.filter(
            actor__in=followings)[:settings.ACTIVITY_LIMIT]
        return activities
        
    
    def save(self, *args, **kwargs):
        """
        Description: On instance save ensure image files are deleted if images
                     are updated.
                            
        Arguments:   *args, **kwargs
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        if self.__original_avatar and self.avatar != self.__original_avatar:
            # not new cover and cover changed, so delete old files
            orig = User.objects.get(pk=self.pk)
            self.delete_avatar_files(orig)
        
        if self.__original_cover and self.cover != self.__original_cover:
            # not new cover and cover changed, so delete old files
            orig = User.objects.get(pk=self.pk)
            self.delete_cover_files(orig)
                    
        super(User, self).save(*args, **kwargs)
        # update the image file tracking properties
        self.__original_avatar = self.avatar
        self.__original_cover = self.cover
        
    
    def delete(self, *args, **kwargs):
        """
        Description:  Default model delete doesn't delete files on storage,
                     so force that to happen.
                     Also update playlist subscriptions and followers count of 
                     followings
                            
        Arguments:   *args, **kwargs
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        # if there were image files, delete those
        if self.avatar:
            self.delete_avatar_files(self)
        
        if self.cover:
            self.delete_cover_files(self)
        
        # all users this user followed now have 1 less follower
        followings = self.following.all()
        for following in followings:
            following.followed.num_followers -= 1
            following.followed.save()
        
        # all users following this user now have 1 less follow
        followers = self.followers.all()
        for follower in followers:
            follower.follower.num_following -= 1
            follower.follower.save()
            
        # all playlists this user subscribed to now have 1 less subscriber
        playlists = self.subscriptions.all()
        for playlist in playlists:
            playlist.num_subscribers -= 1
            playlist.save(refresh_num_subscribers=False)
            
        super(User, self).delete(*args, **kwargs)
