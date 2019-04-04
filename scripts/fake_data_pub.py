#!/usr/bin/env python

import rospy

from numurus_rui.fake_data_node import FakeDataNode

from numurus_rui.image_recognition_publisher import ImageRecognitionPublisher
from numurus_rui.nd_status_publisher import NDStatusPublisher

if __name__ == '__main__':
    image_recognition_pub = ImageRecognitionPublisher()
    nd_status_pub = NDStatusPublisher()

    # publishers is a list of publisher object and frequency turples
    publishers = [
        (image_recognition_pub, 10.), 
        (nd_status_pub, 10.)
    ]
    node = FakeDataNode('fake_data', publishers)

    try:
        node.publish_fake_data()
    except rospy.ROSInterruptException:
        pass