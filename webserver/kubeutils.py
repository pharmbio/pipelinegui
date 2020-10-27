import kubernetes
import logging
import os
import yaml
import base64

def is_debug():
    """
    Check if the users has the debug env.var. set
    """
    debug = False
    if os.environ.get('DEBUG') and os.environ.get('DEBUG') == "True":
        debug = True

    return debug

def init_kubernetes_connection():
    # load the kube config
    kubernetes.config.load_kube_config('/kube/config')


def list_jobs(namespace='cpp'):
    # list all jobs in namespace

    init_kubernetes_connection()
    k8s_batch_api = kubernetes.client.BatchV1Api()
    job_list = k8s_batch_api.list_namespaced_job(namespace=namespace)

    # filter out all finished jobs
    rows = [["NAME", "ACTIVE", "SUCCEEDED", "FAILED", "STARTED", "FINISHED", "DURATION", "AGE", "STATUS"]]
    for job in job_list.items:

        # logging.debug(job)

        row = []

        # convert to dict for usability
        job_dict = job.to_dict()

        logging.debug("Job:" + str(job))
        logging.debug(job.metadata.cluster_name)

        # metadata, spec, status

        # name
        name = job_dict['metadata']['name']

        # active
        active = int(job.status.active or 0)

        # succeeded
        succeeded = int(job.status.succeeded or 0)

        # failed
        failed = int(job.status.failed or 0)

        # start
        started = str(job.status.start_time)

        # Finished
        finished = str(job.status.completion_time)

        # Duration
        duration = "?"

        # Age
        age = "?"

        # Job status
        if job_dict['status']['conditions'] == None:
            status = "None"
        else:
            status = job_dict['status']['conditions'][0]['type']

        row.append(name)
        row.append(active)
        row.append(succeeded)
        row.append(failed)
        row.append(started)
        row.append(finished)
        row.append(duration)
        row.append(age)
        row.append(status)

        rows.append(row)

    
    return rows



def get_job_log(job_name, namespace='cpp'):

    init_kubernetes_connection()
    k8s_core_api = kubernetes.client.CoreV1Api()

    label_selector = f"job-name={job_name}"
    pods_list = k8s_core_api.list_namespaced_pod(namespace=namespace, label_selector=label_selector)

    # TODO in future one job could consist of many pods, but for now we only get log from first
    pod_name = pods_list.items[0].metadata.name

    # logging.debug("pod_name" + str(pod_name))

    response = k8s_core_api.read_namespaced_pod_log(namespace=namespace, name=pod_name)

    return str(response)

def delete_analysis_jobs(analysis_id, namespace='cpp'):
    # list all jobs in namespace

    init_kubernetes_connection()
    k8s_batch_api = kubernetes.client.BatchV1Api()

    label_selector = f"analysis_id={analysis_id}"
    response = k8s_batch_api.delete_collection_namespaced_job(namespace=namespace, label_selector=label_selector)

    return response



