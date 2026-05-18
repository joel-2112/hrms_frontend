import React from 'react';
import { Button } from '../ui/button';
import { ChevronLeft } from 'lucide-react';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div className="mb-4 space-y-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-xl text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;

