'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SearchTerm } from '../../types';
import {
  clearAllSearchTerms,
  deleteSearchTerm,
  listSearchTerms,
  type SearchTermSortBy,
} from '../../services/search-term-service';
import { useCaspianFirebase } from '../../provider/caspian-store-provider';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';
import { Skeleton } from '../../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../../ui/table';
import { useToast } from '../../ui/toast';
import { DashboardSection } from './dashboard-section';

export function DashboardSearchTermsSection() {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [terms, setTerms] = useState<SearchTerm[] | null>(null);
  const [sortBy, setSortBy] = useState<SearchTermSortBy>('count');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    try {
      setTerms(await listSearchTerms(db, { sortBy }));
    } catch (error) {
      console.error('[caspian-store] Failed to load search terms:', error);
      toast({ title: 'Failed to load search terms', variant: 'destructive' });
    }
  }, [db, sortBy, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = (terms ?? []).filter((t) =>
    search ? t.term.toLowerCase().includes(search.toLowerCase()) : true,
  );
  const visible = showAll ? filtered : filtered.slice(0, 10);
  const hasMore = filtered.length > 10 && !showAll;
  const totalSearches = (terms ?? []).reduce((sum, t) => sum + t.count, 0);

  const handleDelete = async (t: SearchTerm) => {
    if (!confirm(`Delete "${t.term}" from search analytics? This cannot be undone.`)) return;
    try {
      await deleteSearchTerm(db, t.id);
      setTerms((prev) => (prev ? prev.filter((x) => x.id !== t.id) : prev));
      toast({ title: 'Search term removed' });
    } catch (error) {
      console.error('[caspian-store] Delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleClearAll = async () => {
    if (!terms?.length) return;
    if (!confirm(`Delete all ${terms.length} search terms? This cannot be undone.`)) return;
    setClearing(true);
    try {
      const removed = await clearAllSearchTerms(db);
      setTerms([]);
      toast({ title: `Removed ${removed} search terms` });
    } catch (error) {
      console.error('[caspian-store] Clear all failed:', error);
      toast({ title: 'Clear failed', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <DashboardSection
      title="Search terms"
      subtitle={
        terms === null
          ? undefined
          : `${terms.length} unique · ${totalSearches} total search${totalSearches === 1 ? '' : 'es'}`
      }
      count={terms?.length}
      defaultOpen={false}
      anchorId="search-terms"
      action={
        <Button
          variant="destructive"
          size="sm"
          onClick={handleClearAll}
          disabled={!terms?.length || clearing}
          loading={clearing}
        >
          Clear all
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <Input
          placeholder="Search in terms…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, flex: 1 }}
        />
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SearchTermSortBy)}
          options={[
            { value: 'count', label: 'Most searched' },
            { value: 'lastSearchedAt', label: 'Most recent' },
          ]}
          style={{ width: 180 }}
        />
      </div>

      {terms === null ? (
        <Skeleton style={{ height: 120 }} />
      ) : filtered.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>
          {terms.length === 0
            ? 'No customer searches yet. Terms will appear here once shoppers start searching.'
            : 'No terms match your filter.'}
        </p>
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Term</TH>
                <TH style={{ textAlign: 'right', width: 100 }}>Searches</TH>
                <TH style={{ width: 200 }}>Last searched</TH>
                <TH style={{ width: 200 }}>First searched</TH>
                <TH style={{ textAlign: 'right', width: 120 }}>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {visible.map((t) => (
                <TR key={t.id}>
                  <TD style={{ fontWeight: 500 }}>{t.term}</TD>
                  <TD style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {t.count.toLocaleString()}
                  </TD>
                  <TD style={{ color: '#888', fontSize: 13 }}>
                    {t.lastSearchedAt?.toDate ? t.lastSearchedAt.toDate().toLocaleString() : '—'}
                  </TD>
                  <TD style={{ color: '#888', fontSize: 13 }}>
                    {t.firstSearchedAt?.toDate ? t.firstSearchedAt.toDate().toLocaleString() : '—'}
                  </TD>
                  <TD style={{ textAlign: 'right' }}>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(t)}>
                      Delete
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {hasMore && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
                Show all {filtered.length} terms
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardSection>
  );
}
