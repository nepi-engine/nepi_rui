#!/usr/bin/env python

import rospy

from numurus_rui.fake_data_node import FakeDataNode

from numurus_rui.image_recognition_publisher import ImageRecognitionPublisher
from numurus_rui.nd_status_publisher import NDStatusPublisher

if __name__ == '__main__':
    image_recognition_pub = ImageRecognitionPublisher()
    nd_status_pub = NDStatusPublisher()
    frequency = 10.0

    publishers = [image_recognition_pub, nd_status_pub]
    node = FakeDataNode(publishers, frequency)

    try:
        node.publish_fake_data()
    except rospy.ROSInterruptException:
        pass