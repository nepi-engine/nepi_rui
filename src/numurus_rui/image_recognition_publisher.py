#!/usr/bin/env python

from __future__ import division

from math import pi, sin

from num_sdk_msgs.msg import Annotation
from sensor_msgs.msg import RegionOfInterest

import rospy

class ImageRecognitionPublisher(object):
    """Example node for publishing fake Annotation msgs"""

    def __init__(self):
        super(ImageRecognitionPublisher, self).__init__()
        self.topic_name = '/fake_image_recognition'
        self._image_recognition = Annotation()
        self._publisher = rospy.Publisher(self.topic_name, Annotation, queue_size=10)
        self.init_image_recognition()

    def init_image_recognition(self):
        self._image_recognition.label = "Fake Image Recognition"

        roi = RegionOfInterest()
        roi.x_offset = 100
        roi.y_offset = 100
        roi.height = 300
        roi.width = 400

        self._image_recognition.roi = roi

    def update(self, msg_count):
        total_angle_f = 100
        total_angle = sin(pi * msg_count / total_angle_f)
        self._image_recognition.roi.x_offset = int(400 + 400 * total_angle)

    def publish(self):
        self._publisher.publish(self._image_recognition)
