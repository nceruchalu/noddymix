from django.db import models

from django.core.urlresolvers import reverse
from imagekit.models import ImageSpecField
from imagekit.processors import SmartResize, Adjust
from noddymix.utils import get_upload_path
from noddymix.apps.account.models import User
from django.conf import settings

from datetime import datetime
from mutagen.mp3 import MP3

# Create your models here.

# ---------------------------------------------------------------------------- #
# HELPER FUNCTIONS
# ---------------------------------------------------------------------------- #

def get_albumart_path(instance, filename):
    """
    Description: Determine a unique upload path for a given Album art file
    
    Arguments:   - instance: Album model instance where file is being attached
                 - filename: filename that was originally given to the file
    Return:      Unique filepath for given file, that's a subpath of `img/art/`
            
    Author:      Nnoduka Eruchalu
    """
    return get_upload_path(instance, filename, 'img/art/')


def get_mp3_path(instance, filename):
    """
    Description: Determine a unique upload path for a given Song mp3 file
    
    Arguments:   - instance: Song model instance where file is being attached
                 - filename: filename that was originally given to the file
    Return:      Unique filepath for given file, that's a subpath of `audio/`
            
    Author:      Nnoduka Eruchalu
    """
    return get_upload_path(instance, filename, 'audio/')



# ---------------------------------------------------------------------------- #
# MODEL CLASSES
# ---------------------------------------------------------------------------- #

class Album(models.Model):
    """
    Description: Every Song object is attached to an album even if the album is 
                 just a single
                                                      
    Author:      Nnoduka Eruchalu
    """
    
    # album title
    title = models.CharField(max_length=200)
    
    # album art
    art = models.ImageField(upload_to=get_albumart_path, blank=True)
    
    # imagekit specs for art shown on desktop view of album/playlist collections
    art_small = ImageSpecField(
        source='art',
        processors=[SmartResize(width=132, height=132),
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    # imagekit spec for art shown with music player bar of desktop view.
    art_thumbnail = ImageSpecField(
        source='art',
        processors=[SmartResize(width=60, height=60),
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    
    # imagekit specs for art shown on mobile view of album/playlist collections
    art_mobile_small = ImageSpecField(
        source='art',
        processors=[SmartResize(width=70, height=70),
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    # imagekit spec for art shown with music player bar of desktop view
    art_mobile_thumbnail = ImageSpecField(
        source='art',
        processors=[SmartResize(width=39, height=39),
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    
    # imagekit spec for art shown as desktop view's og:image (facebook sharing)
    # and mobile view's (now playing) song-details poster.
    art_display = ImageSpecField(
        source='art',
        processors=[SmartResize(width=320, height=320),
                    Adjust(contrast = 1.2, sharpness=1.1)],
        format='JPEG',
        options={'quality':90})
    
    # this is used for tracking album art changes
    # ref: http://stackoverflow.com/a/1793323
    __original_art = None
        
    class Meta:
        ordering = ['title']   
                
    def __unicode__(self):
        return self.title
    
    def __init__(self, *args, **kwargs):
        super(Album, self).__init__(*args, **kwargs)
        self.__original_art = self.art
        
    
    def delete_art_files(self, instance):
        """
        Description: Delete an album's art files in storage
                     - First delete the user's ImageCacheFiles on storage
                       The reason this must happen first is that deleting source
                       file deletes the associated ImageCacheFile references but
                       not the actual ImageCacheFiles in storage.
                     - Next delete source file (this also performs a delete on
                       the storage backend)
                
        Arguments:   - instance: Album object instance to have files deleted
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        # get art_thumbnail location and delete it
        instance.art_thumbnail.storage.delete(instance.art_thumbnail.name)
        # do same for art_small
        instance.art_small.storage.delete(instance.art_small.name)
        # delete art
        instance.art.delete()

    
    def save(self, *args, **kwargs):
        """
        Description: On instance save ensure art files are deleted if art is
                     updated.
                            
        Arguments:   *args, **kwargs
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        if self.__original_art and self.art != self.__original_art:
            # not new art and art changed, so delete old files
            orig = Album.objects.get(pk=self.pk)
            self.delete_art_files(orig)
                                    
        super(Album, self).save(*args, **kwargs)
        self.__original_art = self.art
            
    
    def delete(self, *args, **kwargs):
        """
        Description: Default model delete doesn't delete files on storage,
                     so force that to happen.
                                                 
        Arguments:   *args, **kwargs
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        if self.art:
            self.delete_art_files(self)
        
        super(Album, self).delete(*args, **kwargs)


class Artist(models.Model):
    """
    Description: The musician(s) that create the Song objects.
                                                      
    Author:      Nnoduka Eruchalu
    """
    
    name = models.CharField(max_length=200)
    
    class Meta:
        ordering=['name']

    def __unicode__(self):
        return self.name


class Song(models.Model):
    """
    Description: These are the actual songs that people come to this site to 
                 listen to.
                                                      
    Author:      Nnoduka Eruchalu
    """
    
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(Artist, related_name="songs")
    featuring = models.ManyToManyField(Artist, blank=True)
    album = models.ForeignKey(Album, related_name="songs")
    mp3 = models.FileField(upload_to=get_mp3_path)
    num_plays = models.IntegerField(default=0) # total number of plays
    date_added = models.DateTimeField(default=datetime.now, editable=False)
    length = models.IntegerField(default=0) # length in seconds
    
    # this is used for mp3 file changes
    # ref: http://stackoverflow.com/a/1793323
    __original_mp3 = None

    class Meta:
        ordering = ['title']
        get_latest_by = 'date_added'
        
    def __unicode__(self):
        return self.title
    
    def __init__(self, *args, **kwargs):
        super(Song, self).__init__(*args, **kwargs)
        self.__original_mp3 = self.mp3
        
    def get_absolute_url(self):
        return reverse('song', args=[self.id])
    
        
    def save(self, *args, **kwargs):
        """
        Description:  On song save, if mp3 file is being updated, delete old
                      one from storage.
                      If any mp3 file is being added (new or update), update
                      associated song length
                                                 
        Arguments:   *args, **kwargs
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        
        if mp3 file is being changed, update song length
        """
        if self.__original_mp3 and self.mp3 != self.__original_mp3:
            # not new mp3 and mp3 file changed so delete old file
            orig = Song.objects.get(pk=self.pk)
            orig.mp3.delete()
            
        if self.mp3 != self.__original_mp3:
            #  mp3 file change (new or replacement), so update song length
            audio = MP3(self.mp3.file.temporary_file_path())
            self.length = int(audio.info.length)
                    
        super(Song, self).save(*args, **kwargs)
        self.__original_mp3 = self.mp3
                
    
    def delete(self, *args, **kwargs):
        """
        Description: On a Song delete, this song will be removed from all 
                     playlists it's currently on. So decrement all associated 
                     playlist's song counts.
                     In addition to that default model delete doesn't delete 
                     files on storage, so force that to happen.
        
        Arguments:   *args, **kwargs
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        # decrement all associated playlist's song counts. Be sure that when
        # the playlist is saved it doesn't try to refresh number of songs
        # because this song object hasnt been deleted yet.
        # probably could have just let it refresh num songs if this for-loop
        # was run after super(Song, self).delete()... but it's nice to try
        # something else.
        playlist_songs = Playlist_Songs.objects.filter(song=self)
        for playlist_song in playlist_songs:
            playlist_song.playlist.num_songs -= 1
            playlist_song.playlist.save(refresh_num_songs=False)
            
        self.mp3.delete()
        
        super(Song, self).delete(*args, **kwargs)


class Playlist(models.Model):
    """
    Description: Users can have multiple and named playlists
                                                      
    Author:      Nnoduka Eruchalu
    """
    
    # playlist's creator
    owner = models.ForeignKey(User, related_name="playlists")
    # playlist's name/title
    title = models.CharField(max_length=50, default='a playlist')
    # songs in playlist
    songs = models.ManyToManyField(Song, blank=True, through='Playlist_Songs')
    # other users that have subscribed to this playlist
    subscribers = models.ManyToManyField(User, blank=True, 
                                         related_name="subscriptions")
    # is this playlist publicly available
    is_public = models.BooleanField(default=True)
    # Album whose art will be playlist's cover art
    cover_album = models.ForeignKey(Album, null=True)
    # date playlist is created
    date_added = models.DateTimeField(default=datetime.now)
    
    # keep these stats here so wont have to run count() queries each time
    # the playlist's statistics are to be pulled
    num_songs = models.IntegerField(default=0,
                                    verbose_name="number of songs")
    num_subscribers = models.IntegerField(default=0,
                                          verbose_name="number of subscribers")
    
    class Meta:
        ordering = ('-date_added',)
    
    def __unicode__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('playlist', args=[self.id])
    
    
    def get_first_song_album(self):
        """
        Description: Return an album (with album art) that will represent the
                     playlist
                     In this case,the representative album is that of the first 
                     song in playlist. Another upside to having order to
                     playlist's songs
                             
        Arguments:   Album object instance
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        songs = self.songs.all().order_by("playlist_songs", "-date_added")
        if songs and songs[0].album and songs[0].album.art:
            return songs[0].album
        else:
            return None
    
    
    def save(self, *args, **kwargs):
        """
        Description: On a Playlist save, update owner's number of playlists if
                     it's new. If however this is just a playlist update, 
                     update number of songs, number of subscribers (unless 
                     explicitly not allowed), and cover album.
        
        Arguments:   *args, **kwargs
                     Boolean kwargs of interest are:
                     - refresh_num_songs:       Refresh song count
                     - refresh_num_subscribers: Refresh # of subscribers
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        refresh_num_songs = kwargs.pop('refresh_num_songs', True)
        refresh_num_subscribers = kwargs.pop('refresh_num_subscribers', True)
        if self.pk is None:
            # on save, update owner's number of playlists if it's new
            self.owner.num_playlists += 1
            self.owner.save()
        else:
            if refresh_num_songs==True:
                # on update of a playlist, refresh songs count if desired
                self.num_songs = self.songs.count()
            if refresh_num_subscribers==True:
                # on update of a playlist, refresh subscribers count if desired
                self.num_subscribers = self.subscribers.count()
            # refresh associated album
            qs = self.songs.all().order_by("playlist_songs", "-date_added")
            try:
                self.cover_album = qs[0].album
            except IndexError:
                self.cover_album = None
        
        super(Playlist, self).save(*args, **kwargs)

    
    def delete(self, *args, **kwargs):
        """
        Description: On a Playlist delete, decrement owner's playlist count
                     These are the pains we go through for choosing to have
                     statisitcs saved in the DB...
        
        Arguments:   *args, **kwargs
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        self.owner.num_playlists -= 1
        self.owner.save()
        super(Playlist, self).delete(*args, **kwargs)


class Playlist_Songs(models.Model):
    """
    Description: Table used for defining the many-to-many relationship between 
                 playlists and songs. 
                 
                 It has an `order` field to enable the functionality to reorder
                 songs within a playlist. This is a new features users will
                 appreciate. This order field is 0-indexed where 0 is the
                 highest rank and a larger `order` means a lower rank.
                 
                 This table is usually auto-generated but I needed to add an
                 `order` field. I specifically use both camel case and 
                 underscore to match Django's auto-created many-to-many
                 through-model.
                                                                       
    Author:      Nnoduka Eruchalu
    """
    
    playlist = models.ForeignKey(Playlist)  # the 1 foreign key to source model
    song = models.ForeignKey(Song)          # the 1 foreign key to target model
    order = models.IntegerField(blank=True) # 0-indexed order; 0 is highest rank
    
    class Meta:
        unique_together = ("playlist", "song")
        verbose_name = 'playlist songs'
        verbose_name_plural = 'playlist songs'
        ordering = ('order',)
    
        
    def __unicode__(self):
        return str(self.playlist.id) + ":" + self.song.title
    
    
    def save(self, *args, **kwargs):
        """
        Description: On a new entry addition specify the `order` appropriately.
                     If there is no other song in the playlist, this entry will
                     have the highest rank of 0. If however there are other
                     songs in the playlist, this entry will have the lowest rank
                     in the playlist (playlist's max order + 1)
        
        Arguments:   *args, **kwargs
        Return:      None 
          
        Author:      Nnoduka Eruchalu
        """
        if self.pk is None:
            qs = self.__class__.objects.filter(
                playlist=self.playlist).order_by('-order')
            # if a new item is being created, it's order will be next up in
            # playlist
            try:
                self.order = qs[0].order + 1
            except IndexError:
                # but if this new item is also the first object in the model
                # start it off with a 0-based index. 
                self.order = 0
        
        super(Playlist_Songs, self).save(*args, **kwargs) # call "real" save()


class SongPlay(models.Model):
    """
    Description: These are the representations of song plays across all users, 
                 authenticated and anonymous. This model gives an indication of
                 most popular song over any given time period.
                 This could have been placed under the `activity` app but I feel
                 it's only tied to Song objects so belongs here.
                                                      
    Author:      Nnoduka Eruchalu
    """
    
    song = models.ForeignKey(Song, related_name="plays", editable=False)
    date_added = models.DateTimeField(default=datetime.now, editable=False)
    
    class Meta:
        ordering = ['-date_added']
        get_latest_by = 'date_added'
        
    def __unicode__(self):
        return self.song.title + " play at: " + unicode(self.date_added)
    
    
class SongRank(models.Model):
    """
    Description: This model represents the popularity of the songs. The `score`
                 represents the popularity with users, and the higher scored
                 songs will be first to show up on the 'heavy rotation' list.
                 
    Author:      Nnoduka Eruchalu
    """
    song = models.OneToOneField(Song, related_name="rank", primary_key=True,
                                editable=False)
    score = models.FloatField(default=0.0, editable=False)
    
    class Meta:
        ordering = ['-score']
        
    def __unicode__(self):
        return self.song.title + " with score: " + unicode(self.score)
    
    def set_score(self, num_plays, now, last_play_date):
        """
        Description: Set song ranking score based on recent song plays
                     The algorithm is somewhat based on the ranking performed by
                     Hacker News where each song played in the last 
                     `HEAVY_ROTATION_DAYS` days is scored using the formula:
                     Score = (P)/(T+2)^G
                     where,
                       P = number of song plays of an item
                       T = time since last song play
                       G = Gravity
                     Reference: http://amix.dk/blog/post/19574
                     
        Arguments:   num_plays:      number of song plays
                     now:            reference for time since last play
                     last_play_date: last song play datetime
                     
        Return:      None
                                  
        Author:      Nnoduka Eruchalu
        """
        # rememeber we actually want time since last play in hours
        time_since_play = (now - last_play_date).seconds/3600.0
        self.score = \
            num_plays / (time_since_play + 2.0)**settings.SONG_RANK_GRAVITY
