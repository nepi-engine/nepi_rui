#!/usr/bin/env python

import rospy

from numurus_rui.fake_data_node import FakeDataNode

from numurus_rui.system_status_publisher import SystemStatusPublisher

if __name__ == '__main__':
    system_status_pub = SystemStatusPublisher()

    # publishers is a list of publisher object and frequency turples
    publishers = [
        (system_status_pub, 1.)
    ]
    node = FakeDataNode('fake_status', publishers)

    try:
        node.publish_fake_data()
    except rospy.ROSInterruptException:
        pass