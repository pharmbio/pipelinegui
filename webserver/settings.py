import os
import json

conf_file = "settings_dev_local.json"
with open(conf_file) as json_file:
  js_conf = json.load(json_file)

  DB_USER = os.getenv("DB_USER", js_conf["DB_USER"])
  DB_PASS = os.getenv("DB_PASS", js_conf["DB_PASS"])
  DB_PORT = os.getenv("DB_PORT", js_conf["DB_PORT"])
  DB_NAME = os.getenv("DB_NAME", js_conf["DB_NAME"])
  DB_HOSTNAME = os.getenv("DB_HOSTNAME", js_conf["DB_HOSTNAME"])
  DB_ADMIN_URL = os.getenv("DB_ADMIN_URL", js_conf["DB_ADMIN_URL"])
  DEBUG = os.getenv("DEBUG", js_conf["DEBUG"])
