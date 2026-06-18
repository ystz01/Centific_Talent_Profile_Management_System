import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type NavItem = {
  label: string;
  href: string;
  description: string;
};

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
  navItems: NavItem[];
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
  navItems,
  primaryAction,
  secondaryAction,
}: RoleDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="mx-auto flex w-full max-w-7xl gap-6 p-6">
        <aside className="hidden w-72 shrink-0 xl:block">
          <Card className="sticky top-6 border-border/60 shadow-lg">
            <CardHeader className="space-y-3 border-b border-border/60">
              <div className={`h-2 w-20 rounded-full ${accent}`} />
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {navItems.map((item) => (
                <Button key={item.label} asChild variant="ghost" className="h-auto w-full justify-start px-3 py-3">
                  <Link href={item.href}>
                    <div className="flex flex-col items-start text-left">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </Link>
                </Button>
              ))}
              <div className="pt-3">
                <Button asChild className="w-full">
                  <Link href={primaryAction.href}>{primaryAction.label}</Link>
                </Button>
                {secondaryAction ? (
                  <Button asChild variant="outline" className="mt-2 w-full">
                    <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 space-y-6">
          <Card className="border-border/60 shadow-lg xl:hidden">
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
        </main>
      </div>
    </div>
  );
}