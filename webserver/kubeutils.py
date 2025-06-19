import kubernetes
from kubernetes.client.rest import ApiException
import logging
import os
import yaml
import base64
import datetime


def is_develop():
    """
    Check if the users has the develop env.var. set
    """
    develop = False
    if os.environ.get('DEVELOP') and os.environ.get('DEVELOP') == "True":
        develop = True

    return develop

def is_debug():
    """
    Check if the users has the debug env.var. set
    """
    debug = False
    if os.environ.get('DEBUG') and os.environ.get('DEBUG') == "True":
        debug = True

    return debug

def get_namespace():

    if is_develop():
        namespace = "cpp" # "cpp-debug"
    else:
        namespace = "cpp"

    return namespace


def init_kubernetes_connection():
    # load the kube config
    kubernetes.config.load_kube_config('/kube/config')


def list_jobs():
    namespace = get_namespace()
    init_kubernetes_connection()
    batch = kubernetes.client.BatchV1Api()

    
    
def list_jobs():
    # list all jobs in namespace
    namespace = get_namespace()

    init_kubernetes_connection()
    k8s_batch_api = kubernetes.client.BatchV1Api()

    try:
        job_list = k8s_batch_api.list_namespaced_job(namespace=namespace)
    except ApiException as e:
        # bubble up a structured error instead of HTML
        raise RuntimeError(f"Kubernetes API error [{e.status}]: {e.reason}")

    # filter out all finished jobs
    rows = [["NAME", "ACTIVE", "SUCCEEDED", "FAILED", "CREATED", "STARTED", "FINISHED", "DURATION", "AGE", "STATUS"]]
    for job in job_list.items:

        # logging.debug(job)

        row = []

        # convert to dict for usability
        job_dict = job.to_dict()

        #logging.debug("Job:" + str(job))
        # logging.debug(job.metadata.cluster_name)

        # metadata, spec, status

        # name
        name = job.metadata.name

        # active
        active = int(job.status.active or 0)

        # succeeded
        succeeded = int(job.status.succeeded or 0)

        # failed
        failed = int(job.status.failed or 0)

        # created
        created = job.metadata.creation_timestamp

        # start
        started = job.status.start_time

        # Finished
        finished = job.status.completion_time

        # Duration
        duration = getDuration(started, finished)

        # Age
        age = getAge(created)

        # Job status
        if job.status.conditions is not None and len(job.status.conditions) > 0:
            status = job.status.conditions[0].type
        else:
            status = "None"


        row.append(name)
        row.append(active)
        row.append(succeeded)
        row.append(failed)
        row.append(str(created))
        row.append(str(started))
        row.append(str(finished))
        row.append(str(duration))
        row.append(str(age))
        row.append(status)

        rows.append(row)


    return rows

def getDuration(started, finished):

    duration = None

    if started == None:
        duration = None
    elif finished == None:
        #logging.info(str(datetime.datetime.utcnow()))
        duration =  None #started - datetime.datetime.utcnow()
    else:
        duration = finished - started

    return duration

def getAge(created):

    if created == None:
        return None

    now = datetime.datetime.now()
    now_utc = now.replace(tzinfo = datetime.timezone.utc)

    #logging.info("created" + str(created))
    #logging.info("now" + str(now_utc))

    age = now_utc - created

    return age



def get_job_log(job_name):

    namespace = get_namespace()

    init_kubernetes_connection()
    k8s_core_api = kubernetes.client.CoreV1Api()

    label_selector = f"job-name={job_name}"
    pods_list = k8s_core_api.list_namespaced_pod(namespace=namespace, label_selector=label_selector)

    # TODO in future one job could consist of many pods, but for now we only get log from first
    response = ""
    if pods_list is not None and pods_list.items is not None and len(pods_list.items) > 0:
        pod_name = pods_list.items[0].metadata.name
        response = k8s_core_api.read_namespaced_pod_log(namespace=namespace, name=pod_name)
    else:
        response = "Could not find a log, is pod started?"

    return str(response)

def delete_analysis_jobs(analysis_id):
    # list all jobs in namespace
    namespace = get_namespace()

    init_kubernetes_connection()
    k8s_batch_api = kubernetes.client.BatchV1Api()

    label_selector = f"analysis_id={analysis_id}"
    response = k8s_batch_api.delete_collection_namespaced_job(namespace=namespace, label_selector=label_selector, propagation_policy='Foreground')

    logging.debug("delete_analysis_jobs, response: " + str(response))

    return response



