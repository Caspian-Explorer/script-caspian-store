'use client';

import { useCaspianLink } from '../provider/caspian-store-provider';
import {
  useAdminNotifications,
  type AdminNotification,
  type AdminNotificationKind,
  type UseAdminNotificationsOptions,
} from '../hooks/use-admin-notifications';
import { Button } from '../ui/button';
import { RefreshIcon } from '../ui/icons';
import { Badge, Skeleton } from '../ui/misc';

export interface AdminNotificationsPageProps extends UseAdminNotificationsOptions {
  className?: string;
}

const KIND_LABEL: Record<AdminNotificationKind, string> = {
  'update-available': 'Update',
  'pending-reviews': 'Moderation',
  'pending-questions': 'Moderation',
};

export function AdminNotificationsPage({ className, ...options }: AdminNotificationsPageProps) {
  const { notifications, loading, refresh, unreadCount } = useAdminNotifications(options);

  return (
    <div className={className}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Notifications</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Live signals from your store and this library. Notifications clear automatically when
            resolved (upgrade installed, reviews approved).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} loading={loading}>
          <RefreshIcon size={14} /> Refresh
        </Button>
      </header>

      {loading && notifications.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 72 }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: '#888',
            border: '1px dashed #ddd',
            borderRadius: 8,
          }}
        >
          All clear — no pending notifications.
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>
            {unreadCount} active
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {notifications.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function NotificationCard({ notification }: { notification: AdminNotification }) {
  const Link = useCaspianLink();
  const Wrapper: 'div' | typeof Link = notification.href ? Link : 'div';
  const wrapperProps = notification.href ? { href: notification.href } : {};

  return (
    <li>
      <Wrapper {...(wrapperProps as { href: string })}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            border: '1px solid #eee',
            borderRadius: 'var(--caspian-radius, 8px)',
            background: '#fff',
            cursor: notification.href ? 'pointer' : 'default',
          }}
        >
          <Badge variant="outline">{KIND_LABEL[notification.kind] ?? notification.kind}</Badge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: '#111' }}>{notification.title}</div>
            {notification.description && (
              <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
                {notification.description}
              </div>
            )}
          </div>
          {notification.createdAt && (
            <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
              {formatRelative(notification.createdAt)}
            </div>
          )}
        </div>
      </Wrapper>
    </li>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return 'Today';
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 30 * day) return `${Math.floor(diff / day)} days ago`;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
