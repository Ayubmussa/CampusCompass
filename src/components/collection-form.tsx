'use client';

import * as React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { type Collection } from '@/lib/collections';
import { useCollection, useMemoSupabase, useUser } from '@/supabase';
import { type Place } from '@/lib/places';
import { addCollectionAction, updateCollectionAction } from '@/app/actions';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().optional(),
  place_id: z.string().min(1, { message: 'Please select a place.' }),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  is_featured: z.boolean().default(false),
});

type CollectionFormProps = {
  collection: Collection | null;
  onFormSubmit: () => void;
};

export function CollectionForm({ collection, onFormSubmit }: CollectionFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch places for the dropdown
  const placesQuery = useMemoSupabase(() => {
    return {
      table: 'places',
      filter: (query: any) => query.order('name', { ascending: true }),
      __memo: true
    };
  }, []);
  const { data: placesData } = useCollection<any>(placesQuery);
  const places: Place[] | null = placesData
    ? placesData.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        thumbnailUrl: item.thumbnail_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }))
    : null;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection?.name || '',
      description: collection?.description || '',
      place_id: collection?.place_id || '',
      thumbnail_url: collection?.thumbnail_url || '',
      is_featured: collection?.is_featured || false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You must be logged in to manage collections.',
      });
      return;
    }

    setIsSubmitting(true);
    let result;

    const collectionData = {
      name: values.name,
      description: values.description || undefined,
      place_id: values.place_id,
      thumbnail_url: values.thumbnail_url || undefined,
      is_featured: values.is_featured,
    };

    if (collection) {
      result = await updateCollectionAction({ id: collection.id, ...collectionData });
    } else {
      result = await addCollectionAction(collectionData);
    }

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: collection ? 'Collection Updated' : 'Collection Added',
        description: `"${values.name}" has been saved.`,
      });
      onFormSubmit();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to save collection.',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Dining Options, Art Galleries" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A short description of this collection." {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="place_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Place</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a place" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {places?.map((place) => (
                    <SelectItem key={place.id} value={place.id}>
                      {place.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select the place this collection belongs to.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="thumbnail_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormDescription>URL to an image representing this collection.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="is_featured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Featured Collection</FormLabel>
                <FormDescription>
                  Featured collections appear prominently on the place selection page.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : (collection ? 'Save Changes' : 'Add Collection')}
        </Button>
      </form>
    </Form>
  );
}

