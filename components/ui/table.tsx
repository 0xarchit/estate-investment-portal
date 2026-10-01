import React from "react";

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement>
>(({ className = "", ...props }, ref) => (
  <div className="table-wrap">
    <table ref={ref} className={className} {...props} />
  </div>
));
Table.displayName = "Table";
export const TableHeader = (
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) => <thead {...props} />;
export const TableBody = (
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) => <tbody {...props} />;
export const TableFooter = (
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) => <tfoot {...props} />;
export const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr {...props} />
);
export const TableHead = (
  props: React.ThHTMLAttributes<HTMLTableCellElement>,
) => <th scope="col" {...props} />;
export const TableCell = (
  props: React.TdHTMLAttributes<HTMLTableCellElement>,
) => <td {...props} />;
export const TableCaption = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) => (
  <caption
    className={`p-4 text-sm text-muted-foreground ${className}`}
    {...props}
  />
);
