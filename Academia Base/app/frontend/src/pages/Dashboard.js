import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus, Search, TrendingUp, LogOut, User, Bell } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ user }) {
  const navigate = useNavigate();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await axios.get(`${API}/content/discover/feed?limit=20`, { withCredentials: true });
      setContent(response.data);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleSearch = () => {
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-secondary" data-testid="dashboard-page">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-heading font-bold text-primary">AcademiaBase</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" data-testid="notifications-btn">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/profile/${user.user_id}`)} data-testid="profile-btn">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-heading font-bold mb-2" data-testid="welcome-message">Welcome back, {user.name}!</h2>
          <p className="text-muted-foreground">Discover and share knowledge</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/create')} data-testid="create-content-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Create Content</CardTitle>
                  <CardDescription>Share your knowledge</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/search')} data-testid="search-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Search</CardTitle>
                  <CardDescription>Find resources</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors" data-testid="trending-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Trending</CardTitle>
                  <CardDescription>Popular content</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            <Input
              placeholder="Search for notes, PYQs, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
              data-testid="search-input"
            />
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90" data-testid="search-btn">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content Feed */}
        <div>
          <h3 className="text-2xl font-heading font-bold mb-6">Recent Content</h3>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-lg">
              <p className="text-muted-foreground">No content available yet. Be the first to share!</p>
              <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => navigate('/create')} data-testid="create-first-content-btn">
                Create Content
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {content.map((item) => (
                <Card key={item.content_id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/content/${item.content_id}`)} data-testid={`content-card-${item.content_id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{item.type}</span>
                          <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded">{item.level}</span>
                        </div>
                        <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span>{item.subject}</span>
                          <span>•</span>
                          <span>{item.topic}</span>
                          {item.author && (
                            <>
                              <span>•</span>
                              <span>By {item.author.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
