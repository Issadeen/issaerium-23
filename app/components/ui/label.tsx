// components/ui/label.tsx
import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label: React.FC<LabelProps> = ({ children, ...props }) => {
  return (
    <label {...props} className={`block text-sm font-medium text-gray-400 ${props.className}`}>
      {children}
    </label>
  );
};