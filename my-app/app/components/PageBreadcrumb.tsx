import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  crumbs: Crumb[];
  /** Optional quick-nav links shown as pills on the right */
  actions?: { label: string; href: string; icon?: string }[];
}

export default function PageBreadcrumb({ crumbs, actions }: PageBreadcrumbProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm mb-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant flex-wrap">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href ?? crumb.label} className="flex items-center gap-1">
            {i > 0 && (
              <span className="material-symbols-outlined text-[13px] text-outline-variant">chevron_right</span>
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="hover:text-primary transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-primary font-semibold">{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* Optional action pills */}
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant/40 shadow-sm font-label-ui text-label-ui text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all text-[12px]"
            >
              {action.icon && (
                <span className="material-symbols-outlined text-[14px]">{action.icon}</span>
              )}
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
