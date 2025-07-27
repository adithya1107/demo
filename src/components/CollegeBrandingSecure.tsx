
import React, { useMemo } from 'react';
import { sanitizeCSS } from '@/utils/security';

interface CollegeBrandingSecureProps {
  primaryColor?: string;
  secondaryColor?: string;
  collegeName?: string;
  logo?: string;
  children?: React.ReactNode;
}

const CollegeBrandingSecure = ({
  primaryColor = '#1e40af',
  secondaryColor = '#3b82f6',
  collegeName = 'College',
  logo,
  children
}: CollegeBrandingSecureProps) => {
  // Sanitize colors to prevent XSS through CSS injection
  const sanitizedPrimaryColor = useMemo(() => sanitizeCSS(primaryColor), [primaryColor]);
  const sanitizedSecondaryColor = useMemo(() => sanitizeCSS(secondaryColor), [secondaryColor]);

  // Create CSS custom properties securely
  const cssVariables = useMemo(() => ({
    '--college-primary': sanitizedPrimaryColor,
    '--college-secondary': sanitizedSecondaryColor,
  }), [sanitizedPrimaryColor, sanitizedSecondaryColor]);

  return (
    <div 
      className="college-branding-wrapper"
      style={cssVariables}
      data-college={collegeName}
    >
      <style>
        {`
          .college-branding-wrapper {
            --primary: ${sanitizedPrimaryColor};
            --secondary: ${sanitizedSecondaryColor};
          }
          .college-branding-wrapper .btn-primary {
            background-color: var(--primary);
            border-color: var(--primary);
          }
          .college-branding-wrapper .btn-secondary {
            background-color: var(--secondary);
            border-color: var(--secondary);
          }
          .college-branding-wrapper .text-primary {
            color: var(--primary);
          }
          .college-branding-wrapper .text-secondary {
            color: var(--secondary);
          }
          .college-branding-wrapper .border-primary {
            border-color: var(--primary);
          }
          .college-branding-wrapper .bg-primary {
            background-color: var(--primary);
          }
          .college-branding-wrapper .bg-secondary {
            background-color: var(--secondary);
          }
        `}
      </style>
      {logo && (
        <div className="college-logo mb-4 flex justify-center">
          <img 
            src={logo} 
            alt={`${collegeName} Logo`}
            className="max-h-16 w-auto"
            loading="lazy"
            onError={(e) => {
              // Hide broken images
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
};

export default CollegeBrandingSecure;
