import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex min-h-screen items-center justify-center pt-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md text-center">
            <p className="mb-4 font-display text-7xl font-bold text-primary/20 sm:text-8xl md:text-9xl">
              404
            </p>
            <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              Page Not Found
            </h1>
            <p className="mt-4 text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Button variant="gold" asChild size="lg" className="mt-8">
              <Link to="/" className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Gallery
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
