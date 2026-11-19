/*
#
# Copyright (c) 2026 Numurus <https://www.numurus.com>.
#
# This file is part of nepi rui (nepi_rui) repo
# (see https://github.com/nepi-engine/nepi_rui)
#
# License: NEPI RUI repo source-code and NEPI Images that use this source-code
# are licensed under the "Numurus Software License",
# which can be found at: <https://numurus.com/wp-content/uploads/Numurus-Software-License-Terms.pdf>
#
# Redistributions in source code must retain this top-level comment block.
# Plagiarizing this software to sidestep the license obligations is illegal.
#
# Contact Information:
# ====================
# - mailto:nepi@numurus.com
#
 */

// background.js
import React from 'react';
import backgroundImage from './assets/background.jpg'; // Import the image

function Background() {
  const pageStyle = {
    backgroundImage: `url(${backgroundImage})`, // Use the imported image URL
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    backgroundSize: 'cover',
    height: '100vh',
    margin: 0,
    padding: 0,
  };

  return (
    <div style={pageStyle}>
      {/* Your page content goes here
      <h1>Welcome!</h1> */}
    </div>
  );
}

export default Background;
