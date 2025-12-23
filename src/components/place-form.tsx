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
import { useToast } from '@/hooks/use-toast';
import { addPlaceAction, updatePlaceAction } from '@/app/actions';
import { Loader2, X } from 'lucide-react';
import { type Place } from '@/lib/places';
import { useSupabase, useUser } from '@/supabase';
import { Progress } from '@/components/ui/progress';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  thumbnailUrl: z.string().url({ message: 'Please provide a valid thumbnail URL.' }),
});

type PlaceFormProps = {
  place: Place | null;
  onFormSubmit: () => void;
};

export function PlaceForm({ place, onFormSubmit }: PlaceFormProps) {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { user } = useUser();
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: place?.name || '',
      description: place?.description || '',
      thumbnailUrl: place?.thumbnailUrl || '',
    },
  });

  React.useEffect(() => {
    if (place) {
      form.reset({
        name: place.name,
        description: place.description,
        thumbnailUrl: place.thumbnailUrl,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        thumbnailUrl: '',
      });
    }
  }, [place, form]);

  const handleFileUpload = async (file: File, type: 'thumbnail'): Promise<string> => {
    if (!supabase || !user) {
      throw new Error('Supabase client or user not available');
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `places/${fileName}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setIsUploading(false);
      setUploadProgress(0);
      return publicUrl;
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let thumbnailUrl = values.thumbnailUrl;

      // If thumbnailUrl is a file input, handle upload
      if (values.thumbnailUrl.startsWith('data:') || values.thumbnailUrl === '') {
        // This would need file input handling - for now, we'll use the URL directly
        toast({
          variant: 'destructive',
          title: 'Invalid URL',
          description: 'Please provide a valid image URL or use file upload.',
        });
        return;
      }

      if (place) {
        // Update existing place
        const result = await updatePlaceAction({
          id: place.id,
          name: values.name,
          description: values.description,
          thumbnailUrl: thumbnailUrl,
        });

        if (result.success) {
          toast({
            title: 'Place Updated',
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
        // Create new place
        const result = await addPlaceAction({
          name: values.name,
          description: values.description,
          thumbnailUrl: thumbnailUrl,
        });

        if (result.success) {
          toast({
            title: 'Place Created',
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Building" {...field} />
              </FormControl>
              <FormDescription>The name of the place.</FormDescription>
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
                  placeholder="Describe this place..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>A detailed description of the place.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail Image URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                URL of the thumbnail image for this place.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : place ? (
              'Update Place'
            ) : (
              'Create Place'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

