#!/usr/bin/env python3
import logging
import json
import time
import psycopg2
import psycopg2.extras
import settings as pipelinegui_settings

def get_connection():
    return psycopg2.connect(     host=pipelinegui_settings.DB_HOSTNAME,
                                 port=pipelinegui_settings.DB_PORT,
                                 database=pipelinegui_settings.DB_NAME,
                                 user=pipelinegui_settings.DB_USER, password=pipelinegui_settings.DB_PASS)

def list_plate_acquisitions():

    query = ("SELECT * "
             "FROM plate_acquisition_v1 "
             "ORDER BY id DESC "
             "LIMIT 1000")

    resultlist = select_as_table_from_db(query)
    return resultlist_to_json(resultlist)

def list_image_analyses(limit):

    query = ("SELECT * "
             "FROM image_analyses_v1 "
             "ORDER BY id DESC "
             "LIMIT %s")
    params = (limit,)

    resultlist = select_as_table_from_db(query, params)
    return resultlist_to_json(resultlist)

def list_image_sub_analyses(limit):

    query = ("SELECT * "
             "FROM image_sub_analyses_v1 "
             "ORDER BY sub_id DESC "
             "LIMIT %s")
    params = (limit,)

    resultlist = select_as_table_from_db(query, params)
    return resultlist_to_json(resultlist)

def select_image_analyses(id):
    query = ("SELECT * "
             "FROM image_analyses_v1 "
             "WHERE id = %s ")
    params = (id,)

    return select_from_db(query, params)

def select_image_sub_analyses(id):
    query = ("SELECT * "
             "FROM image_sub_analyses_v1 "
             "WHERE analyses_id = %s ")
    params = (id,)

    return select_from_db(query, params)

def resultlist_to_json(resultlist):
    # First dump to string (This is because datetime cant be converted to string without the default=str function)
    result_jsonstring = json.dumps(resultlist, indent=2, default=str)

    # Then reload into json
    result = json.loads(result_jsonstring)

    # logging.debug(json.dumps(result, indent=2, default=str))
    return result

def select_as_table_from_db(query, params=None):

    logging.debug("Inside select from query")
    logging.info("params=" + str(params))
    logging.info("query=" + str(query))

    conn = None
    try:

        conn = get_connection()

        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)

        colnames = [desc[0] for desc in cursor.description]

        rows = cursor.fetchall()

        cursor.close()

        # create a list of lists with colnames as first row
        resultlist = []
        # first convert rows from list of tuples to list of list
        res = [list(ele) for ele in rows]
        resultlist = [colnames] + res

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

        query = ("SELECT name, meta, FLOOR(EXTRACT(EPOCH FROM modified)) AS modified "
                 "FROM analysis_pipelines "
                 "ORDER BY name")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        cursor.execute(query)

        resultlist = []

        for row in cursor:
            resultlist.append({'name': row[0],
                               'meta': row[1],
                               'modified': row[2]
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
        query = ("INSERT INTO analysis_pipelines(name, meta, modified) "
                 "VALUES (%s, %s, CURRENT_TIMESTAMP) "
                 "ON CONFLICT (name) DO UPDATE "
                 "SET meta = %s, modified = CURRENT_TIMESTAMP")

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

def submit_analysis(plate_acquisition, analysis_pipeline_name,cellprofiler_version,
                    well_filter, site_filter, priority_string, run_on_uppmax):

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
        meta = first_row[1]
        cursor0.close()

        # get the sub-analysis and analysis_meta part of pipeline-meta
        sub_analyses = meta["sub_analyses"]
        analysis_meta = meta["analysis_meta"]

        if priority_string.strip().isnumeric():
            priority = int(priority_string.strip())
        else:
            priority = None

        # Add var to meta
        analysis_meta['priority'] = priority
        if run_on_uppmax:
            analysis_meta['run-on-uppmax'] = run_on_uppmax

        # Build query
        query = ("INSERT INTO image_analyses(plate_acquisition_id, pipeline_name, meta) "
                 "VALUES (%s, %s, %s) RETURNING id")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        cursor.execute(query, [plate_acquisition, pipeline_name, json.dumps(analysis_meta)])
        analysis_id = cursor.fetchone()[0]
        cursor.close()

        # Add uppmax setting to sub_analysis
        for sub_analysis in sub_analyses:
            sub_analysis['run_on_uppmax'] = run_on_uppmax

        # Add priority version info to sub_analysis
        for sub_analysis in sub_analyses:
            sub_analysis['priority'] = priority

        # Add cellprofiler version info to sub_analysis
        for sub_analysis in sub_analyses:
            sub_analysis['cp_version'] = cellprofiler_version

        # Add well filter info to sub_analysis
        if well_filter.strip():
            for sub_analysis in sub_analyses:
                sub_analysis['well_filter'] = well_filter.split(',')

        # Add site filter info to sub_analysis
        if site_filter.strip():
            for sub_analysis in sub_analyses:
                sub_analysis['site_filter'] = site_filter.split(',')


        depends_on_id = []
        for sub_analysis in sub_analyses:
            insert_sub_cursor = conn.cursor() # piro says https://stackoverflow.com/users/10138/piro
            insert_sub_query = ("INSERT INTO image_sub_analyses(analysis_id, plate_acquisition_id, meta, depends_on_sub_id, priority) "
                                "VALUES (%s,%s,%s,%s,%s) RETURNING sub_id")
            insert_sub_cursor.execute(insert_sub_query, (analysis_id, plate_acquisition, json.dumps(sub_analysis),json.dumps(depends_on_id),priority))
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


def update_analysis_meta(analysis_id, analysis_meta):

    logging.debug("update_analysis_meta")

    conn = None
    try:

        conn = get_connection()

        # Build query
        query = ("UPDATE image_analyses"
                 " SET meta = %s "
                 " WHERE id = %s")

        logging.info("query" + str(query))

        cursor = conn.cursor()
        cursor.execute(query, (analysis_meta, analysis_id))

        updated_rows_count = cursor.rowcount

        # Commit the changes to the database
        conn.commit()
        cursor.close()

        return {"rows updated": updated_rows_count}

    except (Exception, psycopg2.DatabaseError) as err:
        logging.exception("Message")
        raise err
    finally:
        if conn is not None:
            conn.close()


def select_from_db(query, params):

    conn = None

    try:

        #start = time.time()
        conn = get_connection()
        cursor = conn.cursor(cursor_factory = psycopg2.extras.RealDictCursor)

        start = time.time()
        cursor.execute(query, params)
        results = cursor.fetchall()
        cursor.close()

        logging.info(f"elapsed: {time.time() - start}")

        return results

    except (Exception, psycopg2.DatabaseError) as err:
        logging.exception("Message")
        raise err
    finally:
        if conn is not None:
            conn.close()
