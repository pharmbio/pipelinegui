#!/usr/bin/env python3
"""
Simple Tornado server.
"""

import os
import logging
import tornado
import tornado.web

import handlers.query_handlers as query_handlers

import settings as pipelinegui_settings
from database import Database

SETTINGS = {
    'debug': True,
    'develop': True,
    'template_path':'templates/',
    'xsrf_cookies': False, # Anders disabled this - TODO enable again....maybe...
    'cookie_secret':'some-really-secret-secret',
    # static path is defined in handler below
}

class DefaultTemplateHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method
    """
    This is the main handler of the application
    """
    def get(self):

        self.render(self.request.path.strip('/'), page_name=self.request.path.strip('/'),
                                                  adminer_url=pipelinegui_settings.ADMINER_URL,
                                                  debug=logging.debug)

class IndexTemplateHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method
    """
    This is the main handler of the application, which serves the index.html template
    """
    def get(self):

        self.render('index.html', adminer_url=pipelinegui_settings.ADMINER_URL)

ROUTES = [
          (r'/static/(.*)', tornado.web.StaticFileHandler, {'path': os.path.join(os.path.dirname(__file__), 'static')}),
          (r'/cpp_work/(.*)', tornado.web.StaticFileHandler, {'path': pipelinegui_settings.STATIC_CPP_DIR}),
          (r'/api/list/plate_acquisition/(?P<limit>.+)', query_handlers.ListPlateAcqHandler),
          (r'/api/list/image_analyses/(?P<limit>.+)', query_handlers.ListImageAnalysesHandler),
          (r'/api/list/image_sub_analyses/(?P<limit>.+)', query_handlers.ListImageSubAnalysesHandler),
          (r'/api/list/jobs', query_handlers.ListJobsHandler),
          (r'/api/list/joblog/(?P<job_name>.+)', query_handlers.ListJobLogHandler),
          (r'/api/list/pipelinefiles', query_handlers.ListPipelinefilesHandler),
          (r'/run-analysis.html', DefaultTemplateHandler),
          (r'/create-analysis.html', DefaultTemplateHandler),
          (r'/cellprofiler-devel.html', DefaultTemplateHandler),
          (r'/api/analysis-pipelines/save', query_handlers.SaveAnalysisPipelinesQueryHandler),
          (r'/api/imgset/save', query_handlers.SaveImgsetQueryHandler),
          (r'/api/analysis-pipelines/run', query_handlers.RunAnalysisQueryHandler),
          (r'/api/analysis-pipelines/delete/(?P<name>.+)', query_handlers.DeleteAnalysisPipelinesQueryHandler),
          (r'/api/analysis-pipelines/(?P<name>.+)*', query_handlers.ListAnalysisPipelinesQueryHandler),
          (r'/api/analysis/delete/(?P<id>.+)', query_handlers.DeleteAnalysisQueryHandler),
          (r'/api/analysis/update_meta', query_handlers.UpdateMetaQueryHandler),
          (r'/log/(?P<analysis_id>.+)', query_handlers.LogHandler),
          (r'/segmentation/(?P<analysis_id>.+)', query_handlers.SegmentationHandler),
          (r'/imgset', query_handlers.SaveImgsetQueryHandler),
          (r'/index.html', IndexTemplateHandler),
          (r'/', IndexTemplateHandler),
         ]

if __name__ == '__main__':

    tornado.log.enable_pretty_logging()

    tornado.autoreload.start()

    logging.basicConfig(format='%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s',
                        datefmt='%H:%M:%S',
                        level=logging.INFO)

    logging.getLogger().setLevel(logging.INFO)

    # Initialize Database connection pool
    db_settings = {
        "host": pipelinegui_settings.DB_HOSTNAME,
        "port": pipelinegui_settings.DB_PORT,
        "database": pipelinegui_settings.DB_NAME,
        "user": pipelinegui_settings.DB_USER,
        "password": pipelinegui_settings.DB_PASS,
    }
    Database.get_instance().initialize_connection_pool(**db_settings)

    APP = tornado.web.Application(ROUTES, **SETTINGS)
    APP.listen(8080)
    try:
        tornado.ioloop.IOLoop.current().start()
    except KeyboardInterrupt:
        logging.info("Shutting down")
