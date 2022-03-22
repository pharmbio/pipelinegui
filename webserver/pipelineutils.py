
import json
import os


def veify_analysis_pipeline_meta(meta):
    pipeline_path = '/cpp_work/pipelines/'
    
    for obj in json.loads(meta):
        if 'pipeline_file' in obj:
            pipeline_file = obj['pipeline_file']
            if not os.path.isfile(os.path.join(pipeline_path, pipeline_file)):
                raise ValueError(f'Pipeline file does not exist: {pipeline_file}')
            
    # else return ok
    return "OK"