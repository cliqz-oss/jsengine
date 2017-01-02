#!/bin/bash
set -e

# Create the kvm node (required --privileged)
if [ ! -e /dev/kvm ]; then
   mknod /dev/kvm c 10 232
fi
