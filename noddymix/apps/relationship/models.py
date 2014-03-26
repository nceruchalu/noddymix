from django.db import models
from noddymix.apps.account.models import User

# Create your models here.
class FollowingManager(models.Manager):
    """
    Description: Custom model manager needed to add table-level operations on
                 the Following model.
                 
    Author:      Nnoduka Eruchalu
    """
    
    def is_following(self, follower, followed):
        """
        Description: Is user `follower` following user `followed`?
        
        Arguments:   - follower: User doing the following 
                     - followed: User being followed
        Return:      Boolean: True/False
          
        Author:      Nnoduka Eruchalu
        """
        try:
            following_exact = self.get(follower=follower, followed=followed)
            return True
        except self.model.DoesNotExist:
            return False
    
    def follow(self, follower, followed):
        """
        Description: If User `follower` not already following `followed`, then
                     create this relationship
        
        Arguments:   - follower: User doing the following 
                     - followed: User being followed
        Return:      None
          
        Author:      Nnoduka Eruchalu
        """
        if follower != followed and not self.is_following(follower, followed):
            self.model(follower=follower, followed=followed).save()
    
    def unfollow(self, follower, followed):
        """
        Description: If User `follower` following `followed`, then delete this
                     relationship
        
        Arguments:   - follower: User doing the following 
                     - followed: User being followed
        Return:      None
          
        Author:      Nnoduka Eruchalu
        """
        try:
            following_exact = self.get(follower=follower, followed=followed)
            following_exact.delete()
        except self.model.DoesNotExist:
            pass


class Following(models.Model):
    """
    Description: Following table.
                 Every Relationship can be represented by simply stating it
                 as "user_1 follows user_2" and making that entry in the
                 `Following`. If user_2 also follows user_1, then that
                 will be another relationship in the `Followinging` table.
                                                                       
    Author:      Nnoduka Eruchalu
    """
    
    # user who is doing the following
    follower = models.ForeignKey(User, related_name="following")
    # user who is being followed
    followed = models.ForeignKey(User, related_name="followers")
    # custom manager
    objects = FollowingManager()

    def __unicode__(self):
        return u'%s following %s' % (self.follower.username, 
                                     self.followed.username)

    def delete(self, *args, **kwargs):
        """
        Description: On a relationship deletion, first decrement followers and 
                     following counts for Users involved in relationship.
                     Again we go through this because we choose to have these
                     summary statistics logged in the User table to speed up
                     processes that would otherwise run count() queries.
        
        Arguments:   *arg, **kwargs
        Return:      None
          
        Author:      Nnoduka Eruchalu
        """
        self.follower.num_following -=1
        self.follower.save()
        self.followed.num_followers -=1
        self.followed.save()
        super(Following, self).delete(*args, **kwargs) # call "real" delete()
        
        
    def save(self, *args, **kwargs):
        """
        Description: On a relationship creation, first increament  followers and
                     following counts for Users involved in relationship.
                     Again we go through this because we choose to have these
                     summary statistics logged in the User table to speed up
                     processes that would otherwise run count() queries.
        
        Arguments:   *arg, **kwargs
        Return:      None
          
        Author:      Nnoduka Eruchalu
        """
        if self.pk is None:
            self.follower.num_following += 1
            self.follower.save()
            self.followed.num_followers += 1
            self.followed.save()
        super(Following, self).save(*args, **kwargs) # call "real" save()
