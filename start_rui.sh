#! /bin/bash
#
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

export RUI_HOME="/opt/nepi/nepi_rui"

# Use the correct python
#source ${RUI_HOME}/venv/bin/activate || echo "Failed to load venv"

# Set environment variables
export PYTHONPATH="$PYTHONPATH:$RUI_HOME/src"

python $RUI_HOME/scripts/run_webserver.py
