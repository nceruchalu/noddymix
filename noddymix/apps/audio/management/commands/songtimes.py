"""
Description:
  Manangement command module for updating song time lengths (in seconds) for 
  each Song object in db
  
Author: 
  Nnoduka Eruchalu
"""

from django.core.management.base import BaseCommand, CommandError
from noddymix.apps.audio.models import Song
from mutagen.mp3 import MP3
from tempfile import NamedTemporaryFile
from urllib2 import urlopen

class Command(BaseCommand):
    help = 'update all song time lengths (in seconds)'
    
    def handle(self, *args, **options):
        """
        Description: download all songs (to temporary local files), extract
                     song length (in seconds) and save this info to db.
                                 
        Arguments:   *args, **options
        Return:      None
        
        Author:      Nnoduka Eruchalu
        """
        for song in Song.objects.all():
            try:
                response = urlopen(song.mp3.url)
                local_file = NamedTemporaryFile()
                local_file.write(response.read())
                audio = MP3(local_file.name)
                song.length = int(audio.info.length)
                song.save()
                print song.title, ': ', song.length
                local_file.close() # this deletes the temp file
            except:
                print 'error: ', song.title
        
