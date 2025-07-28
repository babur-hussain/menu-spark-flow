import { supabase } from "../integrations/supabase/client";

export interface Review {
  id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  order_id: string;
  order_items: string[];
  restaurant_id: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  is_flagged: boolean;
  is_replied: boolean;
  reply?: string;
  reply_date?: string;
  helpful_count: number;
  not_helpful_count: number;
}

export interface CreateReviewData {
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  order_id: string;
  order_items: string[];
}

export interface ReplyData {
  reply: string;
}

export const reviewService = {
  async getReviews(restaurantId: string): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReviews:', error);
      throw error;
    }
  },

  async createReview(restaurantId: string, reviewData: CreateReviewData): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([{
          ...reviewData,
          restaurant_id: restaurantId,
          is_verified: true,
          is_flagged: false,
          is_replied: false,
          helpful_count: 0,
          not_helpful_count: 0,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating review:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createReview:', error);
      throw error;
    }
  },

  async replyToReview(reviewId: string, replyData: ReplyData): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          ...replyData,
          is_replied: true,
          reply_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('Error replying to review:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in replyToReview:', error);
      throw error;
    }
  },

  async flagReview(reviewId: string, isFlagged: boolean): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          is_flagged: isFlagged,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('Error flagging review:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in flagReview:', error);
      throw error;
    }
  },

  async markReviewHelpful(reviewId: string, isHelpful: boolean): Promise<Review> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          helpful_count: isHelpful ? supabase.rpc('increment', { n: 1 }) : supabase.rpc('decrement', { n: 1 }),
          not_helpful_count: !isHelpful ? supabase.rpc('increment', { n: 1 }) : supabase.rpc('decrement', { n: 1 }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        console.error('Error marking review helpful:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in markReviewHelpful:', error);
      throw error;
    }
  },

  async getReviewsStats(restaurantId: string): Promise<{
    total: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
    repliedCount: number;
    flaggedCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating, is_replied, is_flagged')
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error('Error fetching review stats:', error);
        throw error;
      }

      const total = data.length;
      const averageRating = total > 0 ? data.reduce((sum, review) => sum + review.rating, 0) / total : 0;
      const repliedCount = data.filter(review => review.is_replied).length;
      const flaggedCount = data.filter(review => review.is_flagged).length;

      const ratingDistribution = {
        1: data.filter(review => review.rating === 1).length,
        2: data.filter(review => review.rating === 2).length,
        3: data.filter(review => review.rating === 3).length,
        4: data.filter(review => review.rating === 4).length,
        5: data.filter(review => review.rating === 5).length,
      };

      return {
        total,
        averageRating,
        ratingDistribution,
        repliedCount,
        flaggedCount,
      };
    } catch (error) {
      console.error('Error in getReviewsStats:', error);
      throw error;
    }
  },

  async getReviewsByRating(restaurantId: string, rating: number): Promise<Review[]> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('rating', rating)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews by rating:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getReviewsByRating:', error);
      throw error;
    }
  },
}; 