'use client';

import * as React from 'react';
import { useCollection, useMemoSupabase, useUser } from '@/supabase';
import { Loader2, Users, MapPin, Building2, BarChart3, TrendingUp, Star, Download, Calendar, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isSuperAdmin, isSubAdmin, canManagePlace } from '@/lib/admin-helpers';
import { 
  getLocationPopularityAction, 
  getReviewAnalyticsAction, 
  getPlaceAnalyticsAction,
  getUserActivityStatsAction 
} from '@/app/actions';
import type { TimeRange, LocationPopularity, ReviewAnalytics, PlaceAnalytics } from '@/lib/analytics';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AnalyticsDashboard() {
  const { user } = useUser();
  const [timeRange, setTimeRange] = React.useState<TimeRange>('30d');
  const [selectedPlaceId, setSelectedPlaceId] = React.useState<string | undefined>(undefined);
  const [locationPopularity, setLocationPopularity] = React.useState<LocationPopularity[]>([]);
  const [reviewAnalytics, setReviewAnalytics] = React.useState<ReviewAnalytics[]>([]);
  const [placeAnalytics, setPlaceAnalytics] = React.useState<PlaceAnalytics[]>([]);
  const [activityStats, setActivityStats] = React.useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = React.useState(true);

  // Fetch places for filtering
  const placesQuery = useMemoSupabase(() => ({
    table: 'places',
    filter: (query: any) => query.order('name', { ascending: true }),
    __memo: true
  }), []);
  const { data: placesData } = useCollection<any>(placesQuery);
  const places = placesData || [];

  // Filter places based on admin level
  const availablePlaces = React.useMemo(() => {
    if (!user?.profile) return [];
    if (isSuperAdmin(user.profile)) return places;
    if (isSubAdmin(user.profile)) {
      return places.filter((p: any) => canManagePlace(user.profile, p.id));
    }
    return [];
  }, [places, user?.profile]);

  // Load analytics data
  React.useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        const [popularityResult, reviewsResult, placesResult, activityResult] = await Promise.all([
          getLocationPopularityAction(selectedPlaceId, timeRange),
          getReviewAnalyticsAction(selectedPlaceId),
          getPlaceAnalyticsAction(selectedPlaceId),
          getUserActivityStatsAction(timeRange),
        ]);

        if (popularityResult.success) setLocationPopularity(popularityResult.data || []);
        if (reviewsResult.success) setReviewAnalytics(reviewsResult.data || []);
        if (placesResult.success) setPlaceAnalytics(placesResult.data || []);
        if (activityResult.success) setActivityStats(activityResult.data);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    if (isSuperAdmin(user?.profile) || isSubAdmin(user?.profile)) {
      loadAnalytics();
    }
  }, [timeRange, selectedPlaceId, user?.profile]);

  if (!isSuperAdmin(user?.profile) && !isSubAdmin(user?.profile)) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-destructive text-sm font-semibold">Access Denied</p>
        <p className="text-destructive text-sm mt-2">Only admins can access analytics.</p>
      </div>
    );
  }

  // Prepare chart data
  const topLocations = locationPopularity.slice(0, 10).map(loc => ({
    name: loc.location_name.length > 15 ? loc.location_name.substring(0, 15) + '...' : loc.location_name,
    views: loc.total_views,
    visitors: loc.unique_visitors,
    rating: loc.avg_rating || 0,
  }));

  const ratingDistribution = reviewAnalytics.reduce((acc, review) => {
    acc.five += review.five_star_count;
    acc.four += review.four_star_count;
    acc.three += review.three_star_count;
    acc.two += review.two_star_count;
    acc.one += review.one_star_count;
    return acc;
  }, { five: 0, four: 0, three: 0, two: 0, one: 0 });

  const ratingData = [
    { name: '5 Stars', value: ratingDistribution.five, color: '#10b981' },
    { name: '4 Stars', value: ratingDistribution.four, color: '#3b82f6' },
    { name: '3 Stars', value: ratingDistribution.three, color: '#f59e0b' },
    { name: '2 Stars', value: ratingDistribution.two, color: '#ef4444' },
    { name: '1 Star', value: ratingDistribution.one, color: '#dc2626' },
  ].filter(item => item.value > 0);

  const exportToCSV = () => {
    // Simple CSV export
    const csv = [
      ['Metric', 'Value'].join(','),
      ['Total Locations', locationPopularity.length].join(','),
      ['Total Reviews', reviewAnalytics.reduce((sum, r) => sum + r.total_reviews, 0)].join(','),
      ['Average Rating', (reviewAnalytics.reduce((sum, r) => sum + (r.avg_rating || 0) * r.total_reviews, 0) / reviewAnalytics.reduce((sum, r) => sum + r.total_reviews, 0)) || 0].join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Platform usage and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          {isSuperAdmin(user?.profile) && (
            <Select value={selectedPlaceId || 'all'} onValueChange={(value) => setSelectedPlaceId(value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All places" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All places</SelectItem>
                {availablePlaces.map((place: any) => (
                  <SelectItem key={place.id} value={place.id}>{place.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {isLoadingAnalytics ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="locations">Location Analytics</TabsTrigger>
            <TabsTrigger value="reviews">Review Analytics</TabsTrigger>
            {isSuperAdmin(user?.profile) && <TabsTrigger value="places">Place Analytics</TabsTrigger>}
            <TabsTrigger value="activity">Activity Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{locationPopularity.length}</div>
                  <p className="text-xs text-muted-foreground">Tracked locations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reviewAnalytics.reduce((sum, r) => sum + r.total_reviews, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg: {reviewAnalytics.length > 0 
                      ? (reviewAnalytics.reduce((sum, r) => sum + (r.avg_rating || 0) * r.total_reviews, 0) / 
                         reviewAnalytics.reduce((sum, r) => sum + r.total_reviews, 0) || 0).toFixed(1)
                      : '0.0'} ⭐
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {locationPopularity.reduce((sum, l) => sum + l.total_views, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Location views</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {locationPopularity.reduce((sum, l) => sum + l.unique_visitors, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total visitors</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Locations by Views</CardTitle>
                <CardDescription>Most popular locations in the selected time period</CardDescription>
              </CardHeader>
              <CardContent>
                {topLocations.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={topLocations}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#0088FE" name="Total Views" />
                      <Bar dataKey="visitors" fill="#00C49F" name="Unique Visitors" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No location data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Breakdown of reviews by star rating</CardDescription>
              </CardHeader>
              <CardContent>
                {ratingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={ratingData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ratingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No review data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin(user?.profile) && (
            <TabsContent value="places" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Place Performance</CardTitle>
                  <CardDescription>Analytics by place</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {placeAnalytics.map((place) => (
                      <div key={place.place_id} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">{place.place_name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Locations</p>
                            <p className="font-semibold">{place.total_locations}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Activities</p>
                            <p className="font-semibold">{place.total_activities}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Visitors</p>
                            <p className="font-semibold">{place.unique_visitors}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Rating</p>
                            <p className="font-semibold">{place.avg_rating?.toFixed(1) || 'N/A'} ⭐</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>User activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                {activityStats?.activitiesByDay && activityStats.activitiesByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={activityStats.activitiesByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#0088FE" name="Activities" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No activity data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
