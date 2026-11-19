#!/bin/bash
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

# Setup environment

# Use the correct python and npm
#source ./venv/bin/activate || echo "Failed to load venv"
source ~/.nvm/nvm.sh
# Set environment variables
export RUI_HOME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && nvm use )"
