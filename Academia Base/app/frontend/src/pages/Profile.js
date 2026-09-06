import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BookOpen, ArrowLeft, UserPlus, UserMinus, Settings } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadProfile();
    loadUserContent();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const [profileRes, meRes] = await Promise.all([
        axios.get(`${API}/users/profile/${userId}`),
        axios.get(`${API}/auth/me`, { withCredentials: true }).catch(() => null)
      ]);
      setProfile(profileRes.data);
      if (meRes && meRes.data.user_id === userId) {
        setIsOwnProfile(true);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserContent = async () => {
    try {
      const response = await axios.get(`${API}/users/${userId}/content`);
      setContent(response.data);
    } catch (error) {
      console.error('Failed to load user content:', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await axios.delete(`${API}/users/unfollow/${userId}`, { withCredentials: true });
        toast.success('Unfollowed');
        setIsFollowing(false);
      } else {
        await axios.post(`${API}/users/follow/${userId}`, {}, { withCredentials: true });
        toast.success('Following');
        setIsFollowing(true);
      }
      loadProfile();
    } catch (error) {
      toast.error('Please login to follow');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <p>Profile not found</p>
      </div>
    );
  }

  if (!profile.is_public && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-secondary" data-testid="private-profile-page">
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
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">Private Profile</h2>
          <p className="text-muted-foreground">This profile is set to private.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary" data-testid="profile-page">
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
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-heading">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-3xl font-heading font-bold" data-testid="profile-name">{profile.name}</h2>
                  {profile.is_mentor && (
                    <span className="px-3 py-1 bg-accent/10 text-accent text-sm rounded">Mentor</span>
                  )}
                </div>
                {profile.bio && <p className="text-muted-foreground mb-4">{profile.bio}</p>}
                <div className="flex gap-6 mb-4">
                  <div>
                    <span className="text-2xl font-bold">{profile.content_count || 0}</span>
                    <p className="text-sm text-muted-foreground">Content</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{profile.follower_count || 0}</span>
                    <p className="text-sm text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{profile.following_count || 0}</span>
                    <p className="text-sm text-muted-foreground">Following</p>
                  </div>
                </div>
                {profile.subjects && profile.subjects.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {profile.subjects.map((subject, index) => (
                      <span key={index} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded">
                        {subject}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline" data-testid="edit-profile-btn">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <Button onClick={handleFollow} className={isFollowing ? '' : 'bg-primary hover:bg-primary/90'} data-testid="follow-btn">
                      {isFollowing ? (
                        <><UserMinus className="w-4 h-4 mr-2" />Unfollow</>
                      ) : (
                        <><UserPlus className="w-4 h-4 mr-2" />Follow</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Content */}
        <div>
          <h3 className="text-2xl font-heading font-bold mb-6">Published Content</h3>
          {content.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-lg">
              <p className="text-muted-foreground">No content published yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {content.map((item) => (
                <Card key={item.content_id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/content/${item.content_id}`)} data-testid={`content-card-${item.content_id}`}>
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

export default Profile;
