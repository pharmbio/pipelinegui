#!/usr/bin/env python3
"""
This is where most of the logic goes.
"""
import logging
import os

import tornado.web
import datetime
import decimal

import dbqueries
import kubeutils
import fileutils
import pipelineutils

def myserialize(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, datetime.date):
        serial = obj.isoformat()
        return serial

    if isinstance(obj, datetime.datetime):
        serial = obj.isoformat()
        return serial

    if isinstance(obj, datetime.time):
        serial = obj.isoformat()
        return serial

    if isinstance(obj, decimal.Decimal):
        return str(obj)

    return obj.__dict__


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
        logging.info("%r %s" % (self.request, self.request.body.decode()))

        plate_acq_input = self.get_argument("plate_acq-input")

        # Get pipeline from one of three select-boxes
        analysis_pipeline_name = self.get_argument("analysis_pipelines-select-std", "")
        if analysis_pipeline_name == "":
            analysis_pipeline_name = self.get_argument("analysis_pipelines-select-latest", "")
        if analysis_pipeline_name == "":
            analysis_pipeline_name = self.get_argument("analysis_pipelines-select", "")

        cellprofiler_version = self.get_argument("cellprofiler_version-select")

        well_filter = self.get_argument("well_filter-input")
        site_filter = self.get_argument("site_filter-input")
        priority = self.get_argument("priority-input")

        run_on_uppmax = ("on" == self.get_argument("run-uppmax-cbx", default="off"))
        run_on_dardel = ("on" == self.get_argument("run-dardel-cbx", default="off"))

        logging.info(f"run_on_uppmax: {run_on_uppmax}")
        logging.info(f"run_on_dardel: {run_on_dardel}")
        logging.info(f"priority: {priority}")

        plate_acqs_list = pipelineutils.parse_string_of_num_and_ranges(plate_acq_input)
        for plate_acquisition in plate_acqs_list:
            results = dbqueries.submit_analysis(plate_acquisition,
                                                analysis_pipeline_name,
                                                cellprofiler_version,
                                                well_filter,
                                                site_filter,
                                                priority,
                                                run_on_uppmax,
                                                run_on_dardel)
            if results != "OK":
                break
        logging.debug(results)
        self.finish({'results':results})

class CloneAnalysisQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method
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
def get_image_files(base_dir, limit):
    image_files = []
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith( IMAGE_EXTENSIONS ):
                logging.info(f'file: {file}')
                image_files.append(os.path.join(root, file))
                if len(image_files) >= limit:
                    return image_files
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
        # First try result dir, then try temp out dir
        if len(analysis_info) > 0:
            row=analysis_info[0]
            result = row['result']
            if result:
                job_folder = result["job_folder"]
                (f'job folder { job_folder }' )
                img_folder = f'/cpp_work/{job_folder}/'
                files = get_image_files(img_folder, limit)
                selection = files[0:limit]
        else:
            logging.info("do nothing")

        logging.info(f"selection: {selection}")

        # Try temp output folder
        if selection is None or len(selection) == 0:
            result = dbqueries.select_sub_ids(analysis_id)

            logging.info(f"result: {result}")

            all_images = []
            for row in result:
                sub_id = row["sub_id"]
                job_folder = f'/cpp_work/output/{sub_id}'
                img_folder = job_folder
                files = get_image_files(img_folder, limit)
                all_images.extend(files)

            selection = all_images[0:limit]

        logging.info(f"selection: {selection}")

        images = drawImages(selection)

        logging.info(f"images {images}")


        self.render('segmentation.html', analysis_id=analysis_id,
                                         images=images)

