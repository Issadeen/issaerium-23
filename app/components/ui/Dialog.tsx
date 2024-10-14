// components/ui/Dialog.tsx
import { ReactNode } from 'react';
import { Dialog as RadixDialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogOverlay, DialogPortal } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from './button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <RadixDialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 bg-black bg-opacity-50" />
      <DialogPortal>
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-gray-100 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {description && <DialogDescription className="mb-4">{description}</DialogDescription>}
          {children}
        </DialogContent>
      </DialogPortal>
    </RadixDialog>
  );
}

export { DialogTrigger };