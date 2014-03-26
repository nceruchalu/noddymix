from django.db import models

from datetime import datetime
# Create your models here.

SUBJECT_CHOICES = (('Song Request', 'Song Request'), 
                   ('General', 'General'), 
                   ('Copyright Infringement', 'Copyright Infringement'))

class Feedback(models.Model):
    """
    Description: User Feedback
                                                      
    Author:      Nnoduka Eruchalu
    """
    subject = models.CharField(max_length=100, choices=SUBJECT_CHOICES,
                               default=SUBJECT_CHOICES[0][0])
    body = models.CharField(max_length=1000) 
    email = models.EmailField(max_length=100, blank=True)
    date_added = models.DateTimeField(default=datetime.now, editable=False)
    
    class Meta:
        ordering = ['-date_added']
        
    def __unicode__(self):
        return self.body
