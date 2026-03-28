"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Calendar,
  Users,
  History,
  FileText,
  AlertTriangle,
  Gauge,
  Flame,
  Layers,
  Printer,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { api } from "@/lib/api"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const campaignTabs = [
  { label: "Overview", path: "", icon: LayoutDashboard },
  { label: "Plan", path: "/plan", icon: Calendar },
  { label: "Creators", path: "/creators", icon: Users },
  { label: "History", path: "/history", icon: History },
  { label: "Content", path: "/content", icon: FileText },
  { label: "Warmup", path: "/warmup", icon: Flame },
  { label: "Capacity", path: "/capacity", icon: Gauge },
  { label: "Failures", path: "/failures", icon: AlertTriangle },
  { label: "Templates", path: "/templates", icon: Layers },
]

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [campaigns, setCampaigns] = useState<string[]>([])

  useEffect(() => {
    api.getCampaigns().then(({ campaigns }) => setCampaigns(campaigns)).catch(() => {})
  }, [])

  // Extract current campaign from pathname
  const segments = pathname.split("/").filter(Boolean)
  const currentCampaign = segments.length > 0 && segments[0] !== "login" ? segments[0] : null

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Attention Printer">
              <Link href="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Printer className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Attention Printer</span>
                  <span className="truncate text-xs text-muted-foreground">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Campaigns</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {campaigns.map((name) => {
                const isActive = currentCampaign === name
                return (
                  <SidebarMenuItem key={name}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={name}>
                      <Link href={`/${name}`}>
                        <LayoutDashboard />
                        <span>{name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentCampaign && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>{currentCampaign}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {campaignTabs.map((tab) => {
                    const href = `/${currentCampaign}${tab.path}`
                    const isActive =
                      tab.path === ""
                        ? pathname === `/${currentCampaign}`
                        : pathname.startsWith(href)
                    return (
                      <SidebarMenuItem key={tab.path}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={tab.label}>
                          <Link href={href}>
                            <tab.icon />
                            <span>{tab.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={theme === "dark" ? "Light Mode" : "Dark Mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
