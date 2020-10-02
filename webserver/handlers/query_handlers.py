#!/usr/bin/env python3
"""
This is where most of the logic goes.
"""
import json
import logging

import tornado.web

from dbqueries import list_protocols, save_protocol, delete_protocol

class DeleteProtocolQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, protocol):
        """Handles GET requests.
        """
        logging.info("plate_name: " + str(protocol))

        result = delete_protocol(protocol)

        logging.debug(result)
        self.finish({'result':result})


class SaveProtocolQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method
    """
    The query handler handles form posts and returns list of results
    """
    def post(self):
        """Handles POST requests.
        """
        
        # log all input parameters
        logging.debug("%r %s" % (self.request, self.request.body.decode()))

        protocol_steps = self.get_argument("plate-protocol-steps")
        new_name = self.get_argument("new_name")
        
        #logging.debug("form_data:" + str(form_data))

        results = save_protocol(new_name, protocol_steps)
        logging.debug(results)
        self.finish({'results':results})


class ListProtocolsQueryHandler(tornado.web.RequestHandler): #pylint: disable=abstract-method

    def prepare(self):
        header = "Content-Type"
        body = "application/json"
        self.set_header(header, body)

    def get(self, protocol):
        """Handles GET requests.
        """
        logging.info("plate_name: " + str(protocol))

        result = list_protocols()

        logging.debug(result)
        self.finish({'result':result})
