import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, ArrowLeft, Download, ThumbsUp, MessageCircle, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ContentDetail() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    loadContent();
    loadComments();
  }, [contentId]);

  const loadContent = async () => {
    try {
      const response = await axios.get(`${API}/content/${contentId}`);
      setContent(response.data);
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await axios.get(`${API}/content/${contentId}/comments`, { withCredentials: true });
      setComments(response.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      await axios.post(`${API}/content/${contentId}/interact`, { interaction_type: 'like' }, { withCredentials: true });
      toast.success('Liked!');
      loadContent();
    } catch (error) {
      toast.error('Please login to interact');
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      await axios.post(`${API}/content/${contentId}/comments`, { text: newComment, type: 'comment' }, { withCredentials: true });
      setNewComment('');
      toast.success('Comment added');
      loadComments();
    } catch (error) {
      toast.error('Please login to comment');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await axios.get(`${API}/content/${contentId}/export-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${contentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const handleAISummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await axios.post(`${API}/ai/summarize`, { content_id: contentId }, { withCredentials: true });
      setAiSummary(response.data.summary);
      toast.success('AI Summary generated');
    } catch (error) {
      toast.error('Please login to use AI features');
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <p>Loading content...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <p>Content not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary" data-testid="content-detail-page">
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

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded" data-testid="content-type">{content.type}</span>
            <span className="px-3 py-1 bg-secondary text-muted-foreground text-sm rounded">{content.level}</span>
          </div>
          <h2 className="text-4xl font-heading font-bold mb-4" data-testid="content-title">{content.title}</h2>
          <p className="text-lg text-muted-foreground mb-4">{content.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{content.subject}</span>
            <span>•</span>
            <span>{content.topic}</span>
            {content.author && (
              <>
                <span>•</span>
                <span className="cursor-pointer hover:text-primary" onClick={() => navigate(`/profile/${content.author.user_id}`)} data-testid="author-link">
                  By {content.author.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button variant="outline" onClick={handleLike} data-testid="like-btn">
            <ThumbsUp className="w-4 h-4 mr-2" />
            {content.like_count || 0}
          </Button>
          <Button variant="outline" data-testid="comment-btn">
            <MessageCircle className="w-4 h-4 mr-2" />
            {content.comment_count || 0}
          </Button>
          <Button variant="outline" onClick={handleExportPDF} data-testid="export-pdf-btn">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleAISummary} disabled={summaryLoading} data-testid="ai-summary-btn">
            <Sparkles className="w-4 h-4 mr-2" />
            {summaryLoading ? 'Generating...' : 'AI Summary'}
          </Button>
        </div>

        {/* AI Summary */}
        {aiSummary && (
          <Card className="mb-8 border-accent" data-testid="ai-summary-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                AI-Generated Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{aiSummary}</p>
            </CardContent>
          </Card>
        )}

        {/* Content Blocks */}
        <div className="space-y-6 mb-8">
          {content.blocks && content.blocks.map((block, index) => (
            <Card key={block.block_id || index} data-testid={`content-block-${index}`}>
              <CardHeader>
                <CardTitle className="text-2xl">{block.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{block.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex gap-2 mb-8">
            {content.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                data-testid="comment-input"
              />
              <Button onClick={handleComment} className="bg-primary hover:bg-primary/90" data-testid="submit-comment-btn">
                Post Comment
              </Button>
            </div>

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.comment_id} className="border-l-4 border-primary pl-4 py-2" data-testid={`comment-${comment.comment_id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{comment.author?.name || 'Anonymous'}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p>{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ContentDetail;
