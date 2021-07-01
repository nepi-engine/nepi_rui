cmake_minimum_required(VERSION 2.8.3)
project(numurus_rui)

# Find catkin macros and libraries
find_package(catkin REQUIRED COMPONENTS num_sdk_msgs rosbridge_server rospy)

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
## Mark executable scripts (Python etc.) for installation
## in contrast to setup.py, you can choose the destination
install(PROGRAMS
    scripts/rui_config_mgr.py
    DESTINATION ${CATKIN_PACKAGE_BIN_DESTINATION}
)

catkin_install_python(
  PROGRAMS
#    scripts/fake_data_pub.py
#    scripts/fake_status_pub.py
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
