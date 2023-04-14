#!/bin/bash

if [[ -z "${NEPI_SSH_KEY}" ]]; then
  echo "No NEPI_SSH_KEY environment variable... will use the default key path"
  NEPI_SSH_KEY="~/.ssh/numurus/nepi_default_ssh_key_ed25519"
fi

if [[ -z "${NEPI_TARGET_IP}" ]]; then
  echo "No NEPI_TARGET_IP environment variable... will use the default IP"
  NEPI_TARGET_IP="192.168.179.103"
fi

# Also generate the top-level version
git describe --dirty > ./etc/nepi_rui_fw_version.txt

# And copy RUI front-end source code to the /opt/numurus/ros/share folder, since that is where it is built
rsync -avzhe "ssh -i ${NEPI_SSH_KEY}" --exclude .git* --exclude build_* --exclude devel_* --exclude logs_* --exclude install_* ../nepi_rui/ nepi@${NEPI_TARGET_IP}:/opt/nepi/nepi_rui
