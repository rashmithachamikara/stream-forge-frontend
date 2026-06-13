'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, Plus, Search, Tags, Trash2, FolderTree, ChevronLeft, ChevronRight } from 'lucide-react';

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
  displayOrder: string;
};

type TagFormState = {
  name: string;
};

const createEmptyCategoryForm = (): CategoryFormState => ({
  name: '',
  description: '',
  parentCategoryId: NO_PARENT_VALUE,
  displayOrder: '0',
});

const createCategoryFormFromItem = (category: Category): CategoryFormState => ({
  name: category.name,
  description: category.description,
  parentCategoryId: category.parentCategoryId ?? NO_PARENT_VALUE,
  displayOrder: String(category.displayOrder),
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
      ? 'border-destructive/30 bg-destructive/5 text-destructive'
      : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300';

  return (
    <Card className={tone}>
      <CardContent className="py-4 text-sm">{notice.message}</CardContent>
    </Card>
  );
};

export default function TaxonomyManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoryNotice, setCategoryNotice] = useState<NoticeState>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(createEmptyCategoryForm);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

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

  const categoryNameMap = useMemo(
    () =>
      categories.reduce<Record<string, string>>((accumulator, category) => {
        accumulator[category.id] = category.name;
        return accumulator;
      }, {}),
    [categories]
  );

  const availableParentOptions = useMemo(
    () => sortedCategories.filter((category) => category.id !== editingCategory?.id),
    [editingCategory?.id, sortedCategories]
  );

  useEffect(() => {
    void loadCategories();
  }, []);

  useEffect(() => {
    void loadTags();
  }, [tagPage, tagSearch]);

  const loadCategories = async () => {
    setIsCategoriesLoading(true);

    const response = await apiClient.getCategories();

    if (response.success && response.data) {
      setCategories(response.data);
    } else {
      setCategories([]);
      setCategoryNotice({ type: 'error', message: response.error ?? 'Failed to load categories.' });
    }

    setIsCategoriesLoading(false);
  };

  const loadTags = async () => {
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
  };

  const openCreateCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryForm(createEmptyCategoryForm());
    setCategoryNotice(null);
    setIsCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm(createCategoryFormFromItem(category));
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

  const submitCategory = async () => {
    const trimmedName = categoryForm.name.trim();
    const trimmedDescription = categoryForm.description.trim();
    const displayOrder = Number(categoryForm.displayOrder);

    if (!trimmedName) {
      setCategoryNotice({ type: 'error', message: 'Category name is required.' });
      return;
    }

    if (Number.isNaN(displayOrder)) {
      setCategoryNotice({ type: 'error', message: 'Display order must be a number.' });
      return;
    }

    setIsSavingCategory(true);
    setCategoryNotice(null);

    const parentCategoryId =
      categoryForm.parentCategoryId !== NO_PARENT_VALUE ? categoryForm.parentCategoryId : null;

    let response;

    if (editingCategory) {
      const payload: UpdateCategoryRequest = {
        name: trimmedName,
        displayOrder,
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

      response = await apiClient.updateCategory(editingCategory.id, payload);
    } else {
      const payload: CreateCategoryRequest = {
        name: trimmedName,
        description: trimmedDescription || undefined,
        parentCategoryId: parentCategoryId ?? undefined,
        displayOrder,
      };

      response = await apiClient.createCategory(payload);
    }

    if (response.success) {
      await loadCategories();
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm(createEmptyCategoryForm());
      setCategoryNotice({
        type: 'success',
        message: editingCategory ? 'Category updated.' : 'Category created.',
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

  return (
    <DashboardLayout title="Taxonomy" requiredRoles={['admin']}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Taxonomy</CardTitle>
            <CardDescription>Manage shared categories and tags used across the video library.</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="categories" className="gap-2">
              <FolderTree className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2">
              <Tags className="h-4 w-4" />
              Tags
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Organize videos with reusable parent-child categories.</CardDescription>
                </div>
                <Button className="gap-2" onClick={openCreateCategoryDialog}>
                  <Plus className="h-4 w-4" />
                  New category
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderNotice(categoryNotice)}

                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Display Order</TableHead>
                        <TableHead className="w-[140px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isCategoriesLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            <div className="inline-flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading categories...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : sortedCategories.length > 0 ? (
                        sortedCategories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="max-w-sm text-muted-foreground">
                              {category.description || 'No description'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {category.parentCategoryId ? categoryNameMap[category.parentCategoryId] ?? 'Unknown category' : 'None'}
                            </TableCell>
                            <TableCell>{category.displayOrder}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEditCategoryDialog(category)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-destructive hover:text-destructive"
                                  onClick={() => setCategoryToDelete(category)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            No categories found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>Tags</CardTitle>
                  <CardDescription>Manage searchable tags used for filtering and labeling videos.</CardDescription>
                </div>
                <Button className="gap-2" onClick={openCreateTagDialog}>
                  <Plus className="h-4 w-4" />
                  New tag
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderNotice(tagNotice)}

                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={tagSearch}
                      onChange={(event) => handleTagSearchChange(event.target.value)}
                      placeholder="Search tags..."
                      className="pl-9"
                    />
                  </div>
                  <Badge variant="secondary" className="h-10 px-3">
                    {tagTotalCount} total
                  </Badge>
                </div>

                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Usage Count</TableHead>
                        <TableHead className="w-[140px] text-right">Actions</TableHead>
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
                          <TableRow key={tag.id}>
                            <TableCell className="font-medium">{tag.name}</TableCell>
                            <TableCell className="text-muted-foreground">{tag.usageCount}</TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEditTagDialog(tag)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-destructive hover:text-destructive"
                                  onClick={() => setTagToDelete(tag)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
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

                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {tags.length} of {tagTotalCount} tags
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setTagPage((currentPage) => Math.max(1, currentPage - 1))}
                      disabled={isTagsLoading || tagPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="min-w-24 text-center text-sm text-muted-foreground">
                      Page {tagPage}
                      {tagPageCount > 0 ? ` of ${tagPageCount}` : ''}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        setTagPage((currentPage) =>
                          tagPageCount > 0 ? Math.min(currentPage + 1, tagPageCount) : currentPage + 1
                        )
                      }
                      disabled={isTagsLoading || tagPageCount === 0 || tagPage >= tagPageCount}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          setIsCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            setCategoryForm(createEmptyCategoryForm());
          }
        }}
      >
        <DialogContent className="border border-border bg-background sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit category' : 'Create category'}</DialogTitle>
            <DialogDescription>Set the category details used across uploads and video management.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Tutorials"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Optional description"
                className="min-h-28"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Parent category</Label>
                <Select
                  value={categoryForm.parentCategoryId}
                  onValueChange={(value) => setCategoryForm((current) => ({ ...current, parentCategoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No parent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PARENT_VALUE}>No parent</SelectItem>
                    {availableParentOptions.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-display-order">Display order</Label>
                <Input
                  id="category-display-order"
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, displayOrder: event.target.value }))}
                />
              </div>
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
            <Button type="button" onClick={() => void submitCategory()} disabled={isSavingCategory} className="gap-2">
              {isSavingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingCategory ? 'Save category' : 'Create category'}
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
          <div className="space-y-4">
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
            <Button type="button" onClick={() => void submitTag()} disabled={isSavingTag} className="gap-2">
              {isSavingTag ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingTag ? 'Save tag' : 'Create tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(categoryToDelete)} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
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
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(tagToDelete)} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
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
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingTag ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
