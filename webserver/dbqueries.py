#!/usr/bin/env python3
import logging
import json
import psycopg2
import settings as pipelinegui_settings

def get_connection():
    return psycopg2.connect(host=pipelinegui_settings.DB_HOSTNAME,
                                 database=pipelinegui_settings.DB_NAME,
                                 user=pipelinegui_settings.DB_USER, password=pipelinegui_settings.DB_PASS)

def list_plate_acquisitions():

    logging.debug("list_plate_acquisitions")

    conn = None
    try:

        conn = get_connection()

        query = ("SELECT * "
                 "FROM plate_acquisition "
                 "ORDER BY id DESC "
                 "LIMIT 1000")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        cursor.execute(query)

        resultlist = []

        colnames = [desc[0] for desc in cursor.description]

        resultlist.append(colnames)

        for row in cursor:
            # apply str function to every element before appending, and convert to list to avoid having iterator map objects returned           
            resultlist.append(list(map(str, row)))

        logging.debug(resultlist)
                               
        cursor.close()

        logging.debug(str(json.dumps(resultlist, indent=2)))

        return resultlist

    except (Exception, psycopg2.DatabaseError) as err:
        logging.exception("Message")
        raise err
    finally:
        if conn is not None:
            conn.close()

def list_analysis_pipelines():

    logging.debug("list_analysis_pipelines")

    conn = None
    try:

        conn = get_connection()

        query = ("SELECT name, meta "
                 "FROM analysis_pipelines "
                 "ORDER BY name")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        cursor.execute(query)

        resultlist = []

        for row in cursor:
            resultlist.append({'name': row[0],
                               'meta': row[1]
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

def save_analysis_pipelines(name, data):

    logging.debug("save_analysis_pipelines")

    conn = None
    try:

        conn = get_connection()
        
        # Build query
        query = ("INSERT INTO analysis_pipelines(name, meta)"
                 "VALUES (%s, %s) "
                 "ON CONFLICT (name) DO UPDATE "
                 "  SET meta = %s")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        retval = cursor.execute(query, (name, data, data))
        conn.commit()
        cursor.close()

        return "OK"

    except (Exception, psycopg2.DatabaseError) as err:
        logging.exception("Message")
        raise err
    finally:
        if conn is not None:
            conn.close()

def delete_analysis_pipelines(name):

    logging.debug("delete_analysis_pipelines")
    logging.debug("name" + str(name))

    conn = None
    try:

        conn = get_connection()
        
        # Build query
        query = ("DELETE FROM analysis_pipelines WHERE name = %s")
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
