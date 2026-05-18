import React from 'react';
import { cn } from '../../lib/utils';

const StatCard = ({ label, value, hint, icon: Icon, accent = "default" }) => {
  return (
    <div className="group relative p-6 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
          {hint && <p className="text-xs font-medium opacity-75 mt-1">{hint}</p>}
        </div>
        <div className={cn("p-3 rounded-lg bg-muted/50 group-hover:bg-muted/75 transition-colors", `text-${accent}`)}>
          {Icon && <Icon className="h-6 w-6" />}
        </div>
      </div>
    </div>
  );
};

export { StatCard };

