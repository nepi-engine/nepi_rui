#
# NEPI Dual-Use License
# Project: nepi_rui
#
# This license applies to any user of NEPI Engine software
#
# Copyright (C) 2023 Numurus, LLC <https://www.numurus.com>
# see https://github.com/numurus-nepi/nepi_rui
#
# This software is dual-licensed under the terms of either a NEPI software developer license
# or a NEPI software commercial license.
#
# The terms of both the NEPI software developer and commercial licenses
# can be found at: www.numurus.com/licensing-nepi-engine
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - https://www.numurus.com/licensing-nepi-engine
# - mailto:nepi@numurus.com
#
#
import os

APP_BUILD_PATH = os.path.join(os.environ['RUI_HOME'], 'src', 'rui_webserver', 'rui-app', 'build')
DATA_PATH = os.path.join(os.environ['RUI_HOME'], 'src', 'rui_webserver', 'rui-app')