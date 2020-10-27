import logging
import os
import pathlib

def is_debug():
    """
    Check if the users has the debug env.var. set
    """
    debug = False
    if os.environ.get('DEBUG') and os.environ.get('DEBUG') == "True":
        debug = True

    return debug


def list_pipelinefiles():

    return list_files("/cpp_work/pipelines/")

def list_files(input_path):

    files = list(pathlib.Path(input_path).rglob("*.*"))

    #logging.debug("files:" + str(files))

    # create a table of the files with only one column and one file per row (each row is represented as a list)
    result_table = []

    # First add a header
    result_table.append(["Filename"])

    # Then add the files
    for file in files:
        relative_file = file.relative_to(input_path)
        result_table.append([str(relative_file)])

    #logging.debug("result_table:" + str(result_table))

    return result_table

