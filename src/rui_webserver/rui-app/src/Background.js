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
