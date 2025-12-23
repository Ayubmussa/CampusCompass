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
import { addLocationAction, updateLocationAction } from '@/app/actions';
import { Loader2, X } from 'lucide-react';
import { type Location } from '@/lib/locations';
import { useSupabase, useUser, useCollection, useMemoSupabase } from '@/supabase';
import { Progress } from '@/components/ui/progress';
import { type Place } from '@/lib/places';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  placeId: z.string().min(1, { message: 'Please select a place.' }),
  panoramaUrl: z.string().url({ message: 'Please upload a panorama image.' }),
  thumbnailUrl: z.string().url({ message: 'Please upload a thumbnail image.' }),
  lat: z.number(),
  lng: z.number(),
});

type LocationFormProps = {
  location: Location | null;
  onFormSubmit: () => void;
};

export function LocationForm({ location, onFormSubmit }: LocationFormProps) {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{ [key: string]: number }>({});
  const [uploadError, setUploadError] = React.useState<{ [key: string]: string | null }>({});
  const [isUploading, setIsUploading] = React.useState<{ [key: string]: boolean }>({});


  const isUserAdmin = user?.profile?.isAdmin === true;

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
      name: location?.name || '',
      description: location?.description || '',
      placeId: location?.placeId || '',
      panoramaUrl: location?.panoramaUrl || '',
      thumbnailUrl: location?.thumbnailUrl || '',
      lat: location?.coordinates?.lat ?? 0,
      lng: location?.coordinates?.lng ?? 0,
    },
  });

  const handleFileUpload = async (file: File, path: string, fieldName: 'panoramaUrl' | 'thumbnailUrl') => {
    if (!supabase) {
        toast({ variant: 'destructive', title: 'Error', description: 'Storage service not available.' });
        throw new Error('Storage not available');
    }

    setIsUploading(prev => ({...prev, [fieldName]: true}));
    setUploadError(prev => ({...prev, [fieldName]: null}));
    setUploadProgress(prev => ({...prev, [fieldName]: 0}));

    try {
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('locations')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('locations')
        .getPublicUrl(path);

      form.setValue(fieldName, publicUrl);
      form.clearErrors(fieldName);
      setUploadProgress(prev => ({...prev, [fieldName]: 100}));
    } catch (error: any) {
      console.error("Upload failed:", error);
      let errorMessage = 'Could not upload the file.';
      if (error.message?.includes('already exists')) {
        errorMessage = "File already exists. Please use a different filename.";
      } else if (error.message?.includes('permission')) {
        errorMessage = "Permission Denied. Please check your Supabase Storage policies.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      setUploadError(prev => ({...prev, [fieldName]: errorMessage}));
      toast({ 
        variant: 'destructive', 
        title: 'Upload Failed', 
        description: errorMessage,
        duration: 9000,
      });
      setUploadProgress(prev => ({...prev, [fieldName]: 0}));
    } finally {
      setIsUploading(prev => ({...prev, [fieldName]: false}));
    }
  };

  const cancelUpload = (fieldName: 'panoramaUrl' | 'thumbnailUrl') => {
    // Supabase uploads are not cancelable, but we can reset state
    setUploadProgress(prev => ({...prev, [fieldName]: 0}));
    setIsUploading(prev => ({...prev, [fieldName]: false}));
    setUploadError(prev => ({...prev, [fieldName]: 'Upload canceled.'}));
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.profile?.isAdmin) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You must be logged in as an admin to add locations.',
      });
      return;
    }

    setIsSubmitting(true);
    let result;

    const locationData = {
        name: values.name,
        description: values.description,
        placeId: values.placeId,
        panoramaUrl: values.panoramaUrl,
        thumbnailUrl: values.thumbnailUrl,
        coordinates: {
            lat: values.lat,
            lng: values.lng,
        },
        connections: location?.connections || [],
    };
    
    console.log('Submitting location data:', locationData);
    console.log('User info:', { id: user.id, isAdmin: user.profile?.isAdmin, email: user.email });
    
    if (location) {
        result = await updateLocationAction({ id: location.id, ...locationData });
    } else {
        result = await addLocationAction(locationData);
    }

    setIsSubmitting(false);
    
    console.log('Location action result:', result);

    if (result.success) {
      toast({
        title: location ? 'Location Updated' : 'Location Added',
        description: `"${values.name}" has been saved.`,
      });
      // Small delay to ensure Supabase has processed the insert
      await new Promise(resolve => setTimeout(resolve, 500));
      onFormSubmit();
    } else {
      console.error('Location action failed:', result.error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to save location. Check console for details.',
      });
    }
  }
  
  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: 'panoramaUrl' | 'thumbnailUrl') => {
      const file = event.target.files?.[0];
      if (!file) return;

      const locationId = location?.id || form.getValues('name').toLowerCase().replace(/\s+/g, '-') || new Date().getTime().toString();
      if (!locationId) {
          toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter a location name before uploading images.' });
          return;
      }
      const path = `locations/${locationId}/${fieldName === 'panoramaUrl' ? 'panorama' : 'thumbnail'}_${file.name}`;
      
      try {
          handleFileUpload(file, path, fieldName);
      } catch (error) {
           toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload the file.'});
      }
  };

  const isUploadingAny = Object.values(isUploading).some(loading => loading === true);

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
                <Input placeholder="e.g., Main Library" {...field} />
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
                <Textarea placeholder="A short description of the location." {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="placeId"
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
              <FormDescription>Select the place this location belongs to.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="panoramaUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Panorama Image (360°)</FormLabel>
              <FormControl>
                <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => onFileChange(e, 'panoramaUrl')}
                    disabled={!isUserAdmin || isUploading['panoramaUrl']}
                />
              </FormControl>
              {!isUserAdmin && <FormDescription>You must be an admin to upload images.</FormDescription>}
              {uploadProgress['panoramaUrl'] > 0 && (
                <div className="flex items-center gap-2 mt-2">
                    <Progress value={uploadProgress['panoramaUrl']} className="w-full" />
                    {isUploading['panoramaUrl'] && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => cancelUpload('panoramaUrl')}>
                            <X className="h-4 w-4"/>
                        </Button>
                    )}
                </div>
              )}
              {field.value && !uploadProgress['panoramaUrl'] && <FormDescription>Current file: {decodeURIComponent(field.value).split('/').pop()?.split('?')[0].split('_').slice(1).join('_')}</FormDescription>}
              <FormMessage />
              {uploadError['panoramaUrl'] && <p className="text-sm font-medium text-destructive mt-2">{uploadError['panoramaUrl']}</p>}
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail Image</FormLabel>
              <FormControl>
                 <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => onFileChange(e, 'thumbnailUrl')}
                    disabled={!isUserAdmin || isUploading['thumbnailUrl']}
                />
              </FormControl>
               {!isUserAdmin && <FormDescription>You must be an admin to upload images.</FormDescription>}
              {uploadProgress['thumbnailUrl'] > 0 && (
                 <div className="flex items-center gap-2 mt-2">
                    <Progress value={uploadProgress['thumbnailUrl']} className="w-full" />
                    {isUploading['thumbnailUrl'] && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => cancelUpload('thumbnailUrl')}>
                            <X className="h-4 w-4"/>
                        </Button>
                    )}
                </div>
              )}
              {field.value && !uploadProgress['thumbnailUrl'] && <FormDescription>Current file: {decodeURIComponent(field.value).split('/').pop()?.split('?')[0].split('_').slice(1).join('_')}</FormDescription>}
              <FormMessage />
              {uploadError['thumbnailUrl'] && <p className="text-sm font-medium text-destructive mt-2">{uploadError['thumbnailUrl']}</p>}
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="lat"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lng"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" disabled={isSubmitting || isUploadingAny || !isUserAdmin}>
          {(isSubmitting || isUploadingAny) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Saving...' : (isUploadingAny ? 'Uploading...' : (location ? 'Save Changes' : 'Add Location'))}
        </Button>
      </form>
    </Form>
  );
}
