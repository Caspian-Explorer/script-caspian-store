'use client';

import { useCaspianLink } from '../../provider/caspian-store-provider';
import {
  useAdminNotifications,
  type AdminNotification,
  type AdminNotificationKind,
  type UseAdminNotificationsOptions,
} from '../../hooks/use-admin-notifications';
import { Button } from '../../ui/button';
import { RefreshIcon } from '../../ui/icons';
import { Badge, Skeleton } from '../../ui/misc';
import { DashboardSection } from './dashboard-section';

const KIND_LABEL: Record<AdminNotificationKind, string> = {
  'update-available': 'Update',
  'pending-reviews': 'Moderation',
  'pending-questions': 'Moderation',
  'new-contacts': 'Inbox',
};

export interface DashboardNotificationsSectionProps extends UseAdminNotificationsOptions {
  className?: string;
}

export function DashboardNotificationsSection(options: DashboardNotificationsSectionProps) {
  const { notifications, loading, refresh, unreadCount } = useAdminNotifications(options);

  return (
    <DashboardSection
      title="Notifications"
      subtitle="Live signals from your store and this library. Clear automatically when resolved."
      count={unreadCount}
      defaultOpen={unreadCount > 0}
      anchorId="notifications"
      action={
        <Button variant="outline" size="sm" onClick={refresh} loading={loading}>
          <RefreshIcon size={14} /> Refresh
        </Button>
      }
    >
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
      )}
    </DashboardSection>
  );
}

function NotificationCard({ notification }: { notification: AdminNotification }) {
  const Link = useCaspianLink();
  const inner = (
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
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{notification.description}</div>
        )}
      </div>
      {notification.createdAt && (
        <div style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
          {formatRelative(notification.createdAt)}
        </div>
      )}
    </div>
  );
  return (
    <li>{notification.href ? <Link href={notification.href}>{inner}</Link> : inner}</li>
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
