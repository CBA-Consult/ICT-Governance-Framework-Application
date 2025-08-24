import { type NextRequest, NextResponse } from "next/server"

// Real enterprise application names from the provided list
const realApps = [
  { name: "Microsoft Power Apps", status: "sanctioned", category: "Business management", securityScore: 10 },
  { name: "Microsoft AppSource", status: "approved", category: "Business management", securityScore: 10 },
  { name: "Microsoft Online Services", status: "approved", category: "IT services", securityScore: 10 },
  { name: "Microsoft for Startups", status: "approved", category: "IT services", securityScore: 10 },
  { name: "Microsoft 365 admin center", status: "approved", category: "Business management", securityScore: 10 },
  { name: "Microsoft Volume Licensing", status: "approved", category: "IT services", securityScore: 10 },
  { name: "Dynamics 365 BusinessCentral", status: "approved", category: "Business management", securityScore: 10 },
  { name: "Microsoft My Apps", status: "approved", category: "Business management", securityScore: 10 },
  { name: "Movere", status: "approved", category: "IT services", securityScore: 10 },
  { name: "AWS Direct Connect", status: "approved", category: "IT services", securityScore: 10 },
  { name: "SAP Fiori", status: "approved", category: "IT services", securityScore: 10 },
  { name: "IBM Tririga", status: "approved", category: "Business management", securityScore: 10 },
  { name: "jamf", status: "approved", category: "IT services", securityScore: 10 },
  { name: "Fieldglass", status: "approved", category: "Vendor management system", securityScore: 10 },
  { name: "BMC", status: "approved", category: "IT services", securityScore: 10 },
  { name: "CloudAlly", status: "approved", category: "IT services", securityScore: 10 },
  { name: "Iron Mountain", status: "approved", category: "Business management", securityScore: 10 },
  { name: "Splunk On-Call", status: "approved", category: "IT services", securityScore: 10 },
  { name: "Medallia Ideas", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Sprout Social Employee Advocacy", status: "approved", category: "Business management", securityScore: 9 },
  { name: "IBM Turbonomic", status: "approved", category: "Business management", securityScore: 9 },
  { name: "YourCause Blackbaud NPOconnect", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Workday Adaptive Planning", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Ivalua", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Monsido", status: "approved", category: "IT services", securityScore: 9 },
  { name: "ManageEngine MDM Plus", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Intapp", status: "approved", category: "Business management", securityScore: 9 },
  { name: "F5 NGINX", status: "approved", category: "Business management", securityScore: 9 },
  { name: "SAP IAG", status: "approved", category: "IT services", securityScore: 9 },
  { name: "LeanIX SaaS Management Platform", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Blackbaud", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Cisco Jasper", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Brightly", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Progress Secure File Transfer", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Diligent", status: "approved", category: "Business management", securityScore: 9 },
  { name: "NetApp", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Splunk Observability Cloud", status: "approved", category: "IT services", securityScore: 9 },
  { name: "xMatters", status: "approved", category: "IT services", securityScore: 9 },
  { name: "CGI", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Veeva", status: "approved", category: "Business management", securityScore: 9 },
  { name: "OpenText Trading Grid", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Trimble", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Deltek", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Equinix", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Intermedia", status: "approved", category: "IT services", securityScore: 9 },
  { name: "V Vonage", status: "approved", category: "IT services", securityScore: 9 },
  { name: "LogicGate", status: "approved", category: "IT services", securityScore: 9 },
  { name: "SAP Business Technology Platform", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Thomson Reuters Legal Tracker", status: "approved", category: "Business management", securityScore: 9 },
  { name: "ManageEngine ServiceDesk Plus", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Upwork", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Zoho Vault", status: "approved", category: "IT services", securityScore: 9 },
  { name: "IBM Cognos Analytics", status: "approved", category: "IT services", securityScore: 9 },
  { name: "OpsGenie", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Dell", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Broadcom", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Splunk", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Deloitte", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Mendix", status: "approved", category: "Business management", securityScore: 9 },
  { name: "COUPA THIRD-PARTY RISK MANAGEMENT", status: "approved", category: "Business management", securityScore: 9 },
  { name: "CDW", status: "approved", category: "IT services", securityScore: 9 },
  { name: "VirtualBox", status: "approved", category: "IT services", securityScore: 9 },
  { name: "SP Global KY3P", status: "approved", category: "Business management", securityScore: 9 },
  { name: "GlobalLink", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Symplicity", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Edicom", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Dynamic Yield", status: "approved", category: "Business management", securityScore: 9 },
  { name: "HP Anyware", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Deloitte GlobalAdvantage", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Sertifi", status: "approved", category: "Business management", securityScore: 9 },
  { name: "ConnectWise ScreenConnect", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Palantir", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Aruba User Experience Insight", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Splashtop", status: "approved", category: "IT services", securityScore: 9 },
  { name: "MariaDB", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Productboard", status: "approved", category: "Business management", securityScore: 9 },
  { name: "NinjaOne", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Spanning", status: "approved", category: "IT services", securityScore: 9 },
  { name: "BetterUp", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Zoho Creator", status: "approved", category: "Business management", securityScore: 9 },
  { name: "ManageEngine Site24x7", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Edgio", status: "approved", category: "IT services", securityScore: 9 },
  { name: "SolarWinds Dameware", status: "approved", category: "IT services", securityScore: 9 },
  { name: "SP Global Vantage", status: "approved", category: "Business management", securityScore: 9 },
  { name: "everlaw", status: "approved", category: "IT services", securityScore: 9 },
  { name: "EBSCO", status: "approved", category: "IT services", securityScore: 9 },
  { name: "SOTI", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Happiest Minds", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Sakon", status: "approved", category: "IT services", securityScore: 9 },
  { name: "ContractPodAi", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Atos", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Pure Storage", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Data.com", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Zoho Directory", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Gatekeeper", status: "approved", category: "Vendor management system", securityScore: 9 },
  { name: "Protecht", status: "approved", category: "Business management", securityScore: 9 },
  { name: "HashiCorp", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Axcient", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Cognizant MBG", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Prophix", status: "approved", category: "IT services", securityScore: 9 },
  { name: "PTC", status: "approved", category: "IT services", securityScore: 9 },
  { name: "EPAM", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Bugfender", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Apptio", status: "approved", category: "Business management", securityScore: 9 },
  { name: "SolarWinds", status: "approved", category: "IT services", securityScore: 9 },
  { name: "ConnectWise", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Solarwinds Service Desk", status: "approved", category: "IT services", securityScore: 9 },
  { name: "ManageEngine", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Talend", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Bizagi", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Kaseware", status: "approved", category: "IT services", securityScore: 9 },
  { name: "SurveyMonkey Apply", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Riskified", status: "approved", category: "Business management", securityScore: 9 },
  { name: "cloudHQ", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Tech Mahindra", status: "approved", category: "IT services", securityScore: 9 },
  { name: "RWS Language Weaver", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Coupa", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Capgemini", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Agiloft", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Camunda", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Jedox", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Expedient", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Rocket Software", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Accenture", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Damstra", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Cronofy", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Instaclustr", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Unily", status: "approved", category: "Business management", securityScore: 9 },
  { name: "DFIN Venue", status: "approved", category: "Business management", securityScore: 9 },
  { name: "GoToMyPC", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Workato", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Award Force", status: "approved", category: "Business management", securityScore: 9 },
  { name: "Redwood", status: "approved", category: "Business management", securityScore: 9 },
  { name: "QuickBooks Enterprise", status: "approved", category: "IT services", securityScore: 9 },
  { name: "Exact", status: "approved", category: "Business management", securityScore: 9 },
]

const generateMockApps = (count: number) => {
  const apps = []

  // Extract unique vendors from real app names
  const vendors = [
    ...new Set(
      realApps.map((app) => {
        const parts = app.name.split(" ")
        return parts[0] // First word is usually the vendor
      }),
    ),
  ].sort()

  // Extract unique categories
  const categories = [...new Set(realApps.map((app) => app.category))].sort()

  for (let i = 0; i < count; i++) {
    const realApp = realApps[i % realApps.length] // Cycle through real apps
    const baseIndex = Math.floor(i / realApps.length)

    // Create variations of real app names for larger dataset
    const appName = baseIndex > 0 ? `${realApp.name} ${baseIndex + 1}` : realApp.name
    const vendor = realApp.name.split(" ")[0]

    apps.push({
      id: `app-${i + 1}`,
      name: appName,
      vendor,
      category: realApp.category,
      description: `Professional ${realApp.category.toLowerCase()} solution for enterprise use`,
      status: realApp.status,
      securityScore: realApp.securityScore,
      complianceScore: Math.floor(Math.random() * 3) + 8, // 8-10
      users: Math.floor(Math.random() * 5000) + 100,
      owner: `${vendor} Admin`,
      administrator: `admin@${vendor.toLowerCase().replace(/\s+/g, "")}.com`,
      accessMethod: Math.random() > 0.5 ? "SSO" : "Direct Login",
      installationType: Math.random() > 0.7 ? "Desktop Application" : "Web Application",
      logoUrl: `/placeholder.svg?height=40&width=40&text=${vendor.charAt(0)}`,
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString(),
      version: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    })
  }

  return apps
}

const MOCK_APPS = generateMockApps(36201)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Pagination parameters
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "20")
  const offset = (page - 1) * limit

  // Filter parameters
  const search = searchParams.get("search")?.toLowerCase()
  const category = searchParams.get("category")
  const status = searchParams.get("status")
  const vendor = searchParams.get("vendor")

  // Sort parameters
  const sortBy = searchParams.get("sortBy") || "name"
  const sortOrder = searchParams.get("sortOrder") || "asc"

  try {
    // Filter apps
    let filteredApps = MOCK_APPS

    if (search) {
      filteredApps = filteredApps.filter(
        (app) =>
          app.name.toLowerCase().includes(search) ||
          app.vendor.toLowerCase().includes(search) ||
          app.description.toLowerCase().includes(search),
      )
    }

    if (category && category !== "all") {
      filteredApps = filteredApps.filter((app) => app.category === category)
    }

    if (status && status !== "all") {
      filteredApps = filteredApps.filter((app) => app.status === status)
    }

    if (vendor && vendor !== "all") {
      filteredApps = filteredApps.filter((app) => app.vendor === vendor)
    }

    // Sort apps
    filteredApps.sort((a, b) => {
      let aValue = a[sortBy as keyof typeof a]
      let bValue = b[sortBy as keyof typeof b]

      if (typeof aValue === "string") aValue = aValue.toLowerCase()
      if (typeof bValue === "string") bValue = bValue.toLowerCase()

      if (sortOrder === "desc") {
        return aValue < bValue ? 1 : -1
      }
      return aValue > bValue ? 1 : -1
    })

    // Paginate results
    const paginatedApps = filteredApps.slice(offset, offset + limit)

    // Get unique values for filters
    const categories = [...new Set(MOCK_APPS.map((app) => app.category))].sort()
    const statuses = [...new Set(MOCK_APPS.map((app) => app.status))].sort()
    const vendors = [...new Set(MOCK_APPS.map((app) => app.vendor))].sort()

    return NextResponse.json({
      apps: paginatedApps,
      pagination: {
        page,
        limit,
        total: filteredApps.length,
        totalPages: Math.ceil(filteredApps.length / limit),
        hasNext: offset + limit < filteredApps.length,
        hasPrev: page > 1,
      },
      filters: {
        categories,
        statuses,
        vendors,
      },
    })
  } catch (error) {
    console.error("Error fetching apps:", error)
    return NextResponse.json({ error: "Failed to fetch apps" }, { status: 500 })
  }
}
