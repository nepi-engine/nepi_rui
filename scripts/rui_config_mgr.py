#!/usr/bin/env python
import rospy

from std_msgs.msg import UInt8
from num_sdk_msgs.msg import RUISettings

from num_sdk_base.save_cfg_if import SaveCfgIF

class RUICfgMgrNode:
    NODE_NAME = "rui_config_mgr"
    DEFAULT_IMAGE_QUALITY = 95

    def publish_settings(self):
        # Gather all settings for the message
        self.settings_msg.streaming_image_quality = rospy.get_param("~streaming_image_quality", self.DEFAULT_IMAGE_QUALITY)

        # Publish it
        self.settings_pub.publish(self.settings_msg)

    def set_streaming_image_quality_cb(self, msg):
        if (msg.data < 1 or msg.data > 100):
            rospy.logerr("Invalid image qualtiy: %u... ignoring", msg.data)
            return

        rospy.loginfo("Setting streaming image quality to %u", msg.data)
        rospy.set_param("~streaming_image_quality", msg.data)
        self.publish_settings() # Make sure to always publish settings updates

    def __init__(self):
        rospy.init_node(self.NODE_NAME)
        rospy.loginfo("Starting " + self.NODE_NAME + " node")

        self.settings_pub = rospy.Publisher('~settings', RUISettings, queue_size=1, latch=True)
        self.settings_msg = RUISettings()
        self.publish_settings() # Do it once so that latch works on next connection

        rospy.Subscriber('~set_streaming_image_quality', UInt8, self.set_streaming_image_quality_cb)

        self.save_cfg_if = SaveCfgIF(updateParamsCallback=None, paramsModifiedCallback=None)

        rospy.spin()

if __name__ == '__main__':
  RUICfgMgr = RUICfgMgrNode()
