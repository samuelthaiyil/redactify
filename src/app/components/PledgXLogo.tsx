'use client';

import React from 'react';

interface PledgXLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

const PledgXLogo: React.FC<PledgXLogoProps> = ({ 
  width = 120, 
  height = 40, 
  className = '' 
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* PledgX Logo Design */}
      <defs>
        <linearGradient id="pledgx-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF6D1D" />
          <stop offset="100%" stopColor="#FF8C42" />
        </linearGradient>
      </defs>
      
      {/* P */}
      <path
        d="M8 8h8c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4v8h-4V8zm4 6h4c.6 0 1-.4 1-1s-.4-1-1-1h-4v2z"
        fill="url(#pledgx-gradient)"
      />
      
      {/* l */}
      <path
        d="M24 8h4v20h-4V8z"
        fill="url(#pledgx-gradient)"
      />
      
      {/* e */}
      <path
        d="M32 8h8c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4v4h4c.6 0 1 .4 1 1s-.4 1-1 1h-8c-2.2 0-4-1.8-4-4V12c0-2.2 1.8-4 4-4zm0 6h4c.6 0 1-.4 1-1s-.4-1-1-1h-4v2z"
        fill="url(#pledgx-gradient)"
      />
      
      {/* d */}
      <path
        d="M48 8h4v8c0 2.2 1.8 4 4 4s4-1.8 4-4V8h4v8c0 4.4-3.6 8-8 8s-8-3.6-8-8V8z"
        fill="url(#pledgx-gradient)"
      />
      
      {/* g */}
      <path
        d="M68 8h8c2.2 0 4 1.8 4 4v8c0 2.2-1.8 4-4 4h-4v4c0 .6-.4 1-1 1s-1-.4-1-1V8zm4 6h4c.6 0 1-.4 1-1s-.4-1-1-1h-4v2z"
        fill="url(#pledgx-gradient)"
      />
      
      {/* X */}
      <g fill="url(#pledgx-gradient)">
        <path d="M88 8l4 4 4-4h4l-6 6 6 6h-4l-4-4-4 4h-4l6-6-6-6h4z" />
      </g>
    </svg>
  );
};

export default PledgXLogo;
