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
import { useToast } from '@/hooks/use-toast';
import { addMapAction, updateMapAction } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { type Map } from '@/lib/maps';
import { useSupabase, useUser, useCollection, useMemoSupabase } from '@/supabase';
import { type Place } from '@/lib/places';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().optional(),
  image_url: z.string().url({ message: 'Please provide a valid image URL.' }),
  page_number: z.number().min(1, { message: 'Page number must be at least 1.' }),
  place_id: z.string().min(1, { message: 'Please select a place.' }),
});

type MapFormProps = {
  map: Map | null;
  onFormSubmit: () => void;
};

export function MapForm({ map, onFormSubmit }: MapFormProps) {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { user } = useUser();

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
      name: map?.name || '',
      description: map?.description || '',
      image_url: map?.image_url || '',
      page_number: map?.page_number || 1,
      place_id: map?.place_id || '',
    },
  });

  React.useEffect(() => {
    if (map) {
      form.reset({
        name: map.name,
        description: map.description || '',
        image_url: map.image_url,
        page_number: map.page_number || 1,
        place_id: map.place_id,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        image_url: '',
        page_number: 1,
        place_id: '',
      });
    }
  }, [map, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (map) {
        // Update existing map
        const result = await updateMapAction({
          id: map.id,
          name: values.name,
          description: values.description,
          image_url: values.image_url,
          page_number: values.page_number,
          place_id: values.place_id,
        });

        if (result.success) {
          toast({
            title: 'Map Updated',
            description: `"${values.name}" has been updated successfully.`,
          });
          onFormSubmit();
        } else {
          toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: result.error,
          });
        }
      } else {
        // Create new map
        const result = await addMapAction({
          name: values.name,
          description: values.description,
          image_url: values.image_url,
          page_number: values.page_number,
          place_id: values.place_id,
        });

        if (result.success) {
          toast({
            title: 'Map Created',
            description: `"${values.name}" has been created successfully.`,
          });
          form.reset();
          onFormSubmit();
        } else {
          toast({
            variant: 'destructive',
            title: 'Creation Failed',
            description: result.error,
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormDescription>Select the place this map belongs to.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Basement Floor, Ground Floor" {...field} />
              </FormControl>
              <FormDescription>The name of the map (e.g., floor name).</FormDescription>
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
                <Textarea
                  placeholder="Optional description of this map..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional description of the map.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Map Image URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/map.jpg"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                URL of the map image. You can upload to Supabase Storage and use the public URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="page_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Page Number</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormDescription>
                The order/sequence of this map (1, 2, 3, etc.). Maps are displayed in ascending order.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit">
            {map ? 'Update Map' : 'Create Map'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

