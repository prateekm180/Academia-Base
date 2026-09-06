import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Search, TrendingUp, Award, FileText, ArrowRight } from 'lucide-react';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-secondary" data-testid="landing-page">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-secondary/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-heading font-bold text-primary">AcademiaBase</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')} data-testid="nav-login-btn">
              Login
            </Button>
            <Button onClick={() => navigate('/signup')} className="bg-primary hover:bg-primary/90" data-testid="nav-signup-btn">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl lg:text-6xl font-heading font-bold text-foreground leading-tight">
              The Modern Library for Academic Knowledge
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Create, share, and discover structured academic content. From notes to PYQs, build a living knowledge base that evolves with you.
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={() => navigate('/signup')} className="bg-accent hover:bg-accent/90" data-testid="hero-get-started-btn">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/search')} data-testid="hero-explore-btn">
                Explore Content
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1770009971150-f50bc7d373a4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMHNoYXBlcyUyMG1pbmltYWxpc3QlMjB3aGl0ZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc0MjU3MDE1fDA&ixlib=rb-4.1.0&q=85"
              alt="Abstract geometric shapes"
              className="w-full h-auto rounded-lg border border-border shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-heading font-bold mb-4">Why AcademiaBase?</h3>
            <p className="text-lg text-muted-foreground">A knowledge platform built for modern learners</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 border border-border rounded-lg hover:border-primary transition-colors" data-testid="feature-structured">
              <FileText className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-heading font-bold mb-2">Structured Notes</h4>
              <p className="text-muted-foreground">Break down knowledge into modular, searchable blocks. Update and version your content easily.</p>
            </div>
            <div className="p-8 border border-border rounded-lg hover:border-primary transition-colors" data-testid="feature-pyqs">
              <Award className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-heading font-bold mb-2">PYQs & Resources</h4>
              <p className="text-muted-foreground">Access previous year questions, sample papers, and curated learning materials.</p>
            </div>
            <div className="p-8 border border-border rounded-lg hover:border-primary transition-colors" data-testid="feature-community">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-heading font-bold mb-2">Community Driven</h4>
              <p className="text-muted-foreground">Follow mentors, collaborate on notes, and build your academic reputation.</p>
            </div>
            <div className="p-8 border border-border rounded-lg hover:border-primary transition-colors" data-testid="feature-ai">
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-heading font-bold mb-2">AI-Powered</h4>
              <p className="text-muted-foreground">Get instant summaries and personalized content suggestions powered by AI.</p>
            </div>
            <div className="p-8 border border-border rounded-lg hover:border-primary transition-colors" data-testid="feature-search">
              <Search className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-heading font-bold mb-2">Advanced Search</h4>
              <p className="text-muted-foreground">Find exactly what you need with filters by subject, topic, level, and content type.</p>
            </div>
            <div className="p-8 border border-border rounded-lg hover:border-primary transition-colors" data-testid="feature-export">
              <BookOpen className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-heading font-bold mb-2">PDF Export</h4>
              <p className="text-muted-foreground">Export any content as formatted PDFs for offline study and sharing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h3 className="text-4xl lg:text-5xl font-heading font-bold">Ready to Build Your Knowledge Base?</h3>
          <p className="text-lg text-muted-foreground">Join thousands of students, teachers, and researchers already using AcademiaBase.</p>
          <Button size="lg" onClick={() => navigate('/signup')} className="bg-primary hover:bg-primary/90" data-testid="cta-signup-btn">
            Get Started for Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>© 2026 AcademiaBase. Building the future of academic knowledge sharing.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
