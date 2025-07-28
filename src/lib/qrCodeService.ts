import { supabase } from "../integrations/supabase/client";

export interface QRCode {
  id: string;
  name: string;
  type: 'table' | 'takeaway' | 'delivery' | 'custom';
  code: string;
  url: string;
  table_number?: string;
  description?: string;
  is_active: boolean;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
  scan_count: number;
  last_scanned?: string;
}

export interface CreateQRCodeData {
  name: string;
  type: 'table' | 'takeaway' | 'delivery' | 'custom';
  table_number?: string;
  description?: string;
  is_active: boolean;
}

export const qrCodeService = {
  async getQRCodes(restaurantId: string): Promise<QRCode[]> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching QR codes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getQRCodes:', error);
      throw error;
    }
  },

  async createQRCode(restaurantId: string, qrCodeData: CreateQRCodeData): Promise<QRCode> {
    try {
      // Generate unique code
      const code = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const url = `${window.location.origin}/menu?qr=${code}`;

      const { data, error } = await supabase
        .from('qr_codes')
        .insert([{
          ...qrCodeData,
          code,
          url,
          restaurant_id: restaurantId,
          scan_count: 0,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating QR code:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createQRCode:', error);
      throw error;
    }
  },

  async updateQRCode(id: string, updates: Partial<CreateQRCodeData>): Promise<QRCode> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating QR code:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateQRCode:', error);
      throw error;
    }
  },

  async deleteQRCode(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting QR code:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteQRCode:', error);
      throw error;
    }
  },

  async toggleQRCodeStatus(id: string, isActive: boolean): Promise<QRCode> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling QR code status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in toggleQRCodeStatus:', error);
      throw error;
    }
  },

  async recordScan(qrCodeId: string): Promise<QRCode> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          scan_count: supabase.rpc('increment', { n: 1 }),
          last_scanned: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', qrCodeId)
        .select()
        .single();

      if (error) {
        console.error('Error recording QR code scan:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in recordScan:', error);
      throw error;
    }
  },

  async getQRCodeStats(restaurantId: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    totalScans: number;
    averageScans: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('is_active, scan_count')
        .eq('restaurant_id', restaurantId);

      if (error) {
        console.error('Error fetching QR code stats:', error);
        throw error;
      }

      const total = data.length;
      const active = data.filter(qr => qr.is_active).length;
      const inactive = total - active;
      const totalScans = data.reduce((sum, qr) => sum + qr.scan_count, 0);
      const averageScans = total > 0 ? totalScans / total : 0;

      return {
        total,
        active,
        inactive,
        totalScans,
        averageScans,
      };
    } catch (error) {
      console.error('Error in getQRCodeStats:', error);
      throw error;
    }
  },
}; 