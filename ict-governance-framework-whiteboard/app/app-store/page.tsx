"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Shield,
  Users,
  Globe,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface App {
  id: string
  name: string
  vendor: string
  category: string
  description: string
  status: string
  securityScore: number
  complianceScore: number
  users: number
  owner: string
  administrator: string
  accessMethod: string
  installationType: string
  logoUrl: string
  lastUpdated: string
  version: string
}

interface ApiResponse {
  apps: App[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  filters: {
    categories: string[]
    statuses: string[]
    vendors: string[]
  }
}

export default function AppStorePage() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState({
    categories: [] as string[],
    statuses: [] as string[],
    vendors: [] as string[],
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedVendor, setSelectedVendor] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")

  const fetchApps = async (page = 1) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      })

      if (searchTerm) params.append("search", searchTerm)
      if (selectedCategory !== "all") params.append("category", selectedCategory)
      if (selectedStatus !== "all") params.append("status", selectedStatus)
      if (selectedVendor !== "all") params.append("vendor", selectedVendor)

      const response = await fetch(`/api/apps?${params}`)
      if (!response.ok) throw new Error("Failed to fetch apps")

      const data: ApiResponse = await response.json()
      setApps(data.apps)
      setPagination(data.pagination)
      setFilters(data.filters)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps(1)
  }, [searchTerm, selectedCategory, selectedStatus, selectedVendor, sortBy, sortOrder])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page !== 1) {
        fetchApps(1)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const handlePageChange = (newPage: number) => {
    fetchApps(newPage)
  }

  const getSecurityBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    if (score >= 80) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "sanctioned":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "protected":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "approved":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
      case "restricted":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={() => fetchApps(pagination.page)}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold mb-4">Employee App Store</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Browse and request access to company-approved applications and software
        </p>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {filters.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {filters.statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {filters.vendors.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split("-")
              setSortBy(field)
              setSortOrder(order)
            }}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="users-desc">Most Users</SelectItem>
              <SelectItem value="users-asc">Least Users</SelectItem>
              <SelectItem value="securityScore-desc">Highest Security</SelectItem>
              <SelectItem value="securityScore-asc">Lowest Security</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{pagination.total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Apps</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{filters.categories.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">
                {apps.reduce((sum, app) => sum + app.users, 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">
                {apps.length > 0 ? Math.round(apps.reduce((sum, app) => sum + app.securityScore, 0) / apps.length) : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg Security Score</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading applications...</span>
        </div>
      )}

      {/* App Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {apps.map((app) => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={app.logoUrl || "/placeholder.svg"}
                        alt={`${app.name} logo`}
                        className="w-12 h-12 rounded-lg"
                      />
                      <div>
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {app.category}
                          </Badge>
                          <Badge className={`text-xs ${getStatusBadgeColor(app.status)}`}>{app.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">v{app.version}</div>
                  </div>
                </CardHeader>

                <CardContent>
                  <CardDescription className="mb-4">{app.description}</CardDescription>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Security Score</span>
                      <Badge className={getSecurityBadgeColor(app.securityScore)}>{app.securityScore}/10</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Users</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{app.users.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline">
                        {app.installationType === "Web Application" ? (
                          <>
                            <Globe className="h-3 w-3 mr-1" /> Web App
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3 mr-1" /> Desktop
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm">
                        <div className="font-medium">Vendor: {app.vendor}</div>
                        <div className="text-muted-foreground">Owner: {app.owner}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/app-store/${app.id}`}>
                      <Shield className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                  <Button variant="outline">
                    {app.accessMethod === "SSO" ? <ExternalLink className="h-4 w-4" /> : "Request Access"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}{" "}
                applications
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, pagination.page - 2) + i
                    if (pageNum > pagination.totalPages) return null
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {apps.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">No applications found matching your criteria</div>
              <Button asChild variant="outline">
                <Link href="/procurement">Request New Application</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
