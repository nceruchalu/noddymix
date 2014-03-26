"""
Description:
  Decode Django's session_data which is passed in as first argument to script
 
Author:
  Nnoduka Eruchalu
"""

import base64
from django.utils.encoding import force_bytes
from django.utils.six.moves import cPickle as pickle
import sys, getopt

session_data = sys.argv[1:]

encoded_data = base64.b64decode(force_bytes(session_data))
hash, pickled = encoded_data.split(b':', 1)
res = pickle.loads(pickled)
user_id = res.get('_auth_user_id')

sys.stdout.write(str(user_id))
sys.stdout.close()

