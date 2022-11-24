import os
import json

# conf file location can be overridden by ENV-VAR
conf_file = os.getenv("CONF_FILE", "settings_dev_local.json")
with open(conf_file) as json_file:
  js_conf = json.load(json_file)

  DB_USER = os.getenv("DB_USER", js_conf["DB_USER"])
  DB_PASS = os.getenv("DB_PASS", js_conf["DB_PASS"])
  DB_PORT = os.getenv("DB_PORT", js_conf["DB_PORT"])
  DB_NAME = os.getenv("DB_NAME", js_conf["DB_NAME"])
  DB_HOSTNAME = os.getenv("DB_HOSTNAME", js_conf["DB_HOSTNAME"])

  ADMINER_URL = os.getenv("ADMINER_URL", js_conf["ADMINER_URL"])

  DEBUG = os.getenv("DEBUG", js_conf["DEBUG"])

  STATIC_CPP_DIR = os.getenv("STATIC_CPP_DIR", js_conf["STATIC_CPP_DIR"])
