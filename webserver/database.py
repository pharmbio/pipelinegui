from __future__ import annotations
import logging
import json
from typing import List, Optional, Dict, Any
from psycopg2 import pool, extensions
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import threading

class Database:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:  # Ensure thread-safe singleton creation
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance.connection_pool = None  # Ensure the connection_pool is initially set to None
        return cls._instance

    def initialize_connection_pool(self, **connection_info):
        if not hasattr(self, 'initialized'):  # Prevent reinitialization
            if connection_info:
                # Initialize connection pool if it doesn't exist and connection_info is provided
                self.connection_pool = pool.SimpleConnectionPool(minconn=1, maxconn=10, **connection_info)
                self.initialized = True  # Mark as initialized
            else:
                raise ValueError("Connection information must be provided to initialize the connection pool.")

    @classmethod
    def get_instance(cls):
        # Return the singleton instance
        return cls()

    def get_connection(self):
        if self.connection_pool is None:
            raise Exception("Connection pool has not been initialized.")
        return self.connection_pool.getconn()

    def release_connection(self, conn):
        if self.connection_pool is not None:
            self.connection_pool.putconn(conn)
        else:
            raise Exception("Connection pool has not been initialized.")

    def execute_query(self, query, params=None, fetch="all", commit=False, cursor_factory=extensions.cursor):
        conn = self.get_connection()
        try:
            with conn.cursor(cursor_factory=cursor_factory) as cursor:

                # Use mogrify to preview the query with parameters
                debug_query = cursor.mogrify(query, params).decode('utf-8')
                logging.info(f"Executing query: {debug_query}")

                cursor.execute(query, params)
                if commit:
                    conn.commit()
                    return None
                if fetch == "all":
                    return cursor.fetchall()
                elif fetch == "one":
                    return cursor.fetchone()
        finally:
            self.release_connection(conn)


    def get_imgages(self, acq_id, well_filter=None, site_filter=None):
        logging.info('Fetching images belonging to plate acquisition.')

        query = """
            SELECT *
            FROM images_all_view
            WHERE plate_acquisition_id = %s
        """

        # Initialize params list with acq_id as the first parameter
        params = [acq_id]

        # Dynamically build query based on filters
        if site_filter and len(site_filter) > 0:
            logging.info(f'site_filter {site_filter}')
            logging.info(len(site_filter))
            query += " AND site IN %s"
            params.append(tuple(site_filter))  # Add site_filter as tuple to params

        if well_filter and len(well_filter) > 0:
            query += " AND well IN %s"
            params.append(tuple(well_filter))  # Add well_filter as tuple to params

        query += " ORDER BY timepoint, well, site, channel"
        logging.debug("Query: " + query)

        # Execute the query with parameters
        imgs = self.execute_query(query, params, cursor_factory=RealDictCursor)
        return imgs

    def get_channel_map_from_acq_id(self, acq_id):
        # Parameterized SQL query to get channel map based on acquisition ID
        query = """
            SELECT cm.*
            FROM channel_map cm
            INNER JOIN plate_acquisition pa ON cm.map_id = pa.channel_map_id
            WHERE pa.id = %s
        """

        # Execute the query with acq_id as a parameter
        channel_map_res = self.execute_query(query, (acq_id,), fetch="all", cursor_factory=RealDictCursor)

        # use channel as key and dye as value TODO expand into all channel details a nested dict
        channel_map = {channel['channel']: channel['dye'] for channel in channel_map_res}

        return channel_map

