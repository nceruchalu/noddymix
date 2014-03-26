from django.contrib import admin
from django.conf import settings
from django import forms
from noddymix.apps.audio.models import Song, Album, Artist, Playlist, \
    Playlist_Songs


def delete_selected_s(modeladmin, request, queryset):
    """
    Description: A version of the "deleted selected objects" action which calls 
                 the Song model's `delete()` method. This is needed because the 
                 default version uses `QuerySet.delete()`, which doesn't call 
                 the model's `delete()` method.
    
    Arguments:   - modeladmin: The Song ModelAdmin
                 - request:    HttpRequest object representing current request
                 - queryset:   QuerySet of set of Song objects selected by user.
    Return:      None
          
    Author:      Nnoduka Eruchalu
    """
    for obj in queryset:
        obj.delete()
delete_selected_s.short_description = "Delete selected songs"


def delete_selected_a(modeladmin, request, queryset):
    """
    Description: A version of the "deleted selected objects" action which calls 
                 the Album model's `delete()` method. This is needed because the
                 default version uses `QuerySet.delete()`, which doesn't call 
                 the model's `delete()` method.
    
    Arguments:   - modeladmin: The Album ModelAdmin
                 - request:    HttpRequest object representing current request
                 - queryset:   QuerySet of set of Album objects selected by user
    Return:      None
          
    Author:      Nnoduka Eruchalu
    """
    for obj in queryset:
        obj.delete()
delete_selected_a.short_description = "Delete selected albums"


def delete_selected_p(modeladmin, request, queryset):
    """
    Description: A version of the "deleted selected objects" action which calls 
                 the Playlist model's `delete()` method. This is needed because 
                 the default version uses `QuerySet.delete()`, which doesn't
                 call the model's `delete()` method.
    
    Arguments:   - modeladmin: The Playlist ModelAdmin
                 - request:    HttpRequest object representing current request
                 - queryset:   QuerySet of set of selectd Playlist objects
    Return:      None
          
    Author:      Nnoduka Eruchalu
    """
    for obj in queryset:
        obj.delete()
delete_selected_p.short_description = "Delete selected playlists"


class SongAdminForm(forms.ModelForm):
    """
    Description: Custom form to be used with Song's ModelAdmin, SongAdmin.
                 The purpose is to override the default admin form behavior
                 by adding more validations to uploaded mp3 file.
    
    Functions:   - clean_mp3: validate uploaded file size and type
            
    Author:      Nnoduka Eruchalu
    """
    
    def clean_mp3(self):
        """
        Description: Ensure uploaded mp3 file is within allowed limits and is
                     of the right content type/mime type.
          
        Arguments:   None
        Return:      cleaned 'mp3' field data.
                    
        Author:      Nnoduka Eruchalu
        """
        afile = self.cleaned_data.get('mp3',False)
        if afile:
            if afile.size > settings.MAX_AUDIO_SIZE:
                raise forms.ValidationError("audio file too large ( > %s bytes)"
                                            % settings.MAX_AUDIO_SIZE )
            if hasattr(afile, 'content_type') and \
                    (afile.content_type not in settings.AUDIO_FORMATS):
                raise forms.ValidationError(
                    "Upload a valid mp3 file. Detected file type: " 
                    + afile.content_type)
            return afile
        else:
            raise forms.ValidationError("couldn't read uploaded audio file")


class SongAdmin(admin.ModelAdmin):
    """
    Description: Representation of the Song model in the admin interface.
    
    Functions:   - get_actions: disable some actions for this ModelAdmin
                                              
    Author:      Nnoduka Eruchalu
    """
    
    actions = [delete_selected_s]
    readonly_fields = ('num_plays','length')
    filter_horizontal = ('featuring',)
    list_display = ('title', 'artist', 'album', 'num_plays',)
    search_fields = ('title', 'artist__name', 'featuring__name', 'album__title')
    ordering = ('title',)
    form = SongAdminForm
    
    def get_actions(self, request):
        """
        Description: Permanently disable the default "deleted selected objects" 
                     action for this ModelAdmin
          
        Arguments:   - request: HttpRequest object representing current request
        Return:      Updated list of actions.
                    
        Author:      Nnoduka Eruchalu
        """
        actions = super(SongAdmin, self).get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions


class AlbumAdmin(admin.ModelAdmin):
    """
    Description: Representation of the Album model in the admin interface.
    
    Functions:   - get_actions: disable some actions for this ModelAdmin
                                              
    Author:      Nnoduka Eruchalu
    """
    
    actions = [delete_selected_a]
    search_fields = ('title',)
    list_display = ('title',)
    
    def get_actions(self, request):
        """
        Description: Permanently disable the default "deleted selected objects" 
                     action for this ModelAdmin
          
        Arguments:   - request: HttpRequest object representing current request
        Return:      Updated list of actions.
                    
        Author:      Nnoduka Eruchalu
        """
        actions = super(AlbumAdmin, self).get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
    
    def has_delete_permission(self, request, obj=None):
        return False


class PlaylistAdmin(admin.ModelAdmin):
    """
    Description: Representation of the Playlist model in the admin interface.
    
    Functions:   - get_actions: disable some actions for this ModelAdmin
                                              
    Author:      Nnoduka Eruchalu
    """
    
    actions = [delete_selected_p]
    fields = ('owner', 'title', 'songs', 'subscribers', 'is_public', 
              'cover_album', 'num_songs', 'num_subscribers','date_added',)
    list_display = ('id', 'title', 'owner',)
    readonly_fields = ('owner', 'num_songs', 'songs', 'subscribers', 
                       'cover_album', 'num_subscribers', 'date_added',)
    search_fields = ('id', 'title', 'owner__username', 'owner__first_name', 
                     'owner__last_name',)
    ordering = ('id',)
    
    def get_actions(self, request):
        """
        Description: Permanently disable the default "deleted selected objects" 
                     action for this ModelAdmin
          
        Arguments:   - request: HttpRequest object representing current request
        Return:      Updated list of actions.
                    
        Author:      Nnoduka Eruchalu
        """
        actions = super(PlaylistAdmin, self).get_actions(request)
        if 'delete_selected' in actions:
            del actions['delete_selected']
        return actions
    

class Playlist_SongsAdmin(admin.ModelAdmin):
    """
    Description: Representation of the Playlist_Songs model in the admin 
                 interface. Remember this model is the thru-table for the 
                 many-to-many relationship between Playlist and Songs
    
    Functions:   - get_playlist_id: get Id of playlist that object refers to
                                              
    Author:      Nnoduka Eruchalu
    """
    
    fields = ('playlist', 'song', 'order',)
    list_display = ('get_playlist_id', 'playlist', 'song', 'order',)
    readonly_fields = ('playlist', 'song',)
    search_fields = ('playlist__id', 'playlist__title', 
                     'playlist__owner__username','playlist__owner__first_name',
                     'playlist__owner__last_name', 'song__title',)
    ordering = ('playlist__id', 'order')
        
    def get_playlist_id(self, obj):
        """
        Description: Get Id of playlist from Playlist_Song instance
          
        Arguments:   - obj: Playlist_Song through-model object
        Return:      playlist id
                    
        Author:      Nnoduka Eruchalu
        """
        return str(obj.playlist.id)


admin.site.register(Song, SongAdmin)
admin.site.register(Album, AlbumAdmin)
admin.site.register(Artist)
admin.site.register(Playlist, PlaylistAdmin)
admin.site.register(Playlist_Songs, Playlist_SongsAdmin)
