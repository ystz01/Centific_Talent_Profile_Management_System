import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type RoleLandingProps = {
  title: string;
  description: string;
  accent: string;
};

export function RoleLanding({ title, description, accent }: RoleLandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl border-border/60 shadow-lg">
        <CardHeader className="space-y-3">
          <div className={`h-2 w-20 rounded-full ${accent}`} />
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription className="text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <Button asChild>
            <Link href="/home">Go to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Log out</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
