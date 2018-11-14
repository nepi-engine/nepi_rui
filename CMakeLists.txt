cmake_minimum_required(VERSION 2.8.3)
project(numurus_rui)

# Find catkin macros and libraries
find_package(catkin REQUIRED COMPONENTS num_sdk_msgs rosbridge_server)

###################################
## Catkin specific configuration ##
###################################
catkin_package(
  CATKIN_DEPENDS
    num_sdk_msgs
    rosbridge_server
)
catkin_python_setup()

###########
## Build ##
###########

#############
## Install ##
#############
install(PROGRAMS scripts/nd_status_pub.py
  DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

#############
## Testing ##
#############
