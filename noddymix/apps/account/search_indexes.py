from haystack import indexes
from noddymix.apps.account.models import User

class UserIndex(indexes.SearchIndex, indexes.Indexable):
    """
    Description: Haystack search index for User model
                             
    Author:      Nnoduka Eruchalu
    """
    
    text = indexes.EdgeNgramField(document=True, use_template=True)
    
    def get_model(self):
        return User

