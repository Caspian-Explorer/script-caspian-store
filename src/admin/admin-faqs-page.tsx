'use client';

import { useEffect, useState } from 'react';
import type { FaqItem } from '../types';
import { createFaq, deleteFaq, listFaqs, updateFaq, type FaqWriteInput } from '../services/faq-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input, Label, Textarea } from '../ui/input';
import { Select, type SelectOption } from '../ui/select';
import { Skeleton, Badge } from '../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { useToast } from '../ui/toast';

const emptyDraft: FaqWriteInput = {
  category: 'orders',
  question: '',
  answer: '',
  order: 0,
};

const DEFAULT_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'orders', label: 'Orders & Shipping' },
  { value: 'returns', label: 'Returns & Exchanges' },
  { value: 'products', label: 'Products & Sizing' },
  { value: 'account', label: 'Account & Payment' },
  { value: 'general', label: 'General' },
];

export interface AdminFaqsPageProps {
  categoryOptions?: SelectOption[];
  className?: string;
}

export function AdminFaqsPage({
  categoryOptions = DEFAULT_CATEGORY_OPTIONS,
  className,
}: AdminFaqsPageProps) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FaqItem[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FaqWriteInput>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setFaqs(await listFaqs(db));
    } catch (error) {
      console.error('[caspian-store] Failed to list FAQs:', error);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      order: (faqs?.length ?? 0) + 1,
    });
    setDialogOpen(true);
  };

  const openEdit = (faq: FaqItem) => {
    setEditingId(faq.id);
    setDraft({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!draft.question.trim() || !draft.answer.trim()) {
      toast({ title: 'Question and answer are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateFaq(db, editingId, draft);
        toast({ title: 'FAQ updated' });
      } else {
        await createFaq(db, draft);
        toast({ title: 'FAQ created' });
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      console.error('[caspian-store] FAQ save failed:', error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq: FaqItem) => {
    if (!confirm(`Delete: "${faq.question}"?`)) return;
    try {
      await deleteFaq(db, faq.id);
      setFaqs((prev) => (prev ? prev.filter((f) => f.id !== faq.id) : prev));
      toast({ title: 'FAQ deleted' });
    } catch (error) {
      console.error('[caspian-store] FAQ delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <div className={className}>
      <header
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>FAQs</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Manage the questions shown on the public FAQs page.
          </p>
        </div>
        <Button onClick={openCreate}>+ New FAQ</Button>
      </header>

      {faqs === null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ height: 48 }} />
          <Skeleton style={{ height: 48 }} />
        </div>
      ) : faqs.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>No FAQs yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Category</TH>
              <TH>Question</TH>
              <TH style={{ textAlign: 'right' }}>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {faqs.map((faq) => (
              <TR key={faq.id}>
                <TD style={{ fontFamily: 'monospace', fontSize: 13 }}>{faq.order}</TD>
                <TD>
                  <Badge variant="secondary">{faq.category || 'general'}</Badge>
                </TD>
                <TD style={{ fontWeight: 500 }}>{faq.question}</TD>
                <TD style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <Button variant="outline" size="sm" onClick={() => openEdit(faq)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(faq)}>
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? 'Edit FAQ' : 'New FAQ'}
        maxWidth={560}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>Category</Label>
            <Select
              options={categoryOptions}
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            />
          </div>
          <div>
            <Label>Question</Label>
            <Input
              value={draft.question}
              onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
            />
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea
              rows={5}
              value={draft.answer}
              onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))}
            />
          </div>
          <div>
            <Label>Display order</Label>
            <Input
              type="number"
              value={draft.order}
              onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) || 0 }))}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
