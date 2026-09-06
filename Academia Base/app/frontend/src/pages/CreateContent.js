import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function CreateContent({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'note',
    subject: '',
    topic: '',
    subtopic: '',
    level: 'undergraduate',
    tags: '',
    blocks: [{ block_id: `block_${Date.now()}`, title: '', content: '', order: 0 }]
  });

  const addBlock = () => {
    setFormData({
      ...formData,
      blocks: [...formData.blocks, { block_id: `block_${Date.now()}`, title: '', content: '', order: formData.blocks.length }]
    });
  };

  const removeBlock = (index) => {
    const newBlocks = formData.blocks.filter((_, i) => i !== index);
    setFormData({ ...formData, blocks: newBlocks });
  };

  const updateBlock = (index, field, value) => {
    const newBlocks = [...formData.blocks];
    newBlocks[index][field] = value;
    setFormData({ ...formData, blocks: newBlocks });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };
      const response = await axios.post(`${API}/content`, payload, { withCredentials: true });
      toast.success('Content created successfully!');
      navigate(`/content/${response.data.content_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary" data-testid="create-content-page">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-heading font-bold text-primary">AcademiaBase</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} data-testid="back-dashboard-btn">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-4xl font-heading font-bold mb-8">Create Content</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete Guide to Arrays"
                  required
                  data-testid="title-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief overview of the content"
                  required
                  rows={3}
                  data-testid="description-input"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Content Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger data-testid="type-select">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="pyq">PYQ</SelectItem>
                      <SelectItem value="sample_paper">Sample Paper</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="explanation">Explanation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger data-testid="level-select">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Data Structures"
                    required
                    data-testid="subject-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g., Arrays"
                    required
                    data-testid="topic-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., algorithms, sorting, data structures"
                  data-testid="tags-input"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Blocks */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Content Blocks</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addBlock} data-testid="add-block-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Block
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.blocks.map((block, index) => (
                <div key={block.block_id} className="p-4 border border-border rounded-lg space-y-4" data-testid={`block-${index}`}>
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Block {index + 1}</h4>
                    {formData.blocks.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeBlock(index)} data-testid={`remove-block-${index}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Block Title</Label>
                    <Input
                      value={block.title}
                      onChange={(e) => updateBlock(index, 'title', e.target.value)}
                      placeholder="e.g., Definition"
                      data-testid={`block-title-${index}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Block Content</Label>
                    <Textarea
                      value={block.content}
                      onChange={(e) => updateBlock(index, 'content', e.target.value)}
                      placeholder="Enter the content for this block"
                      rows={4}
                      data-testid={`block-content-${index}`}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading} data-testid="create-submit-btn">
              {loading ? 'Creating...' : 'Create Content'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} data-testid="cancel-btn">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateContent;
