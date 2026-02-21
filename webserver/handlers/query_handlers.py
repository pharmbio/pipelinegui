#!/usr/bin/env python3
"""
This is where most of the logic goes.
"""
import logging
import os
import json
import re

import tornado.web
import datetime
import decimal

import dbqueries
import kubeutils
import fileutils
import pipelineutils
from database import Database
import cellprofiler_utils
import hpc_utils

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

        logging.info("done ListPlateAcqHandler, limit=" + str(limit))
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

        logging.info("done ListImageAnalysesHandler, limit=" + str(limit))

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

        logging.info("done ListImageSubAnalysesHandler, limit=" + str(limit))

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

        logging.info("done ListJobsHandler")

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

        logging.info("done ListPipelinefilesHandler")
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
        logging.info("done job_name: " + str(job_name))

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

        # Attempt to cancel HPC jobs on Pelle by extracting job ids from status/meta
        scancel_info = None
        try:
            rows = dbqueries.select_image_analyses(id)
            job_ids = []
            if rows and isinstance(rows, list):
                row0 = rows[0]
                status_obj = row0.get('status') if isinstance(row0, dict) else None
                meta_obj = row0.get('meta') if isinstance(row0, dict) else None

                # Helper: parse job ids from a dict of strings
                def parse_job_ids(dct):
                    if not isinstance(dct, dict):
                        return
                    for k, v in dct.items():
                        # pattern 1: jobid_<subid>: "169237"
                        if isinstance(k, str) and k.startswith('jobid_'):
                            if v is not None:
                                job_ids.append(str(v))
                        # pattern 2: status_<subid>: "submitted, job_id=57167333"
                        if isinstance(k, str) and k.startswith('status_') and isinstance(v, str):
                            m = re.search(r"job_id=(\d+)", v)
                            if m:
                                job_ids.append(m.group(1))

                parse_job_ids(status_obj)
                parse_job_ids(meta_obj)

            # De-duplicate while preserving order
            if job_ids:
                seen = set()
                uniq = []
                for j in job_ids:
                    if j not in seen:
                        uniq.append(j)
                        seen.add(j)
                try:
                    scancel_info = hpc_utils.scancel_job_ids_on_pelle(uniq)
                except Exception:
                    logging.exception("Failed to scancel Pelle job ids for analysis id=%s", id)
        except Exception:
            logging.exception("Unable to inspect analysis status/meta before deletion; id=%s", id)

        result1 = dbqueries.delete_analysis(id)
        result2 = str(kubeutils.delete_analysis_jobs(id))
        #result3 = str(fileutils.delete_analysis_jobs(id))

        result = []
        result.append(result1)
        result.append(result2)
        if scancel_info is not None:
            result.append({"pelle_scancel": scancel_info})

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
        z_plane = self.get_argument("z_plane-input")
        priority = self.get_argument("priority-input")

        run_on_uppmax = ("on" == self.get_argument("run-uppmax-cbx", default="off"))
        run_on_pharmbio = ("on" == self.get_argument("run-pharmbio-cbx", default="off"))
        run_on_haswell = ("on" == self.get_argument("run-haswell-cbx", default="off"))
        run_on_pelle = ("on" == self.get_argument("run-pelle-cbx", default="off"))
        run_on_hpcdev = ("on" == self.get_argument("run-hpcdev-cbx", default="off"))
        run_location = self.get_argument("run-location", default="uppmax")

        logging.info(f"run_on_uppmax: {run_on_uppmax}")
        logging.info(f"run_on_pelle: {run_on_pelle}")
        logging.info(f"run_on_pharmbio: {run_on_pharmbio}")
        logging.info(f"run_on_haswell: {run_on_haswell}")
        logging.info(f"run_on_hpcdev: {run_on_hpcdev}")
        logging.info(f"run_location: {run_location}")
        logging.info(f"priority: {priority}")

        plate_acqs_list = pipelineutils.parse_string_of_num_and_ranges(plate_acq_input)
        for plate_acquisition in plate_acqs_list:
            results = dbqueries.submit_analysis(plate_acquisition,
                                                analysis_pipeline_name,
                                                cellprofiler_version,
                                                well_filter,
                                                site_filter,
                                                z_plane,
                                                priority,
                                                run_on_uppmax,
                                                run_on_pharmbio,
                                                run_on_haswell,
                                                run_on_pelle,
                                                run_on_hpcdev,
                                                run_location)
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


class SaveImgsetQueryHandler(tornado.web.RequestHandler):
    def post(self):
        logging.info("%r %s", self.request, self.request.body.decode())

        try:

            multi_filter_input = self.get_argument("multi_filter-input").strip()
            if multi_filter_input == '':
                multi_filters = None
            else:
                multi_filters = multi_filter_input.split(',')

            if not multi_filters or len(multi_filters) == 0:
                # Split acq_id input into a list of integers
                acq_ids = [int(acq_id.strip()) for acq_id in self.get_argument("plate_acq-input").split(',')]
                # Process site filters, defaulting to [None] if no filter is provided
                site_filters = self.get_argument("site_filter-input").strip().split(',')
                site_filters = [None] if len(site_filters) == 1 and not site_filters[0] else site_filters
                # Process well filters, defaulting to [None] if no filter is provided
                well_filters = self.get_argument("well_filter-input").strip().split(',')
                well_filters = [None] if len(well_filters) == 1 and not well_filters[0] else well_filters


        except ValueError as e:
            logging.error(f"Error processing input parameters: {e}")
            self.set_status(400)
            self.write("Invalid input parameters. plate_acq-input should be integers.")
            return

        include_icf = self.get_argument("include-icf-cbx", None)
        use_icf = include_icf == "on"
        icf_path = None if not use_icf else "/cpp_work/devel/icf_npy/"

        all_imgsets = {}
        channel_map = None
        logging.info(f'multi {multi_filters}')
        if multi_filters and len(multi_filters) > 0 and multi_filters != None:
            for filter in multi_filters:
                parts = filter.split('_')
                acq_id = parts[0]
                # Check if well_filter exists; if not, set it to [None]
                well_filters = [parts[1]] if len(parts) > 1 else [None]
                # Check if site_filter exists; if not, set it to [None]
                site_filters = [parts[2]] if len(parts) > 2 else [None]

                imgsets = cellprofiler_utils.get_imgsets(acq_id, well_filters, site_filters)
                all_imgsets.update(imgsets)

                database = Database.get_instance()
                channel_map = database.get_channel_map_from_acq_id(acq_id)

        else:
            for acq_id in acq_ids:
                # Fetch imgsets for each acq_id
                imgsets = cellprofiler_utils.get_imgsets(acq_id, well_filters, site_filters)
                all_imgsets.update(imgsets)

                database = Database.get_instance()
                channel_map = database.get_channel_map_from_acq_id(acq_id)

        logging.info(f"{all_imgsets}")

        imgset_csv = cellprofiler_utils.get_cellprofiler_imgsets_csv(all_imgsets, channel_map, use_icf, icf_path)

        self.set_header("Content-type", "text/plain")
        self.write(imgset_csv)

    def get(self):
        """Handles GET requests.
        """

        # log all input parameters
        logging.info("%r %s" % (self.request, self.request.body.decode()))

        # meta = self.get_argument("analysis_pipeline-meta")
        # name = self.get_argument("analysis_pipeline-name")

        # verification = pipelineutils.veify_analysis_pipeline_meta(meta)
        # if verification != 'OK':
        #     results = verification
        # else:
        #     results = dbqueries.save_analysis_pipelines(name, meta)



        imgset = ("Header1,Header2\n"
                   "val1,val2")

        self.set_header("Content-type", "text/plain")
        self.write(imgset)


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


class LogHandler(tornado.web.RequestHandler):  # pylint: disable=abstract-method

    def get(self, analysis_id):
        """Handles GET requests."""

        logging.info(f"LogHandler, id: {analysis_id}")

        log_msg = self._create_log_message(analysis_id)

        log_msg = f"{log_msg}"

        log_msg = self._highlight_error(log_msg)

        self.render('log.html', log_msg=log_msg)

    def _create_log_message(self, analysis_id):
        analysis_info = dbqueries.select_image_analyses(analysis_id)
        # Ensure there is at least one result in the list
        if isinstance(analysis_info, list) and len(analysis_info) > 0:
            analysis_info = analysis_info[0]  # Access the first dictionary in the list
        else:
            raise ValueError(f"No analysis found for ID {analysis_id}")
        sub_analyses = dbqueries.select_image_sub_analyses(analysis_id)

        log_msg = f"result_path: /cpp_work/results/{analysis_info['plate_barcode']}/{analysis_info['plate_acquisition_id']}/{analysis_info['id']}"
        log_msg += "<br><br>"

        for sub in sub_analyses:
            msg = self._create_sub_log_message(sub)
            log_msg += f"{msg}<br><br>"

        return log_msg

    def _create_sub_log_message(self, sub):
        id = sub['sub_id']

        msg = []
        msg.append(f"sub_id: {id}")
        msg.append(f"analysis_id: {sub['analysis_id']}")
        msg.append(f"acq_id: {sub['plate_acquisition_id']}")
        msg.append(f"input_path: /cpp_work/input/{id}/")
        out_path = f"/cpp_work/output/{id}/"
        msg.append(f"out_path: {out_path}")
        msg.append(f"start: {sub['start']}")
        msg.append(f"finish: {sub['finish']}")
        msg.append(f"error: {sub['error']}")
        msg.append(f"runner_log: {out_path}runner.log")
        remote_log_path = self._get_remote_log_path(sub)
        msg.append(f"remote_log: {remote_log_path}")

        pretty_meta = json.dumps(sub['meta'], indent=2)
        msg.append(f"meta:<pre>{pretty_meta}</pre>")

        # If an "error" file exists directly in the output directory, display its contents
        try:
            top_error_file = os.path.join(out_path, "error")
            if os.path.isfile(top_error_file):
                top_error_content = self._read_file_to_string(top_error_file)
                msg.append(f"error file content:<pre>{top_error_content}</pre>")
        except Exception as e:
            logging.error(f"Failed reading top-level error file in {out_path}: {e}")

        error_paths = self._get_error_job_paths(out_path, 10)

        header_added = False
        for path in error_paths:
            if not header_added:
                msg.append(f"<b>jobs with error status, their cellprofiler log and input.csv (displaying up to 10 jobs):</b><br>")
                header_added = True
            msg.append(f"job_path: {path}<br>")

            log_file = os.path.join(path, "cp.log")
            log_file_content = self._read_file_to_string(log_file)
            msg.append(f"cellprofiler log:<pre>{log_file_content}</pre>")

            input_csv_path = self._get_input_csv_path_from_out_path(path)
            input_csv = self._read_file_to_string(input_csv_path)
            # TODO pretty print this
            msg.append(f"input.csv:<pre>{input_csv}</pre>")

            msg.append("###################################################################################################################<br>")

        return '<br>'.join(msg)
    
    def _get_remote_log_path(self, sub):
        job_id = self._get_job_id(sub['status'])
        slurm_log_path = None
        remote_log_path = ""
        if job_id:
            slurm_log_path = f"~/cppipeline2/uppmax/logs/{sub['sub_id']}-*.out"
        if slurm_log_path:
            remote_log_path = f"ssh uppmax cat '{slurm_log_path}'"
        return remote_log_path

    def _get_job_id(self, status_meta):
        """Extract jobid from the provided status JSON
        Expected shape: {"jobid":"178100", ...} 
        """
        # If a JSON string is provided, parse it
        if isinstance(status_meta, str):
            try:
                status_meta = json.loads(status_meta)
            except Exception:
                return None

        # If it's a dict, return the 'jobid' field
        if isinstance(status_meta, dict):
            jobid = status_meta.get('jobid')
            return str(jobid) if jobid is not None else None

        return None

    def _get_error_job_paths(self, sub_out_path, limit=10):
        root = sub_out_path
        error_paths = []
        try:
            # List the first-level subdirectories
            subdirs = [os.path.join(root, subdir) for subdir in os.listdir(root) if os.path.isdir(os.path.join(root, subdir))]

            # Check each subdirectory for the "error" file
            for subdir in subdirs:
                error_file_path = os.path.join(subdir, "error")
                if os.path.isfile(error_file_path):
                    error_paths.append(subdir)

                    # Break if we have reached the limit
                    if len(error_paths) >= limit:
                        break
        except Exception as e:
            logging.error(f"An error occurred while fetching error job paths: {e}")

        return error_paths

    def _get_input_csv_path_from_out_path(self, output_path):
        # Split the output path into parts
        path_parts = output_path.split('/')

        # Replace 'output' with 'input'
        path_parts[2] = 'input'

        # Construct the new path with the .csv extension
        new_path = '/'.join(path_parts) + '.csv'

        return new_path

    def _read_file_to_string(self, file_path):
        """
        Reads the content of the specified file and returns it as a string.

        :param file_path: Path to the file to be read
        :return: Content of the file as a string, or None if an error occurs
        """
        try:
            with open(file_path, 'r') as file:
                content = file.read()
            return content
        except FileNotFoundError:
            logging.error(f"The file {file_path} does not exist.")
            return None
        except Exception as e:
            logging.error(f"An error occurred while reading the file {file_path}: {e}")
            return None

    def _highlight_error(self, log_msg):
        # Use re.sub to find case insensitive "error" and replace with <span class="highlight-error"></span>
        highlighted_msg = re.sub(r'(?i)error', r'<span class="highlight-error">\g<0></span>', log_msg)
        return highlighted_msg

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
