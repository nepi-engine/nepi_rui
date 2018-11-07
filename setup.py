#!/usr/bin/env python

from distutils.core import setup
from catkin_pkg.python_setup import generate_distutils_setup

d = generate_distutils_setup(
    packages=['numurus_rui'],
    scripts=['scripts/nd_status_pub.py']
)

setup(**d)
