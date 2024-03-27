import logging
from config import Config
from dotenv import load_dotenv
from database import Database
import cellprofiler_utils


# Load the environment variables from the .env file
load_dotenv()
config = Config()

logging.basicConfig(format='%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s',
                    datefmt='%H:%M:%S',
                    level=logging.INFO)

logging.getLogger().setLevel(logging.INFO)

# Initialize Database connection pool
db_settings = {
    "host": config.DB_HOSTNAME,
    "port": config.DB_PORT,
    "database": config.DB_NAME,
    "user": config.DB_USER,
    "password": config.DB_PASS,
}
Database.get_instance().initialize_connection_pool(**db_settings)

acq_id = 3173
well_filter = ["D04"]
use_icf = False
icf_path = None
site_filter = None
imgsets = cellprofiler_utils.get_imgsets(acq_id, well_filter, site_filter)
logging.info(f"imgsets: {imgsets}")
database = Database.get_instance()
channel_map = database.get_channel_map_from_acq_id(3177)
logging.info(f"channel_map: {channel_map}")
csv_imgsets = cellprofiler_utils.get_cellprofiler_imgsets_csv(imgsets, channel_map, use_icf, icf_path)
logging.info(f"imgset-csv: {csv_imgsets}")

# master.prepare_analysis_cellprofiler_dardel(sub_analysis, cursor)

#master.init_new_db(cpp_config)
#analysis = Database.get_instance().get_analysis_from_sub_id(9504)
#master.merge_family_jobs_csv_to_parquet(analysis, Database.get_instance())