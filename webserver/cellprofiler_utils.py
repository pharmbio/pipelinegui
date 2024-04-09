import logging
import os
from database import Database


def get_imgsets(acq_id, well_filter=None, site_filter=None):
        # fetch all images belonging to the plate acquisition
        logging.info(f'Fetching images belonging to plate acqusition {acq_id}')

        database = Database.get_instance()

        images = database.get_imgages(acq_id, well_filter, site_filter)

        imgsets = make_imgsets_from_images(images)

        return imgsets


def make_imgsets_from_images(images):

    imgsets = {}
    for img in images:

        logging.debug(f'img: {img["path"]}')
        # readability
        imgset_key = f"{img['plate_acquisition_id']}-{img['well']}-{img['site']}"

        imgsets.setdefault(imgset_key, []).append(img)

    return imgsets

def get_cellprofiler_imgsets_csv(imgsets, channel_map, use_icf, icf_path):

    logging.info("Inside make_imgset_csv")

    ### create header row
    header = ""

    for ch_nr,ch_name in sorted(channel_map.items()):
        header += f"FileName_{ch_name}," #header += f"FileName_w{ch_nr}_{ch_name},"

    header += "Group_Index,Group_Number,ImageNumber,Metadata_Barcode,Metadata_Site,Metadata_Well,Metadata_AcqID,"

    for ch_nr,ch_name in sorted(channel_map.items()):
        header += f"PathName_{ch_name},"

    for ch_nr,ch_name in sorted(channel_map.items()):
        header += f"URL_{ch_name},"

    # Add Illumination correction headers if needed
    if use_icf:
        # First as URL_
        for ch_nr,ch_name in sorted(channel_map.items()):
            header += f"URL_ICF_{ch_name},"

        # And then as PathName_
        for ch_nr,ch_name in sorted(channel_map.items()):
            header += f"PathName_ICF_{ch_name},"

         # And then as FileName_
        for ch_nr,ch_name in sorted(channel_map.items()):
            header += f"FileName_ICF_{ch_name},"

    # remove last comma and add newline
    header = header[:-1]+"\n"
    ###

    # init counter
    content = ""

    # for each imgset
    for imgset_counter,imgset in enumerate(imgsets.values()):
        #pdb.set_trace()
        # construct the csv row
        row = ""

        # sort the images in the imgset by channel id
        sorted_imgset = sorted(imgset, key=lambda k: k['channel'])

        # add filenames
        for img in sorted_imgset:
            img_filename = os.path.basename(img['path'])
            row += f'"{img_filename}",'

        # add imgset info
        row += (
            f'{imgset_counter},1,{imgset_counter},'
            f'"{img["plate_barcode"]}",{img["site"]},'
            f'"{img["well"]}",{img["plate_acquisition_id"]},'
        )

        # add file paths
        for img in sorted_imgset:
            img_dirname = os.path.dirname(img['path'])
            row += f'"{img_dirname}",'

        # add file urls
        for img in sorted_imgset:
            path = img['path']
            row += f'"file:{path}",'


        # add illumination file names, both as URL_ and PATH_ - these are not uniqe per image,
        # all images with same channel have the same correction image
        if use_icf:

            icf_path = icf_path

            # First as URL
            for ch_nr,ch_name in sorted(channel_map.items()):
                icf_file_name = f'ICF_{ch_name}.npy'
                path = f'{icf_path}/{icf_file_name}'
                row +=  f'"file:{path}",'

            # Also as PathName_
            for ch_nr,ch_name in sorted(channel_map.items()):
                row +=  f'"{icf_path}",'

            # Also as FileName_
            for ch_nr,ch_name in sorted(channel_map.items()):
                icf_file_name = f'ICF_{ch_name}.npy'
                row +=  f'"{icf_file_name}",'

        # remove last comma and add a newline before adding it to the content
        content += row[:-1] + "\n"

    # return the header and the content
    return header + content