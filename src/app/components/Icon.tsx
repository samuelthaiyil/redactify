'use client';

import React from 'react';

interface IconProps {
  name: string; // Accept any Bootstrap Icon name (e.g., 'cloud-upload', 'trash', 'heart-fill', etc.)
  className?: string;
  size?: string | number; // Optional size prop for flexibility
}

const Icon: React.FC<IconProps> = ({ name, className = '', size = '1.25rem' }) => {
  // Ensure the name starts with 'bi-' prefix for Bootstrap Icons
  const iconClass = name.startsWith('bi-') ? name : `bi-${name}`;
  
  return (
    <i 
      className={`${iconClass} ${className}`} 
      style={{ fontSize: size }}
    ></i>
  );
};

export default Icon;
