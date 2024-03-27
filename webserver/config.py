import os
import json

class Config:
    def __init__(self, config_file=None):
        # Default configuration file name
        default_conf_file = "settings_dev_local.json"
        # Use environment variable if exists, otherwise use the default
        self.conf_file = config_file or os.getenv("CONF_FILE", default_conf_file)
        self.load_config()

    def load_config(self):
        # Load configuration from JSON file
        with open(self.conf_file) as json_file:
            js_conf = json.load(json_file)
            # Update the configuration with values from the environment (if present)
            self.DB_USER = os.getenv("DB_USER", js_conf.get("DB_USER"))
            self.DB_PASS = os.getenv("DB_PASS", js_conf.get("DB_PASS"))
            self.DB_PORT = os.getenv("DB_PORT", js_conf.get("DB_PORT"))
            self.DB_NAME = os.getenv("DB_NAME", js_conf.get("DB_NAME"))
            self.DB_HOSTNAME = os.getenv("DB_HOSTNAME", js_conf.get("DB_HOSTNAME"))
            self.ADMINER_URL = os.getenv("ADMINER_URL", js_conf.get("ADMINER_URL"))
            self.DEBUG = os.getenv("DEBUG", js_conf.get("DEBUG", False))  # Assuming DEBUG is a boolean
            self.STATIC_CPP_DIR = os.getenv("STATIC_CPP_DIR", js_conf.get("STATIC_CPP_DIR"))
