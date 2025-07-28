import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Reply,
  Flag,
  MoreHorizontal,
  Calendar,
  User,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";
import { reviewService, Review } from "@/lib/reviewService";
import { useToast } from "@/hooks/use-toast";

export default function Reviews() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    repliedCount: 0,
    flaggedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = selectedRating === "all" || review.rating === parseInt(selectedRating);
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "replied" && review.is_replied) ||
                         (selectedStatus === "unreplied" && !review.is_replied) ||
                         (selectedStatus === "flagged" && review.is_flagged);
    return matchesSearch && matchesRating && matchesStatus;
  });

  // Fetch reviews on component mount
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.restaurant_id) return;
      
      try {
        setIsLoading(true);
        const [reviewsData, statsData] = await Promise.all([
          reviewService.getReviews(user.restaurant_id),
          reviewService.getReviewsStats(user.restaurant_id),
        ]);
        setReviews(reviewsData);
        setReviewStats(statsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast({
          title: "Error",
          description: "Failed to load reviews. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [user?.restaurant_id, toast]);

  const averageRating = reviewStats.averageRating;
  const totalReviews = reviewStats.total;
  const repliedReviews = reviewStats.repliedCount;
  const flaggedReviews = reviewStats.flaggedCount;

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingIcon = (rating: number) => {
    if (rating >= 4) return <Heart className="h-4 w-4 fill-current" />;
    if (rating >= 3) return <Star className="h-4 w-4 fill-current" />;
    return <AlertCircle className="h-4 w-4 fill-current" />;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const handleReply = async (reviewId: string, reply: string) => {
    try {
      const updatedReview = await reviewService.replyToReview(reviewId, { reply });
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? updatedReview : review
      ));
      toast({
        title: "Reply Sent",
        description: "Your reply has been posted successfully.",
      });
    } catch (error) {
      console.error('Error replying to review:', error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFlag = async (reviewId: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;
      
      const updatedReview = await reviewService.flagReview(reviewId, !review.is_flagged);
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? updatedReview : review
      ));
    } catch (error) {
      console.error('Error flagging review:', error);
      toast({
        title: "Error",
        description: "Failed to update review flag. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout userRole="restaurant_manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Reviews</h1>
            <p className="text-muted-foreground">
              Monitor and respond to customer feedback and ratings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Export Reviews
            </Button>
            <LogoutButton variant="outline" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}/5</div>
              <div className="flex items-center mt-1">
                {renderStars(Math.round(averageRating))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                All time reviews
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replied</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repliedReviews}</div>
              <p className="text-xs text-muted-foreground">
                {totalReviews > 0 ? ((repliedReviews / totalReviews) * 100).toFixed(0) : 0}% response rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flaggedReviews}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search reviews by customer name, title, or comment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                  <SelectItem value="unreplied">Unreplied</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.customer_name}`} />
                      <AvatarFallback>{review.customer_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{review.customer_name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {review.order_id}
                            </Badge>
                            {review.is_verified && (
                              <Badge variant="default" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                              {review.rating}/5
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                          <h4 className="font-medium mb-1">{review.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {review.is_flagged && (
                            <Badge variant="destructive" className="text-xs">
                              Flagged
                            </Badge>
                          )}
                          {review.is_replied && (
                            <Badge variant="default" className="text-xs">
                              Replied
                            </Badge>
                          )}
                        </div>
                      </div>

                      {review.is_replied && review.reply && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <User className="h-3 w-3 text-primary-foreground" />
                            </div>
                            <span className="text-sm font-medium">Restaurant Response</span>
                            <span className="text-xs text-muted-foreground">
                              {review.reply_date && formatDate(review.reply_date)}
                            </span>
                          </div>
                          <p className="text-sm">{review.reply}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!review.is_replied && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Reply className="h-4 w-4 mr-1" />
                                Reply
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reply to Review</DialogTitle>
                                <DialogDescription>
                                  Respond to {review.customer_name}'s review
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Original Review</h4>
                                  <div className="p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="flex items-center">
                                        {renderStars(review.rating)}
                                      </div>
                                      <span className="text-sm font-medium">{review.title}</span>
                                    </div>
                                    <p className="text-sm">{review.comment}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Your Response</label>
                                  <textarea
                                    className="w-full mt-1 p-3 border rounded-lg min-h-[100px]"
                                    placeholder="Write your response to this review..."
                                    id="reply-text"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      const replyText = (document.getElementById('reply-text') as HTMLTextAreaElement).value;
                                      if (replyText.trim()) {
                                        handleReply(review.id, replyText);
                                      }
                                    }}
                                  >
                                    Send Reply
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFlag(review.id)}
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          {review.is_flagged ? "Unflag" : "Flag"}
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredReviews.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedRating !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Customer reviews will appear here when they are submitted."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
} 