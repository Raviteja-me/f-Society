import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface LinkProps {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  text: string;
  path: string;
  onClick?: () => void;
}

export function Link({ Icon, text, path, onClick }: LinkProps) {
  return (
    <RouterLink to={path} className="group flex items-center space-x-2 py-2 px-4 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-800 w-full" onClick={onClick}>
      <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors" />
      <span className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-500 transition-colors">{text}</span>
    </RouterLink>
  );
}
