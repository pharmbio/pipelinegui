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
        """Renders the index file as a template without arguments.
        """
        logging.debug(self.request.path)

        self.render(self.request.path.strip('/'), admin_db_url=pipelinegui_settings.DB_ADMIN_URL)
        #self.render('index.html')

class IndexTemplateHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method
    """
    This is the main handler of the application, which serves the index.html template
    """
    def get(self):

        self.render('index.html', admin_db_url=pipelinegui_settings.DB_ADMIN_URL)


ROUTES = [
          (r'/static/(.*)', tornado.web.StaticFileHandler, {'path': os.path.join(os.path.dirname(__file__), 'static')}),
          (r'/results/(.*)', tornado.web.StaticFileHandler, {'path': pipelinegui_settings.STATIC_RESULTS_DIR}),
          (r'/api/list/plate_acquisition/(?P<limit>.+)/(?P<sortorder>.+)', query_handlers.ListPlateAcqHandler),
          (r'/api/list/image_analyses/(?P<limit>.+)/(?P<sortorder>.+)', query_handlers.ListImageAnalysesHandler),
          (r'/api/list/image_sub_analyses/(?P<limit>.+)/(?P<sortorder>.+)', query_handlers.ListImageSubAnalysesHandler),
          (r'/api/list/jobs', query_handlers.ListJobsHandler),
          (r'/api/list/joblog/(?P<job_name>.+)', query_handlers.ListJobLogHandler),
          (r'/api/list/pipelinefiles', query_handlers.ListPipelinefilesHandler),
          (r'/run-analysis.html', DefaultTemplateHandler),
          (r'/create-analysis.html', DefaultTemplateHandler),
          (r'/api/analysis-pipelines/save', query_handlers.SaveAnalysisPipelinesQueryHandler),
          (r'/api/analysis-pipelines/run', query_handlers.RunAnalysisQueryHandler),
          (r'/api/analysis-pipelines/delete/(?P<name>.+)', query_handlers.DeleteAnalysisPipelinesQueryHandler),
          (r'/api/analysis-pipelines/(?P<name>.+)*', query_handlers.ListAnalysisPipelinesQueryHandler),
          (r'/api/analysis/delete/(?P<id>.+)', query_handlers.DeleteAnalysisQueryHandler),
          (r'/index.html', IndexTemplateHandler),
          (r'/', IndexTemplateHandler),
         ]
         
if __name__ == '__main__':

    tornado.log.enable_pretty_logging()

    logging.basicConfig(format='%(asctime)s,%(msecs)d %(levelname)-8s [%(filename)s:%(lineno)d] %(message)s',
                        datefmt='%H:%M:%S',
                        level=logging.DEBUG)

    logging.getLogger().setLevel(logging.DEBUG)

    APP = tornado.web.Application(ROUTES, **SETTINGS)
    APP.listen(8080)
    try:
        tornado.ioloop.IOLoop.current().start()
    except KeyboardInterrupt:
        logging.info("Shutting down")
