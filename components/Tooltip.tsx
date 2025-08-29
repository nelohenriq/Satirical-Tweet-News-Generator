import React, { useState, useRef, useEffect } from 'react';
import { InfoIcon } from './icons';

interface TooltipProps {
  text: string;
  // FIX: Made children optional to allow the component to be used without wrapping another element, in which case it will render a default InfoIcon.
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  useEffect(() => {
    const triggerElement = triggerRef.current;
    if (triggerElement) {
      triggerElement.addEventListener('mouseenter', showTooltip);
      triggerElement.addEventListener('mouseleave', hideTooltip);
      triggerElement.addEventListener('focus', showTooltip, true);
      triggerElement.addEventListener('blur', hideTooltip, true);
    }
    return () => {
      if (triggerElement) {
        triggerElement.removeEventListener('mouseenter', showTooltip);
        triggerElement.removeEventListener('mouseleave', hideTooltip);
        triggerElement.removeEventListener('focus', showTooltip, true);
        triggerElement.removeEventListener('blur', hideTooltip, true);
      }
    };
  }, []);

  return (
    <div className="relative inline-flex items-center">
      <div ref={triggerRef} tabIndex={0} className="flex items-center focus:outline-none">
        {children || <InfoIcon className="h-4 w-4 text-light-text-secondary dark:text-text-secondary cursor-pointer" />}
      </div>
      {isVisible && (
        <div 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-text-primary dark:text-light-bg bg-gray-dark dark:bg-light-text-primary rounded-md shadow-lg z-10 transition-opacity"
          role="tooltip"
        >
          {text}
        </div>
      )}
    </div>
  );
};
