import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <path d="M4 21V10.0833C4 9.53102 4.44772 9.08331 5 9.08331H19C19.5523 9.08331 20 9.53102 20 10.0833V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 21V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 21V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 7L12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    <span className="ml-2 text-xl font-bold text-foreground">HotelZenith</span>
  </div>
);

export default Logo;
