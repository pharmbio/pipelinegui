FROM ubuntu:22.04

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

RUN apt-get update && apt-get install -y \
        python3 \
        python3-pip

# opencv-python lib deps
RUN apt-get install -y \
        libsm6 \
        libxext6 \
        libxrender-dev

# install devtools
RUN apt-get update && apt-get install -y \
        git \
        vim

# install postgres devtools
RUN apt-get update && apt-get install -y \
        libpq-dev

# install tiffinfo
RUN apt-get update && apt-get install -y \
        libtiff-tools

ENV TZ=Europe/London
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
        libgl1 \
        libglib2.0-0

# Install with pip before copying app files so this
# layer can be cached when only source changes.
COPY requirements.txt /app/
RUN pip3 install -r /app/requirements.txt

# Copy only the relevant application files into the image.
# Assumes the build context is the pipeline-monitor directory.
COPY *.py settings*.json /app/

WORKDIR /app
