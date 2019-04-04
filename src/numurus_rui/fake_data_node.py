#!/usr/bin/env python

from __future__ import division

import rospy

class FakeDataNode(object):
    """Example node for publishing fake Annotation msgs."""

    def __init__(self, name, publishers_rate_turple):
        """publishers_rate_turple accepts a list of turples containing the publisher object and
        the frequency it should be published"""
        super(FakeDataNode, self).__init__()
        self.publishers_rate_turple = publishers_rate_turple
        self._node_name = name
        rospy.init_node(self._node_name, anonymous=True)
        self._msg_count = 0

    def create_callback(self, publisher):
        """ 
        This function is necesary because scoping in python is lexical and the lambda remembers
        the name of the varaible.  That is why if you create lambdas in a loop using a loop variable
        all the resulting lambdas will have the scope of the last time the loop ran. 
        See: https://stackoverflow.com/questions/2295290/what-do-lambda-function-closures-capture
        """
        return lambda event: self.publish(publisher)

    def publish(self, publisher):
        rospy.loginfo('Fake msg {}: {}'.format(self._msg_count, publisher.topic_name))
        publisher.update(self._msg_count)
        publisher.publish()
        self._msg_count += 1

    def publish_fake_data(self):
        """
        Iterate through publishers and publish fake data every `interval` seconds
        """
        for publisher, rate in self.publishers_rate_turple:
            callback = self.create_callback(publisher)
            rospy.Timer(rospy.Duration(1.0 / rate), callback, oneshot=False)

        rospy.spin()