
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

def parse_string_of_num_and_ranges(input: str):
    """
    Take a string like '2-5,7,15-17,12' and turn it into a list [2, 3, 4, 5, 7, 12, 15, 16, 17]
    """

    if input.startswith("-"):
        return [input]

    numbers = set()

    for element in input.split(','):
        parts = [int(x) for x in element.split('-')]
        if len(parts) == 1:
            numbers.add(parts[0])
        else:
            for part in range(min(parts), max(parts) + 1):
                numbers.add(part)

    return list(numbers)