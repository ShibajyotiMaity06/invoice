import Link from 'next/link';
import { FileText } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <FileText className="h-5 w-5 text-primary-foreground" />
      </div>
      {showText && (
        <span className="text-xl font-bold">Invoicely</span>
      )}
    </Link>
  );
}