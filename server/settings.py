# settings.py
import os
from pathlib import Path
from dotenv import load_dotenv

# Grab explicit directory so location of caller is not important
current_directory = os.path.dirname(os.path.realpath(__file__))
env_path = Path(current_directory) / '..' / '.env'
load_dotenv(dotenv_path=env_path)
