from django import forms
from noddymix.apps.account.models import User
from django.conf import settings

class UserSettingsForm(forms.ModelForm):
    """
    Description: Form for updating a user's settings.
                 Only field is boolean to set user's activity as public/private.
            
    Author:      Nnoduka Eruchalu
    """
    
    class Meta:
        model = User
        fields = ('activity_public',)


class UploadAvatarForm(forms.ModelForm):
    """
    Description: Form for uploading a user's avatar.
    
    Author:      Nnoduka Eruchalu
    """
    
    class Meta:
        model = User
        fields = ('avatar',)
        
    def clean_avatar(self):
        """
        Description: Ensure uploaded file's size is within allowed limits.
        
        Arguments:   None  
        Return:      Cleaned 'avatar' field data
                                    
        Author:      Nnoduka Eruchalu
        """
        imgfile = self.cleaned_data.get('avatar',False)
        if imgfile:
            if imgfile.size > settings.MAX_IMAGE_SIZE:
                raise forms.ValidationError("image file too large ( > %s bytes)"
                                            % settings.MAX_IMAGE_SIZE )
            return imgfile
        else:
            raise forms.ValidationError("couldn't read uploaded file")


class UploadCoverForm(forms.ModelForm):
    """
    Description: Form for uploading a user's cover photo.
                  
    Author:      Nnoduka Eruchalu
    """
    class Meta:
        model = User
        fields = ('cover',)
        
    def clean_cover(self):
        """
        Description: Ensure uploaded file's size is within allowed limits.
        
        Arguments:   None  
        Return:      Cleaned 'cover' field data
                                    
        Author:      Nnoduka Eruchalu
        """
        imgfile = self.cleaned_data.get('cover',False)
        if imgfile:
            if imgfile.size > settings.MAX_IMAGE_SIZE:
                raise forms.ValidationError("image file too large ( > %s bytes)"
                                            % settings.MAX_IMAGE_SIZE )
            return imgfile
        else:
            raise forms.ValidationError("couldn't read uploaded file")
