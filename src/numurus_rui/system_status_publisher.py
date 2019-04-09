#!/usr/bin/env python

"""
 Author: Tyler Weaver
 Desc: The SystemStatus message is used to identify the hardware and
 provide hardware status.  This publisher sends fake ones for use in
 testing.
"""

from __future__ import division

from num_sdk_msgs.msg import SystemStatus, StampedString, WarningFlags

import rospy

class SystemStatusPublisher(object):
    """Example node for publishing fake SystemStatus msgs"""

    def __init__(self):
        super(SystemStatusPublisher, self).__init__()
        self.topic_name = '/numurus/fake_device/0000-01/system_status'
        self._system_status = SystemStatus()
        self._publisher = rospy.Publisher(self.topic_name, SystemStatus, queue_size=10)
        self.init_system_status()

    def init_system_status(self):
        self._system_status.temperatures = [60]
        self._system_status.disk_usage = 2500
        self._system_status.storage_rate = 0.5
        self._system_status.save_all_enabled = False

        self._system_status.info_strings = []

        self._system_status.warnings = WarningFlags()
        self._system_status.warnings.flags = [False, False, True]

    def update(self, msg_count):
        self._system_status.sys_time = rospy.get_rostime()

        # Increment temprature, wrap at 200C
        temp = self._system_status.temperatures[0]
        temp += 2.1
        temp %= 200
        self._system_status.temperatures[0] = temp

        # every 10th message send a message
        if (msg_count % 10 == 0):
            self._system_status.info_strings = [StampedString()]
            self._system_status.info_strings[0].timestamp = rospy.get_rostime()
            self._system_status.info_strings[0].priority = StampedString.PRI_ELEVATED
            self._system_status.info_strings[0].payload = "Elevated Stamped String!"
        else:
            self._system_status.info_strings = []

    def publish(self):
        self._publisher.publish(self._system_status)
