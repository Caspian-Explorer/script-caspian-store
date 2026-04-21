'use client';

import { useEffect, useState } from 'react';
import type { PageContent, ShippingMethod } from '../../types';
import { listShippingMethods } from '../../services/shipping-method-service';
import { getPageContent } from '../../services/page-content-service';
import { useCaspianFirebase } from '../../provider/caspian-store-provider';
import { useFormatCurrency, useT } from '../../i18n/locale-context';
import { Skeleton } from '../../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../../ui/table';
import { cn } from '../../utils/cn';

export interface ShippingReturnsPageProps {
  title?: string;
  subtitle?: string;
  /** PageContent doc id used for the returns copy. Default: `shipping-returns`. */
  returnsPageKey?: string;
  currency?: string;
  className?: string;
}

export function ShippingReturnsPage({
  title,
  subtitle,
  returnsPageKey = 'shipping-returns',
  currency = 'USD',
  className,
}: ShippingReturnsPageProps) {
  const { db } = useCaspianFirebase();
  const t = useT();
  const priceFmt = useFormatCurrency(currency);
  const [methods, setMethods] = useState<ShippingMethod[] | null>(null);
  const [returnsContent, setReturnsContent] = useState<PageContent | null>(null);
  const [loadingReturns, setLoadingReturns] = useState(true);

  useEffect(() => {
    let alive = true;
    listShippingMethods(db, { onlyActive: true })
      .then((list) => {
        if (alive) setMethods(list);
      })
      .catch((error) => {
        console.error('[caspian-store] Failed to load shipping methods:', error);
        if (alive) setMethods([]);
      });
    getPageContent(db, returnsPageKey)
      .then((c) => {
        if (alive) setReturnsContent(c);
      })
      .catch((error) => {
        console.error('[caspian-store] Failed to load returns content:', error);
      })
      .finally(() => {
        if (alive) setLoadingReturns(false);
      });
    return () => {
      alive = false;
    };
  }, [db, returnsPageKey]);

  return (
    <main className={cn('caspian-shipping-returns', className)} style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1
            style={{
              fontFamily: 'var(--caspian-font-headline, inherit)',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {title ?? t('shipping.title')}
          </h1>
          <p style={{ color: '#666', marginTop: 12, fontSize: 15 }}>
            {subtitle ?? t('shipping.subtitle')}
          </p>
        </header>

        <section style={{ marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: 'var(--caspian-font-headline, inherit)',
              fontSize: 20,
              fontWeight: 600,
              margin: 0,
              marginBottom: 12,
            }}
          >
            {t('shipping.methods.title')}
          </h2>

          {methods === null ? (
            <Skeleton style={{ height: 160 }} />
          ) : methods.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14 }}>No shipping methods configured yet.</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Method</TH>
                  <TH>Estimated delivery</TH>
                  <TH style={{ textAlign: 'right' }}>Cost</TH>
                </TR>
              </THead>
              <TBody>
                {methods.map((m) => (
                  <TR key={m.id}>
                    <TD style={{ fontWeight: 500 }}>{m.name}</TD>
                    <TD style={{ color: '#666' }}>
                      {m.estimatedDays?.min === m.estimatedDays?.max
                        ? `${m.estimatedDays?.min} business days`
                        : `${m.estimatedDays?.min}–${m.estimatedDays?.max} business days`}
                    </TD>
                    <TD style={{ textAlign: 'right', fontWeight: 600 }}>
                      {m.price > 0 ? priceFmt.format(m.price) : 'Free'}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </section>

        {loadingReturns ? null : returnsContent ? (
          <section>
            {returnsContent.title && (
              <h2
                style={{
                  fontFamily: 'var(--caspian-font-headline, inherit)',
                  fontSize: 20,
                  fontWeight: 600,
                  margin: 0,
                  marginBottom: 12,
                }}
              >
                {returnsContent.title}
              </h2>
            )}
            {returnsContent.subtitle && (
              <p style={{ color: '#666', marginBottom: 16 }}>{returnsContent.subtitle}</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15, lineHeight: 1.7, color: '#333' }}>
              {(returnsContent.content ?? '')
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i} style={{ margin: 0 }}>
                    {p}
                  </p>
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
