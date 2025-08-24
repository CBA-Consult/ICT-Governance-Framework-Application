"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ShoppingCart,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Search,
} from "lucide-react"

// Sample procurement requests data
const procurementRequests = [
  {
    id: "REQ-2024-001",
    applicationName: "Figma",
    category: "Design",
    requestedBy: "Sarah Johnson",
    department: "Marketing",
    requestDate: "2024-01-15",
    status: "pending_review",
    priority: "medium",
    estimatedCost: "$15/month per user",
    expectedUsers: 12,
    businessJustification: "Need collaborative design tool for marketing campaigns and brand assets",
    currentAlternative: "Adobe Creative Suite (limited collaboration)",
    urgency: "medium",
    approver: "Mike Chen",
  },
  {
    id: "REQ-2024-002",
    applicationName: "Notion",
    category: "Productivity",
    requestedBy: "David Brown",
    department: "Engineering",
    requestDate: "2024-01-12",
    status: "approved",
    priority: "high",
    estimatedCost: "$8/month per user",
    expectedUsers: 25,
    businessJustification: "Centralized documentation and project management for engineering team",
    currentAlternative: "Multiple scattered tools",
    urgency: "high",
    approver: "John Smith",
    approvalDate: "2024-01-18",
  },
  {
    id: "REQ-2024-003",
    applicationName: "Zoom Pro",
    category: "Communication",
    requestedBy: "Lisa Wang",
    department: "Sales",
    requestDate: "2024-01-10",
    status: "rejected",
    priority: "low",
    estimatedCost: "$14.99/month per user",
    expectedUsers: 8,
    businessJustification: "Enhanced video conferencing features for client meetings",
    currentAlternative: "Microsoft Teams",
    urgency: "low",
    approver: "John Smith",
    rejectionReason: "Microsoft Teams already provides sufficient video conferencing capabilities",
    rejectionDate: "2024-01-16",
  },
  {
    id: "REQ-2024-004",
    applicationName: "Jira",
    category: "Project Management",
    requestedBy: "Robert Kim",
    department: "Engineering",
    requestDate: "2024-01-20",
    status: "under_evaluation",
    priority: "high",
    estimatedCost: "$7/month per user",
    expectedUsers: 30,
    businessJustification: "Advanced project tracking and agile development workflow management",
    currentAlternative: "Basic project tracking in spreadsheets",
    urgency: "high",
    approver: "John Smith",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending_review":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      )
    case "under_evaluation":
      return (
        <Badge variant="outline">
          <AlertCircle className="h-3 w-3 mr-1" />
          Under Evaluation
        </Badge>
      )
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">High</Badge>
    case "medium":
      return <Badge variant="secondary">Medium</Badge>
    case "low":
      return <Badge variant="outline">Low</Badge>
    default:
      return <Badge variant="secondary">{priority}</Badge>
  }
}

export default function ProcurementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)

  const filteredRequests = procurementRequests
    .filter(
      (req) =>
        req.applicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.department.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((req) => statusFilter === "all" || req.status === statusFilter)

  const stats = {
    total: procurementRequests.length,
    pending: procurementRequests.filter((r) => r.status === "pending_review").length,
    approved: procurementRequests.filter((r) => r.status === "approved").length,
    rejected: procurementRequests.filter((r) => r.status === "rejected").length,
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold mb-4">IT Procurement Portal</h1>
        <p className="text-lg text-muted-foreground mb-6">Request new applications and track procurement status</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">View Requests</TabsTrigger>
          <TabsTrigger value="submit">Submit New Request</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="under_evaluation">Under Evaluation</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requests List */}
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{request.applicationName}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {request.requestedBy} ({request.department})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {request.requestDate}
                        </span>
                        <span className="text-xs text-muted-foreground">#{request.id}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      {getPriorityBadge(request.priority)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.estimatedCost}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.expectedUsers} users</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.category}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Business Justification</h4>
                    <p className="text-sm text-muted-foreground">{request.businessJustification}</p>
                  </div>

                  {request.status === "approved" && request.approvalDate && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                      <div className="text-sm text-green-800 dark:text-green-300">
                        <strong>Approved</strong> by {request.approver} on {request.approvalDate}
                      </div>
                    </div>
                  )}

                  {request.status === "rejected" && request.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                      <div className="text-sm text-red-800 dark:text-red-300">
                        <strong>Rejected</strong> by {request.approver} on {request.rejectionDate}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-400 mt-1">
                        Reason: {request.rejectionReason}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground mb-4">No procurement requests found</div>
              <Button onClick={() => setIsNewRequestOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit New Request
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit New Application Request</CardTitle>
              <CardDescription>
                Request a new application that is not currently available in the App Store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appName">Application Name *</Label>
                    <Input id="appName" placeholder="e.g., Figma, Notion, Slack" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="productivity">Productivity</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="project-management">Project Management</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="engineering">Engineering</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedUsers">Expected Number of Users *</Label>
                    <Input id="expectedUsers" type="number" placeholder="e.g., 15" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedCost">Estimated Monthly Cost</Label>
                    <Input id="estimatedCost" placeholder="e.g., $15/month per user" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urgency">Urgency *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select urgency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Can wait 30+ days</SelectItem>
                        <SelectItem value="medium">Medium - Needed within 2-4 weeks</SelectItem>
                        <SelectItem value="high">High - Needed within 1-2 weeks</SelectItem>
                        <SelectItem value="critical">Critical - Needed immediately</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessJustification">Business Justification *</Label>
                  <Textarea
                    id="businessJustification"
                    placeholder="Explain why this application is needed, how it will benefit the organization, and what business problem it solves..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentAlternative">Current Alternative/Workaround</Label>
                  <Textarea
                    id="currentAlternative"
                    placeholder="Describe what tools or processes are currently being used and their limitations..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder="Any additional context, requirements, or considerations..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Request
                  </Button>
                  <Button type="button" variant="outline">
                    Save as Draft
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
