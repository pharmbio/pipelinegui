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

    query = ("SELECT * "
             "FROM plate_acquisition "
             "ORDER BY id DESC "
             "LIMIT 1000")

    return select_from_db(query)

def list_image_analyses():

    query = ("SELECT * "
             "FROM image_analyses "
             "ORDER BY id DESC "
             "LIMIT 1000")

    return select_from_db(query)

def list_image_sub_analyses():

    query = ("SELECT * "
             "FROM image_sub_analyses "
             "ORDER BY sub_id DESC "
             "LIMIT 1000")

    return select_from_db(query)


def select_from_db(query):

    logging.debug("Inside select from query")
    logging.info("query=" + str(query))

    conn = None
    try:

        conn = get_connection()

        cursor = conn.cursor()
        cursor.execute(query)

        resultlist = []

        colnames = [desc[0] for desc in cursor.description]

        resultlist.append(colnames)

        for row in cursor:
            # apply str function to every element before appending, and convert to list to avoid having iterator map objects returned           
            resultlist.append(list(map(str, row)))

        # logging.debug(resultlist)
                               
        cursor.close()

        # logging.debug(str(json.dumps(resultlist, indent=2)))

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

def submit_analysis(plate_acquisition, analysis_pipeline_name):

    logging.debug("save_analysis_pipelines")

    conn = None
    try:

        conn = get_connection()

        select_query = ("SELECT meta FROM analysis_pipelines WHERE name=%s")
        logging.info("select_query" + str(select_query))
        cursor0 = conn.cursor()
        cursor0.execute(select_query, (analysis_pipeline_name,))
        meta = cursor0.fetchone()[0]
        cursor0.close()

        # Build query
        query = ("INSERT INTO image_analyses(plate_acquisition_id) "
                 "VALUES (%s) RETURNING id")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        cursor.execute(query, (plate_acquisition,))
        analysis_id = cursor.fetchone()[0]
        cursor.close()

        for sub_analysis in meta:
            insert_sub_cursor = conn.cursor() # piro says https://stackoverflow.com/users/10138/piro
            insert_sub_query = ("INSERT INTO image_sub_analyses(analysis_id, plate_acquisition_id, meta) "
                                "VALUES (%s,%s,%s)")
            insert_sub_cursor.execute(insert_sub_query, (analysis_id, plate_acquisition, json.dumps(sub_analysis),))
        
        conn.commit()
        
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

def delete_analysis(id):

    logging.debug("inside delete_analysis")
    logging.debug("id" + str(id))
    
    query = ("DELETE FROM image_analyses WHERE id = %s")
    values = (id,)
    delete_from_db(query, values)

    query = ("DELETE FROM image_sub_analyses WHERE analysis_id = %s")
    values = (id,)
    delete_from_db(query, values)


def delete_from_db(query, values):

    logging.debug("inside delete_analysis")
    logging.debug("values" + str(values))

    conn = None
    try:

        conn = get_connection()
    
        logging.info("query" + str(query))

        cursor = conn.cursor()
        retval = cursor.execute(query, values)
        conn.commit()
        cursor.close()

        return "OK"

    except (Exception, psycopg2.DatabaseError) as err:
        logging.exception("Message")
        raise err
    finally:
        if conn is not None:
            conn.close()
