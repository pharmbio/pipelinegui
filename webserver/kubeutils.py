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
    rows = [["NAME", "COMPLETIONS", "DURATION", "AGE", "STATUS"]]
    for job in job_list.items:

        logging.debug(job)

        row = []

        # convert to dict for usability
        job_dict = job.to_dict()

        # name
        name = job_dict['metadata']['name']

        # completion
        completion = "?"

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
        row.append(completion)
        row.append(duration)
        row.append(age)
        row.append(status)

        rows.append(row)

    
    return rows
