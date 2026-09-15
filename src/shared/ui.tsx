import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ArrowLeft, Calculator, Dumbbell, Info, LayoutDashboard, ListOrdered, Menu, Settings2, TrendingUp, X } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router';
import { AREA_LABELS, GOAL_LABELS, type Area, type Profile } from '../domain';

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="brand-mark">F</div>
      <p>Loading your space…</p>
    </div>
  );
}

export function AppShell({ profile }: { profile: Profile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 720px)').matches === true);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(max-width: 720px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useDialogFocus(menuOpen && isMobile, sidebarRef, closeMenu);

  return (
    <div className="app-shell">
      <aside ref={sidebarRef} id="primary-navigation" className={`sidebar ${menuOpen ? 'open' : ''}`} role={isMobile && menuOpen ? 'dialog' : undefined} aria-modal={isMobile && menuOpen ? true : undefined} aria-label={isMobile && menuOpen ? 'Primary navigation' : undefined} aria-hidden={isMobile && !menuOpen ? true : undefined} inert={isMobile && !menuOpen ? true : undefined}>
        <div className="sidebar-top">
          <Link to="/" className="brand"><span className="brand-mark">F</span><span>fitnessPal</span></Link>
          <button className="icon-button mobile-menu-close" onClick={closeMenu} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <p className="eyebrow side-label">Your personal fitness space</p>
        <nav className="primary-nav" aria-label="Primary navigation">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Today" onClick={closeMenu} />
          <NavItem to="/plans" icon={<Dumbbell size={18} />} label="Workout plans" onClick={closeMenu} />
          <NavItem to="/progress" icon={<TrendingUp size={18} />} label="Progress" onClick={closeMenu} />
          <NavItem to="/exercise-order" icon={<ListOrdered size={18} />} label="Exercise order" onClick={closeMenu} />
          <NavItem to="/about" icon={<Info size={18} />} label="How it works" onClick={closeMenu} />
          <NavItem to="/calculate" icon={<Calculator size={18} />} label="Calculator" onClick={closeMenu} />
        </nav>
        <div className="sidebar-bottom">
          <NavItem to="/profile" icon={<Settings2 size={18} />} label="Profile settings" onClick={closeMenu} />
          <div className="profile-mini">
            <span className="avatar">{profile.name.charAt(0).toUpperCase()}</span>
            <span><strong>{profile.name}</strong><small>{GOAL_LABELS[profile.primaryGoal]}</small></span>
          </div>
        </div>
      </aside>
      {menuOpen && <button className="sidebar-scrim" onClick={closeMenu} aria-label="Close navigation" />}
      <main className="main-content">
        <header className="mobile-header">
          <Link to="/" className="brand"><span className="brand-mark">F</span><span>fitnessPal</span></Link>
          <button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation" aria-expanded={menuOpen} aria-controls="primary-navigation"><Menu size={20} /></button>
        </header>
        <div className="content-wrap"><Outlet /></div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, onClick }: { to: string; icon: ReactNode; label: string; onClick: () => void }) {
  return <NavLink to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span></NavLink>;
}

interface PageProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
  backTo?: string;
  children: ReactNode;
}

export function Page({ title, subtitle, action, backTo, children }: PageProps) {
  const eyebrow = backTo ? 'Workout space' : 'Good to see you';
  return (
    <div className="page">
      <div className="page-header">
        {backTo && <Link className="back-link" to={backTo}><ArrowLeft size={16} /> Back</Link>}
        <div className="page-header-row">
          <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div>
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(open: boolean, containerRef: RefObject<HTMLElement | null>, onRequestClose?: () => void) {
  const closeRef = useRef(onRequestClose);
  closeRef.current = onRequestClose;
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;
    const container = containerRef.current;
    const previousOverflow = document.body.style.overflow;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';

    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const focusFirst = () => (container.querySelector<HTMLElement>('[autofocus]') ?? getFocusable()[0] ?? container).focus();
    const focusLast = () => {
      const focusable = getFocusable();
      (focusable[focusable.length - 1] ?? container).focus();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeRef.current) {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length || !container.contains(document.activeElement)) {
        event.preventDefault();
        if (event.shiftKey) focusLast();
        else focusFirst();
        return;
      }
      if (event.shiftKey && document.activeElement === focusable[0]) {
        event.preventDefault();
        focusLast();
      } else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) {
        event.preventDefault();
        focusFirst();
      }
    };

    focusFirst();
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (restoreFocusRef.current?.isConnected) restoreFocusRef.current.focus();
    };
  }, [containerRef, open]);
}

export function Modal({ children, className, labelledBy, describedBy, label, onClose }: { children: ReactNode; className: string; labelledBy?: string; describedBy?: string; label?: string; onClose?: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(true, dialogRef, onClose);
  return <div ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy} aria-label={label} tabIndex={-1}>{children}</div>;
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
  large?: boolean;
  compact?: boolean;
}

export function EmptyState({ icon, title, body, action, large = false, compact = false }: EmptyStateProps) {
  const classes = ['empty-state', large && 'large', compact && 'compact'].filter(Boolean).join(' ');
  return <div className={classes}><span className="empty-icon">{icon}</span><h3>{title}</h3><p>{body}</p>{action}</div>;
}

interface FieldProps {
  label: string;
  suffix?: string;
  hint?: string;
  error?: string;
  validationTarget?: string;
  children: ReactNode;
}

export function Field({ label, suffix, hint, error, validationTarget, children }: FieldProps) {
  return <label className="field" data-validation-target={validationTarget}><span className="field-label">{label}{suffix && <em>{suffix}</em>}</span>{hint && <small className="field-hint">{hint}</small>}<span className="field-control">{children}</span>{error && <span className="form-error">{error}</span>}</label>;
}

export function Snackbar({ message, tone = 'success', onDismiss }: { message: string; tone?: 'success' | 'error'; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div
      className={`snackbar ${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <span>{message}</span>
      <button type="button" className="snackbar-dismiss" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  );
}

export function BodyGraphic({ area, compact = false }: { area: Area; compact?: boolean }) {
  const targetLabel = AREA_LABELS[area];
  const classes = `body-graphic ${compact ? 'compact' : ''}`;
  return (
    <div className={classes} role="img" aria-label={`${targetLabel} primary target area body graphic`}>
      <svg viewBox="0 0 180 240" aria-hidden="true">
        <title>{targetLabel} focus</title>
        <desc>Abstract body illustration with the {targetLabel.toLowerCase()} area highlighted.</desc>
        <circle className="body-head" cx="90" cy="24" r="14" />
        <BodyPart name="torso" area={area} highlightedAreas={['full-body', 'chest', 'back', 'core']} path="M67 49 Q90 39 113 49 L119 119 Q90 132 61 119 Z" />
        <BodyPart name="arm" area={area} highlightedAreas={['full-body', 'arms', 'shoulders']} path="M67 53 L43 66 L31 119 L45 123 L67 88 Z" />
        <BodyPart name="arm" area={area} highlightedAreas={['full-body', 'arms', 'shoulders']} path="M113 53 L137 66 L149 119 L135 123 L113 88 Z" />
        <BodyPart name="leg" area={area} highlightedAreas={['full-body', 'legs', 'glutes']} path="M64 116 L88 119 L83 190 L64 231 L48 228 L59 181 Z" />
        <BodyPart name="leg" area={area} highlightedAreas={['full-body', 'legs', 'glutes']} path="M116 116 L92 119 L97 190 L116 231 L132 228 L121 181 Z" />
        <BodyPart name="glute" area={area} highlightedAreas={['full-body', 'glutes']} path="M63 102 Q90 92 117 102 L116 128 Q90 139 64 128 Z" />
      </svg>
      <span className="body-caption">{targetLabel}</span>
    </div>
  );
}

function BodyPart({ name, area, highlightedAreas, path }: { name: string; area: Area; highlightedAreas: Area[]; path: string }) {
  const className = `body-part ${name} ${highlightedAreas.includes(area) ? 'highlight' : ''}`;
  return <path className={className} d={path} />;
}
