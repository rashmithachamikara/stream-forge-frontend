'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { apiClient } from '@/shared/lib/api';
import {
  Category,
  CreateCategoryRequest,
  CreateTagRequest,
  TagSummary,
  UpdateCategoryRequest,
  UpdateTagRequest,
} from '@/features/videos/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/shared/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Folder,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Video,
} from 'lucide-react';

const TAG_PAGE_SIZE = 12;
const NO_PARENT_VALUE = '__none__';

type NoticeState = {
  type: 'success' | 'error';
  message: string;
} | null;

type CategoryFormState = {
  name: string;
  description: string;
  parentCategoryId: string;
};

type TagFormState = {
  name: string;
};

type CategoryTreeRow = {
  category: Category;
  depth: number;
  siblingIndex: number;
  siblingCount: number;
};

const createEmptyCategoryForm = (): CategoryFormState => ({
  name: '',
  description: '',
  parentCategoryId: NO_PARENT_VALUE,
});

const createCategoryFormFromItem = (category: Category): CategoryFormState => ({
  name: category.name,
  description: category.description,
  parentCategoryId: category.parentCategoryId ?? NO_PARENT_VALUE,
});

const createEmptyTagForm = (): TagFormState => ({
  name: '',
});

const createTagFormFromItem = (tag: TagSummary): TagFormState => ({
  name: tag.name,
});

const renderNotice = (notice: NoticeState) => {
  if (!notice) {
    return null;
  }

  const tone =
    notice.type === 'error'
      ? 'border-destructive/20 bg-destructive/5 text-destructive'
      : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400';

  return (
    <div className={cn('border rounded-md px-3 py-2 text-xs', tone)}>
      {notice.message}
    </div>
  );
};

export default function TaxonomyManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoryNotice, setCategoryNotice] = useState<NoticeState>(null);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [createCategoryForm, setCreateCategoryForm] = useState<CategoryFormState>(createEmptyCategoryForm);
  const [editCategoryForm, setEditCategoryForm] = useState<CategoryFormState>(createEmptyCategoryForm);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderDraftCategories, setOrderDraftCategories] = useState<Category[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [tags, setTags] = useState<TagSummary[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [tagPage, setTagPage] = useState(1);
  const [tagPageCount, setTagPageCount] = useState(0);
  const [tagTotalCount, setTagTotalCount] = useState(0);
  const [isTagsLoading, setIsTagsLoading] = useState(true);
  const [tagNotice, setTagNotice] = useState<NoticeState>(null);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagSummary | null>(null);
  const [tagForm, setTagForm] = useState<TagFormState>(createEmptyTagForm);
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagSummary | null>(null);
  const [isDeletingTag, setIsDeletingTag] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)),
    [categories]
  );


  const availableParentOptions = useMemo(
    () => sortedCategories.filter((category) => category.id !== editingCategory?.id),
    [editingCategory?.id, sortedCategories]
  );

  const buildCategoryTreeRows = (inputCategories: Category[]) => {
    const normalizedCategories = [...inputCategories].sort(
      (left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)
    );
    const childrenByParent = new Map<string | null, Category[]>();

    normalizedCategories.forEach((category) => {
      const key = category.parentCategoryId ?? null;
      const siblings = childrenByParent.get(key) ?? [];
      siblings.push(category);
      childrenByParent.set(key, siblings);
    });

    const rows: CategoryTreeRow[] = [];

    const visit = (parentCategoryId: string | null, depth: number) => {
      const siblings = childrenByParent.get(parentCategoryId) ?? [];

      siblings.forEach((category, siblingIndex) => {
        rows.push({
          category,
          depth,
          siblingIndex,
          siblingCount: siblings.length,
        });

        visit(category.id, depth + 1);
      });
    };

    visit(null, 0);

    return rows;
  };

  const categoryTreeRows = useMemo(() => buildCategoryTreeRows(sortedCategories), [sortedCategories]);
  const orderDraftRows = useMemo(() => buildCategoryTreeRows(orderDraftCategories), [orderDraftCategories]);

  const loadCategories = useCallback(async () => {
    setIsCategoriesLoading(true);

    const response = await apiClient.getCategories();

    if (response.success && response.data) {
      setCategories(response.data);
    } else {
      setCategories([]);
      setCategoryNotice({ type: 'error', message: response.error ?? 'Failed to load categories.' });
    }

    setIsCategoriesLoading(false);
  }, []);

  const loadTags = useCallback(async () => {
    setIsTagsLoading(true);

    const response = await apiClient.getTags(tagSearch.trim() || undefined, tagPage, TAG_PAGE_SIZE);

    if (response.success && response.data) {
      setTags(response.data.items);
      setTagPageCount(response.data.totalPages);
      setTagTotalCount(response.data.totalCount);
    } else {
      setTags([]);
      setTagPageCount(0);
      setTagTotalCount(0);
      setTagNotice({ type: 'error', message: response.error ?? 'Failed to load tags.' });
    }

    setIsTagsLoading(false);
  }, [tagPage, tagSearch]);

  useEffect(() => {
    const run = async () => {
      await loadCategories();
    };

    void run();
  }, [loadCategories]);

  useEffect(() => {
    const run = async () => {
      await loadTags();
    };

    void run();
  }, [loadTags]);

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryForm(createCategoryFormFromItem(category));
    setCategoryNotice(null);
    setIsCategoryDialogOpen(true);
  };

  const openCreateTagDialog = () => {
    setEditingTag(null);
    setTagForm(createEmptyTagForm());
    setTagNotice(null);
    setIsTagDialogOpen(true);
  };

  const openEditTagDialog = (tag: TagSummary) => {
    setEditingTag(tag);
    setTagForm(createTagFormFromItem(tag));
    setTagNotice(null);
    setIsTagDialogOpen(true);
  };

  const submitCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = createCategoryForm.name.trim();
    const trimmedDescription = createCategoryForm.description.trim();

    if (!trimmedName) {
      setCategoryNotice({ type: 'error', message: 'Category name is required.' });
      return;
    }

    setIsSavingCategory(true);
    setCategoryNotice(null);

    const parentCategoryId =
      createCategoryForm.parentCategoryId !== NO_PARENT_VALUE ? createCategoryForm.parentCategoryId : null;

    const siblingCategories = categories.filter(
      (category) => (category.parentCategoryId ?? null) === parentCategoryId
    );
    const nextDisplayOrder =
      siblingCategories.length > 0
        ? Math.max(...siblingCategories.map((category) => category.displayOrder)) + 1
        : 0;

    const payload: CreateCategoryRequest = {
      name: trimmedName,
      description: trimmedDescription || undefined,
      parentCategoryId: parentCategoryId ?? undefined,
      displayOrder: nextDisplayOrder,
    };

    const response = await apiClient.createCategory(payload);

    if (response.success) {
      await loadCategories();
      setCreateCategoryForm(createEmptyCategoryForm());
      setCategoryNotice({
        type: 'success',
        message: 'Category created.',
      });
    } else {
      setCategoryNotice({ type: 'error', message: response.error ?? 'Failed to create category.' });
    }

    setIsSavingCategory(false);
  };

  const submitEditCategory = async () => {
    if (!editingCategory) return;
    const trimmedName = editCategoryForm.name.trim();
    const trimmedDescription = editCategoryForm.description.trim();

    if (!trimmedName) {
      setCategoryNotice({ type: 'error', message: 'Category name is required.' });
      return;
    }

    setIsSavingCategory(true);
    setCategoryNotice(null);

    const parentCategoryId =
      editCategoryForm.parentCategoryId !== NO_PARENT_VALUE ? editCategoryForm.parentCategoryId : null;

    const payload: UpdateCategoryRequest = {
      name: trimmedName,
    };

    if (trimmedDescription) {
      payload.description = trimmedDescription;
    } else if (editingCategory.description) {
      payload.clearDescription = true;
    }

    if (parentCategoryId) {
      payload.parentCategoryId = parentCategoryId;
    } else if (editingCategory.parentCategoryId) {
      payload.clearParentCategory = true;
    }

    const response = await apiClient.updateCategory(editingCategory.id, payload);

    if (response.success) {
      await loadCategories();
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setEditCategoryForm(createEmptyCategoryForm());
      setCategoryNotice({
        type: 'success',
        message: 'Category updated.',
      });
    } else {
      setCategoryNotice({ type: 'error', message: response.error ?? 'Failed to save category.' });
    }

    setIsSavingCategory(false);
  };

  const submitTag = async () => {
    const trimmedName = tagForm.name.trim();

    if (!trimmedName) {
      setTagNotice({ type: 'error', message: 'Tag name is required.' });
      return;
    }

    setIsSavingTag(true);
    setTagNotice(null);

    let response;

    if (editingTag) {
      const payload: UpdateTagRequest = { name: trimmedName };
      response = await apiClient.updateTag(editingTag.id, payload);
    } else {
      const payload: CreateTagRequest = { name: trimmedName };
      response = await apiClient.createTag(payload);
    }

    if (response.success) {
      await loadTags();
      setIsTagDialogOpen(false);
      setEditingTag(null);
      setTagForm(createEmptyTagForm());
      setTagNotice({
        type: 'success',
        message: editingTag ? 'Tag updated.' : 'Tag created.',
      });
    } else {
      setTagNotice({ type: 'error', message: response.error ?? 'Failed to save tag.' });
    }

    setIsSavingTag(false);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) {
      return;
    }

    setIsDeletingCategory(true);
    setCategoryNotice(null);

    const response = await apiClient.deleteCategory(categoryToDelete.id);

    if (response.success) {
      await loadCategories();
      setCategoryNotice({ type: 'success', message: 'Category deleted.' });
      setCategoryToDelete(null);
    } else {
      setCategoryNotice({ type: 'error', message: response.error ?? 'Failed to delete category.' });
    }

    setIsDeletingCategory(false);
  };

  const confirmDeleteTag = async () => {
    if (!tagToDelete) {
      return;
    }

    setIsDeletingTag(true);
    setTagNotice(null);

    const response = await apiClient.deleteTag(tagToDelete.id);

    if (response.success) {
      const shouldGoBackOnePage = tags.length === 1 && tagPage > 1;
      if (shouldGoBackOnePage) {
        setTagPage((currentPage) => currentPage - 1);
      } else {
        await loadTags();
      }
      setTagNotice({ type: 'success', message: 'Tag deleted.' });
      setTagToDelete(null);
    } else {
      setTagNotice({ type: 'error', message: response.error ?? 'Failed to delete tag.' });
    }

    setIsDeletingTag(false);
  };

  const handleTagSearchChange = (value: string) => {
    setTagSearch(value);
    setTagPage(1);
  };

  const openDisplayOrderDialog = () => {
    setOrderDraftCategories(sortedCategories.map((category) => ({ ...category })));
    setCategoryNotice(null);
    setIsOrderDialogOpen(true);
  };

  const moveDraftCategory = (row: CategoryTreeRow, direction: 'up' | 'down') => {
    const siblingCategories = [...orderDraftCategories]
      .filter(
        (category) => (category.parentCategoryId ?? null) === (row.category.parentCategoryId ?? null)
      )
      .sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name));
    const currentIndex = row.siblingIndex;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= siblingCategories.length) {
      return;
    }

    const currentCategory = siblingCategories[currentIndex];
    const targetCategory = siblingCategories[targetIndex];

    setOrderDraftCategories((currentCategories) =>
      currentCategories.map((category) => {
        if (category.id === currentCategory.id) {
          return { ...category, displayOrder: targetCategory.displayOrder };
        }

        if (category.id === targetCategory.id) {
          return { ...category, displayOrder: currentCategory.displayOrder };
        }

        return category;
      })
    );
  };

  const saveDisplayOrder = async () => {
    const changedCategories = orderDraftCategories.filter((draftCategory) => {
      const existingCategory = categories.find((category) => category.id === draftCategory.id);
      return existingCategory && existingCategory.displayOrder !== draftCategory.displayOrder;
    });

    if (changedCategories.length === 0) {
      setIsOrderDialogOpen(false);
      return;
    }

    setIsSavingOrder(true);
    setCategoryNotice(null);

    const responses = await Promise.all(
      changedCategories.map((category) =>
        apiClient.updateCategory(category.id, { displayOrder: category.displayOrder })
      )
    );

    const failedResponse = responses.find((response) => !response.success);

    if (failedResponse) {
      setCategoryNotice({
        type: 'error',
        message: failedResponse.error ?? 'Failed to update category order.',
      });
      setIsSavingOrder(false);
      return;
    }

    await loadCategories();
    setIsOrderDialogOpen(false);
    setCategoryNotice({ type: 'success', message: 'Category order updated.' });
    setIsSavingOrder(false);
  };

  const getSiblingCategories = (row: CategoryTreeRow, sourceCategories: Category[]) => {
    return [...sourceCategories].filter(
      (category) => (category.parentCategoryId ?? null) === (row.category.parentCategoryId ?? null)
    ).sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name));
  };

  return (
    <DashboardLayout title="Taxonomy" requiredRoles={['admin']}>
      <div className="space-y-8 text-left">
        {/* Header strip */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Admin · Taxonomy</p>
          <h1 className="text-2xl font-bold tracking-tight mt-1 text-foreground">Categories & tags</h1>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="border-b border-border flex gap-6 w-full justify-start h-auto rounded-none bg-transparent p-0 overflow-y-hidden overflow-x-hidden">
            <TabsTrigger
              value="categories"
              className="h-auto pb-3 px-0 text-xs font-semibold capitalize border-b-2 -mb-px rounded-none bg-transparent hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              <Folder className="size-3.5" />
              Categories <span className="text-muted-foreground ml-0.5 font-mono">({categories.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="tags"
              className="h-auto pb-3 px-0 text-xs font-semibold capitalize border-b-2 -mb-px rounded-none bg-transparent hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent flex items-center gap-1.5 cursor-pointer shadow-none"
            >
              <Tag className="size-3.5" />
              Tags <span className="text-muted-foreground ml-0.5 font-mono">({tagTotalCount})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="outline-none mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Pane (Table) */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                      <TableHead className="h-9 font-medium px-4">Name</TableHead>
                      <TableHead className="h-9 font-medium px-4">Description</TableHead>
                      <TableHead className="h-9 font-medium px-4 text-right">Videos</TableHead>
                      <th className="px-4 py-2.5 w-16"></th>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isCategoriesLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading categories...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : categoryTreeRows.length > 0 ? (
                      categoryTreeRows.map((row) => {
                        const { category, depth } = row;
                        const hasDesc = !!category.description;
                        const descText = category.description;
                        const truncatedDesc = hasDesc
                          ? descText.length > 40
                            ? `${descText.substring(0, 40)}...`
                            : descText
                          : '—';

                        return (
                          <TableRow key={category.id} className="border-b border-border last:border-0 hover:bg-accent/40 group">
                            <TableCell className="px-4 py-3 font-medium">
                              <div style={{ paddingLeft: `${depth * 20}px` }}>
                                {category.name}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                              {hasDesc ? (
                                descText.length > 40 ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help border-b border-dashed border-muted-foreground/45 pb-0.5">
                                        {truncatedDesc}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      {descText}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span>{descText}</span>
                                )
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-right font-mono text-muted-foreground">
                              —
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link
                                      href={`/videos?categoryId=${category.id}`}
                                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    >
                                      <Video className="size-3.5" />
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent>View videos</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => openEditCategoryDialog(category)}
                                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    >
                                      <Pencil className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit category</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => setCategoryToDelete(category)}
                                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete category</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          No categories found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Right Pane (Add Category Panel + Display Order Button) */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-1 text-foreground">Add category</h3>
                  <p className="text-[11px] text-muted-foreground mb-4">
                    Categories appear in the library filter and on browse pages.
                  </p>
                  
                  <form onSubmit={submitCreateCategory} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                        Name
                      </label>
                      <Input
                        value={createCategoryForm.name}
                        onChange={(e) =>
                          setCreateCategoryForm((curr) => ({ ...curr, name: e.target.value }))
                        }
                        placeholder="e.g. Product Launches"
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs"
                        required
                        disabled={isSavingCategory}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                        Description
                      </label>
                      <Textarea
                        value={createCategoryForm.description}
                        onChange={(e) =>
                          setCreateCategoryForm((curr) => ({ ...curr, description: e.target.value }))
                        }
                        placeholder="Optional description of the category..."
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs min-h-20"
                        disabled={isSavingCategory}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                        Parent category
                      </label>
                      <Select
                        value={createCategoryForm.parentCategoryId}
                        onValueChange={(val) =>
                          setCreateCategoryForm((curr) => ({ ...curr, parentCategoryId: val }))
                        }
                        disabled={isSavingCategory}
                      >
                        <SelectTrigger className="w-full h-8 text-xs bg-background">
                          <SelectValue placeholder="No parent" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border text-left">
                          <SelectItem value={NO_PARENT_VALUE}>No parent</SelectItem>
                          {availableParentOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {renderNotice(categoryNotice)}

                    <Button
                      type="submit"
                      disabled={isSavingCategory}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-foreground text-background py-2.5 rounded-md text-xs font-semibold hover:opacity-90 cursor-pointer"
                    >
                      {isSavingCategory ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                      Add category
                    </Button>
                  </form>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-1 text-foreground">Sort order</h3>
                  <p className="text-[11px] text-muted-foreground mb-4">
                    Adjust the sequence of categories in navigation lists.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openDisplayOrderDialog}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-md border border-border hover:bg-accent cursor-pointer"
                  >
                    <ArrowUpDown className="size-3.5" />
                    Display order
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tags" className="outline-none mt-0 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative max-w-md flex-1 text-left">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={tagSearch}
                  onChange={(event) => handleTagSearchChange(event.target.value)}
                  placeholder="Search tags..."
                  className="pl-9 w-full bg-card text-xs h-9 border border-border"
                />
              </div>

              <Button
                onClick={openCreateTagDialog}
                className="gap-1.5 bg-foreground text-background text-xs h-9 font-semibold cursor-pointer shrink-0"
              >
                <Plus className="size-3.5" />
                New tag
              </Button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                    <th className="text-left font-medium px-4 py-2.5">Tag</th>
                    <th className="text-right font-medium px-4 py-2.5">Videos</th>
                    <th className="px-4 py-2.5 w-16"></th>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTagsLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        <div className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading tags...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : tags.length > 0 ? (
                    tags.map((tag) => (
                      <TableRow key={tag.id} className="border-b border-border last:border-0 hover:bg-accent/40 group">
                        <TableCell className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 bg-muted border border-border px-2 py-0.5 rounded text-[11px] font-mono text-foreground font-medium">
                            #{tag.name}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                          {tag.usageCount}
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={`/videos?tagId=${tag.id}`}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <Video className="size-3.5" />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>View videos</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => openEditTagDialog(tag)}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Edit tag</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setTagToDelete(tag)}
                                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Delete tag</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                        No tags found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Tags Pagination */}
            {tagPageCount > 1 && (
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-muted-foreground font-mono">
                  Page {tagPage} of {tagPageCount} ({tagTotalCount} total)
                </span>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold cursor-pointer"
                    onClick={() => setTagPage((currentPage) => Math.max(1, currentPage - 1))}
                    disabled={isTagsLoading || tagPage <= 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold cursor-pointer"
                    onClick={() =>
                      setTagPage((currentPage) =>
                        tagPageCount > 0 ? Math.min(currentPage + 1, tagPageCount) : currentPage + 1
                      )
                    }
                    disabled={isTagsLoading || tagPageCount === 0 || tagPage >= tagPageCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            
            {renderNotice(tagNotice)}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            setEditCategoryForm(createEmptyCategoryForm());
          }
        }}
      >
        <DialogContent className="border border-border bg-background sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>Update the category details used across uploads and video management.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Name</Label>
              <Input
                id="edit-category-name"
                value={editCategoryForm.name}
                onChange={(event) => setEditCategoryForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Tutorials"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={editCategoryForm.description}
                onChange={(event) => setEditCategoryForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Optional description"
                className="min-h-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Parent category</Label>
              <Select
                value={editCategoryForm.parentCategoryId}
                onValueChange={(value) => setEditCategoryForm((current) => ({ ...current, parentCategoryId: value }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="No parent" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border text-left">
                  <SelectItem value={NO_PARENT_VALUE}>No parent</SelectItem>
                  {availableParentOptions.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderNotice(categoryNotice)}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
              disabled={isSavingCategory}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitEditCategory()} disabled={isSavingCategory} className="gap-2 cursor-pointer">
              {isSavingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOrderDialogOpen}
        onOpenChange={(open) => {
          setIsOrderDialogOpen(open);
          if (!open) {
            setOrderDraftCategories([]);
          }
        }}
      >
        <DialogContent className="border border-border bg-background sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Display order</DialogTitle>
            <DialogDescription>Reorder sibling categories, then save the whole batch once.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-left">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
                    <TableHead className="px-4 py-2.5 h-9">Category</TableHead>
                    <TableHead className="px-4 py-2.5 h-9">Display Order</TableHead>
                    <TableHead className="px-4 py-2.5 h-9 w-[140px] text-right">Move</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderDraftRows.map((row) => {
                    const siblingCategories = getSiblingCategories(row, orderDraftCategories);
                    return (
                      <TableRow key={row.category.id} className="hover:bg-accent/20">
                        <TableCell className="px-4 py-3">
                          <div
                            style={{ paddingLeft: `${row.depth * 20}px` }}
                            className="font-medium text-foreground text-xs"
                          >
                            {row.category.name}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 font-mono text-muted-foreground text-xs">
                          {row.category.displayOrder}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 cursor-pointer"
                                  onClick={() => moveDraftCategory(row, 'up')}
                                  disabled={row.siblingIndex === 0 || isSavingOrder || siblingCategories.length <= 1}
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move up</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 cursor-pointer"
                                  onClick={() => moveDraftCategory(row, 'down')}
                                  disabled={row.siblingIndex === row.siblingCount - 1 || isSavingOrder || siblingCategories.length <= 1}
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Move down</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {renderNotice(categoryNotice)}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOrderDialogOpen(false)}
              disabled={isSavingOrder}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveDisplayOrder()} disabled={isSavingOrder} className="gap-2 cursor-pointer">
              {isSavingOrder ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTagDialogOpen}
        onOpenChange={(open) => {
          setIsTagDialogOpen(open);
          if (!open) {
            setEditingTag(null);
            setTagForm(createEmptyTagForm());
          }
        }}
      >
        <DialogContent className="border border-border bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit tag' : 'Create tag'}</DialogTitle>
            <DialogDescription>Tags are used for search, filtering, and video labeling.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={tagForm.name}
                onChange={(event) => setTagForm({ name: event.target.value })}
                placeholder="beginner"
              />
            </div>
            {renderNotice(tagNotice)}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTagDialogOpen(false)}
              disabled={isSavingTag}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void submitTag()} disabled={isSavingTag} className="gap-2 cursor-pointer">
              {isSavingTag ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingTag ? 'Save tag' : 'Create tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(categoryToDelete)} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete
                ? `This will remove "${categoryToDelete.name}" if the backend allows it.`
                : 'This will remove the selected category if the backend allows it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCategory}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteCategory();
              }}
              disabled={isDeletingCategory}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
            >
              {isDeletingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(tagToDelete)} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Delete tag?</AlertDialogTitle>
            <AlertDialogDescription>
              {tagToDelete
                ? `This will remove "${tagToDelete.name}" if the backend allows it.`
                : 'This will remove the selected tag if the backend allows it.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTag}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteTag();
              }}
              disabled={isDeletingTag}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground cursor-pointer"
            >
              {isDeletingTag ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
