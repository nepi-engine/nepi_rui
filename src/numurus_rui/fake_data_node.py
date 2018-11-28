#!/usr/bin/env python

from __future__ import division

import rospy

class FakeDataNode(object):
    """Example node for publishing fake Annotation msgs"""

    def __init__(self, publishers, frequency=10):
        super(FakeDataNode, self).__init__()
        self.publishers = publishers
        self.frequency = frequency
        self._node_name = 'fake_data_publisher'
        rospy.init_node(self._node_name, anonymous=True)
        self._msg_count = 0

    def publish_fake_data(self):
        """
        Iterate through publishers and publish fake data every `interval` seconds
        """
        rate = rospy.Rate(self.frequency)
        while not rospy.is_shutdown():
            for publisher in self.publishers:
                rospy.loginfo('{}: Publishing fake message. (index: {})'.format(publisher.topic_name, self._msg_count))
                publisher.update(self._msg_count)
                publisher.publish()
            self._msg_count += 1
            rate.sleep()

