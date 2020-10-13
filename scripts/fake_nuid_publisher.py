#!/usr/bin/env python
import rospy

# Simple testing node publishes a dummy NUID

from std_msgs.msg import String

if __name__ == '__main__':
  print('Starting fake_nuid_publisher node')
  pub = rospy.Publisher('nuid', String, queue_size=5, latch=True)
  rospy.init_node('fake_nuid_publisher')
  pub.publish('0123456789') # Publish once so the message is "latched"
  rospy.spin()
