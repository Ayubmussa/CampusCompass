import { createServerSupabaseClient } from '@/supabase/server';
import type { Location } from '@/lib/locations';
import Link from 'next/link';

type LocationRecord = {
  id: string;
  name: string;
  description: string | null;
  panorama_url: string | null;
  thumbnail_url: string | null;
};

const toLocation = (record: LocationRecord): Location => ({
  id: record.id,
  name: record.name,
  description: record.description ?? 'No description provided.',
  panoramaUrl: record.panorama_url ?? '',
  thumbnailUrl: record.thumbnail_url ?? '',
  coordinates: { lat: 0, lng: 0 },
  connections: [],
});

export default async function LocationsPage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, description, panorama_url, thumbnail_url')
    .order('name', { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-headline font-semibold">All Locations</h1>
        <p className="mt-4 text-sm text-destructive">
          Failed to load locations. Please try again later.
        </p>
      </div>
    );
  }

  const locations = (data ?? []).map(toLocation);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-semibold">All Locations</h1>
        <Link href="/" className="text-sm text-primary hover:underline">
          Back to tour
        </Link>
      </div>
      {locations.length === 0 ? (
        <p className="text-muted-foreground">No locations available yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((location) => (
            <article
              key={location.id}
              className="rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-xl font-headline font-semibold">{location.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{location.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {location.panoramaUrl ? 'Panorama available' : 'No panorama uploaded'}
                </span>
                <Link
                  href={`/?location=${location.id}`}
                  className="text-primary hover:underline"
                >
                  View in tour
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

