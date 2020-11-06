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
             "FROM image_analyses_v1 "
             "ORDER BY id DESC "
             "LIMIT 1000")

    return select_from_db(query)

def list_image_sub_analyses():

    query = ("SELECT * "
             "FROM image_sub_analyses_v1 "
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

        colnames = [desc[0] for desc in cursor.description]

 #       for row in cursor:
 #           # apply str function to every element before appending, and convert to list to avoid having iterator map objects returned           
 #           resultlist.append(list(map(str, row)))

  #      resultlist = [dict(zip([key[0] for key in cursor.description], row)) for row in cursor]

        # logging.debug(resultlist)

        rows = cursor.fetchall()

        cursor.close()

        resultlist = []
        resultlist = [colnames] + rows

        # First dump to string (This is because datetime cant be converted to string without the default=str function)
        result_jsonstring = json.dumps(resultlist, indent=2, default=str)

        # Then reload into json
        result = json.loads(result_jsonstring)

        # logging.debug(json.dumps(result, indent=2, default=str))

        return result

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

        select_query = ("SELECT name, meta FROM analysis_pipelines WHERE name=%s")
        logging.info("select_query" + str(select_query))
        cursor0 = conn.cursor()
        cursor0.execute(select_query, (analysis_pipeline_name,))
        first_row = cursor0.fetchone()
        pipeline_name = first_row[0]
        pipeline_meta = first_row[1]
        cursor0.close()

        # Build query
        query = ("INSERT INTO image_analyses(plate_acquisition_id, pipeline_name) "
                 "VALUES (%s, %s) RETURNING id")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        cursor.execute(query, (plate_acquisition, pipeline_name,))
        analysis_id = cursor.fetchone()[0]
        cursor.close()

        depends_on_id = []
        for sub_analysis in pipeline_meta:
            insert_sub_cursor = conn.cursor() # piro says https://stackoverflow.com/users/10138/piro
            insert_sub_query = ("INSERT INTO image_sub_analyses(analysis_id, plate_acquisition_id, meta, depends_on_sub_id) "
                                "VALUES (%s,%s,%s,%s) RETURNING sub_id")
            insert_sub_cursor.execute(insert_sub_query, (analysis_id, plate_acquisition, json.dumps(sub_analysis),json.dumps(depends_on_id),))
            returned_sub_id = insert_sub_cursor.fetchone()[0]
            depends_on_id = [returned_sub_id]
        
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
