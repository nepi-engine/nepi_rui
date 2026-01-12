# Copyright (c) 2024 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License", 
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#


import time
import subprocess
import sys

# Stolen from here:
# https://www.andreas-jung.com/contents/a-python-decorator-for-measuring-the-execution-time-of-methods
def timeit(method):
    def timed(*args, **kw):
        ts = time.time()
        result = method(*args, **kw)
        te = time.time()
        print('Timed {} {} took {}'.format(method.__name__, args, te-ts))
        return result
    return timed


@timeit
def check_call(*args, **kwargs):
    subprocess.check_call(*args, **kwargs)


@timeit
def check_output(*args, **kwargs):
    return subprocess.check_output(*args, **kwargs)


def stream_output(*args, **kwargs):
    kwargs['stdout'] = subprocess.PIPE
    process = subprocess.Popen(*args, **kwargs)
    for c in iter(lambda: process.stdout.read(1), ''):
        sys.stdout.write(c)

    ret = process.wait()
    if ret != 0:
        raise subprocess.CalledProcessError(ret, " ".join(*args))