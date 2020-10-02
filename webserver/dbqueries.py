#!/usr/bin/env python3
import logging
import json
import psycopg2
import settings as labdesign_settings

def get_connection():
    return psycopg2.connect(host=labdesign_settings.DB_HOSTNAME,
                                 database=labdesign_settings.DB_NAME,
                                 user=labdesign_settings.DB_USER, password=labdesign_settings.DB_PASS)

def list_protocols():

    logging.debug("list_protocols")

    conn = None
    try:

        conn = get_connection()

        query = ("SELECT name, steps "
                 "FROM protocols "
                 "ORDER BY name")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        cursor.execute(query)

        resultlist = []

        for row in cursor:
            resultlist.append({'name': row[0],
                               'steps': row[1]
                               })
                               
        cursor.close()

        logging.debug(json.dumps(resultlist, indent=2))

        return resultlist

    except (Exception, psycopg2.DatabaseError) as err:
        logging.exception("Message")
        raise err
    finally:
        if conn is not None:
            conn.close()

def save_protocol(name, data):

    logging.debug("save_protocol")

    conn = None
    try:

        conn = get_connection()
        
        # Build query
        query = ("INSERT INTO protocols(name, steps)"
                 "VALUES (%s, %s)")
        logging.info("query" + str(query))

        # Add protocol steps into a json array
        #steps_array = data.splitlines()
        #json_array = [];
        #for stp in steps_array: 
        #  json_array.append(json.loads(step))

        #logging.debug("data_json" + str(jsodatan_array))

        cursor = conn.cursor()
        retval = cursor.execute(query, (name, data))
        conn.commit()
        cursor.close()

        return "OK"

    except (Exception, psycopg2.DatabaseError) as err:
        logging.exception("Message")
        raise err
    finally:
        if conn is not None:
            conn.close()

def delete_protocol(name):

    logging.debug("delete_protocol")
    logging.debug("name" + str(name))

    conn = None
    try:

        conn = get_connection()
        
        # Build query
        query = ("DELETE FROM protocols WHERE name = %s")
        logging.info("query" + str(query))

        cursor = conn.cursor()
        retval = cursor.execute(query, (name,))
        conn.commit()
        cursor.close()

        return "OK"

    except (Exception, psycopg2.DatabaseError) as err:
        logging.exception("Message")
        raise err
    finally:
        if conn is not None:
            conn.close()