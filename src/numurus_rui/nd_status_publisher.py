#!/usr/bin/env python

from __future__ import division

from math import pi, sin

from num_sdk_msgs.msg import Status3DX, Range3DX, Angle3DX, AutoManualSelection3DX

import rospy

class Status3DXPublisher(object):
    """Example node for publishing fake Status3DX msgs"""

    def __init__(self):
        super(Status3DXPublisher, self).__init__()
        self.topic_name = '/numurus/fake_device/x0000-02/fake_status_3dx'
        self._status_3dx = Status3DX()
        self._publisher = rospy.Publisher(self.topic_name, Status3DX, queue_size=10)
        self.init_status_3dx()

    def init_status_3dx(self):
        self._status_3dx.display_name = "Status3DX msg"
        self._status_3dx.pause_enable = True
        self._status_3dx.simulate_data = True

        self._status_3dx.range = Range3DX()
        self._status_3dx.range.min_range = 0.0
        self._status_3dx.range.max_range = 1.0

        self._status_3dx.angle = Angle3DX()
        self._status_3dx.angle.angle_offset = 0.0
        self._status_3dx.angle.total_angle = 1.0

        self._status_3dx.resolution_settings = AutoManualSelection3DX()
        self._status_3dx.resolution_settings.enabled = True
        self._status_3dx.resolution_settings.adjustment = 0.1

        self._status_3dx.gain_settings = AutoManualSelection3DX()
        self._status_3dx.gain_settings.enabled = True
        self._status_3dx.gain_settings.adjustment = 0.1

        self._status_3dx.filter_settings = AutoManualSelection3DX()
        self._status_3dx.filter_settings.adjustment = 0.1
        self._status_3dx.filter_settings.enabled = True

    def update(self, msg_count):
        frequency = 100

        # Every 10 cycles flip the pause_enable msg
        if msg_count % frequency == 0:
            self._status_3dx.pause_enable = not self._status_3dx.pause_enable

        # Total angle follows a sin wave between 0.25 and 0.75
        total_angle_f = frequency
        self._status_3dx.angle.total_angle = sin(pi * msg_count / total_angle_f) / 4 + 0.5

        # Angle offset goes between 0.25 and 0 every 10 cycles
        angle_offset_f = 10
        angle_offset_hi = 0.25
        angle_offset_lo = 0.0
        if msg_count % angle_offset_f == 0:
            if self._status_3dx.angle.angle_offset == angle_offset_hi:
                self._status_3dx.angle.angle_offset = angle_offset_lo
            else:
                self._status_3dx.angle.angle_offset = angle_offset_hi

    def publish(self):
        self._publisher.publish(self._status_3dx)
