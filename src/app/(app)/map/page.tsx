import { createClient } from "@/lib/supabase/server";
import { MapView } from "./map-loader";

export default async function MapPage() {
  const supabase = await createClient();

  const [{ data: trips }, { data: allTags }] = await Promise.all([
    supabase
      .from("trips")
      .select(
        "id, title, cover_photo_url, latitude, longitude, location_name, trip_tag_assignments ( trip_tags ( id, name, color ) )"
      )
      .not("latitude", "is", null)
      .not("longitude", "is", null),
    supabase.from("trip_tags").select("id, name, color").order("name"),
  ]);

  const mappedTrips = (trips ?? []).map((trip) => ({
    id: trip.id as string,
    title: trip.title as string,
    cover_photo_url: trip.cover_photo_url as string | null,
    latitude: trip.latitude as number,
    longitude: trip.longitude as number,
    location_name: trip.location_name as string | null,
    tags: (
      (trip.trip_tag_assignments as unknown as Array<{
        trip_tags: { id: string; name: string; color: string } | null;
      }>)
        ?.map((a) => a.trip_tags)
        .filter((t): t is { id: string; name: string; color: string } => t != null) ?? []
    ),
  }));

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MapView trips={mappedTrips} allTags={allTags ?? []} />
    </div>
  );
}
