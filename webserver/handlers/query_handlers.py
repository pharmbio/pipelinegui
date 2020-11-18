#!/usr/bin/env python3
"""
This is where most of the logic goes.
"""
import json
import logging

import tornado.web

import dbqueries
import kubeutils
import fileutils


class ListPlateAcqHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, limit, sortorder):
        """Handles GET requests.
        """
        logging.info("inside ListPlateAcqHandler, limit=" + str(limit))

        result = dbqueries.list_plate_acquisitions()

        logging.debug(result)
        self.finish({'result':result})

class ListImageAnalysesHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, limit, sortorder):
        """Handles GET requests.
        """
        logging.info("inside ListImageAnalysesHandler, limit=" + str(limit))

        result = dbqueries.list_image_analyses()

        logging.debug(result)
        self.finish({'result':result})

class ListImageSubAnalysesHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, limit, sortorder):
        """Handles GET requests.
        """
        logging.info("inside ListImageSubAnalysesHandler, limit=" + str(limit))

        result = dbqueries.list_image_sub_analyses()

        logging.debug(result)
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

        logging.debug(result)
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

        plate_acquisition = self.get_argument("plate_acq-input")
        indata_analysis_id = self.get_argument("indata_analysis_id-input")
        analysis_pipeline_name = self.get_argument("analysis_pipelines-select")
        
        #logging.debug("form_data:" + str(form_data))

        results = dbqueries.submit_analysis(plate_acquisition, analysis_pipeline_name)
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
        
        #logging.debug("form_data:" + str(form_data))

        results = dbqueries.save_analysis_pipelines(name, meta)
        logging.debug(results)
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

        


