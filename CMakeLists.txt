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
cmake_minimum_required(VERSION 3.5)
project(nepi_rui)

# Find catkin macros and libraries
find_package(catkin REQUIRED COMPONENTS nepi_interfaces rosbridge_server rospy)

###################################
## Catkin specific configuration ##
###################################
catkin_package(
  CATKIN_DEPENDS
    nepi_interfaces
    rosbridge_server
)
catkin_python_setup()

###########
## Build ##
###########

#############
## Install ##
#############


if(NOT NEPI_BASE)
  set( NEPI_BASE 
    /opt/nepi
  )
endif()

if(NOT NEPI_RUI)
  set( NEPI_RUI 
    ${NEPI_BASE}/nepi_rui
  )
endif()

if(NOT NEPI_ENGINE)
  set( NEPI_ENGINE 
    ${NEPI_BASE}/nepi_engine
  )
endif()

if(NOT NEPI_ETC)
  set( NEPI_ETC 
    ${NEPI_BASE}/etc
  )
endif()


## Mark executable scripts (Python etc.) for installation
## in contrast to setup.py, you can choose the destination
install(PROGRAMS
    scripts/rui_config_mgr.py
    DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

catkin_install_python(
  PROGRAMS
    scripts/run_webserver.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION})

  # Install etc files (startup scripts, factory configs, etc.) to the global (not project) etc destination
install(DIRECTORY etc/
  DESTINATION ${CATKIN_GLOBAL_ETC_DESTINATION}
  USE_SOURCE_PERMISSIONS
)

install(DIRECTORY launch/
  DESTINATION ${CATKIN_PACKAGE_SHARE_DESTINATION}/launch
)

#############
## Testing ##
#############
