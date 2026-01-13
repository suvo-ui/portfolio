import artistPortrait from "@/assets/artist-portrait.jpg";

export function AboutSection() {
  return (
    <div id="about">
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Portrait */}
            <div className="opacity-0 animate-fade-in-left order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-gold opacity-20 blur-3xl" />
                <div className="relative overflow-hidden shadow-image">
                  <img
                    src={artistPortrait}
                    alt="Elena Voss - Contemporary Artist"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="order-1 lg:order-2 opacity-0 animate-fade-in-right [animation-delay:200ms]">
              <p className="font-display text-sm uppercase tracking-[0.3em] text-primary mb-6">
                About the Artist
              </p>
              
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] mb-8">
                Elena<br />
                <span className="text-gradient">Voss</span>
              </h2>
              
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  Born in the vibrant heart of Brooklyn, Elena Voss has spent over a decade translating the raw energy of urban landscapes and natural phenomena into bold, expressive works that resonate with contemporary audiences.
                </p>
                <p>
                  Her signature style—characterized by thick impasto strokes, warm amber tones, and a fearless approach to light and shadow—draws from both the Abstract Expressionist tradition and the immediacy of street art culture.
                </p>
                <p>
                  "I paint what moves me," Elena explains. "Whether it's the neon-soaked streets of Tokyo at midnight or the quiet power of an ocean wave catching the last light of day—there's a universal energy in these moments that I try to capture."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "12+", label: "Years Creating" },
              { value: "200+", label: "Original Works" },
              { value: "50+", label: "Exhibitions" },
              { value: "15", label: "Countries Collected" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="text-center opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="font-display text-4xl md:text-5xl font-bold text-gradient mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground uppercase tracking-widest font-display">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8">
              Artistic Philosophy
            </h2>
            
            <blockquote className="text-2xl md:text-3xl text-muted-foreground leading-relaxed italic font-light">
              "Every brushstroke is a conversation between chaos and control. I don't paint to represent reality—I paint to capture its 
              <span className="text-foreground not-italic font-medium"> feeling</span>."
            </blockquote>
            
            <p className="mt-8 text-primary font-display uppercase tracking-widest text-sm">
              — Elena Voss
            </p>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              The Creative Process
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Observation",
                  description: "Every piece begins with immersion—walking city streets, watching waves crash, observing the play of light at golden hour.",
                },
                {
                  step: "02",
                  title: "Exploration",
                  description: "Quick sketches and color studies capture the essence of a moment before it fades, preserving the raw emotional response.",
                },
                {
                  step: "03",
                  title: "Expression",
                  description: "In the studio, intuition takes over. Layers build upon layers until the canvas holds that same electric energy.",
                },
              ].map((item, index) => (
                <div
                  key={item.step}
                  className="text-center opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <p className="font-display text-6xl font-bold text-primary/20 mb-4">
                    {item.step}
                  </p>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
