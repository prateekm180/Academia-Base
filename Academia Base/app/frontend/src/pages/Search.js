import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Search as SearchIcon, ArrowLeft, Filter } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    subject: '',
    type: '',
    level: ''
  });

  useEffect(() => {
    if (searchParams.get('q')) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.type) params.append('type', filters.type);
      if (filters.level) params.append('level', filters.level);

      const response = await axios.get(`${API}/content/search/query?${params.toString()}`);
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary" data-testid="search-page">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-heading font-bold text-primary">AcademiaBase</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-4xl font-heading font-bold mb-8">Search Knowledge Base</h2>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            <Input
              placeholder="Search for notes, PYQs, topics..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
              data-testid="search-input"
            />
            <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90" data-testid="search-btn">
              <SearchIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="e.g., Data Structures"
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                  data-testid="filter-subject"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger data-testid="filter-type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="pyq">PYQ</SelectItem>
                    <SelectItem value="sample_paper">Sample Paper</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="explanation">Explanation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Level</label>
                <Select value={filters.level} onValueChange={(value) => setFilters({ ...filters, level: value })}>
                  <SelectTrigger data-testid="filter-level">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All levels</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={handleSearch} data-testid="apply-filters-btn">
              Apply Filters
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div>
          <h3 className="text-2xl font-heading font-bold mb-6">
            {loading ? 'Searching...' : `${results.length} Results`}
          </h3>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-lg">
              <p className="text-muted-foreground">No results found. Try different keywords or filters.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {results.map((item) => (
                <Card
                  key={item.content_id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/content/${item.content_id}`)}
                  data-testid={`result-card-${item.content_id}`}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{item.type}</span>
                      <span className="px-2 py-1 bg-secondary text-muted-foreground text-xs rounded">{item.level}</span>
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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

export default Search;
