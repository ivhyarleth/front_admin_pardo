import { cn } from '../../lib/utils';

const Table = ({ className, ...props }) => {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
};

const TableHeader = ({ className, ...props }) => {
  return (
    <thead className={cn('[&_tr]:border-b', className)} {...props} />
  );
};

const TableBody = ({ className, ...props }) => {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  );
};

const TableRow = ({ className, ...props }) => {
  return (
    <tr className={cn('border-b transition-colors hover:bg-gray-50', className)} {...props} />
  );
};

const TableHead = ({ className, ...props }) => {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-spartan font-bold text-pardos-dark [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
};

const TableCell = ({ className, ...props }) => {
  return (
    <td className={cn('p-4 align-middle font-lato text-pardos-dark [&:has([role=checkbox])]:pr-0', className)} {...props} />
  );
};

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };

