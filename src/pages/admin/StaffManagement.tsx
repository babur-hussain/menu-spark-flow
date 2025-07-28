import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Shield,
  ChefHat,
  UtensilsCrossed,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LogoutButton } from "@/components/auth/LogoutButton";

const staffSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  role: z.enum(["chef", "waiter", "manager", "host", "bartender", "kitchen_helper"]),
  hire_date: z.string().min(1, "Hire date is required"),
  hourly_rate: z.string().min(1, "Hourly rate is required"),
  is_active: z.boolean().default(true),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: "chef" | "waiter" | "manager" | "host" | "bartender" | "kitchen_helper";
  hire_date: string;
  hourly_rate: number;
  is_active: boolean;
  emergency_contact?: string;
  emergency_phone?: string;
  avatar_url?: string;
  created_at: string;
  last_shift?: string;
  total_hours_this_week: number;
  rating: number;
}

export default function StaffManagement() {
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: "1",
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sarah.johnson@restaurant.com",
      phone: "+1 (555) 123-4567",
      role: "manager",
      hire_date: "2023-01-15",
      hourly_rate: 25.00,
      is_active: true,
      emergency_contact: "Mike Johnson",
      emergency_phone: "+1 (555) 987-6543",
      created_at: "2023-01-15T10:00:00Z",
      last_shift: "2024-01-20T16:00:00Z",
      total_hours_this_week: 40,
      rating: 4.8,
    },
    {
      id: "2",
      first_name: "Carlos",
      last_name: "Rodriguez",
      email: "carlos.rodriguez@restaurant.com",
      phone: "+1 (555) 234-5678",
      role: "chef",
      hire_date: "2023-03-20",
      hourly_rate: 28.00,
      is_active: true,
      emergency_contact: "Maria Rodriguez",
      emergency_phone: "+1 (555) 876-5432",
      created_at: "2023-03-20T10:00:00Z",
      last_shift: "2024-01-20T15:30:00Z",
      total_hours_this_week: 38,
      rating: 4.9,
    },
    {
      id: "3",
      first_name: "Emily",
      last_name: "Davis",
      email: "emily.davis@restaurant.com",
      phone: "+1 (555) 345-6789",
      role: "waiter",
      hire_date: "2023-06-10",
      hourly_rate: 18.00,
      is_active: true,
      emergency_contact: "Robert Davis",
      emergency_phone: "+1 (555) 765-4321",
      created_at: "2023-06-10T10:00:00Z",
      last_shift: "2024-01-20T14:00:00Z",
      total_hours_this_week: 32,
      rating: 4.6,
    },
    {
      id: "4",
      first_name: "James",
      last_name: "Wilson",
      email: "james.wilson@restaurant.com",
      phone: "+1 (555) 456-7890",
      role: "bartender",
      hire_date: "2023-08-05",
      hourly_rate: 20.00,
      is_active: false,
      emergency_contact: "Lisa Wilson",
      emergency_phone: "+1 (555) 654-3210",
      created_at: "2023-08-05T10:00:00Z",
      last_shift: "2024-01-15T22:00:00Z",
      total_hours_this_week: 0,
      rating: 4.4,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "waiter",
      hire_date: "",
      hourly_rate: "",
      is_active: true,
      emergency_contact: "",
      emergency_phone: "",
    },
  });

  const roles = [
    { value: "chef", label: "Chef", icon: ChefHat },
    { value: "waiter", label: "Waiter", icon: Users },
    { value: "manager", label: "Manager", icon: Shield },
    { value: "host", label: "Host", icon: Users },
    { value: "bartender", label: "Bartender", icon: UtensilsCrossed },
    { value: "kitchen_helper", label: "Kitchen Helper", icon: ChefHat },
  ];

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || staff.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && staff.is_active) ||
                         (selectedStatus === "inactive" && !staff.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const onSubmit = async (data: StaffFormData) => {
    try {
      const newStaff: StaffMember = {
        id: editingStaff?.id || Date.now().toString(),
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        hire_date: data.hire_date,
        hourly_rate: parseFloat(data.hourly_rate),
        is_active: data.is_active,
        emergency_contact: data.emergency_contact,
        emergency_phone: data.emergency_phone,
        created_at: editingStaff?.created_at || new Date().toISOString(),
        total_hours_this_week: editingStaff?.total_hours_this_week || 0,
        rating: editingStaff?.rating || 4.5,
      };

      if (editingStaff) {
        setStaffMembers(prev => prev.map(staff => staff.id === editingStaff.id ? newStaff : staff));
        toast({
          title: "Staff Member Updated",
          description: `${data.first_name} ${data.last_name} has been updated successfully.`,
        });
      } else {
        setStaffMembers(prev => [...prev, newStaff]);
        toast({
          title: "Staff Member Added",
          description: `${data.first_name} ${data.last_name} has been added to your team.`,
        });
      }

      setIsAddDialogOpen(false);
      setEditingStaff(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (staff: StaffMember) => {
    setEditingStaff(staff);
    form.reset({
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      hire_date: staff.hire_date,
      hourly_rate: staff.hourly_rate.toString(),
      is_active: staff.is_active,
      emergency_contact: staff.emergency_contact || "",
      emergency_phone: staff.emergency_phone || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (staffId: string) => {
    setStaffMembers(prev => prev.filter(staff => staff.id !== staffId));
    toast({
      title: "Staff Member Removed",
      description: "The staff member has been removed from your team.",
    });
  };

  const toggleActive = (staffId: string) => {
    setStaffMembers(prev => prev.map(staff => 
      staff.id === staffId ? { ...staff, is_active: !staff.is_active } : staff
    ));
  };

  const getRoleIcon = (role: string) => {
    const roleData = roles.find(r => r.value === role);
    return roleData ? <roleData.icon className="h-4 w-4" /> : <Users className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "chef":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "waiter":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "manager":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "host":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "bartender":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "kitchen_helper":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage your restaurant staff, schedules, and performance
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Staff Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingStaff 
                      ? "Update the staff member details below."
                      : "Add a new member to your restaurant team."
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="john.doe@restaurant.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map(role => (
                                  <SelectItem key={role.value} value={role.value}>
                                    <div className="flex items-center gap-2">
                                      <role.icon className="h-4 w-4" />
                                      {role.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="hourly_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate ($)</FormLabel>
                            <FormControl>
                              <Input placeholder="18.00" type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="hire_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hire Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="emergency_contact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emergency_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 (555) 987-6543" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <div className="text-xs text-muted-foreground">
                              Currently employed and available for shifts
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

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false);
                          setEditingStaff(null);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingStaff ? "Update Staff Member" : "Add Staff Member"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <LogoutButton variant="outline" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staffMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                Active: {staffMembers.filter(staff => staff.is_active).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(staffMembers.reduce((sum, staff) => sum + staff.rating, 0) / staffMembers.length).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of 5 stars
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {staffMembers.reduce((sum, staff) => sum + staff.total_hours_this_week, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total hours worked
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hourly Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(staffMembers.reduce((sum, staff) => sum + staff.hourly_rate, 0) / staffMembers.length).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per hour
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
                    placeholder="Search staff by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Staff Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => (
            <Card key={staff.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={staff.avatar_url} />
                      <AvatarFallback>
                        {staff.first_name[0]}{staff.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{staff.first_name} {staff.last_name}</CardTitle>
                      <CardDescription>{staff.email}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={staff.is_active ? "default" : "secondary"}>
                    {staff.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getRoleColor(staff.role)}>
                    {getRoleIcon(staff.role)}
                    <span className="ml-1 capitalize">{staff.role.replace('_', ' ')}</span>
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{staff.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{staff.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hourly Rate:</span>
                    <span className="font-medium">${staff.hourly_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">This Week:</span>
                    <span className="font-medium">{staff.total_hours_this_week}h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Hired:</span>
                    <span className="font-medium">{new Date(staff.hire_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(staff)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(staff.id)}
                    className="flex-1"
                  >
                    {staff.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(staff.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No staff members found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedRole !== "all" || selectedStatus !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by adding your first staff member."
                }
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
} 