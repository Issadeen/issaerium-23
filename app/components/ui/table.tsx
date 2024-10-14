// components/ui/table.tsx

import React from 'react';

export const Table = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <table className={`min-w-full divide-y divide-gray-700 ${className}`}>
        {children}
    </table>
);

export const TableHeader = ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-gray-800">
        {children}
    </thead>
);

export const TableBody = ({ children }: { children: React.ReactNode }) => (
    <tbody className="bg-gray-800 divide-y divide-gray-700">
        {children}
    </tbody>
);

export const TableRow = ({ children }: { children: React.ReactNode }) => (
    <tr>
        {children}
    </tr>
);

export const TableHead = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${className}`}>
        {children}
    </th>
);

export const TableCell = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
        {children}
    </td>
);