import sys
import os

# Set up paths
current_dir = os.path.dirname(os.path.abspath(__file__))
# Go up from api/ to backend/, then up to root
backend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(backend_dir)

sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from app import app as application

app = application
