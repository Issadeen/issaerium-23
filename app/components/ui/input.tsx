import React, { InputHTMLAttributes, forwardRef } from 'react';
import classNames from 'classnames';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={classNames(
        'px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;