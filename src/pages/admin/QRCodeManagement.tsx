import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Download, 
  Copy, 
  Trash2, 
  QrCode, 
  Search, 
  Filter, 
  Table,
  Smartphone,
  Printer,
  Eye,
  Edit,
  RefreshCw,
  BarChart3,
  Settings,
  Loader2,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/contexts/AuthContext";
import { qrCodeService, QRCode, CreateQRCodeData } from "@/lib/qrCodeService";
import { supabase } from "@/integrations/supabase/client";
import QRCodeLib from 'qrcode';

const qrCodeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  table_number: z.string().min(1, "Table number is required"),
  location: z.string().min(1, "Location is required"),
  type: z.enum(["table", "takeaway", "delivery"]),
  is_active: z.boolean().default(true),
});

type QRCodeFormData = z.infer<typeof qrCodeSchema>;

// Remove duplicate interface since it's imported from qrCodeService

export default function QRCodeManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [qrCodeStats, setQrCodeStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalScans: 0,
    averageScans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentRestaurant, setCurrentRestaurant] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<QRCode | null>(null);

  const form = useForm<QRCodeFormData>({
    resolver: zodResolver(qrCodeSchema),
    defaultValues: {
      name: "",
      table_number: "",
      location: "",
      type: "table",
      is_active: true,
    },
  });

  // Fetch restaurants and set current restaurant
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingRestaurants(true);
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching restaurants:', error);
          return;
        }

        setRestaurants(restaurants || []);
        
        // Get the last selected restaurant from localStorage
        const lastSelectedRestaurantId = localStorage.getItem('selectedRestaurantId');
        
        if (lastSelectedRestaurantId && restaurants.some(r => r.id === lastSelectedRestaurantId)) {
          const selectedRestaurant = restaurants.find(r => r.id === lastSelectedRestaurantId);
          setCurrentRestaurant(selectedRestaurant);
        } else if (restaurants.length > 0) {
          // If no saved restaurant or saved restaurant doesn't exist, use the first one
          setCurrentRestaurant(restaurants[0]);
          localStorage.setItem('selectedRestaurantId', restaurants[0].id);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setIsLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, [user?.id]);

  // Fetch QR codes when current restaurant changes
  useEffect(() => {
    const fetchQRCodes = async () => {
      if (!user || !currentRestaurant) return;
      
      try {
        setIsLoading(true);
        
        const [qrCodesData, statsData] = await Promise.all([
          qrCodeService.getQRCodes(currentRestaurant.id),
          qrCodeService.getQRCodeStats(currentRestaurant.id),
        ]);
        setQrCodes(qrCodesData);
        setQrCodeStats(statsData);
      } catch (error) {
        console.error('Error fetching QR codes:', error);
        toast({
          title: "Error",
          description: "Failed to load QR codes. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (currentRestaurant) {
      fetchQRCodes();
    }
  }, [user, currentRestaurant, toast]);

  const handleRestaurantChange = (restaurantId: string) => {
    const selectedRestaurant = restaurants.find(r => r.id === restaurantId);
    if (selectedRestaurant) {
      setCurrentRestaurant(selectedRestaurant);
      localStorage.setItem('selectedRestaurantId', restaurantId);
    }
  };

  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = qr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qr.table_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || qr.type === selectedType;
    return matchesSearch && matchesType;
  });

  const onSubmit = async (data: QRCodeFormData) => {
    if (!user || !currentRestaurant) {
      toast({
        title: "Error",
        description: "User or restaurant not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // Generate QR code URL: /order/:restaurantId?table=:table_number
      let qrUrl = `${window.location.origin}/order/${currentRestaurant.id}`;
      if (data.table_number) {
        qrUrl += `?table=${encodeURIComponent(data.table_number)}`;
      }
      const qrCodeData: CreateQRCodeData = {
        name: data.name,
        type: data.type,
        table_number: data.table_number,
        description: data.location,
        is_active: data.is_active,
        // Add url for QR code
        url: qrUrl,
      };
      if (editingQR) {
        const updatedQR = await qrCodeService.updateQRCode(editingQR.id, qrCodeData);
        setQrCodes(prev => prev.map(qr => qr.id === editingQR.id ? updatedQR : qr));
        toast({
          title: "QR Code Updated",
          description: `${data.name} has been updated successfully.`,
        });
      } else {
        const newQR = await qrCodeService.createQRCode(currentRestaurant.id, qrCodeData);
        setQrCodes(prev => [newQR, ...prev]);
        toast({
          title: "QR Code Added",
          description: `${data.name} has been added successfully.`,
        });
      }
      setIsAddDialogOpen(false);
      setEditingQR(null);
      form.reset();
    } catch (error) {
      console.error('Error saving QR code:', error);
      toast({
        title: "Error",
        description: "Failed to save QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (qr: QRCode) => {
    setEditingQR(qr);
    form.reset({
      name: qr.name,
      table_number: qr.table_number,
      location: qr.location,
      type: qr.type,
      is_active: qr.is_active,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (qrId: string) => {
    try {
      await qrCodeService.deleteQRCode(qrId);
      setQrCodes(prev => prev.filter(qr => qr.id !== qrId));
      toast({
        title: "QR Code Deleted",
        description: "The QR code has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast({
        title: "Error",
        description: "Failed to delete QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (qrId: string) => {
    try {
      const qr = qrCodes.find(qr => qr.id === qrId);
      if (!qr) return;
      
      const updatedQR = await qrCodeService.toggleQRCodeStatus(qrId, !qr.is_active);
      setQrCodes(prev => prev.map(qr => 
        qr.id === qrId ? updatedQR : qr
      ));
    } catch (error) {
      console.error('Error toggling QR code status:', error);
      toast({
        title: "Error",
        description: "Failed to update QR code status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (qr: QRCode) => {
    // Get restaurant and table info
    const restaurantName = currentRestaurant?.name || 'Restaurant';
    const tableNumber = qr.table_number || qr.name || '';
    const qrUrl = qr.url;

    // Create a canvas
    const size = 600;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size + 100;
    const ctx = canvas.getContext('2d');

    // Draw background (light beige)
    ctx.fillStyle = '#fff8f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a food emoji at the top
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍽️', size / 2, 60);

    // Draw restaurant name
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#d35400';
    ctx.fillText(restaurantName, size / 2, 110);

    // Generate QR code and draw it
    const qrCanvas = document.createElement('canvas');
    await QRCodeLib.toCanvas(qrCanvas, qrUrl, { width: 360, margin: 1, color: { dark: '#222', light: '#fff8f0' } });
    ctx.drawImage(qrCanvas, (size - 360) / 2, 140);

    // Draw table number
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#16a085';
    ctx.fillText(`Table: ${tableNumber}`, size / 2, size + 40);

    // Draw a food border (simple icons)
    const foodEmojis = ['🍕','🍔','🥗','🍣','🍜','🍩','🍦','🍟'];
    ctx.font = '24px serif';
    for (let i = 0; i < 8; i++) {
      ctx.fillText(foodEmojis[i], 60 + i * 70, size + 80);
    }

    // Download as PNG
    const link = document.createElement('a');
    link.download = `${restaurantName.replace(/\s+/g, '_')}_Table_${tableNumber}_QR.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast({
      title: 'Download Started',
      description: `Beautiful QR code for ${qr.name} is being downloaded.`,
    });
  };

  const handleCopy = (qr: QRCode) => {
    navigator.clipboard.writeText(qr.qr_code_url);
    toast({
      title: "URL Copied",
      description: "QR code URL has been copied to clipboard.",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "table":
        return <Table className="h-4 w-4" />;
      case "takeaway":
        return <Smartphone className="h-4 w-4" />;
      case "delivery":
        return <Printer className="h-4 w-4" />;
      default:
        return <QrCode className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "table":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "takeaway":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "delivery":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <AdminLayout userRole="restaurant_manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">QR Code Management</h1>
            <p className="text-muted-foreground">
              Create and manage QR codes for tables, takeaway, and delivery orders
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingQR ? "Edit QR Code" : "Generate New QR Code"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingQR 
                      ? "Update the QR code details below."
                      : "Create a new QR code for your restaurant."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>QR Code Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Table 1 - Window View" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="table_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Table/Station Number</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 1, TA-01, DEL-01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="table">Table</SelectItem>
                                <SelectItem value="takeaway">Takeaway</SelectItem>
                                <SelectItem value="delivery">Delivery</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Main Dining Area, Front Counter" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Enable or disable this QR code
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingQR(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editingQR ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          editingQR ? "Update QR Code" : "Generate QR Code"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <LogoutButton />
          </div>
        </div>

        {/* Restaurant Selector */}
        {!isLoadingRestaurants && restaurants.length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <Label htmlFor="restaurant-select" className="text-sm font-medium">
                    Select Restaurant:
                  </Label>
                </div>
                <Select 
                  value={currentRestaurant?.id || ""} 
                  onValueChange={handleRestaurantChange}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        {currentRestaurant && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-700">
                <strong>Current Restaurant:</strong> {currentRestaurant.name} (ID: {currentRestaurant.id})
              </p>
              <p className="text-sm text-blue-600">
                <strong>QR Codes Found:</strong> {qrCodes.length}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qrCodes.length}</div>
              <p className="text-xs text-muted-foreground">
                Active: {qrCodes.filter(qr => qr.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tables</CardTitle>
              <Table className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {qrCodes.filter(qr => qr.type === "table" && qr.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for orders
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Takeaway Stations</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {qrCodes.filter(qr => qr.type === "takeaway" && qr.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Self-service ordering
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
                    placeholder="Search QR codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="table">Tables</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* QR Codes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading QR codes...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredQRCodes.map((qr) => (
            <Card key={qr.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{qr.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {qr.location}
                    </CardDescription>
                  </div>
                  <Badge variant={qr.is_active ? "default" : "secondary"}>
                    {qr.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getTypeColor(qr.type)}>
                    {getTypeIcon(qr.type)}
                    <span className="ml-1 capitalize">{qr.type}</span>
                  </Badge>
                  <Badge variant="outline">#{qr.table_number}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Scans:</span>
                    <span className="font-medium">{qr.scan_count}</span>
                  </div>
                  {qr.last_scanned && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Scanned:</span>
                      <span className="font-medium">
                        {new Date(qr.last_scanned).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(qr.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(qr)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(qr)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(qr)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(qr.id)}
                    className="flex-1"
                  >
                    {qr.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(qr.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {!isLoading && filteredQRCodes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No QR codes found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedType !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first QR code."
                }
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create QR Code
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
} 