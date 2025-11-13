import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AnalyticsAdmin = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Analyze trends and insights from creator data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              Advanced analytics and insights will be available here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Future features will include:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-4 text-muted-foreground">
              <li>Growth trends across creators</li>
              <li>Video performance analytics</li>
              <li>Keyword and tag analysis</li>
              <li>Brand mention tracking</li>
              <li>Engagement rate comparisons</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsAdmin;
