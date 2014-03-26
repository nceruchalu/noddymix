from haystack import indexes
from noddymix.apps.audio.models import Song, Playlist

class SongIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Description: Haystack search index for Song model
                             
    Author:      Nnoduka Eruchalu
    """
    
    text = indexes.EdgeNgramField(document=True, use_template=True)
    
    def get_model(self):
        return Song
    

class PlaylistIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Description: Haystack search index for Playlist model
                             
    Author:      Nnoduka Eruchalu
    """
    
    text = indexes.EdgeNgramField(document=True, use_template=True)
    
    def get_model(self):
        return Playlist
