import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type DashboardMetric = {
  label: string;
  value: string;
  note: string;
};

type DashboardItem = {
  title: string;
  description: string;
  meta?: string;
  tag?: string;
};

type RoleDashboardProps = {
  title: string;
  description: string;
  accent: string;
  metrics: DashboardMetric[];
  focusTitle: string;
  focusDescription: string;
  focusItems: DashboardItem[];
  activityTitle: string;
  activityDescription: string;
  activityItems: DashboardItem[];
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
};

export function RoleDashboard({
  title,
  description,
  accent,
  metrics,
  focusTitle,
  focusDescription,
  focusItems,
  activityTitle,
  activityDescription,
  activityItems,
  primaryAction,
  secondaryAction,
}: RoleDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card className="border-border/60 shadow-lg">
          <CardHeader className="space-y-4">
            <div className={`h-2 w-20 rounded-full ${accent}`} />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle className="text-3xl">{title}</CardTitle>
                <CardDescription className="mt-1 text-base">{description}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
                {secondaryAction ? (
                  <Button asChild variant="outline">
                    <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-border/60">
              <CardHeader className="pb-2">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-3xl">{metric.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{metric.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{focusTitle}</CardTitle>
              <CardDescription>{focusDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {focusItems.map((item) => (
                <div key={item.title} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {item.tag ? <Badge variant="secondary">{item.tag}</Badge> : null}
                  </div>
                  {item.meta ? <p className="mt-3 text-xs text-muted-foreground">{item.meta}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>{activityTitle}</CardTitle>
              <CardDescription>{activityDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityItems.map((item) => (
                <div key={item.title} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {item.tag ? <Badge variant="outline">{item.tag}</Badge> : null}
                  </div>
                  {item.meta ? <p className="mt-3 text-xs text-muted-foreground">{item.meta}</p> : null}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}