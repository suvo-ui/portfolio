import { Layout } from "@/components/Layout";
import { Play, Clock, BookOpen, CheckCircle } from "lucide-react";

const syllabus = [
  {
    module: "Module 1",
    title: "Foundations of Abstract Expression",
    topics: ["Understanding color theory", "Emotional composition basics", "Materials and tools overview"],
  },
  {
    module: "Module 2", 
    title: "Developing Your Visual Language",
    topics: ["Finding your artistic voice", "Texture and layering techniques", "Creating movement in static art"],
  },
  {
    module: "Module 3",
    title: "Advanced Composition Techniques",
    topics: ["Balance and asymmetry", "Negative space mastery", "Large-scale canvas work"],
  },
  {
    module: "Module 4",
    title: "Professional Practice",
    topics: ["Building a portfolio", "Gallery submissions", "Pricing your work"],
  },
];

export default function Courses() {
  return (
    <Layout>
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="font-display text-sm uppercase tracking-[0.3em] text-primary mb-4 block">
              Online Course
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Master Abstract Art
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A comprehensive journey into the world of abstract expression, guided by Elena Voss herself.
            </p>
          </div>

          {/* Video Section */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="relative aspect-video bg-card rounded-2xl overflow-hidden border border-border/50 group">
              {/* Placeholder for video - replace src with actual video */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Course Introduction"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              {/* Video overlay info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    12 Hours Total
                  </span>
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    4 Modules
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Syllabus Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">
              Course Syllabus
            </h2>
            
            <div className="grid gap-6">
              {syllabus.map((item, index) => (
                <div
                  key={index}
                  className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-display text-sm font-bold text-primary">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs uppercase tracking-widest text-primary mb-1 block">
                        {item.module}
                      </span>
                      <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                        {item.title}
                      </h3>
                      <ul className="space-y-2">
                        {item.topics.map((topic, topicIndex) => (
                          <li key={topicIndex} className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary/60" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
