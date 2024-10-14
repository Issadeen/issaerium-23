import React from 'react';

export const Avatar: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`h-10 w-10 rounded-full overflow-hidden ${className}`}>
    {children}
  </div>
);

export const AvatarImage: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => (
  <img src={src} alt={alt} className="object-cover h-full w-full" />
);

export const AvatarFallback: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center justify-center bg-gray-600 text-white h-full w-full">
    {children}
  </div>
);
