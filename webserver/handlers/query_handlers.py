#!/usr/bin/env python3
"""
This is where most of the logic goes.
"""
import json
import logging
import os

import tornado.web

import dbqueries
import kubeutils
import fileutils
import pipelineutils


class ListPlateAcqHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, limit):
        """Handles GET requests.
        """
        logging.info("inside ListPlateAcqHandler, limit=" + str(limit))

        result = dbqueries.list_plate_acquisitions()

        #logging.debug(result)
        self.finish({'result':result})

class ListImageAnalysesHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, limit):
        """Handles GET requests.
        """
        logging.info("inside ListImageAnalysesHandler, limit=" + str(limit))

        result = dbqueries.list_image_analyses(limit)

        #logging.debug(result)
        self.finish({'result':result})

class ListImageSubAnalysesHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, limit):
        """Handles GET requests.
        """
        logging.info("inside ListImageSubAnalysesHandler, limit=" + str(limit))

        result = dbqueries.list_image_sub_analyses(limit)

        #logging.debug(result)
        self.finish({'result':result})

class ListJobsHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self):
        """Handles GET requests.
        """
        logging.info("inside ListJobsHandler")

        result = kubeutils.list_jobs()

        #logging.debug(result)
        self.finish({'result':result})

class ListPipelinefilesHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self):
        """Handles GET requests.
        """
        logging.info("inside ListPipelinefilesHandler")

        result = fileutils.list_pipelinefiles()

        logging.debug(result)
        self.finish({'result':result})



class DeleteAnalysisPipelinesQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, name):
        """Handles GET requests.
        """
        logging.info("name: " + str(name))
        result = dbqueries.delete_analysis_pipelines(name)

        logging.debug(result)
        self.finish({'result':result})

class ListJobLogHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, job_name):
        """Handles GET requests.
        """
        logging.info("job_name: " + str(job_name))
        result = kubeutils.get_job_log(job_name)

        logging.debug(result)
        self.finish({'result':result})

class UpdateMetaQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    """
    The query handler handles form posts and returns list of results
    """
    def post(self):
        """Handles POST requests.
        """

        # log all input parameters
        logging.debug("%r %s" % (self.request, self.request.body.decode()))

        id = self.get_argument("edit-meta-analysis-id-input")
        meta = self.get_argument("edit-meta-input")


        logging.debug("meta:" + str(meta))

        result = dbqueries.update_analysis_meta(id, meta)

        self.finish({'result':result})


class DeleteAnalysisQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method
    """
    In version 2 check result and propagate error to client
    """
    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, id):
        """Handles GET requests.
        """
        logging.info("id: " + str(id))
        result1 = dbqueries.delete_analysis(id)
        result2 = str(kubeutils.delete_analysis_jobs(id))
        #result3 = str(fileutils.delete_analysis_jobs(id))

        result = []
        result.append(result1)
        result.append(result2)

        logging.debug(result)
        self.finish({'result':result})

class RunAnalysisQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method
    """
    The query handler handles form posts and returns list of results
    """
    def post(self):
        """Handles POST requests.
        """

        # log all input parameters
        logging.debug("%r %s" % (self.request, self.request.body.decode()))

        plate_acq_input = self.get_argument("plate_acq-input")
        #indata_analysis_id = self.get_argument("indata_analysis_id-input")
        analysis_pipeline_name = self.get_argument("analysis_pipelines-select")
        cellprofiler_version = self.get_argument("cellprofiler_version-select")

        well_filter = self.get_argument("well_filter-input")
        site_filter = self.get_argument("site_filter-input")

        #logging.debug("form_data:" + str(form_data))

        plate_acqs_list = pipelineutils.parse_string_of_num_and_ranges(plate_acq_input)
        for plate_acquisition in plate_acqs_list:
            results = dbqueries.submit_analysis(plate_acquisition, analysis_pipeline_name, cellprofiler_version, well_filter, site_filter)
            if results != "OK":
                break
        logging.debug(results)
        self.finish({'results':results})


class SaveAnalysisPipelinesQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method
    """
    The query handler handles form posts and returns list of results
    """
    def post(self):
        """Handles POST requests.
        """

        # log all input parameters
        logging.debug("%r %s" % (self.request, self.request.body.decode()))

        meta = self.get_argument("analysis_pipeline-meta")
        name = self.get_argument("analysis_pipeline-name")

        verification = pipelineutils.veify_analysis_pipeline_meta(meta)
        if verification != 'OK':
            results = verification
        else:
            results = dbqueries.save_analysis_pipelines(name, meta)

        self.finish({'results':results})


class ListAnalysisPipelinesQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, name):
        """Handles GET requests.
        """
        logging.info("name: " + str(name))

        result = dbqueries.list_analysis_pipelines()

        logging.debug(result)
        self.finish({'result':result})


class ErrorLogHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def get(self, analysis_id):
        """Handles GET requests.
        """

        logging.info(f"ErrorLogHandler, id: {analysis_id}")

        analysis_info = dbqueries.select_image_analyses(analysis_id)

        sub_analyses = dbqueries.select_image_sub_analyses(analysis_id)

        logging.info(sub_analyses)

        self.render('error-log.html', analysis_id=analysis_id,
                                      analysis_info=analysis_info,
                                      sub_analyses=sub_analyses)


IMAGE_EXTENSIONS = (".tif", ".tiff", ".png", ".jpg", ".jpeg", ".bmp")
def get_all_image_files(dir):
    # get all files
    logging.info(dir)

    image_files = []
    for file in os.listdir(dir):
        if file.lower().endswith( IMAGE_EXTENSIONS ):
            absolute_file = os.path.join(dir, file)
            image_files.append(absolute_file)

    return image_files

def drawImages(images):

    out = []

    for image in images:

        out.append('<br>')
        out.append(f'{os.path.basename(image)}')
        out.append('<br>')
        out.append(f'<img src="{image}" alt="{image}" width=1000 />')
        out.append('<br>')

    return "".join(out)


class SegmentationHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def get(self, analysis_id):
        """Handles GET requests.
        """

        limit = 20

        logging.info(f"SegmentationHandler, id: {analysis_id}")

        logging.info(f"Limit, id: {analysis_id}")

        analysis_info = dbqueries.select_image_analyses(analysis_id)

        selection = []
        if len(analysis_info) > 0:
            row=analysis_info[0]
            result = row['result']

            job_folder = result["job_folder"]
            (f'job folder { job_folder }' )

            img_folder = f'/cpp_work/{job_folder}/img/objnumber/'

            files = get_all_image_files(img_folder)

            selection = files[0:limit]

        else:
            logging.info("do nothing")


        images = drawImages(selection)

        logging.info(f"images {images}")


        self.render('segmentation.html', analysis_id=analysis_id,
                                         images=images)

