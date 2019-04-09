#!/usr/bin/env python

from __future__ import division

from math import pi, sin

from num_sdk_msgs.msg import NDStatus, NDRange, NDAngle, NDAutoManualSelection

import rospy

class NDStatusPublisher(object):
    """Example node for publishing fake NDStatus msgs"""

    def __init__(self):
        super(NDStatusPublisher, self).__init__()
        self.topic_name = '/numurus/fake_device/x0000-02/fake_nd_status'
        self._nd_status = NDStatus()
        self._publisher = rospy.Publisher(self.topic_name, NDStatus, queue_size=10)
        self.init_nd_status()

    def init_nd_status(self):
        self._nd_status.display_name = "NDStatus msg"
        self._nd_status.pause_enable = True
        self._nd_status.simulate_data = True

        self._nd_status.range = NDRange()
        self._nd_status.range.min_range = 0.0
        self._nd_status.range.max_range = 1.0

        self._nd_status.angle = NDAngle()
        self._nd_status.angle.angle_offset = 0.0
        self._nd_status.angle.total_angle = 1.0

        self._nd_status.resolution_settings = NDAutoManualSelection()
        self._nd_status.resolution_settings.enabled = True
        self._nd_status.resolution_settings.adjustment = 0.1

        self._nd_status.gain_settings = NDAutoManualSelection()
        self._nd_status.gain_settings.enabled = True
        self._nd_status.gain_settings.adjustment = 0.1

        self._nd_status.filter_settings = NDAutoManualSelection()
        self._nd_status.filter_settings.adjustment = 0.1
        self._nd_status.filter_settings.enabled = True

    def update(self, msg_count):
        frequency = 100

        # Every 10 cycles flip the pause_enable msg
        if msg_count % frequency == 0:
            self._nd_status.pause_enable = not self._nd_status.pause_enable

        # Total angle follows a sin wave between 0.25 and 0.75
        total_angle_f = frequency
        self._nd_status.angle.total_angle = sin(pi * msg_count / total_angle_f) / 4 + 0.5

        # Angle offset goes between 0.25 and 0 every 10 cycles
        angle_offset_f = 10
        angle_offset_hi = 0.25
        angle_offset_lo = 0.0
        if msg_count % angle_offset_f == 0:
            if self._nd_status.angle.angle_offset == angle_offset_hi:
                self._nd_status.angle.angle_offset = angle_offset_lo
            else:
                self._nd_status.angle.angle_offset = angle_offset_hi

    def publish(self):
        self._publisher.publish(self._nd_status)
