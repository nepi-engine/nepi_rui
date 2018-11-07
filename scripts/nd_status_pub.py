#!/usr/bin/env python

####################################################################
# Software License Agreement (BSD License)
#
#  Copyright (c) 2018, PickNik LLC
#  All rights reserved.
#
#  Redistribution and use in source and binary forms, with or without
#  modification, are permitted provided that the following conditions
#  are met:
#
#   * Redistributions of source code must retain the above copyright
#     notice, this list of conditions and the following disclaimer.
#   * Redistributions in binary form must reproduce the above
#     copyright notice, this list of conditions and the following
#     disclaimer in the documentation and/or other materials provided
#     with the distribution.
#   * Neither the name of PickNik LLC nor the names of its
#     contributors may be used to endorse or promote products derived
#     from this software without specific prior written permission.
#
#  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
#  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
#  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
#  FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
#  COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
#  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
#  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
#  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
#  CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
#  LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
#  ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
#  POSSIBILITY OF SUCH DAMAGE.
####################################################################

from __future__ import division

from math import pi, sin

from num_sdk_msgs.msg import NDStatus, NDRange, NDAngle, NDAutoManualSelection

import rospy

class NDStatusPublisher(object):
    """Example node for publishing fake NDStatus msgs"""

    def __init__(self):
        super(NDStatusPublisher, self).__init__()
        self._node_name = 'nd_status_publisher'
        self._topic_name = 'fake_nd_status'
        rospy.init_node(self._node_name, anonymous=True)
        self._nd_status = NDStatus()
        self._publisher = rospy.Publisher(self._topic_name, NDStatus, queue_size=10)
        self._msg_count = 0

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

    def update_nd_status_msg(self):
        frequency = 100

        # Every 10 cycles flip the pause_enable msg
        if self._msg_count % frequency == 0:
            self._nd_status.pause_enable = not self._nd_status.pause_enable

        # Total angle follows a sin wave between 0.25 and 0.75
        total_angle_f = frequency
        self._nd_status.angle.total_angle = sin(pi * self._msg_count / total_angle_f) / 4 + 0.5

        # Angle offset goes between 0.25 and 0 every 10 cycles
        angle_offset_f = 10
        angle_offset_hi = 0.25
        angle_offset_lo = 0.0
        if self._msg_count % angle_offset_f == 0:
            if self._nd_status.angle.angle_offset == angle_offset_hi:
                self._nd_status.angle.angle_offset = angle_offset_lo
            else:
                self._nd_status.angle.angle_offset = angle_offset_hi

    def publish_fake_data(self, frequency=1):
        """
        Publishes fake data every `interval` seconds
        """
        rate = rospy.Rate(frequency)  # 10hz
        while not rospy.is_shutdown():
            self.update_nd_status_msg()
            self._publisher.publish(self._nd_status)
            self._msg_count += 1
            rate.sleep()


if __name__ == '__main__':
    nd_status_pub = NDStatusPublisher()
    frequency = 10.0

    try:
        nd_status_pub.publish_fake_data(frequency=frequency)
    except rospy.ROSInterruptException:
        pass
